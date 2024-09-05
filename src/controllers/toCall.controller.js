const toCallModel = require("../models/toCall.model");

exports.createCall = async (req, res, next) => {
  try {
    const call = await toCallModel.create(req.body);
    if (!call) {
      return res.status(400).json({ error: "Chaqiruvda hatolik yuz berdi" });
    }
    res.status(200).json(call);
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};

exports.getAllCalls = async (req, res, next) => {
  try {
    const allCalls = await toCallModel.find({ restaurantId: req.params.id });
    if (!allCalls) {
      return res.status(400).json({ error: "Chaqiruvlar topiladi" });
    }
    res.status(200).json(allCalls);
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};
exports.getCall = async (req, res, next) => {
  try {
    const call = await toCallModel.findById(req.params.id);
    if (!call) {
      return res.status(400).json({ error: "Chaqiruv topilmadi" });
    }
    res.status(200).json(call);
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};
exports.editCall = async (req, res, next) => {
  try {
    const call = await toCallModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    if (!call) {
      res.status(400).json({ error: "Chaqiruv ozgartirilmadi" });
    }
    res.status(200).json(call);
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};
exports.doneCall = async (req, res, next) => {
  try {
    const call = await toCallModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status: "Complate" },
      },
      { new: true }
    );
    if (!call) {
      return res.status(400).json({ error: "Bunday chaqiruv topilmadi" });
    }
    res.status(200).json(call);
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};
exports.deleteCall = async (req, res, next) => {
  try {
    await toCallModel.findByIdAndDelete(req.params.id);
    const call = await toCallModel.findById(req.params.id);

    if (call) {
      return res.status(400).json({ error: "Chaqiruv ochirilmadi" });
    }
    res.status(200).json({ msg: "Chaqiruv ochirildi" });
  } catch (error) {
    res.status(400).json({ error: error.message });
    next();
  }
};
