const jwt = require("jsonwebtoken");
const restaurantModel = require("../models/restaurant.model");

exports.authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (err) {
        return res.sendStatus(403); // Bu yerda javob yuborildi, next() chaqirilmaydi
      }

      try {
        const foundUser = await restaurantModel.findById(user.userId);
        if (!foundUser) {
          return res.sendStatus(404); // Javob yuborildi, next() chaqirilmaydi
        }
        req.user = foundUser;

        next(); // Faqat user topilgan bo'lsa va xato bo'lmasa navbat davom ettiriladi
      } catch (error) {
        return res.status(500).json({ message: "Serverda xato yuz berdi" }); // Javob yuborildi, next() chaqirilmaydi
      }
    });
  } else {
    return res.sendStatus(401); // Javob yuborildi, next() chaqirilmaydi
  }
};
