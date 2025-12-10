/*
- fills in orders table after payment processed
- handled when stripe's payment intent is successful
 */
const Orders = require('./orders');
const Inventory = require('./inventory');

// process single cart item -> adds to order table -> updates inventory
// checks low stock status
async function fulfillCartItem(item, receiptId, connection) {
    let toppingsValue = item.toppings;
    if (Array.isArray(item.toppings)) { toppingsValue = item.toppings.join(', '); }

    // Include drink size and temperature in the stored customizations without affecting inventory updates
    const customizationParts = [];
    if (item.size) customizationParts.push(`Size: ${item.size}`);
    if (item.temperature) customizationParts.push(`Temp: ${item.temperature}`);
    if (toppingsValue) customizationParts.push(toppingsValue);
    const toppingsWithSize = customizationParts.join(' | ') || null;

    await Orders.addOrderItem(
        receiptId,
        item.drinkID,
        item.quantity,
        item.totalPrice,
        item.iceLevel,
        item.sweetness,
        toppingsWithSize,
        connection
    );

    await Inventory.updateDrinkIngredients(item.drinkID, item.quantity, connection);

    if (item.toppings && item.toppings.length > 0) {
        for (const topping of item.toppings) {
            if (topping) {
                await Inventory.updateTopping(topping, item.quantity, connection);
            }
        }
    }

    await Inventory.updateLowStockStatus(item.drinkID, item.toppings || [], connection);
}

module.exports = { fulfillCartItem };
