require('dotenv').config();
const mongoose = require('mongoose');
const { getConfig } = require('../src/config');
const { Catalog } = require('../src/models');

const styles = ['modern', 'minimalist', 'scandinavian', 'industrial', 'bohemian', 'traditional', 'contemporary', 'coastal', 'farmhouse'];
const categories = [
  ['sofa', 4, 'PKR', 8500000],
  ['bed', 4, 'PKR', 7200000],
  ['table', 4, 'PKR', 1800000],
  ['chair', 4, 'PKR', 900000],
  ['wardrobe', 4, 'PKR', 6200000],
  ['lamp', 4, 'PKR', 650000],
  ['rug', 3, 'PKR', 1250000],
  ['decor', 3, 'PKR', 350000]
];
const colorNames = ['beige', 'oak', 'walnut', 'white', 'charcoal', 'sage'];

async function seedCatalog() {
  const config = getConfig();
  await mongoose.connect(config.mongoUri);
  await Catalog.init();
  let updated = 0;
  for (const [category, count, currency, basePrice] of categories) {
    for (let index = 1; index <= count; index += 1) {
      const sku = `${category}-${String(index).padStart(2, '0')}`;
      const product = {
        sku,
        name: `${category[0].toUpperCase()}${category.slice(1)} ${index}`,
        category,
        styles: [styles[(index + categories.findIndex((entry) => entry[0] === category)) % styles.length]],
        pricePaisa: basePrice * index,
        currency,
        dimensionsCm: { w: 80 + index * 10, h: 60 + index * 8, d: 60 + index * 5 },
        colors: [colorNames[index % colorNames.length]],
        modelKey: null,
        thumbKey: null,
        isActive: true
      };
      await Catalog.updateOne({ sku }, { $set: product }, { upsert: true, runValidators: true });
      updated += 1;
    }
  }
  console.log(`Seeded ${updated} stable catalogue items.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  seedCatalog().catch(async (error) => {
    console.error('Catalogue seeding failed:', error.message);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}

module.exports = { seedCatalog };
