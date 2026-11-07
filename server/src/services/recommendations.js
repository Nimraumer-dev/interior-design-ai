const { Catalog } = require('../models');
const { getReadUrl } = require('./storage');

const budgetCeilingsPaisa = Object.freeze({
  low: 2500000,
  medium: 10000000,
  high: 50000000
});

function isColorMatch(itemColors, hint) {
  if (!hint) return false;
  const normalizedHint = hint.toLowerCase();
  return itemColors.some((color) => normalizedHint.includes(color.toLowerCase()) ||
    color.toLowerCase().includes(normalizedHint));
}

async function selectRecommendations(recommendations, budgetRange) {
  const ceiling = budgetCeilingsPaisa[budgetRange];
  if (!ceiling || !recommendations.length) return [];
  const categories = [...new Set(recommendations.map((item) => item.category))];
  const products = await Catalog.find({
    category: { $in: categories },
    isActive: true,
    pricePaisa: { $lte: ceiling }
  }).lean();
  const chosen = [];
  for (const category of categories) {
    const categoryIdeas = recommendations.filter((idea) => idea.category === category);
    const matches = products
      .filter((product) => product.category === category)
      .filter((product) => categoryIdeas.some((idea) => !idea.styleTags.length ||
        idea.styleTags.some((tag) => product.styles.includes(tag))))
      .sort((a, b) => Number(categoryIdeas.some((idea) => isColorMatch(b.colors, idea.colorHint))) -
        Number(categoryIdeas.some((idea) => isColorMatch(a.colors, idea.colorHint))) ||
        a.pricePaisa - b.pricePaisa)
      .slice(0, 3);
    for (const product of matches) chosen.push(product);
  }
  return [...new Map(chosen.map((product) => [String(product._id), product])).values()];
}

async function serializeCatalogItem(item) {
  return {
    id: String(item._id),
    sku: item.sku,
    name: item.name,
    category: item.category,
    styles: item.styles,
    pricePaisa: item.pricePaisa,
    currency: item.currency,
    dimensionsCm: item.dimensionsCm,
    colors: item.colors,
    modelUrl: item.modelKey ? await getReadUrl(item.modelKey) : null,
    thumbUrl: item.thumbKey ? await getReadUrl(item.thumbKey) : null
  };
}

module.exports = { budgetCeilingsPaisa, selectRecommendations, serializeCatalogItem };
