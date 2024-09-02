const User = require('../models/user.model');
const bcrypt = require('bcrypt');

exports.createUser = async (userData) => {
    const user = new User(userData);
    return await user.save();
};

exports.getAllUsers = async () => {
    return await User.find().select('-password');
};

exports.getUserById = async (id) => {
    return await User.findById(id).select('-password');
};

exports.updateUser = async (id, updateData) => {
    if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    return await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
};

exports.deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};

exports.findUserByUsername = async (username) => {
    return await User.findOne({ username });
};