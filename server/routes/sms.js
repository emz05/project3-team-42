const express = require('express');
const OpenAI = require('openai');
const twilio = require('twilio');
const Drink = require('../models/drinks');
const Receipt = require('../models/receipt');
const Customers = require('../models/customers');
const { startCardPayment } = require('../pendingOrderService');

const router = express.Router();

const openaiKey = process.env.OPENAI_API_KEY;
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

const smsEmployeeId = Number(process.env.SMS_EMPLOYEE_ID || 1);

const ICE_CHOICES = [
    { match: ['no ice', 'noice', 'none'], label: 'No ice' },
    { match: ['less ice', 'light ice', 'little ice', 'less'], label: 'Less ice' },
    { match: ['regular', 'normal', 'default'], label: 'Regular ice' },
    { match: ['extra ice', 'more ice'], label: 'Extra ice' },
];

const STEP_SEQUENCE = ['pick_drink', 'pick_quantity', 'pick_sweetness', 'pick_ice', 'pick_toppings', 'confirm'];

function sendTwiml(res, message) {
    res.type('text/xml').send(`<Response><Message>\n${message}</Message></Response>`);
}

function summarizeMenu(drinks = []) {
    return drinks.slice(0, 12).map((drink) => (
        `${drink.drink_name} (${drink.category}) - $${Number(drink.drink_price).toFixed(2)}`
    )).join('\n');
}

function cleanName(value = '') {
    return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function normalizeSweetness(value = '') {
    const text = value.toLowerCase();
    if (!text) return '100%';
    if (text.includes('no') || text.includes('none') || text.includes('0')) return '0%';
    if (text.includes('25') || text.includes('quarter')) return '25%';
    if (text.includes('half') || text.includes('50')) return '50%';
    if (text.includes('75') || text.includes('less')) return '75%';
    if (text.includes('extra') || text.includes('120')) return '120%';
    return '100%';
}

function findDrinkByName(name, drinks = []) {
    const normalized = cleanName(name);
    if (!normalized) {
        return null;
    }

    let match = drinks.find((drink) => cleanName(drink.drink_name) === normalized);
    if (match) {
        return match;
    }

    match = drinks.find((drink) => normalized.includes(cleanName(drink.drink_name)));
    if (match) {
        return match;
    }

    match = drinks.find((drink) => cleanName(drink.drink_name).includes(normalized));
    return match || null;
}

function resolveCartItems(cartSpecs = [], drinks = []) {
    if (!Array.isArray(cartSpecs) || cartSpecs.length === 0) {
        return { ok: false, error: 'EMPTY_CART' };
    }

    const resolved = [];
    for (const spec of cartSpecs) {
        let drink = null;
        const explicitId = spec.drinkId || spec.drinkID;
        if (explicitId) {
            drink = drinks.find((d) => Number(d.id) === Number(explicitId));
        }

        if (!drink) {
            drink = findDrinkByName(spec.drinkName || spec.name || '', drinks);
        }

        if (!drink) {
            return { ok: false, error: `I could not find ${spec.drinkName || 'that drink'} on the menu.` };
        }

        const quantity = Math.max(1, Number(spec.quantity || 1));
        const unitPrice = Number(drink.drink_price);
        const totalPrice = unitPrice * quantity;

        resolved.push({
            drinkId: drink.id,
            drinkID: drink.id,
            drinkName: drink.drink_name,
            quantity,
            unitPrice,
            totalPrice,
            iceLevel: spec.iceLevel || spec.ice || null,
            sweetness: normalizeSweetness(spec.sweetness || spec.sugar || '').slice(0, 4),
            toppings: Array.isArray(spec.toppings) ? spec.toppings : [],
        });
    }

    return { ok: true, items: resolved };
}

function getInitialSession() {
    return {
        step: 'pick_drink',
        cart: [],
    };
}

function normalizeRawCartSpec(spec = {}) {
    const toppings = Array.isArray(spec.toppings) ? spec.toppings : null;
    return {
        drinkName: spec.drinkName || spec.name || '',
        drinkId: spec.drinkId || spec.drinkID || null,
        quantity: spec.quantity ?? null,
        sweetness: normalizeSweetness(spec.sweetness || spec.sugar || ''),
        iceLevel: spec.iceLevel || spec.ice || '',
        toppings,
    };
}

function createEmptyCartItem() {
    return {
        drinkName: '',
        drinkId: null,
        quantity: null,
        sweetness: '',
        iceLevel: '',
        toppings: null,
    };
}

function hasValue(value) {
    return value !== undefined && value !== null && value !== '';
}

function determineNextStep(cartItem) {
    if (!cartItem || !cartItem.drinkName) {
        return 'pick_drink';
    }
    if (!hasValue(cartItem.quantity)) {
        return 'pick_quantity';
    }
    if (!hasValue(cartItem.sweetness)) {
        return 'pick_sweetness';
    }
    if (!hasValue(cartItem.iceLevel)) {
        return 'pick_ice';
    }
    if (!Array.isArray(cartItem.toppings)) {
        return 'pick_toppings';
    }
    return 'confirm';
}

function promptForStep(step) {
    switch (step) {
        case 'pick_size':
            return 'What size would you like? Options: small, medium, or large.';
        case 'pick_quantity':
            return 'How many would you like? Reply with a number such as 1 or 2.';
        case 'pick_sweetness':
            return 'What sweetness level are you feeling up to today (0-100%)?';
        case 'pick_ice':
            return 'Awesome and how about your ice preference?';
        case 'pick_toppings':
            return 'Perfect! Will that come with any toppings?\n\nWe currently have boba, ice cream, jelly, and condensed milk';
        case 'confirm':
            return 'Reply YES to place the order or NO to change it';
        default:
            return 'Tell me what drink you would like';
    }
}

function formatCartSummary(item = {}) {
    const toppings = Array.isArray(item.toppings) && item.toppings.length > 0 ? item.toppings.join(', ') : 'None';
    const sweetness = item.sweetness || '100%';
    const ice = item.iceLevel || 'Regular ice';
    const qty = item.quantity || 1;
    return `Here is your drink:\n- ${item.drinkName || 'Drink'}\n- Qty: ${qty}\n- Sweetness: ${sweetness}\n- Ice: ${ice}\n- Toppings: ${toppings}`;
}

function parseQuantity(message) {
    const match = String(message).match(/\d+/);
    if (match) {
        const parsed = Number.parseInt(match[0], 10);
        if (parsed > 0) {
            return parsed;
        }
    }
    const words = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
    };
    const lower = String(message).toLowerCase();
    if (words[lower]) {
        return words[lower];
    }
    return null;
}

function normalizeIce(message = '') {
    const lower = message.toLowerCase();
    for (const option of ICE_CHOICES) {
        if (option.match.some((token) => lower.includes(token))) {
            return option.label;
        }
    }
    if (lower.includes('regular')) {
        return 'Regular ice';
    }
    return null;
}

function parseToppings(message = '') {
    const lower = message.toLowerCase();
    if (lower.includes('no') || lower.includes('none')) {
        return [];
    }
    const parts = message.split(/,| and /i).map((part) => part.trim()).filter(Boolean);
    return parts;
}

function isAffirmative(message = '') {
    const lower = message.toLowerCase();
    return ['yes', 'yeah', 'yup', 'sure', 'confirm', 'ok', 'okay'].some((word) => lower === word || lower.startsWith(word));
}

function isNegative(message = '') {
    const lower = message.toLowerCase();
    return ['no', 'nope', 'nah', 'cancel', 'change'].some((word) => lower === word || lower.startsWith(word));
}

async function callAssistant({ message, sessionState, menuSummary }) {
    if (!openai) {
        return {
            reply: 'Our SMS assistant is offline right now. Please try again later or visit the kiosk.',
            action: 'idle',
            session: sessionState,
        };
    }

    const currentCart = Array.isArray(sessionState?.cart) ? sessionState.cart : [];
    const schema = {
        name: 'order_assistant',
        schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
                reply: { type: 'string' },
                action: {
                    type: 'string',
                    enum: ['idle', 'collect_details', 'confirm_cart', 'finalize_order', 'reorder_last'],
                },
                updatedCart: {
                    type: 'array',
                    items: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            drinkName: { type: ['string', 'null'] },
                            quantity: { type: ['integer', 'null'] },
                            iceLevel: { type: ['string', 'null'] },
                            sweetness: { type: ['string', 'null'] },
                            toppings: {
                                type: ['array', 'null'],
                                items: { type: 'string' },
                            },
                        },
                        required: ['drinkName', 'quantity', 'iceLevel', 'sweetness', 'toppings'],
                    },
                },
            },
            required: ['reply', 'action', 'updatedCart'],
        },
    };

    const systemPrompt = [
        'You are a concise SMS ordering assistant for a boba shop.',
        'Only offer drinks listed in the menu summary below.',
        'Guide the user through drink, quantity, sweetness, ice, toppings, then confirm.',
        'Always respond with JSON matching the schema.',
        'Keep language friendly and short (under 250 characters).',
    ].join(' ');

    const userPayload = `Menu:\n${menuSummary}\n\nSession:${JSON.stringify(sessionState || {})}\n\nUser:${message}`;

    const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: [
            {
                role: 'system',
                content: [
                    { type: 'input_text', text: systemPrompt },
                ],
            },
            {
                role: 'user',
                content: [
                    { type: 'input_text', text: userPayload },
                ],
            },
        ],
        text: {
            format: {
                name: 'structured_order_reply',
                type: 'json_schema',
                schema: schema.schema,
            },
        },
    });

    const textChunk = response.output?.[0]?.content?.[0]?.text;
    if (!textChunk) {
        return { reply: 'I had trouble understanding that. Please try again.', action: 'idle', updatedCart: currentCart };
    }

    try {
        return JSON.parse(textChunk);
    } catch (error) {
        return { reply: 'I had trouble understanding that. Please try again.', action: 'idle', updatedCart: currentCart };
    }
}

async function buildPaymentLink({ phone, cart, drinks }) {
    const resolvedResult = resolveCartItems(cart, drinks);
    if (!resolvedResult.ok) {
        return { ok: false, message: resolvedResult.error };
    }

    const resolvedCart = resolvedResult.items;

    const totalAmount = resolvedCart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
    if (totalAmount <= 0) {
        return { ok: false, message: 'Unable to calculate the order total.' };
    }

    const nextOrderNumber = (await Receipt.getlatestReceiptId()) + 1;

    const payment = await startCardPayment({
        orderId: nextOrderNumber,
        employeeId: smsEmployeeId,
        cartCards: resolvedCart,
        totalAmount,
        metadata: {
            customer_phone: phone,
            channel: 'sms',
        },
    });

    return { ok: true, url: payment.url, cart: resolvedCart, totalAmount };
}

async function handleGuidedStep({ session, phone, message, drinks }) {
    const normalizedMessage = message.trim();
    const lower = normalizedMessage.toLowerCase();

    if (lower === 'cancel' || lower === 'start over') {
        const fresh = getInitialSession();
        await Customers.saveSession(phone, fresh);
        return {
            handled: true,
            reply: 'No problem! Tell me what drink you would like.',
        };
    }

    const step = session?.step || 'pick_drink';
    if (step === 'pick_drink') {
        return { handled: false };
    }

    if (!session.cart || !session.cart[0] || !session.cart[0].drinkName) {
        const fresh = getInitialSession();
        await Customers.saveSession(phone, fresh);
        return {
            handled: true,
            reply: 'Let\'s start fresh. What drink would you like?',
        };
    }

        const cartItem = session.cart[0];

        if (step === 'pick_quantity') {
        const quantity = parseQuantity(normalizedMessage);
        if (!quantity) {
            return { handled: true, reply: 'Please reply with a number like 1 or 2.' };
        }
        cartItem.quantity = quantity;
        session.step = 'pick_sweetness';
        await Customers.saveSession(phone, session);
        return { handled: true, reply: promptForStep('pick_sweetness') };
    }

    if (step === 'pick_sweetness') {
        cartItem.sweetness = normalizeSweetness(normalizedMessage);
        session.step = 'pick_ice';
        await Customers.saveSession(phone, session);
        return { handled: true, reply: promptForStep('pick_ice') };
    }

    if (step === 'pick_ice') {
        const ice = normalizeIce(normalizedMessage);
        if (!ice) {
            return { handled: true, reply: 'Please reply with no ice, less ice, regular ice, or extra ice.' };
        }
        cartItem.iceLevel = ice;
        session.step = 'pick_toppings';
        await Customers.saveSession(phone, session);
        return { handled: true, reply: promptForStep('pick_toppings') };
    }

    if (step === 'pick_toppings') {
        cartItem.toppings = parseToppings(normalizedMessage);
        session.step = 'confirm';
        await Customers.saveSession(phone, session);
        const summary = formatCartSummary(cartItem);
        return {
            handled: true,
            reply: `${summary}\nReply YES to confirm or NO to change.`,
        };
    }

    if (step === 'confirm') {
        if (isAffirmative(lower)) {
            const paymentLink = await buildPaymentLink({ phone, cart: session.cart, drinks });
            if (paymentLink.ok) {
                await Customers.saveSession(phone, getInitialSession());
                return {
                    handled: true,
                    reply: `Perfect! Pay here: ${paymentLink.url}`,
                };
            }
            return {
                handled: true,
                reply: paymentLink.message || 'Unable to start card payment right now.',
            };
        }

        if (isNegative(lower)) {
            const fresh = getInitialSession();
            await Customers.saveSession(phone, fresh);
            return {
                handled: true,
                reply: 'No worries. Tell me what drink you would like instead.',
            };
        }

        return {
            handled: true,
            reply: 'Please reply YES to place the order or NO to make a change.',
        };
    }

    return { handled: false };
}

router.post('/webhook', express.urlencoded({ extended: false }), async (req, res) => {
    const fromNumber = req.body.From || '';
    const rawMessage = req.body.Body || '';
    const userMessage = rawMessage.trim();
    const normalizedPhone = Customers.normalizePhone ? Customers.normalizePhone(fromNumber) : fromNumber.replace(/\D/g, '');

    if (!normalizedPhone) {
        return sendTwiml(res, 'Please use a valid US phone number.');
    }

    const lower = userMessage.toLowerCase();

    try {
        if (lower === 'help') {
            return sendTwiml(res, 'Text MENU for today\'s drinks, MY USUAL to reorder, or describe what you would like');
        }

        const drinks = await Drink.getDrinks();
        const menuSummary = summarizeMenu(drinks);

        if (lower === 'menu') {
            return sendTwiml(res, `Here are a few favorites:\n${menuSummary}`);
        }

        if (lower.includes('usual') || lower.includes('reorder')) {
            const lastOrder = await Customers.getLastOrder(normalizedPhone);
            if (!lastOrder || !Array.isArray(lastOrder.last_cart) || lastOrder.last_cart.length === 0) {
                return sendTwiml(res, 'I could not find a saved order for this number yet.');
            }

            const paymentLink = await buildPaymentLink({ phone: normalizedPhone, cart: lastOrder.last_cart, drinks });
            if (!paymentLink.ok) {
                return sendTwiml(res, paymentLink.message || 'Unable to rebuild your last order. Please order manually.');
            }

            await Customers.saveSession(normalizedPhone, null);
            return sendTwiml(res, `Here is your payment link for your usual: ${paymentLink.url}`);
        }

        let sessionState = await Customers.getSession(normalizedPhone);
        if (!sessionState || !sessionState.step) {
            sessionState = getInitialSession();
            await Customers.saveSession(normalizedPhone, sessionState);
        }

        const guidedResult = await handleGuidedStep({
            session: sessionState,
            phone: normalizedPhone,
            message: userMessage,
            drinks,
        });

        if (guidedResult.handled) {
            return sendTwiml(res, guidedResult.reply);
        }

        if (sessionState.step !== 'pick_drink') {
            return sendTwiml(res, promptForStep(sessionState.step));
        }

        const aiReply = await callAssistant({ message: userMessage, sessionState, menuSummary });

        if (aiReply.action === 'finalize_order' && Array.isArray(aiReply.updatedCart) && aiReply.updatedCart.length > 0) {
            const paymentLink = await buildPaymentLink({ phone: normalizedPhone, cart: aiReply.updatedCart, drinks });
            if (paymentLink.ok) {
                await Customers.saveSession(normalizedPhone, null);
                return sendTwiml(res, `Perfect! Pay here to confirm: ${paymentLink.url}`);
            }
            return sendTwiml(res, paymentLink.message || 'Something went wrong creating your payment link.');
        }

        if (Array.isArray(aiReply.updatedCart) && aiReply.updatedCart.length > 0) {
            if (!sessionState.cart || sessionState.cart.length === 0) {
                sessionState.cart = [createEmptyCartItem()];
            }

            const currentItem = sessionState.cart[0];
            const aiItem = aiReply.updatedCart[0] || {};
            const aiNormalized = normalizeRawCartSpec(aiItem);

            if (aiItem.drinkId) {
                currentItem.drinkId = aiItem.drinkId;
            }

            if (aiNormalized.drinkName) {
                currentItem.drinkName = aiNormalized.drinkName;
            }

            if (aiNormalized.quantity !== null && aiNormalized.quantity !== undefined) {
                const parsed = Number(aiNormalized.quantity);
                if (Number.isFinite(parsed) && parsed > 0) {
                    currentItem.quantity = parsed;
                }
            }

            if (aiNormalized.sweetness) {
                currentItem.sweetness = aiNormalized.sweetness;
            }

            if (aiNormalized.iceLevel) {
                currentItem.iceLevel = normalizeIce(aiNormalized.iceLevel) || currentItem.iceLevel;
            }

            if (Array.isArray(aiNormalized.toppings)) {
                currentItem.toppings = aiNormalized.toppings;
            }

            sessionState.step = determineNextStep(currentItem);
            await Customers.saveSession(normalizedPhone, sessionState);

            if (sessionState.step === 'confirm') {
                const summary = formatCartSummary(currentItem);
                return sendTwiml(res, `${summary}\nReply YES to confirm or NO to change.`);
            }

            return sendTwiml(res, aiReply.reply || promptForStep(sessionState.step));
        }

        return sendTwiml(res, aiReply.reply || promptForStep(sessionState.step));
    } catch (error) {
        console.error('SMS_WEBHOOK_ERROR', error);
        return sendTwiml(res, 'Sorry, I had an issue handling that request. Please try again soon.');
    }
});

module.exports = router;
