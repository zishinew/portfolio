import { useScrollAnimation } from '../hooks/useScrollAnimation'
import './About.css'

function About() {
  const [ref, isVisible] = useScrollAnimation()

  const skillCategories = {
    'Languages': ['Python', 'JavaScript', 'C', 'TypeScript', 'SQL', 'Racket', 'HTML/CSS'],
    'Data & Machine Learning': ['NumPy', 'Pandas', 'Scikit-learn', 'Matplotlib'],
    'Frameworks & Libraries': ['React', 'FastAPI', 'SQLModel', 'Streamlit', 'Pygame', 'CustomTkinter'],
    'Developer Tools': ['Git', 'GitHub', 'VS Code']
  }

  return (
    <section id="about" className="about">
      <div ref={ref} className={`about-wrapper ${isVisible ? 'fade-in' : ''}`}>
        <h2>About</h2>
        <div className="about-content">
          <p>
            I'm a first year Honours Mathematics student at the University of Waterloo. I'm currently looking for Summer 2026 internship positions.
          </p>
          <p>
            I also run a YouTube channel making game art with 11k+ subscribers and over 1m+ impressions, where I post my creations and take commissions.
          </p>

          {/* Skills Section */}
          <div className="skills-section">
            <h3 className="section-heading">Skills</h3>
            {Object.entries(skillCategories).map(([category, skills]) => (
              <div key={category} className="skill-category">
                <h3 className="category-title">{category}</h3>
                <div className="skills">
                  {skills.map((skill, index) => (
                    <span key={index} className="skill">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
