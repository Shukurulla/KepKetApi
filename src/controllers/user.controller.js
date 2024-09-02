const User = require('../models/user.model');

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        next(error);
    }
};

exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
        res.json(user);
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const { username, role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { username, role },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
        res.json(user);
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
        res.json({
            message: 'Foydalanuvchi muvaffaqiyatli ochirildi' });
  } catch (error) {
            next(error);
        }
    };