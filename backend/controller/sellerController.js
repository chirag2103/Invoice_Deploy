import Seller from '../models/Seller.js';

export const createSeller = async (req, res, next) => {
  const exists = await Seller.find({
    user: req.user.id,
    name: req.body.name.trim(),
  });
  if (exists.length > 0) {
    return res.status(400).json({
      message: 'Seller with this name already exists for the user.',
    });
  }
  const seller = await Seller.create({ ...req.body, user: req.user.id });
  res.status(201).json({
    seller,
  });
};
export const getSellers = async (req, res, next) => {
  const sellers = await Seller.find({ user: req.user.id })
    .collation({ locale: 'en', strength: 1 })
    .sort({ name: 1 });
  // console.log(req.user.id);
  // console.log(sellers);
  res.status(200).json({
    sellers,
  });
};
