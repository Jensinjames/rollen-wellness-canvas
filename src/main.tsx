
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  const root = createRoot(rootElement);
  root.render(<App />);
  console.log('✅ React app mounted successfully');
} catch (error) {
  console.error('❌ Failed to mount React app:', error);
  
  // Fallback UI
  rootElement.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;padding:20px;">
      <div style="text-align:center;max-width:500px;">
        <h1 style="color:#dc2626;margin-bottom:16px;">Application Error</h1>
        <p style="color:#666;margin-bottom:24px;">Failed to initialize the application. Please try refreshing the page.</p>
        <button onclick="location.reload()" style="padding:12px 24px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:16px;">
          Reload Application
        </button>
        <details style="margin-top:24px;text-align:left;">
          <summary style="cursor:pointer;color:#666;">Technical Details</summary>
          <pre style="background:#f3f4f6;padding:12px;border-radius:4px;overflow:auto;margin-top:8px;font-size:12px;">${error instanceof Error ? error.message : 'Unknown error'}</pre>
        </details>
      </div>
    </div>
  `;
}
