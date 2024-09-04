const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const bcrypt = require("bcrypt");
const RestourantModel = require("../models/restaurant.model");
const userModel = require("../models/user.model");

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await userModel.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ message: "Notogri foydalanuvchi nomi yoki parol" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: "30d" }
    );
    res.json({ token, user });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { username, password, role, restourantId } = req.body;
    const restourant = await RestourantModel.findById(restourantId);
    if (restourant) {
      const user = new User({ username, password, role, restourantId });
      await user.save();
      res
        .status(201)
        .json({ message: "Foydalanuvchi muvaffaqiyatli royxatdan otdi", user });
    } else {
      res.status(403).json({ message: "Bunday restoran topilmadi" });
    }
  } catch (error) {
    next(error);
  }
};
