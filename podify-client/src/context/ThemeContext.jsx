import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  // Read saved preference, default to dark (Spotify's native mode)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('podify-theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    // Bootstrap 5.3 reads color mode off this attribute — this is what
    // flips every bootstrap component (cards, tables, forms, navbar) at once
    document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('podify-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const toggleTheme = () => setDarkMode(prev => !prev)

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
