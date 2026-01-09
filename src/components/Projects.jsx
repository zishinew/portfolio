import mlLight from '../../ml-light.png'
import mlDark from '../../ml-dark.png'
import aiLight from '../../ai-light.png'
import aiDark from '../../ai-dark.png'
import fileLight from '../../file-light.png'
import fileDark from '../../file-dark.png'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import './Projects.css'
import { useState, useEffect } from 'react'

function Projects() {
  const [ref, isVisible] = useScrollAnimation()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme')
      setIsDark(theme === 'dark')
    }
    
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    
    return () => observer.disconnect()
  }, [])

  const projects = [
    {
      title: 'California Housing Price Predictor',
      description: 'Developed a regression model to predict median house values, achieving 84% accuracy. Cleaned and preprocessed datasets using Pandas and NumPy, with feature scaling and one-hot encoding.',
      tags: ['Python', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib'],
      link: 'https://github.com/zishinew/California-Housing-Price-Predictor',
      image: isDark ? mlDark : mlLight
    },
    {
      title: 'AI Resume Reviewer',
      description: 'Integrated Google\'s Gemini API to automate resume critiques. Developed and deployed a full-stack web application for accessible file upload and instant AI reviews.',
      tags: ['Python', 'Streamlit', 'Gemini API'],
      link: 'https://github.com/zishinew/AI-Resume-Critique',
      image: isDark ? aiDark : aiLight
    },
    {
      title: 'Automated File Organization App',
      description: 'Reduced file management time by engineering a script to automate file organization, sorting 18+ file types. Developed a full-stack application using CustomTkinter.',
      tags: ['Python', 'CustomTkinter'],
      link: 'https://github.com/zishinew/File-Organizer',
      image: isDark ? fileDark : fileLight
    }
  ]

  return (
    <section id="projects" className="projects">
      <div ref={ref} className={`projects-wrapper ${isVisible ? 'fade-in' : ''}`}>
        <h2>Projects</h2>
        <div className="projects-list">
        {projects.map((project, index) => (
          <a href={project.link} key={index} className="project-card" target="_blank" rel="noopener noreferrer">
            {project.image && <img src={project.image} alt={project.title} className="project-image" />}
            <div className="project-content">
              <div className="project-header">
                <h3>{project.title}</h3>
                <span className="arrow">→</span>
              </div>
              <p>{project.description}</p>
              <div className="tags">
                {project.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
      </div>
    </section>
  )
}

export default Projects
