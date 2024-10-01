const jwt = require("jsonwebtoken");
const config = require("../config/config.js");
const restaurantModel = require("../models/restaurant.model.js");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    const findRestoran = await restaurantModel.findById(decoded.userId);
    if (!findRestoran) {
      return res.json({ message: "Bunday Restoran topilmadi" });
    }
    req.userData = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Autentifikatsiya amalga oshmadi" });
  }
};
