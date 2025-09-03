import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Upload } from 'lucide-react';
import { useTextLogParser } from '@/hooks/useTextLogParser';
import { useBulkEntries } from '@/hooks/useBulkEntries';
import { format } from 'date-fns';

interface ParsedEntry {
  date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  activity: string;
  category?: string;
  subcategory?: string;
  raw_text: string;
  mapping?: {
    category_id: string;
    subcategory_id: string;
    confidence_score: number;
  };
}

export function TextLogImportForm() {
  const [textLog, setTextLog] = useState('');
  const [baseDate, setBaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([]);
  const [validationRules, setValidationRules] = useState({
    enforce_15_min_increments: true,
    auto_round_15_min: true,
    sleep_cutoff_hour: 4,
  });

  const parseTextLogMutation = useTextLogParser();
  const bulkEntriesMutation = useBulkEntries();

  const handleParse = async () => {
    if (!textLog.trim()) return;

    try {
      const result = await parseTextLogMutation.mutateAsync({
        text_log: textLog,
        date: baseDate,
      });

      if (result.success) {
        setParsedEntries(result.entries);
      }
    } catch (error) {
      console.error('Parse error:', error);
    }
  };

  const handleImport = async () => {
    const validEntries = parsedEntries
      .filter(entry => entry.mapping && entry.duration_minutes > 0)
      .map(entry => ({
        date: entry.date || baseDate,
        start_time: entry.start_time,
        end_time: entry.end_time,
        duration_minutes: entry.duration_minutes,
        activity: entry.activity,
        category_id: entry.mapping!.category_id,
        subcategory_id: entry.mapping!.subcategory_id,
        is_completed: entry.duration_minutes > 0,
      }));

    if (validEntries.length === 0) {
      return;
    }

    try {
      await bulkEntriesMutation.mutateAsync({
        entries: validEntries,
        validation_rules: validationRules,
      });

      // Clear form on success
      setTextLog('');
      setParsedEntries([]);
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const validEntriesCount = parsedEntries.filter(entry => entry.mapping && entry.duration_minutes > 0).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Text Log Import
          </CardTitle>
          <CardDescription>
            Import time entries from free-text logs. Supports formats like "9:00-10:30 Faith - Prayer" or "2h 15m Work - Meeting".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base-date">Base Date</Label>
            <Input
              id="base-date"
              type="date"
              value={baseDate}
              onChange={(e) => setBaseDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-log">Text Log</Label>
            <Textarea
              id="text-log"
              placeholder="9:00-10:30 Faith - Prayer
2h 15m Work - Client Meeting
45m Health - Exercise
Faith - Evening Devotion"
              value={textLog}
              onChange={(e) => setTextLog(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
          </div>

          <Button 
            onClick={handleParse}
            disabled={!textLog.trim() || parseTextLogMutation.isPending}
            className="w-full"
          >
            {parseTextLogMutation.isPending ? 'Parsing...' : 'Parse Text Log'}
          </Button>
        </CardContent>
      </Card>

      {parsedEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Entries ({parsedEntries.length})</CardTitle>
            <CardDescription>
              Review parsed entries before importing. {validEntriesCount} entries ready for import.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {parsedEntries.map((entry, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {entry.mapping ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="font-medium">{entry.activity}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {entry.start_time && entry.end_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.start_time} - {entry.end_time}
                          </span>
                        )}
                        <span>{entry.duration_minutes}m</span>
                        {entry.category && (
                          <Badge variant="outline">{entry.category}</Badge>
                        )}
                        {entry.subcategory && (
                          <Badge variant="outline">{entry.subcategory}</Badge>
                        )}
                      </div>

                      {entry.mapping && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Confidence: {Math.round(entry.mapping.confidence_score * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Validation Rules</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enforce-15min">Enforce 15-minute increments</Label>
                  <Switch
                    id="enforce-15min"
                    checked={validationRules.enforce_15_min_increments}
                    onCheckedChange={(checked) => 
                      setValidationRules(prev => ({ ...prev, enforce_15_min_increments: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-round">Auto-round to 15-minute increments</Label>
                  <Switch
                    id="auto-round"
                    checked={validationRules.auto_round_15_min}
                    onCheckedChange={(checked) => 
                      setValidationRules(prev => ({ ...prev, auto_round_15_min: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sleep-cutoff">Sleep cutoff hour (entries before this hour go to previous day)</Label>
                  <Input
                    id="sleep-cutoff"
                    type="number"
                    min="0"
                    max="23"
                    value={validationRules.sleep_cutoff_hour}
                    onChange={(e) => 
                      setValidationRules(prev => ({ ...prev, sleep_cutoff_hour: parseInt(e.target.value) || 4 }))
                    }
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleImport}
              disabled={validEntriesCount === 0 || bulkEntriesMutation.isPending}
              className="w-full"
              size="lg"
            >
              {bulkEntriesMutation.isPending ? 'Importing...' : `Import ${validEntriesCount} Entries`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}