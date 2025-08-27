import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallbackPath?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundaryClass extends Component<Props & { navigate: (path: string) => void }, State> {
  constructor(props: Props & { navigate: (path: string) => void }) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route Error Boundary caught an error:', error, errorInfo);
  }

  handleGoHome = () => {
    this.props.navigate(this.props.fallbackPath || '/');
    this.setState({ hasError: false, error: null });
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Page Error</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">This page encountered an error and couldn't load properly.</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleGoHome}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export const RouteErrorBoundary: React.FC<Props> = ({ children, fallbackPath }) => {
  const navigate = useNavigate();
  
  return (
    <RouteErrorBoundaryClass navigate={navigate} fallbackPath={fallbackPath}>
      {children}
    </RouteErrorBoundaryClass>
  );
};