const Orders = require('./models/orders');
const Inventory = require('./models/inventory');

async function fulfillCartItem(item, receiptId, connection) {
    await Orders.addOrderItem(
        receiptId,
        item.drinkID,
        item.quantity,
        item.totalPrice,
        item.iceLevel,
        item.sweetness,
        Array.isArray(item.toppings) ? item.toppings.join(', ') : item.toppings,
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
