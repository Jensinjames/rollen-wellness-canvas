
export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  parent_id?: string;
  level: number;
  goal_type: 'time' | 'boolean' | 'both';
  is_boolean_goal: boolean;
  boolean_goal_label?: string;
  daily_time_goal_minutes?: number;
  weekly_time_goal_minutes?: number;
  created_at: string;
  updated_at: string;
  children?: Category[];
}
