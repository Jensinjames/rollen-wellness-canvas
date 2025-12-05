import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { envValidation } from '@/integrations/supabase/clientWrapper'
import { EnvErrorDisplay } from '@/components/debug/EnvErrorDisplay'
import { registerServiceWorker } from '@/utils/serviceWorker'

// Register service worker for caching
registerServiceWorker();

const rootElement = document.getElementById("root")!;

// Validate environment variables before rendering the app
if (!envValidation.isValid) {
  // Show error display if environment validation fails
  createRoot(rootElement).render(<EnvErrorDisplay validationResult={envValidation} />);
} else {
  // Render the app normally if validation passes
  createRoot(rootElement).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
