import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="container">
        <div className="not-found-content">
          <div className="error-icon">🎭</div>
          <h1 className="error-title">404</h1>
          <h2 className="error-subtitle">Page Not Found</h2>
          <p className="error-message">
            Sorry, the page you're looking for doesn't exist. 
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
          
          <div className="error-actions">
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
            <Link to="/categories" className="btn btn-secondary">
              Browse Categories
            </Link>
          </div>

          <div className="helpful-links">
            <h3>Popular Pages</h3>
            <ul>
              <li><Link to="/magicians">Magicians</Link></li>
              <li><Link to="/singers">Singers</Link></li>
              <li><Link to="/djs">DJs</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
