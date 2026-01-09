import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import Education from './components/Education'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Contact from './components/Contact'
import Loading from './components/Loading'
import ChinaPhotos from './components/ChinaPhotos'
import './App.css'

function App() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [trailPositions, setTrailPositions] = useState([])
  const [isHovering, setIsHovering] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  // Initialize theme before loading screen shows
  useEffect(() => {
    const getSystemTheme = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const savedTheme = localStorage.getItem('theme')
    const themeToUse = savedTheme || getSystemTheme()
    
    if (themeToUse === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)

      // Check if hovering over a clickable element
      const target = e.target
      const isClickable = target.tagName === 'A' ||
                         target.tagName === 'BUTTON' ||
                         target.closest('a') ||
                         target.closest('button') ||
                         window.getComputedStyle(target).cursor === 'pointer'
      setIsHovering(isClickable)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.body.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isVisible])

  useEffect(() => {
    const trailLength = 35
    const speeds = Array.from({ length: trailLength }, (_, i) => 0.92 - (i * 0.022))

    if (trailPositions.length === 0) {
      setTrailPositions(Array(trailLength).fill({ x: cursorPosition.x, y: cursorPosition.y }))
      return
    }

    let animationFrameId
    const animate = () => {
      setTrailPositions(prev => {
        const newPositions = [...prev]

        newPositions[0] = {
          x: newPositions[0].x + (cursorPosition.x - newPositions[0].x) * speeds[0],
          y: newPositions[0].y + (cursorPosition.y - newPositions[0].y) * speeds[0]
        }

        for (let i = 1; i < trailLength; i++) {
          newPositions[i] = {
            x: newPositions[i].x + (newPositions[i - 1].x - newPositions[i].x) * speeds[i],
            y: newPositions[i].y + (newPositions[i - 1].y - newPositions[i].y) * speeds[i]
          }
        }

        return newPositions
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [cursorPosition, trailPositions.length])

  useEffect(() => {
    const startTime = Date.now()
    const minLoadingTime = 2000

    const loadImages = async () => {
      const images = document.querySelectorAll('img')
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) {
          return Promise.resolve()
        }
        return new Promise((resolve) => {
          img.addEventListener('load', resolve)
          img.addEventListener('error', resolve)
        })
      })

      await Promise.all(imagePromises)

      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)

      setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => {
          setIsLoading(false)
        }, 600)
      }, remainingTime)
    }

    if (document.readyState === 'complete') {
      loadImages()
    } else {
      window.addEventListener('load', loadImages)
      return () => window.removeEventListener('load', loadImages)
    }
  }, [])

  if (isLoading) {
    return <Loading fadeOut={fadeOut} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="app">
              {trailPositions.map((pos, index) => {
                const distance = Math.sqrt(
                  Math.pow(pos.x - cursorPosition.x, 2) + Math.pow(pos.y - cursorPosition.y, 2)
                )
                const maxDistance = 200
                const distanceFactor = Math.max(0, 1 - (distance / maxDistance))
                const baseOpacity = (1 - (index / trailPositions.length)) * 2.5
                const size = 40 - (index * 0.8)

                return (
                  <div
                    key={index}
                    className={`spotlight-trail ${isHovering ? 'hovering' : ''}`}
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                      width: `${size}px`,
                      height: `${size}px`,
                      opacity: isVisible ? baseOpacity * distanceFactor : 0
                    }}
                  />
                )
              })}
              <div
                className={`spotlight ${isHovering ? 'hovering' : ''}`}
                style={{
                  left: `${cursorPosition.x}px`,
                  top: `${cursorPosition.y}px`,
                  opacity: isVisible ? 1 : 0
                }}
              />
              <Header />
              <main>
                <Hero />
                <Education />
                <Experience />
                <Projects />
                <Contact />
              </main>
            </div>
          }
        />
        <Route path="/china-photos" element={<ChinaPhotos />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
