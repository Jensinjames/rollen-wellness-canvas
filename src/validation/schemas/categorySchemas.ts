/**
 * Zod Schemas for Category Validation
 * Centralized schema definitions for all category-related forms
 */

import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(50, 'Category name cannot exceed 50 characters')
    .trim(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid 6-digit hex code')
    .toUpperCase(),
  description: z.string()
    .max(200, 'Description cannot exceed 200 characters')
    .trim()
    .optional()
    .default(''),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  parent_id: z.string().uuid().nullable().optional(),
  level: z.number().int().min(0).max(1),
  goal_type: z.enum(['time', 'boolean', 'both']).default('time'),
  is_boolean_goal: z.boolean().default(false),
  boolean_goal_label: z.string().max(50).trim().optional().default(''),
  daily_time_goal_minutes: z.number().int().min(0).max(1440).optional().nullable(),
  weekly_time_goal_minutes: z.number().int().min(0).max(10080).optional().nullable(),
}).refine(
  (data) => {
    // If goal_type includes 'boolean', boolean_goal_label is required when is_boolean_goal is true
    if ((data.goal_type === 'boolean' || data.goal_type === 'both') && data.is_boolean_goal) {
      return !!data.boolean_goal_label?.trim();
    }
    return true;
  },
  {
    message: 'Boolean goal label is required when completion tracking is enabled',
    path: ['boolean_goal_label'],
  }
).refine(
  (data) => {
    // Subcategories must have parent_id
    if (data.level === 1) {
      return !!data.parent_id;
    }
    return true;
  },
  {
    message: 'Subcategory must have a parent category',
    path: ['parent_id'],
  }
).refine(
  (data) => {
    // Top-level categories cannot have parent_id
    if (data.level === 0) {
      return !data.parent_id;
    }
    return true;
  },
  {
    message: 'Top-level category cannot have a parent',
    path: ['parent_id'],
  }
);

export type CategoryFormSchema = z.infer<typeof categoryFormSchema>;
