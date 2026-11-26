import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { StampsProvider } from './context/StampsContext.tsx'
import { FollowProvider } from './context/FollowContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <AuthProvider>
      <StampsProvider>
        <FollowProvider>
          <App />
        </FollowProvider>
      </StampsProvider>
    </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)