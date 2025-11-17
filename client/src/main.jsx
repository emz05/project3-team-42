// main.jsx
// Entry point for the React app. Sets up StrictMode and renders the Client router.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './components/cashier/css/main.css'  // global stylesheet
import Client from './client.jsx'           // main application router component

// Render the root React component into the HTML element with id="root"
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Client />
  </StrictMode>,
)
