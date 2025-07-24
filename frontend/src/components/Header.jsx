import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';

const Header = () => {
  const navigate = useNavigate();
  const { state, actions } = useSearch();
  const [searchQuery, setSearchQuery] = useState(state.query || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    actions.setQuery(searchQuery);
    navigate('/search');
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <span className="logo-icon">🎭</span>
            <span className="logo-text">BookPerformers</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="header-search">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Search for performers, categories, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </form>

          {/* Navigation */}
          <nav className="header-nav">
            <Link to="/categories" className="nav-link">
              Browse Categories
            </Link>
            <Link to="/about" className="nav-link">
              About
            </Link>
            <Link to="/faq" className="nav-link">
              FAQ
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 12h18m-9-9v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <form onSubmit={handleSearch} className="mobile-search">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Search performers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-btn">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
            
            <div className="mobile-nav">
              <Link 
                to="/categories" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Categories
              </Link>
              <Link 
                to="/about" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/faq" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
