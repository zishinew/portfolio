import { useState, useEffect } from 'react'
import './Header.css'

function Header() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDark(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    }
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

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <button onClick={() => scrollToSection('home')} className="logo">
          <img src="/logo.png" alt="Logo" className="logo-image" />
          <span className="logo-text">zishinew.com</span>
        </button>
        <nav>
          <button onClick={() => scrollToSection('about')}>About</button>
          <button onClick={() => scrollToSection('projects')}>Work</button>
          <button onClick={() => scrollToSection('contact')}>Contact</button>
          <button onClick={toggleTheme} className="theme-toggle">
            {isDark ? '☀' : '☾'}
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
