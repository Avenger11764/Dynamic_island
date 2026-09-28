import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SettingsWindow from './SettingsWindow.jsx'
import './index.css'

const isSettingsWindow = 
  typeof window !== 'undefined' && 
  (window.location.hash.includes('settings') || window.location.search.includes('window=settings'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isSettingsWindow ? <SettingsWindow /> : <App />}
  </React.StrictMode>,
)

