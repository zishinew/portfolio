import mlLight from '../../ml-light.png'
import mlDark from '../../ml-dark.png'
import aiLight from '../../ai-light.png'
import aiDark from '../../ai-dark.png'
import fileLight from '../../file-light.png'
import fileDark from '../../file-dark.png'
import hearthImage from '../../hearth.png'
import fryLight from '../../frymyresume_light.png'
import fryDark from '../../frymyresume_dark.png'
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
      title: 'frymyresume.cv',
      description: 'full-stack job application simulator with AI resume critique, real internship search via SimplifyJobs, timed coding interviews with auto-grading, and live behavioral interviews using Gemini audio with WebSocket.',
      tags: ['react', 'python', 'fastapi', 'gemini api', 'websocket', 'monaco editor', 'web speech api'],
      site: 'https://frymyresume.cv',
      github: 'https://github.com/zishinew/frymyresume.cv',
      image: isDark ? fryDark : fryLight
    },
    {
      title: 'hearth.',
      description: 'application for seniors that analyzes real estate listings to find accessibility barriers and generates renovation visualizations with cost estimates.',
      tags: ['fastapi', 'next.js', 'typescript', 'react', 'python', 'tailwindcss', 'google gemini api', 'playwright'],
      link: 'https://github.com/zishinew/hearth-ai',
      image: hearthImage
    },
    {
      title: 'California Housing Price Predictor',
      description: 'regression model to predict median house values, achieving 84% accuracy.',
      tags: ['python', 'scikit-learn', 'pandas', 'numpy', 'matplotlib'],
      link: 'https://github.com/zishinew/California-Housing-Price-Predictor',
      image: isDark ? mlDark : mlLight
    },
    {
      title: 'Automated File Organization App',
      description: 'reduced file management time by engineering a script to automate file organization, sorting 18+ file types.',
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
          <a href={project.site || project.link} key={index} className="project-card" target="_blank" rel="noopener noreferrer">
            {project.image && <img src={project.image} alt={project.title} className="project-image" />}
            <div className="project-content">
              <div className="project-header">
                <h3>{project.title}</h3>
                <div className="project-header-icons">
                  {project.github && (
                    <span
                      className="github-icon"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        window.open(project.github, '_blank')
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </span>
                  )}
                  {project.site ? (
                    <span className="arrow">→</span>
                  ) : (
                    <span className="github-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </span>
                  )}
                </div>
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
