const jwt = require("jsonwebtoken");
const restaurantModel = require("../models/restaurant.model");
exports.authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      try {
        const foundUser = await restaurantModel.findById(user.userId);
        if (!foundUser) {
          return res.sendStatus(404);
        }
        req.user = foundUser;
        next();
      } catch (error) {
        res.status(500).json({ message: "Serverda xato yuz berdi" });
      }
    });
  } else {
    res.sendStatus(401);
  }
};