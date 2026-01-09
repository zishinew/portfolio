import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import './Hero.css'
import profileImg from '../../profile-picture.png'
import profileImgDark from '../../profile-picture-dark.png'

function Hero() {
  const [ref, isVisible] = useScrollAnimation()
  const [isDark, setIsDark] = useState(true)
  const [isFlipping, setIsFlipping] = useState(false)
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 })

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme')
      const newIsDark = theme === 'dark'

      if (newIsDark !== isDark) {
        setIsFlipping(true)
        setTimeout(() => {
          setIsDark(newIsDark)
        }, 150)
        setTimeout(() => {
          setIsFlipping(false)
        }, 300)
      }
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => observer.disconnect()
  }, [isDark])

  useEffect(() => {
    let angle = Math.random() * Math.PI * 2
    let speed = 0.3

    const wander = () => {
      angle += (Math.random() - 0.5) * 0.3

      setSpotlightPos(prev => {
        let newX = prev.x + Math.cos(angle) * speed
        let newY = prev.y + Math.sin(angle) * speed

        if (newX < 5 || newX > 95) {
          angle = Math.PI - angle
          newX = Math.max(5, Math.min(95, newX))
        }
        if (newY < 5 || newY > 95) {
          angle = -angle
          newY = Math.max(5, Math.min(95, newY))
        }

        return { x: newX, y: newY }
      })
    }

    const intervalId = setInterval(wander, 50)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <section id="home" className="hero">
      <div
        className="hero-wandering-spotlight"
        style={{
          left: `${spotlightPos.x}%`,
          top: `${spotlightPos.y}%`
        }}
      />
      <div ref={ref} className={`hero-content ${isVisible ? 'fade-in' : ''}`}>
        <div className="hero-text">
          <h1>
            Hi, I'm Zishine!
          </h1>
          <p className="hero-description">
            Math @ UWaterloo
          </p>
          <p className="hero-about">
            I'm a first year Honours Mathematics student at the University of Waterloo. I'm currently looking for Summer 2026 internship positions.
          </p>
          <p className="hero-about">
            I also run a YouTube channel making game art with 11k+ subscribers and over 1m+ impressions, where I post my creations and take commissions.
          </p>
        </div>
        <div className="hero-image-container">
          <Link to="/china-photos" className="hero-image-link">
            <img
              src={isDark ? profileImgDark : profileImg}
              alt="Zishine"
              className={`hero-image ${isFlipping ? 'flipping' : ''}`}
            />
            <div className="speech-bubble">
              <span className="speech-text-default">Click me!</span>
              <span className="speech-text-hover">See some of my photos in China.</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
