import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import BuildWindow from './components/BuildWindow'

const isBuildWindow = window.location.hash === '#/build'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isBuildWindow ? <BuildWindow /> : <App />}
  </StrictMode>
)
