import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import LivestreamControl from './components/livestream-control.jsx'

createRoot(document.getElementById('root')).render(
  <LivestreamControl/>
)
