const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");


const list = (req, res) => {
    res.json({ data: orders });
}

const bodyDataHas = (propertyName) => {
    return (req, res, next) => {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Must include a ${propertyName}` });
    };
}

const dishesValidation = (req, res, next) => {
    const { data: { dishes }  = {} } = req.body;
    if (!Array.isArray(dishes) || dishes.length === 0) {
        return next({
            status: 400,
            message: "Order must include at least one dish"
        });
    }
    dishes.forEach((dish, index) => {
        const quantity = dish.quantity;
        if (quantity <= 0 || !Number.isInteger(quantity)){
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
    });
    next();
}

const updateStatusValidation = (req, res, next) => {
    const { data: { status }  = {} } = req.body;
    const valid = ["pending", "preparing", "out-for-delivery", "delivered"]
    if (!status || !valid.includes(status)) {
        next({
            status: 400,
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
        });
    } else if (status === "delivered") {
        next({
            status: 400,
            message: "A delivered order cannot be changed"
        });
    }
    next();
}

const deleteStatusValidation = (req, res, next) => {
    const valid = ["pending"]
    if (!valid.includes(res.locals.order.status)) {
        next({
            status: 400,
            message: "An order cannot be deleted unless it is pending."
        });
    }
    next();
}

const idValidation = (req, res, next) => {
    const { data: { id }  = {} } = req.body;
    const { orderId } = req.params;
    if (id && id !== orderId) {
        next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
        });
    }
    next();
}

const create = (req, res) => {
    const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo, 
        mobileNumber, 
        dishes, 
        status,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

const orderExists = (req, res, next) => {
    const { orderId } = req.params;
    const found = orders.find(order => order.id === orderId);
    if (found) {
        res.locals.order = found;
        return next();
    }
    next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
}
  
const read = (req, res) => {
    res.json({ data: res.locals.order });
}

const update = (req, res) => {
    const found = res.locals.order;
    const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
  
    found.deliverTo = deliverTo; 
    found.mobileNumber = mobileNumber;
    found.dishes = dishes;
    found.status = status;
  
    res.json({ data: found });
}

const destroy = (req, res) => {
    const { orderId } = req.params;
    const index = orders.findIndex(order => order.id === orderId);
    const deletedOrder = orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesValidation,
    create
  ],
  read: [
    orderExists,
    read
  ],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    idValidation,
    dishesValidation,
    updateStatusValidation,
    update
  ],
  delete: [
    orderExists,
    deleteStatusValidation,
    destroy
  ],
  list,
};

