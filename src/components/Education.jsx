import { useScrollAnimation } from '../hooks/useScrollAnimation'
import './Education.css'

function Education() {
  const [ref, isVisible] = useScrollAnimation()

  const education = {
    school: 'University of Waterloo',
    degree: 'Honours Bachelor of Mathematics',
    period: 'Sept. 2025 – 2030',
    details: [
      'Relevant Coursework: Calculus 1, Algebra, Designing Functional Programs',
      "President's Scholarship: Awarded for academic achievement"
    ]
  }

  return (
    <section id="education" className="education">
      <div ref={ref} className={`education-wrapper ${isVisible ? 'fade-in' : ''}`}>
        <h2>Education</h2>
        <div className="education-content">
          <div className="education-item">
            <div className="item-header">
              <h4>{education.school}</h4>
              <span className="period">{education.period}</span>
            </div>
            <p className="subtitle">{education.degree}</p>
            <ul className="details-list">
              {education.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Education
