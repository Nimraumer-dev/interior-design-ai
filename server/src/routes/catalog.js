const express = require('express');
const { Catalog } = require('../models');
const { authenticate } = require('../middleware/auth');
const { categories, styles } = require('../utils/validation');
const { AppError } = require('../utils/errors');
const { serializeCatalogItem } = require('../services/recommendations');
const { pagination } = require('./designs');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const { page, limit } = pagination(req.query);
  const filter = { isActive: true };
  if (req.query.category !== undefined) {
    if (!categories.includes(req.query.category)) throw new AppError(400, 'INVALID_FILTER', 'category filter is invalid.');
    filter.category = req.query.category;
  }
  if (req.query.style !== undefined) {
    if (!styles.includes(req.query.style)) throw new AppError(400, 'INVALID_FILTER', 'style filter is invalid.');
    filter.styles = req.query.style;
  }
  const [products, total] = await Promise.all([
    Catalog.find(filter).sort({ category: 1, name: 1 }).skip((page - 1) * limit).limit(limit),
    Catalog.countDocuments(filter)
  ]);
  res.json({
    items: await Promise.all(products.map(serializeCatalogItem)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

module.exports = router;
