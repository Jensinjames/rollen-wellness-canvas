import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDailyStreaks, useGoalDeficiencies } from '@/hooks/useBusinessRules';
import { Flame, AlertTriangle, Target, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type ActivityStreak = Database['public']['Views']['activity_streaks']['Row'];
type GoalDeficiency = Database['public']['Views']['goal_deficiencies']['Row'];

const BusinessRulesInsights: React.FC = memo(() => {
  const { data: streaks, isLoading: streaksLoading } = useDailyStreaks();
  const { data: deficiencies, isLoading: deficienciesLoading } = useGoalDeficiencies({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date()
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const isCurrentStreak = (streakEnd: string) => {
    const endDate = new Date(streakEnd);
    const today = new Date();
    return differenceInDays(today, endDate) <= 1;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Streaks Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Activity Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {streaksLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : streaks && streaks.length > 0 ? (
            <div className="space-y-3">
              {streaks.slice(0, 5).map((streak: ActivityStreak) => (
                <div key={`${streak.category_id}-${streak.streak_start}`} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: streak.color || '#3b82f6' }}
                    />
                    <div>
                      <p className="font-medium">{streak.category_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {streak.streak_start && streak.streak_end && 
                          `${format(new Date(streak.streak_start), 'MMM d')} - ${format(new Date(streak.streak_end), 'MMM d')}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={streak.streak_end && isCurrentStreak(streak.streak_end) ? "default" : "secondary"}
                      className="mb-1"
                    >
                      {streak.streak_length || 0} days
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(Number(streak.total_streak_minutes) || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No activity streaks found. Start logging activities to build your streaks!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Goal Deficiencies Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Goal Deficiencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deficienciesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : deficiencies && deficiencies.length > 0 ? (
            <div className="space-y-3">
              {deficiencies.slice(0, 5).map((def: GoalDeficiency) => (
                <Alert key={`${def.category_id}-${def.deficiency_date}`} className="border-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: def.color || '#3b82f6' }}
                        />
                        <span className="font-medium">{def.category_name || 'Unknown'}</span>
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {def.deficiency_date && format(new Date(def.deficiency_date), 'MMM d')}
                        </span>
                      </div>
                      <div className="text-right">
                        {def.is_daily_behind && def.daily_deficiency && (
                          <p className="text-sm text-amber-600">
                            Daily: -{formatTime(Number(def.daily_deficiency))}
                          </p>
                        )}
                        {def.is_weekly_behind && def.weekly_deficiency && (
                          <p className="text-sm text-amber-600">
                            Weekly: -{formatTime(Number(def.weekly_deficiency))}
                          </p>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              
              {deficiencies.length === 0 && (
                <div className="text-center py-4">
                  <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">All goals on track!</p>
                  <p className="text-sm text-muted-foreground">
                    Keep up the great work maintaining your activity goals.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-600 font-medium">All goals on track!</p>
              <p className="text-sm text-muted-foreground">
                No deficiencies found. Great job staying on track!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

BusinessRulesInsights.displayName = 'BusinessRulesInsights';

export { BusinessRulesInsights };