import { useScrollAnimation } from '../hooks/useScrollAnimation'
import './Experience.css'
import uwOrbitalLogo from '../../uw-orbital.png'

function Experience() {
  const [ref, isVisible] = useScrollAnimation()

  const experience = [
    {
      title: 'Ground Station Software Developer',
      company: 'UW Orbital',
      period: 'nov. 2025 – present',
      logo: uwOrbitalLogo
    },
    {
      title: 'Freelance Game Art Designer',
      company: 'self-employed',
      period: 'aug. 2021 – present'
    }
  ]

  return (
    <section id="experience" className="experience">
      <div ref={ref} className={`experience-wrapper ${isVisible ? 'fade-in' : ''}`}>
        <h2>experience</h2>
        <div className="experience-content">
          {experience.map((job, index) => (
            <div key={index} className="experience-item">
              <div className="item-header">
                <h4>{job.title}</h4>
                <span className="period">{job.period}</span>
              </div>
              <div className="company-with-logo">
                {job.logo && (
                  <img src={job.logo} alt={job.company} className="company-logo" />
                )}
                <p className="subtitle">{job.company}</p>
              </div>
              {job.description && (
                <p className="experience-description">{job.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Experience
