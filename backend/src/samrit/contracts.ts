import { z } from 'zod';
import { ALLERGENS } from '../../../shared/types/samrit';
export const gpsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
export const locationSchema = gpsSchema.extend({
  address: z.string().trim().min(5).max(300),
});
export const handlingSchema = z.enum([
  'hot',
  'refrigerated',
  'frozen',
  'shelf_stable',
]);
export const metadataSchema = z
  .record(z.string().max(100), z.json())
  .refine(
    (v) => Buffer.byteLength(JSON.stringify(v), 'utf8') <= 16384,
    'Miscellaneous data must be at most 16 KB',
  )
  .default({});
export const itemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  ingredients: z.array(z.string().max(100)).max(80).default([]),
  allergens: z.array(z.enum(ALLERGENS)).max(9),
  estimatedServings: z.number().int().min(1).max(10000),
  handlingRequirement: handlingSchema,
  verified: z.literal(true),
  metadata: metadataSchema,
  description: z.string().max(2000).nullable().optional(),
  sourceCandidateId: z.uuid().optional(),
});
export const eventSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    scheduledAt: z.iso.datetime(),
    location: locationSchema,
    items: z.array(itemSchema).min(1).max(50),
    notes: z.string().max(2000).default(''),
    metadata: metadataSchema,
    documentIds: z.array(z.uuid()).max(10).default([]),
  })
  .strict();
export const batchSchema = z
  .object({
    donorEventId: z.uuid(),
    items: z.array(itemSchema).min(1).max(50),
    handlingRequirement: handlingSchema,
    handlingRequirements: z.array(handlingSchema).min(1).max(4).optional(),
    expiresAt: z.iso.datetime(),
    photoId: z.uuid(),
    metadata: metadataSchema,
  })
  .strict();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const centerSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    location: locationSchema,
    timeZone: z.string().refine((value) => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, 'Invalid IANA time zone'),
    capabilities: z
      .object({
        refrigeration: z.boolean(),
        hotHolding: z.boolean(),
        freezer: z.boolean(),
        maxMealCapacity: z.number().int().min(1).max(10000),
      })
      .strict(),
    operatingHours: z
      .object({ open: time, close: time })
      .refine(
        (value) => value.open !== value.close,
        'Opening and closing times must differ',
      ),
    seating: z.number().int().min(0).max(10000),
    staffing: z.number().int().min(1).max(1000),
    metadata: metadataSchema,
  })
  .strict();
export const matchSchema = z
  .object({ batchId: z.uuid(), driverId: z.uuid(), vehicleId: z.uuid() })
  .strict();
export const vehicleSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    registration: z
      .string()
      .trim()
      .min(2)
      .max(30)
      .transform((value) => value.toUpperCase()),
    capacityServings: z.number().int().min(1).max(10000),
    capabilities: z.array(handlingSchema).min(1).max(4),
    equipment: z.array(z.string().trim().min(1).max(100)).max(20),
    status: z.enum(['ready', 'maintenance', 'inactive']),
    metadata: metadataSchema,
  })
  .strict();
export const provisionDriverSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email().transform((value) => value.toLowerCase()),
    password: z.string().min(10).max(100),
    phone: z.string().trim().max(40).default(''),
    isAvailable: z.boolean().default(false),
    location: locationSchema,
  })
  .strict();
export const manageDriverSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().max(40).optional(),
    isAvailable: z.boolean().optional(),
    isActive: z.boolean().optional(),
    location: locationSchema.optional(),
  })
  .strict();
export const scanSchema = gpsSchema
  .extend({
    batchId: z.uuid(),
    value: z.string().trim().min(1).max(200),
    kind: z.enum(['event', 'center']),
  })
  .strict();
export const linkSchema = gpsSchema
  .extend({ batchId: z.uuid(), qrStickerId: z.string().trim().min(3).max(120) })
  .strict();
export const reviewSchema = z
  .object({
    targetType: z.enum(['donor', 'center']),
    targetId: z.uuid(),
    linkedBatchId: z.uuid(),
    sentiment: z.enum(['positive', 'negative']),
    rawText: z.string().trim().min(3).max(3000),
  })
  .strict();
export const photoSchema = gpsSchema
  .extend({ stage: z.coerce.number().int().min(1).max(3) })
  .strict();
