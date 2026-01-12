import mlLight from '../../ml-light.png'
import mlDark from '../../ml-dark.png'
import aiLight from '../../ai-light.png'
import aiDark from '../../ai-dark.png'
import fileLight from '../../file-light.png'
import fileDark from '../../file-dark.png'
import hearthImage from '../../hearth.png'
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
      title: 'hearth.',
      description: 'built a full-stack ai application that analyzes real estate listings to find accessibility barriers and generates renovation visualizations with cost estimates. engineered a web scraping pipeline using playwright to extract property images from realtor.ca listings.',
      tags: ['fastapi', 'next.js', 'typescript', 'google gemini api', 'playwright'],
      link: 'https://github.com/zishinew/hearth',
      image: hearthImage
    },
    {
      title: 'California Housing Price Predictor',
      description: 'developed a regression model to predict median house values, achieving 84% accuracy. cleaned and preprocessed datasets using pandas and numpy, with feature scaling and one-hot encoding.',
      tags: ['python', 'scikit-learn', 'pandas', 'numpy', 'matplotlib'],
      link: 'https://github.com/zishinew/California-Housing-Price-Predictor',
      image: isDark ? mlDark : mlLight
    },
    {
      title: 'AI Resume Reviewer',
      description: 'integrated google\'s gemini api to automate resume critiques. developed and deployed a full-stack web application for accessible file upload and instant ai reviews.',
      tags: ['python', 'streamlit', 'gemini api'],
      link: 'https://github.com/zishinew/AI-Resume-Critique',
      image: isDark ? aiDark : aiLight
    },
    {
      title: 'Automated File Organization App',
      description: 'reduced file management time by engineering a script to automate file organization, sorting 18+ file types. developed a full-stack application using customtkinter.',
      tags: ['python', 'customtkinter'],
      link: 'https://github.com/zishinew/File-Organizer',
      image: isDark ? fileDark : fileLight
    }
  ]

  return (
    <section id="projects" className="projects">
      <div ref={ref} className={`projects-wrapper ${isVisible ? 'fade-in' : ''}`}>
        <h2>projects</h2>
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
