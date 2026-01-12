import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Loading from './Loading'
import './ChinaPhotos.css'

// Import all images from china-pics folder
import img1 from '../../china-pics/1E3BD4DD-255C-4A97-8ABF-F590BD5A6AD3.webp'
import img2 from '../../china-pics/6651ef0ecf244b19f38ce3a68b989616.webp'
import img3 from '../../china-pics/IMG_0459.webp'
import img4 from '../../china-pics/IMG_0902.webp'
import img5 from '../../china-pics/IMG_0963.webp'
import img6 from '../../china-pics/IMG_1927.webp'
import img7 from '../../china-pics/IMG_2367.webp'
import img8 from '../../china-pics/IMG_2438.webp'
import img9 from '../../china-pics/IMG_2581.webp'
import img10 from '../../china-pics/IMG_2621.webp'
import img11 from '../../china-pics/IMG_2796.webp'
import img12 from '../../china-pics/IMG_2951.webp'
import img13 from '../../china-pics/IMG_3058.webp'
import img14 from '../../china-pics/IMG_3286.webp'
import img15 from '../../china-pics/IMG_3338.webp'
import img16 from '../../china-pics/IMG_3385.webp'
import img17 from '../../china-pics/IMG_3506.webp'
import img18 from '../../china-pics/IMG_3796.webp'
import img19 from '../../china-pics/IMG_3840.webp'
import img20 from '../../china-pics/IMG_4044.webp'
import img21 from '../../china-pics/IMG_4166.webp'
import img22 from '../../china-pics/IMG_6045.webp'
import img23 from '../../china-pics/IMG_6401.webp'
import img24 from '../../china-pics/IMG_7090.webp'
import img25 from '../../china-pics/IMG_7274.webp'
import img26 from '../../china-pics/IMG_7519.webp'
import img27 from '../../china-pics/IMG_7551.webp'
import img28 from '../../china-pics/IMG_7663 2.webp'

const imageFiles = [
  img1, img2, img3, img4, img5, img6, img7, img8, img9, img10,
  img11, img12, img13, img14, img15, img16, img17, img18, img19, img20,
  img21, img22, img23, img24, img25, img26, img27, img28
]

function ChinaPhotos() {
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState(null)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [trailPositions, setTrailPositions] = useState([])
  const [isHovering, setIsHovering] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  // Cursor tracking with throttling for better performance - disabled on touch devices
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return

    let rafId = null
    let lastX = 0
    let lastY = 0

    const handleMouseMove = (e) => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          setCursorPosition({ x: lastX, y: lastY })
          if (!isVisible) setIsVisible(true)
          rafId = null
        })
      }
      lastX = e.clientX
      lastY = e.clientY

      const target = e.target
      const isClickable = target.tagName === 'A' ||
                         target.tagName === 'BUTTON' ||
                         target.closest('a') ||
                         target.closest('button') ||
                         target.closest('.gallery-item') ||
                         window.getComputedStyle(target).cursor === 'pointer'
      setIsHovering(isClickable)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.body.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isVisible])

  // Cursor trail animation - optimized with reduced trail length - disabled on touch devices
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return

    const trailLength = 20 // Reduced from 35 for better performance
    const speeds = Array.from({ length: trailLength }, (_, i) => 0.92 - (i * 0.025))

    if (trailPositions.length === 0) {
      setTrailPositions(Array(trailLength).fill({ x: cursorPosition.x, y: cursorPosition.y }))
      return
    }

    let animationFrameId
    let lastUpdate = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const animate = (currentTime) => {
      if (currentTime - lastUpdate >= frameInterval) {
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
        lastUpdate = currentTime
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [cursorPosition, trailPositions.length])

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

  // Loading screen
  useEffect(() => {
    const startTime = Date.now()
    const minLoadingTime = 1500

    const finishLoading = () => {
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)

      setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => {
          setIsLoading(false)
        }, 600)
      }, remainingTime)
    }

    // Wait for page to be ready
    if (document.readyState === 'complete') {
      finishLoading()
    } else {
      window.addEventListener('load', finishLoading, { once: true })
      return () => window.removeEventListener('load', finishLoading)
    }
  }, [])

  const handleImageClick = (index) => {
    setSelectedImage(index)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction) => {
    if (selectedImage === null) return
    const newIndex = direction === 'next' 
      ? (selectedImage + 1) % imageFiles.length
      : (selectedImage - 1 + imageFiles.length) % imageFiles.length
    setSelectedImage(newIndex)
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (selectedImage !== null) {
        if (e.key === 'Escape') closeModal()
        if (e.key === 'ArrowRight') navigateImage('next')
        if (e.key === 'ArrowLeft') navigateImage('prev')
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage])

  if (isLoading) {
    return <Loading fadeOut={fadeOut} />
  }

  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  return (
    <div className="china-photos-page">
      {!isTouchDevice && trailPositions.map((pos, index) => {
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
      {!isTouchDevice && (
        <div
          className={`spotlight ${isHovering ? 'hovering' : ''}`}
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
            opacity: isVisible ? 1 : 0
          }}
        />
      )}
      <Header />
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>
      <h1 className="gallery-title">Photos from China</h1>
      <div className="gallery-container">
        {imageFiles.map((imageSrc, index) => (
          <div
            key={index}
            className="gallery-item"
            onClick={() => handleImageClick(index)}
          >
            <img
              src={imageSrc}
              alt={`China photo ${index + 1}`}
              className="gallery-image"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>

      {selectedImage !== null && (
        <div className="image-modal" onClick={closeModal}>
          <button className="modal-close" onClick={closeModal}>×</button>
          <button 
            className="modal-nav modal-nav-prev" 
            onClick={(e) => {
              e.stopPropagation()
              navigateImage('prev')
            }}
          >
            <span>‹</span>
          </button>
          <img
            src={imageFiles[selectedImage]}
            alt={`China photo ${selectedImage + 1}`}
            className="modal-image"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="modal-nav modal-nav-next"
            onClick={(e) => {
              e.stopPropagation()
              navigateImage('next')
            }}
          >
            <span>›</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ChinaPhotos
