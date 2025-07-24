import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '../context/SearchContext';
import api from '../services/api';

// Components
import PerformerCard from '../components/PerformerCard';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const navigate = useNavigate();
  const { actions } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch featured performers
  const { data: featuredPerformers = [], isLoading: performersLoading } = useQuery({
    queryKey: ['performers', 'featured'],
    queryFn: api.performers.getFeatured
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.getAll
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      actions.setQuery(searchQuery.trim());
      navigate('/search');
    }
  };

  const handleCategoryClick = (categorySlug) => {
    actions.setCategory(categorySlug);
    navigate(`/${categorySlug}`);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Find the Perfect Performer for Your Event
            </h1>
            <p className="hero-subtitle">
              Book talented magicians, musicians, entertainers and more for weddings, 
              parties, corporate events and special occasions across the UK.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="hero-search">
              <div className="search-group">
                <input
                  type="text"
                  placeholder="What type of performer are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="hero-search-input"
                />
                <button type="submit" className="hero-search-btn">
                  Search Performers
                </button>
              </div>
            </form>

            {/* Quick Links */}
            <div className="hero-quick-links">
              <span className="quick-links-label">Popular searches:</span>
              <Link to="/magicians" className="quick-link">Magicians</Link>
              <Link to="/singers" className="quick-link">Singers</Link>
              <Link to="/djs" className="quick-link">DJs</Link>
              <Link to="/caricaturists" className="quick-link">Caricaturists</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">
              Discover performers by their specialty
            </p>
          </div>

          {categoriesLoading ? (
            <div className="loading-container">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="categories-grid-home">
              {categories.slice(0, 8).map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.slug)}
                  className="category-card-home"
                >
                  <div className="category-icon-home">
                    {category.icon_url || '🎭'}
                  </div>
                  <h3 className="category-name-home">{category.name}</h3>
                  <p className="category-count-home">
                    {category.performer_count || 0} performers
                  </p>
                </button>
              ))}
            </div>
          )}

          <div className="section-footer">
            <Link to="/categories" className="btn btn-secondary">
              View All Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Performers Section */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Performers</h2>
            <p className="section-subtitle">
              Handpicked top-rated performers for your special events
            </p>
          </div>

          {performersLoading ? (
            <div className="loading-container">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="featured-grid">
              {featuredPerformers.slice(0, 6).map(performer => (
                <PerformerCard
                  key={performer.id}
                  performer={performer}
                  className="featured-card"
                />
              ))}
            </div>
          )}

          <div className="section-footer">
            <Link to="/search" className="btn btn-primary">
              View All Performers
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Booking your perfect performer is easy
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Search & Browse</h3>
                <p className="step-description">
                  Find performers by category, location, price, and availability. 
                  Read reviews and view portfolios.
                </p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Get Quotes</h3>
                <p className="step-description">
                  Contact performers directly through our platform. 
                  Get personalized quotes for your event.
                </p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Book & Pay</h3>
                <p className="step-description">
                  Secure your booking with our safe payment system. 
                  Your money is protected until after the event.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-content">
            <div className="trust-stats">
              <div className="trust-stat">
                <div className="stat-number">10,000+</div>
                <div className="stat-label">Happy Customers</div>
              </div>
              <div className="trust-stat">
                <div className="stat-number">500+</div>
                <div className="stat-label">Verified Performers</div>
              </div>
              <div className="trust-stat">
                <div className="stat-number">4.9/5</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>

            <div className="trust-features">
              <div className="trust-feature">
                <div className="feature-icon">🛡️</div>
                <div className="feature-content">
                  <h4>Secure Payments</h4>
                  <p>Your money is safe with our secure payment system</p>
                </div>
              </div>
              <div className="trust-feature">
                <div className="feature-icon">✅</div>
                <div className="feature-content">
                  <h4>Verified Performers</h4>
                  <p>All performers are background checked and verified</p>
                </div>
              </div>
              <div className="trust-feature">
                <div className="feature-icon">💬</div>
                <div className="feature-content">
                  <h4>24/7 Support</h4>
                  <p>Get help whenever you need it from our support team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
