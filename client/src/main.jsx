import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './components/cashier/css/main.css'
import Client from './client.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Client />
  </StrictMode>,
)
