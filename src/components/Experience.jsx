import { useScrollAnimation } from '../hooks/useScrollAnimation'
import './Experience.css'

function Experience() {
  const [ref, isVisible] = useScrollAnimation()

  const experience = [
    {
      title: 'Ground Station Software Developer',
      company: 'UW Orbital',
      period: 'Nov. 2025 – Present',
      description: [
        'Developed full-stack features with a FastAPI (Python) backend and React (TypeScript) frontend',
        'Engineered RESTful endpoints using SQLModel for CRUD operations and command data validation',
        'Built asynchronous middleware for request logging and error handling utilizing Loguru'
      ]
    },
    {
      title: 'Freelance Game Art Designer',
      company: 'Self-Employed',
      period: 'Aug. 2021 – Present',
      description: [
        'Managed client relationships and project timelines, consistently delivering high-quality assets to 100+ clients',
        'Built a personal brand with over 11,000+ followers and more than 1M+ impressions across platforms'
      ]
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
              <p className="subtitle">{job.company}</p>
              <ul className="details-list">
                {job.description.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Experience
