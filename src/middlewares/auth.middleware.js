const jwt = require("jsonwebtoken");
const config = require("../config/config.js");
const restaurantModel = require("../models/restaurant.model.js");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Autentifikatsiya amalga oshmadi" });
  }
};
