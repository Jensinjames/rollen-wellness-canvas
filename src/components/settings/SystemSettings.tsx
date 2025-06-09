
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/UnifiedAuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Info, 
  Shield, 
  HelpCircle, 
  ExternalLink, 
  LogOut,
  RefreshCw
} from "lucide-react";

export const SystemSettings = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearCache = () => {
    // Clear browser cache/storage
    localStorage.clear();
    sessionStorage.clear();
    toast({
      title: "Cache Cleared",
      description: "Application cache has been cleared.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">System & Account</h3>
        <p className="text-sm text-muted-foreground">
          System information, security settings, and account actions.
        </p>
      </div>

      {/* App Information */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-blue-500" />
            <h4 className="font-medium">Application Information</h4>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <Badge variant="secondary">1.0.0</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>June 2, 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build</span>
              <span className="font-mono">#{Math.random().toString(36).substr(2, 9)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-green-500" />
            <h4 className="font-medium">Security & Privacy</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Session Management</p>
                <p className="text-sm text-muted-foreground">
                  View and manage your active sessions
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Manage Sessions
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Support & Help */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-orange-500" />
            <h4 className="font-medium">Support & Help</h4>
          </div>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Help Documentation
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Feature Requests
            </Button>
          </div>
        </div>
      </Card>

      {/* System Actions */}
      <Card className="p-6">
        <div className="space-y-4">
          <h4 className="font-medium">System Actions</h4>
          <div className="space-y-3">
            <Button variant="outline" onClick={clearCache} className="w-full justify-start">
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button variant="destructive" onClick={handleSignOut} className="w-full justify-start">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
