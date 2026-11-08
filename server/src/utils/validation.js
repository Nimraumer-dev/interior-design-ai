const { z } = require('zod');

const categories = ['sofa', 'bed', 'table', 'chair', 'wardrobe', 'lamp', 'rug', 'decor'];
const roomTypes = ['living_room', 'bedroom', 'kitchen', 'dining_room', 'bathroom', 'office', 'other'];
const styles = ['modern', 'minimalist', 'scandinavian', 'industrial', 'bohemian', 'traditional', 'contemporary', 'coastal', 'farmhouse'];
const budgetRanges = ['low', 'medium', 'high', 'ultra'];
const objectIdPattern = /^[a-f\d]{24}$/i;

const objectId = z.string().regex(objectIdPattern);
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const name = z.string().trim().min(1).max(80);
const colorList = z.array(z.string().trim().min(1).max(40)).max(8).default([]);
const coordinates = z.object({
  x: z.number().finite().min(-100).max(100),
  y: z.number().finite().min(-100).max(100),
  z: z.number().finite().min(-100).max(100)
}).strict();
const rotation = z.object({
  x: z.number().finite().min(-360).max(360),
  y: z.number().finite().min(-360).max(360),
  z: z.number().finite().min(-360).max(360)
}).strict();
const scale = z.object({
  x: z.number().finite().min(0.01).max(100),
  y: z.number().finite().min(0.01).max(100),
  z: z.number().finite().min(0.01).max(100)
}).strict();

const register = z.object({
  name,
  email,
  password: z.string().min(10).max(128).refine((value) => Buffer.byteLength(value, 'utf8') <= 72,
    'password must not exceed 72 UTF-8 bytes')
}).strict();

const login = z.object({
  email,
  password: z.string().min(1).max(128).refine((value) => Buffer.byteLength(value, 'utf8') <= 72,
    'password must not exceed 72 UTF-8 bytes')
}).strict();

const designFields = z.object({
  roomType: z.enum(roomTypes),
  style: z.enum(styles),
  budgetRange: z.enum(budgetRanges),
  colors: colorList,
  numVariants: z.coerce.number().int().min(1).max(4).default(2),
  seed: z.coerce.number().int().min(0).max(2147483647).optional()
}).strict();

const catalogWrite = z.object({
  sku: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/).transform((value) => value.toLowerCase()),
  name: z.string().trim().min(1).max(120),
  category: z.enum(categories),
  styles: z.array(z.enum(styles)).max(20).default([]),
  pricePaisa: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  currency: z.literal('PKR').default('PKR'),
  dimensionsCm: z.object({
    w: z.number().positive().max(10000),
    h: z.number().positive().max(10000),
    d: z.number().positive().max(10000)
  }).strict().optional(),
  colors: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  modelKey: z.string().trim().min(1).max(500).nullable().default(null),
  thumbKey: z.string().trim().min(1).max(500).nullable().default(null),
  isActive: z.boolean().default(true)
}).strict();

const room3dWrite = z.object({
  name: z.string().trim().min(1).max(120),
  templateKey: z.string().trim().min(1).max(500),
  thumbnailKey: z.string().trim().min(1).max(500).nullable().default(null),
  supportedRoomTypes: z.array(z.enum(roomTypes)).min(1).max(roomTypes.length),
  isActive: z.boolean().default(true)
}).strict();

const sceneWrite = z.object({
  name: z.string().trim().min(1).max(100),
  designId: objectId.nullable().optional(),
  roomTemplateId: objectId,
  placements: z.array(z.object({
    catalogItemId: objectId,
    position: coordinates,
    rotation,
    scale
  }).strict()).max(100).default([])
}).strict();

function parseOrThrow(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`).join('; '));
    error.status = 400;
    error.code = 'INVALID_INPUT';
    throw error;
  }
  return result.data;
}

module.exports = {
  categories,
  roomTypes,
  styles,
  budgetRanges,
  objectIdPattern,
  objectId,
  email,
  register,
  login,
  designFields,
  catalogWrite,
  room3dWrite,
  sceneWrite,
  parseOrThrow
};
