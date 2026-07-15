import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import { GoogleOAuthProvider } from '@react-oauth/google' // NEW IMPORT
import 'react-toastify/dist/ReactToastify.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { PlayerProvider } from './context/PlayerContext.jsx'
import { LibraryProvider } from './context/LibraryContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* PASTE YOUR GOOGLE CLIENT ID BELOW */}
    <GoogleOAuthProvider clientId="54810489340-lnplin97rlid6ue8jitogcr9ktl8uokr.apps.googleusercontent.com">
      <ThemeProvider>
        <AuthProvider>
          <LibraryProvider>
            <PlayerProvider>
              <App />
              <ToastContainer position="top-right" autoClose={3000} theme="colored" />
            </PlayerProvider>
          </LibraryProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)