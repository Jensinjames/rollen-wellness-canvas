/**
 * Unified Activity Types
 * Single source of truth for all activity-related type definitions
 */

/**
 * Core Activity interface - represents an activity record from the database
 * This matches the activities table schema with enriched category/subcategory data
 */
export interface Activity {
  id: string;
  category_id: string;
  user_id: string;
  
  // Timing fields
  start_time: string;
  end_time: string;
  date_time: string; // Computed field for backward compatibility (same as start_time)
  duration_minutes: number;
  
  // Optional fields
  notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Enriched data from joins
  category?: {
    id: string;
    name: string;
    color: string;
    level: number;
    parent_id?: string;
  };
  subcategory?: {
    id: string;
    name: string;
    color: string;
    level: number;
    parent_id?: string;
  };
}

/**
 * Activity Form Data - used for activity entry forms
 */
export interface ActivityFormData {
  category_id: string;
  subcategory_id: string;
  date_time: string;
  duration_minutes: number;
  is_completed?: boolean;
  notes?: string;
}

/**
 * Activity Submission Data - prepared data ready for database insertion
 */
export interface ActivitySubmissionData {
  category_id: string;
  subcategory_id: string;
  name: string;
  date_time: string;
  duration_minutes: number;
  is_completed: boolean;
  notes?: string;
}

/**
 * Activity Filters - for filtering activity lists
 */
export interface ActivityFilters {
  categoryIds: string[];
  subcategoryIds: string[];
  searchTerm: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * Activity Update Notification - for real-time updates
 */
export interface ActivityUpdateNotification {
  id: string;
  categoryName: string;
  subcategoryName: string;
  duration: number;
  timestamp: string;
  color: string;
}
