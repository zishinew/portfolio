import { FaLinkedin, FaGithub, FaYoutube } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import './Contact.css'

function Contact() {
  const links = [
    { name: 'Email', url: 'mailto:wzishine@gmail.com', icon: MdEmail },
    { name: 'GitHub', url: 'https://github.com/zishinew', icon: FaGithub },
    { name: 'LinkedIn', url: 'https://linkedin.com/in/zishine', icon: FaLinkedin },
    { name: 'YouTube', url: 'https://youtube.com/@zshyne', icon: FaYoutube }
  ]

  return (
    <div className="contact-footer">
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
