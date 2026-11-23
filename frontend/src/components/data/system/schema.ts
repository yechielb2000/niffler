import { z } from 'zod';

export const SystemPayloadSchema = z
  .object({
    info: z.record(z.string(), z.unknown()).optional(),
    cpu: z.record(z.string(), z.unknown()).optional(),
    memory: z.record(z.string(), z.unknown()).optional(),
    uptime: z.record(z.string(), z.unknown()).optional(),
    load: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();
