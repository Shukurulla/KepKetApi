const express = require("express");
const promoCodeModel = require("../models/promoCode.model");
const restaurantModel = require("../models/restaurant.model");
const orderModel = require("../models/order.model");

exports.createPromoCode = async (req, res, next) => {
  try {
    const promoCode = await promoCodeModel.create(req.body);

    res.json(promoCode);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};
exports.getAllPromoCodes = async (req, res, next) => {
  try {
    const promoCodes = await promoCodeModel.find();
    const promoFilter = promoCodes.filter(
      (c) => c.restaurantId == req.params.id
    );
    if (!promoFilter) {
      return res.json({ error: "Bunday restoran topilmadi" });
    }
    res.json(promoFilter);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};
exports.getPromocCodeById = async (req, res, next) => {
  try {
    const promoCode = await promoCodeModel.findById(req.params.id);
    if (!promoCode) {
      return res.json({ error: "Bunday PromoCode topilmadi" });
    }
    res.json(promoCode);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};
exports.editPromoCode = async (req, res, next) => {
  try {
    const promoCode = await promoCodeModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      {
        new: true,
      }
    );
    if (!promoCode) {
      return res.json({ error: "Bunday Promocode topilmadi" });
    }
    res.json(promoCode);
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};

exports.deletePromoCode = async (req, res, next) => {
  try {
    const promoCode = await promoCodeModel.findByIdAndDelete(req.params.id);
    res.json({
      message: "PromoCode muvaffaqiyatli ochirildi",
    });
  } catch (error) {
    res.json({ error: error.message });
    next();
  }
};
