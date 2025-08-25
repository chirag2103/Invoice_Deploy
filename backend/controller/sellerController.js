import Seller from '../models/Seller.js';

export const createSeller = async (req, res, next) => {
  const seller = await Seller.create({ ...req.body, user: req.user.id });
  res.status(201).json({
    seller,
  });
};
export const getSellers = async (req, res, next) => {
  const sellers = await Seller.find({ user: req.user.id });
  console.log(req.user.id);
  console.log(sellers);
  res.status(200).json({
    sellers,
  });
};
