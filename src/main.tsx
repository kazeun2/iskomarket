
  import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// seller flash (vanilla JS + CSS)
import "./styles/seller-flash.css";
import "./utils/sellerFlash.js";

// Mount React app
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  try {
    // Quick debug override: visit http://localhost:3000/?test=1 to render a visible test div
    const params = new URLSearchParams(window.location.search);
    if (params.get('test') === '1') {
      root.render(
        <div style={{ padding: 40, background: '#0f0', color: '#000' }}>
          Hello IskoMarket — test render
        </div>
      );
    } else if (params.get('test') === 'chatdemo') {
      const ChatDemo = (await import('./pages/ChatPrototype')).default
      root.render(<ChatDemo />)
    } else {
      root.render(<App />);
    }
  } catch (err) {
    console.error('React render failed:', err);
    // Show a minimal visible fallback so devs can see something instead of a white page
    container.innerHTML = '<div style="padding:32px;background:#f00;color:#fff;">Render failed — check console</div>';
  }
} else {
  console.error("Root element #root not found — cannot mount React app");
}
  