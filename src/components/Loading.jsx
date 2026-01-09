import './Loading.css'
import logoImg from '../../logo.png'

function Loading({ fadeOut }) {
  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <img src={logoImg} alt="Logo" className="loading-logo" />
        <div className="loading-spinner-container">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      </div>
    </div>
  )
}

export default Loading
