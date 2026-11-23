import { z } from 'zod';

export const ConfigFileSchema = z
  .object({
    path: z.string().optional(),
    name: z.string().optional(),
    format: z.string().optional(),
    owner: z.string().optional(),
    mode: z.string().optional(),
    modified: z.string().optional(),
    status: z.string().optional(),
    content: z.unknown().optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const ConfigPayloadSchema = z
  .object({
    files: z.array(ConfigFileSchema).optional(),
    configurations: z.array(ConfigFileSchema).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
    variables: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type ConfigFile = z.infer<typeof ConfigFileSchema>;
