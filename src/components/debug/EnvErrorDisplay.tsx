import { AlertCircle, Terminal, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EnvValidationResult } from "@/utils/envValidation";

interface EnvErrorDisplayProps {
  validationResult: EnvValidationResult;
}

export function EnvErrorDisplay({ validationResult }: EnvErrorDisplayProps) {
  const isDevelopment = import.meta.env.DEV;
  
  // Only show in development mode
  if (!isDevelopment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            The application is not properly configured. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { errors, warnings, variables } = validationResult;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Terminal className="h-8 w-8" />
            Environment Configuration Required
          </h1>
          <p className="text-muted-foreground text-lg">
            The application cannot connect to the backend because environment variables are missing or invalid.
          </p>
        </div>

        {/* Missing Configuration */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Missing Configuration
            </CardTitle>
            <CardDescription>
              The following environment variables are required but not found:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {errors
                .filter(error => !error.startsWith('🔧') && !error.match(/^\d\./) && error !== '')
                .map((error, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">{error}</code>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>

        {/* Current Environment State */}
        <Card>
          <CardHeader>
            <CardTitle>Current Environment State</CardTitle>
            <CardDescription>Detected environment variable values:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <code className="text-sm">VITE_SUPABASE_URL</code>
                <Badge variant={variables.VITE_SUPABASE_URL ? "default" : "destructive"}>
                  {variables.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-sm">VITE_SUPABASE_PUBLISHABLE_KEY</code>
                <Badge variant={variables.VITE_SUPABASE_PUBLISHABLE_KEY ? "default" : "destructive"}>
                  {variables.VITE_SUPABASE_PUBLISHABLE_KEY ? '✓ Set' : '✗ Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-sm">VITE_SUPABASE_PROJECT_ID</code>
                <Badge variant={variables.VITE_SUPABASE_PROJECT_ID ? "default" : "secondary"}>
                  {variables.VITE_SUPABASE_PROJECT_ID ? '✓ Set' : 'Optional'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Fix */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              How to Fix This Issue
            </CardTitle>
            <CardDescription>
              Follow these steps to resolve the configuration issue:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Stop the development server</p>
                  <p className="text-sm text-muted-foreground">Press <kbd className="px-2 py-1 bg-muted rounded">Ctrl+C</kbd> (or <kbd className="px-2 py-1 bg-muted rounded">Cmd+C</kbd> on Mac) in your terminal</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Clear Vite's cache</p>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Run in terminal:</p>
                    <div className="bg-muted p-3 rounded font-mono text-sm">
                      <div className="mb-2">
                        <span className="text-muted-foreground"># macOS/Linux:</span><br />
                        rm -rf node_modules/.vite
                      </div>
                      <div>
                        <span className="text-muted-foreground"># Windows:</span><br />
                        rmdir /s /q node_modules\.vite
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Verify .env file exists</p>
                  <p className="text-sm text-muted-foreground mb-2">Ensure <code className="bg-muted px-2 py-0.5 rounded">.env</code> file is in your project root with:</p>
                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    VITE_SUPABASE_URL="your_supabase_url"<br />
                    VITE_SUPABASE_PUBLISHABLE_KEY="your_key"
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Restart the development server</p>
                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    npm run dev
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  5
                </span>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Hard refresh your browser</p>
                  <p className="text-sm text-muted-foreground">Press <kbd className="px-2 py-1 bg-muted rounded">Ctrl+Shift+R</kbd> (or <kbd className="px-2 py-1 bg-muted rounded">Cmd+Shift+R</kbd> on Mac)</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Additional Warnings</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i} className="text-sm">• {warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>This message only appears in development mode.</p>
          <p className="mt-1">Once environment variables are configured, the application will load normally.</p>
        </div>
      </div>
    </div>
  );
}
