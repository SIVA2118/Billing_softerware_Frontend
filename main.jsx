import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Suppress noisy runtime.lastError console messages originating from browser
// extensions (e.g. "Could not establish connection. Receiving end does not exist.").
// This is a defensive, opt-in filter — it only ignores that exact message.
const __origConsoleError = console.error;
console.error = (...args) => {
    try {
        if (args && args.length > 0) {
            const first = args[0];
            if (typeof first === 'string' && first.includes('Could not establish connection. Receiving end does not exist.')) {
                return; // ignore known benign extension noise
            }
        }
    } catch (e) {
        // If our filter fails for any reason, fall back to original behavior
        __origConsoleError.apply(console, args);
        return;
    }
    __origConsoleError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
