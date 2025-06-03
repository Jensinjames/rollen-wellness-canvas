
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { EnhancedAuthProvider } from './contexts/EnhancedAuthContext'
import { SecurityMonitor } from './components/security/SecurityMonitor'
import { Toaster } from './components/ui/toaster'

createRoot(document.getElementById("root")!).render(
  <EnhancedAuthProvider>
    <SecurityMonitor>
      <App />
      <Toaster />
    </SecurityMonitor>
  </EnhancedAuthProvider>
);
