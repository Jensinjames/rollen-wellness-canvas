
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, AlertTriangle, Activity, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  event_type: string;
  created_at: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
}

interface SecurityMetrics {
  totalEvents: number;
  riskLevel: 'low' | 'medium' | 'high';
  recentThreats: number;
  lastActivity: string;
}

export const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    riskLevel: 'low',
    recentThreats: 0,
    lastActivity: 'Never',
  });
  const [loading, setLoading] = useState(true);

  const fetchSecurityData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch recent security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;

      setEvents(eventsData || []);

      // Calculate metrics
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const recentEvents = eventsData?.filter(event => 
        new Date(event.created_at) > oneHourAgo
      ) || [];

      const threatEvents = recentEvents.filter(event =>
        event.event_type.includes('threat') || 
        event.event_type.includes('suspicious') ||
        event.details?.risk_level === 'high'
      );

      const riskLevel = 
        threatEvents.length > 5 ? 'high' :
        threatEvents.length > 2 ? 'medium' : 'low';

      setMetrics({
        totalEvents: eventsData?.length || 0,
        riskLevel,
        recentThreats: threatEvents.length,
        lastActivity: eventsData?.[0]?.created_at || 'Never',
      });

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const exportSecurityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const csv = [
        ['Timestamp', 'Event Type', 'User ID', 'Details', 'IP Address', 'User Agent'].join(','),
        ...data.map(event => [
          event.created_at,
          event.event_type,
          event.user_id || '',
          JSON.stringify(event.details || {}),
          event.ip_address || '',
          event.user_agent || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-audit-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Security logs exported successfully');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export security logs');
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('threat') || eventType.includes('suspicious')) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (eventType.includes('auth')) {
      return <Shield className="h-4 w-4 text-blue-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  useEffect(() => {
    fetchSecurityData();
  }, [user]);

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Authentication required to access security dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground">Monitor and manage security events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSecurityData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportSecurityLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getRiskColor(metrics.riskLevel)}>
              {metrics.riskLevel.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{metrics.recentThreats}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {metrics.lastActivity !== 'Never' 
                ? new Date(metrics.lastActivity).toLocaleString()
                : 'Never'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Latest security events and audit logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="data">Data Access</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getEventIcon(event.event_type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.event_type}</span>
                          <Badge variant="outline" className="text-xs">
                            {new Date(event.created_at).toLocaleString()}
                          </Badge>
                        </div>
                        {event.details && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {typeof event.details === 'object' 
                              ? JSON.stringify(event.details, null, 2).slice(0, 100) + '...'
                              : event.details
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No security events found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Add filtered views for other tabs */}
            {['auth', 'data', 'security'].map(category => (
              <TabsContent key={category} value={category} className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {events
                      .filter(event => event.event_type.toLowerCase().includes(category))
                      .map((event) => (
                        <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          {getEventIcon(event.event_type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{event.event_type}</span>
                              <Badge variant="outline" className="text-xs">
                                {new Date(event.created_at).toLocaleString()}
                              </Badge>
                            </div>
                            {event.details && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {typeof event.details === 'object' 
                                  ? JSON.stringify(event.details, null, 2).slice(0, 100) + '...'
                                  : event.details
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
