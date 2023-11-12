const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");


const list = (req, res) => {
    res.json({ data: dishes });
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

const priceValidation = (req, res, next) => {
    const { data: { price }  = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)){
        return next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0"
        });
    }
    next();
}

const idValidation = (req, res, next) => {
    const { data: { id }  = {} } = req.body;
    const { dishId } = req.params;
    if (id && id !== dishId) {
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
        });
    }
    next();
}

const create = (req, res) => {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

const dishExists = (req, res, next) => {
    const { dishId } = req.params;
    const found = dishes.find(dish => dish.id === dishId);
    if (found) {
        res.locals.dish = found;
        return next();
    }
    next({
      status: 404,
      message: `Dish id not found: ${dishId}`,
    });
}
  
const read = (req, res) => {
    const found = res.locals.dish;
    res.json({ data: found });
}

const update = (req, res) => {
    const found = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;
  
    found.name = name;
    found.description = description;
    found.price = price;
    found.image_url = image_url;
  
    res.json({ data: found });
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceValidation,
    create
  ],
  read: [
    dishExists,
    read
  ],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceValidation,
    idValidation,
    update
  ],
  list,
};
