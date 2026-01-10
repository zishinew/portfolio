import { useScrollAnimation } from '../hooks/useScrollAnimation'
import './Experience.css'
import uwOrbitalLogo from '../../uw-orbital.png'

function Experience() {
  const [ref, isVisible] = useScrollAnimation()

  const experience = [
    {
      title: 'Ground Station Software Developer',
      company: 'UW Orbital',
      period: 'Nov. 2025 – Present',
      logo: uwOrbitalLogo
    },
    {
      title: 'Freelance Game Art Designer',
      company: 'Self-Employed',
      period: 'Aug. 2021 – Present'
    }
  ]

  return (
    <section id="experience" className="experience">
      <div ref={ref} className={`experience-wrapper ${isVisible ? 'fade-in' : ''}`}>
        <h2>Experience</h2>
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Experience
