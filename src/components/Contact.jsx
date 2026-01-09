import { useState, useEffect } from 'react'
import { FaLinkedin, FaGithub, FaYoutube } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import './Contact.css'

function Contact() {
  const [isNearBottom, setIsNearBottom] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const clientHeight = window.innerHeight
      
      // Check if user is within 200px of the bottom
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)
      setIsNearBottom(distanceFromBottom < 200)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial position

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const links = [
    { name: 'Email', url: 'mailto:wzishine@gmail.com', icon: MdEmail },
    { name: 'GitHub', url: 'https://github.com/zishinew', icon: FaGithub },
    { name: 'LinkedIn', url: 'https://linkedin.com/in/zishine', icon: FaLinkedin },
    { name: 'YouTube', url: 'https://youtube.com/@zshyne', icon: FaYoutube }
  ]

  return (
    <div className={`contact-footer ${isNearBottom ? 'expanded' : ''}`}>
      <div className="contact-label">Contact me!</div>
      <div className="icon-container">
        {links.map((link, index) => {
          const IconComponent = link.icon
          return (
            <a
              href={link.url}
              key={index}
              className="icon-link"
              title={link.name}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconComponent />
            </a>
          )
        })}
      </div>
    </div>
  )
}

export default Contact
