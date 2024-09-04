const Joi = require("joi");

// Order input validation schema
const orderInputSchema = Joi.object({
  restaurantId: Joi.string().required(),
  tableNumber: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        dish: Joi.string().required(),
        quantity: Joi.number().min(3).required(),
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
