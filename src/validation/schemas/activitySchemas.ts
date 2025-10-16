/**
 * Zod Schemas for Activity Validation
 * Centralized schema definitions for all activity-related forms
 */

import { z } from 'zod';

export const activityFormSchema = z.object({
  category_id: z.string().min(1, 'Parent category is required').uuid('Invalid category ID'),
  subcategory_id: z.string().min(1, 'Subcategory is required').uuid('Invalid subcategory ID'),
  date_time: z.string().min(1, 'Date and time is required'),
  duration_minutes: z.number().min(0, 'Duration cannot be negative').max(1440, 'Duration cannot exceed 24 hours').int('Duration must be a whole number'),
  is_completed: z.boolean().optional().default(false),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

export const bulkActivitySchema = z.array(activityFormSchema).min(1, 'At least one activity is required').max(100, 'Cannot submit more than 100 activities at once');

export type ActivityFormSchema = z.infer<typeof activityFormSchema>;
export type BulkActivitySchema = z.infer<typeof bulkActivitySchema>;
