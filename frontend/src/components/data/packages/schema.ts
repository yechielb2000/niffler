import { z } from 'zod';

export const PackageSchema = z
  .object({
    name: z.string().optional(),
    package: z.string().optional(),
    version: z.union([z.string(), z.number()]).optional(),
    architecture: z.string().optional(),
    arch: z.string().optional(),
    source: z.string().optional(),
    manager: z.string().optional(),
    status: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const PackagesPayloadSchema = z
  .object({
    packages: z.array(PackageSchema).optional(),
    installed: z.array(PackageSchema).optional(),
    items: z.array(PackageSchema).optional(),
    package_count: z.number().optional(),
  })
  .passthrough();

export type PackageRow = z.infer<typeof PackageSchema>;
