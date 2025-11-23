const express = require('express');
const twilio = require('twilio');

const router = express.Router();

// Twilio configuration from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

// Initialize Twilio client (null if credentials are missing)
let smsClient = null;
if (accountSid && authToken) {
  smsClient = twilio(accountSid, authToken);
}

/**
 * Normalizes phone numbers to E.164 format (+1XXXXXXXXXX)
 */
function normalizePhone(value) {
  if (!value) {
    value = '';
  }

  const digits = value.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length > 10 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (digits.length > 11) {
    return `+${digits}`;
  }

  return null;
}

/**
 * Formats a single order item for display in SMS
 */
function formatLineItem(item) {
  if (!item) {
    item = {};
  }

  const details = [];

  if (item.sugar) {
    details.push(`${item.sugar} sugar`);
  }
  if (item.ice) {
    details.push(item.ice);
  }
  if (item.toppings && item.toppings.length > 0) {
    details.push(item.toppings.join(', '));
  }

  let modifiers = '';
  if (details.length > 0) {
    modifiers = `, ${details.join(', ')}`;
  }

  let size = '';
  if (item.size) {
    size = `${item.size} `;
  }

  return `• ${size}${item.drinkName}${modifiers}`;
}

/**
 * Builds the complete SMS message for order confirmation
 */
function buildMessage(orderNumber, items) {
  const itemList = items.map(formatLineItem).join('\n');

  return [
    `\nOrder ${orderNumber} placed\n`,
    itemList,
    'Please listen for your number to get drink!\n\n We appreciate your visit and want to introduce you to some other cool features we have\n\nReply HELP to see our other offerings'
  ].join('\n');
}

// POST endpoint to send order confirmation SMS
router.post('/order-confirmation', async (req, res) => {
  // Check if SMS service is configured
  if (!smsClient) {
    return res.status(503).json({ error: 'SMS_DISABLED' });
  }

  // Extract request data
  let body = req.body;
  if (!body) {
    body = {};
  }

  const { phoneNumber, orderNumber, items } = body;

  // Validate required fields
  if (!phoneNumber || !orderNumber || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'MISSING_FIELDS' });
  }

  // Normalize and validate phone number
  const normalizedPhone = normalizePhone(phoneNumber);
  if (!normalizedPhone) {
    return res.status(400).json({ error: 'INVALID_PHONE' });
  }

  // Build SMS message
  const messageBody = buildMessage(orderNumber, items);

  // Prepare Twilio payload
  const twilioPayload = {
    to: normalizedPhone,
    body: messageBody
  };

  if (messagingServiceSid) {
    twilioPayload.messagingServiceSid = messagingServiceSid;
  } else {
    twilioPayload.from = fromNumber;
  }

  // Send SMS
  try {
    await smsClient.messages.create(twilioPayload);
    res.json({ sent: true });
  } catch (error) {
    console.error('SMS send failed:', error);
    res.status(502).json({
      error: 'SMS_SEND_FAILED',
      details: error.message
    });
  }
});

module.exports = router;
