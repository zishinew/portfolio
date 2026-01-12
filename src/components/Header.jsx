import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Header.css'
import logoImg from '../../logo.png'

function Header() {
  const [isDark, setIsDark] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Check system preference first, then saved preference
    const getSystemTheme = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const savedTheme = localStorage.getItem('theme')
    const systemTheme = getSystemTheme()
    
    // Use saved theme if exists, otherwise use system preference
    const themeToUse = savedTheme || systemTheme
    
    if (themeToUse === 'dark') {
      setIsDark(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      setIsDark(false)
      document.documentElement.removeAttribute('data-theme')
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (e) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        if (e.matches) {
          setIsDark(true)
          document.documentElement.setAttribute('data-theme', 'dark')
        } else {
          setIsDark(false)
          document.documentElement.removeAttribute('data-theme')
        }
      }
    }
    
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme')
      setIsDark(theme === 'dark')
    }
    
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    
    return () => observer.disconnect()
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)

    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" onClick={handleLogoClick} className="logo">
          <img src={logoImg} alt="logo" className="logo-image" />
        </Link>
        <button onClick={toggleTheme} className="theme-toggle">
          {isDark ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}

export default Header
