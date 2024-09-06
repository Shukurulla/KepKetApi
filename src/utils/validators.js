const Joi = require("joi");

// Order input validation schema
const orderInputSchema = Joi.object({
  restaurantId: Joi.string().required(),
  tableNumber: Joi.object().required(),
  items: Joi.array()
    .items(
      Joi.object({
        dish: Joi.object().required(),
        quantity: Joi.number().min(1).required(),
      })
    )
    .required(),
  status: Joi.string().required(),
  totalPrice: Joi.number().required(),
  promoCode: Joi.string(),
});

// Order status validation schema
const orderStatusSchema = Joi.string()
  .valid("pending", "preparing", "completed", "canceled")
  .required();

// Function to validate order input
function validateOrderInput(orderData) {
  return orderInputSchema.validate(orderData);
}

// Function to validate order status
function validateOrderStatus(status) {
  return orderStatusSchema.validate({ status });
}

module.exports = {
  validateOrderInput,
  validateOrderStatus,
};
