const express = require('express');
const { z } = require('zod');
const { Catalog } = require('../models');
const { authenticate } = require('../middleware/auth');
const { parseOrThrow, objectId } = require('../utils/validation');
const { AppError } = require('../utils/errors');

const router = express.Router();
const estimateSchema = z.object({
  items: z.array(z.object({
    itemId: objectId,
    qty: z.number().int().min(1).max(100)
  }).strict()).min(1).max(50)
}).strict();
const MAX_TOTAL_PAISA = 1_000_000_000_000;

router.post('/estimate', authenticate, async (req, res) => {
  const input = parseOrThrow(estimateSchema, req.body);
  const quantities = new Map();
  for (const item of input.items) {
    quantities.set(item.itemId, (quantities.get(item.itemId) || 0) + item.qty);
  }
  if ([...quantities.values()].some((qty) => qty > 100)) {
    throw new AppError(400, 'INVALID_QUANTITY', 'Combined quantity for a catalogue item cannot exceed 100.');
  }
  const products = await Catalog.find({
    _id: { $in: [...quantities.keys()] },
    isActive: true
  }).lean();
  const byId = new Map(products.map((product) => [String(product._id), product]));
  if (byId.size !== quantities.size) {
    throw new AppError(400, 'INVALID_CATALOG_ITEM', 'All item IDs must reference active catalogue products.');
  }
  let totalPaisa = 0;
  const items = [...quantities.entries()].map(([itemId, qty]) => {
    const unitPricePaisa = byId.get(itemId).pricePaisa;
    const lineTotalPaisa = unitPricePaisa * qty;
    if (!Number.isSafeInteger(lineTotalPaisa) || totalPaisa > MAX_TOTAL_PAISA - lineTotalPaisa) {
      throw new AppError(400, 'ESTIMATE_TOO_LARGE', 'Estimated total exceeds the supported limit.');
    }
    totalPaisa += lineTotalPaisa;
    return { itemId, qty, unitPricePaisa, lineTotalPaisa };
  });
  res.json({ currency: 'PKR', totalPaisa, items });
});

module.exports = { router, MAX_TOTAL_PAISA };
