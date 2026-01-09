import { useScrollAnimation } from '../hooks/useScrollAnimation'
import './Hero.css'
import profileImg from '../../profile-picture.png'

function Hero() {
  const [ref, isVisible] = useScrollAnimation()

  return (
    <section id="home" className="hero">
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
          <img 
            src={profileImg} 
            alt="Zishine" 
            className="hero-image"
          />
        </div>
      </div>
    </section>
  )
}

export default Hero
