import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import faviconImg from '../img_0010.png'

// Set favicon
const link = document.createElement('link')
link.rel = 'icon'
link.href = faviconImg
document.head.appendChild(link)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
