import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

// Components
import LoadingSpinner from '../components/LoadingSpinner';

const CategoriesListPage = () => {
  // Fetch categories with performer counts
  const {
    data: categories = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['categories', 'with-counts'],
    queryFn: api.categories.getAll
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p>Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Unable to Load Categories</h2>
          <p>Sorry, we couldn't load the categories. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-page">
      {/* Page header */}
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <h1 className="page-title">Browse by Category</h1>
            <p className="page-subtitle">
              Find the perfect performer for your event from our wide range of categories
            </p>
          </div>

          {/* Breadcrumbs */}
          <nav className="breadcrumbs">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">Categories</span>
          </nav>
        </div>
      </div>

      {/* Categories grid */}
      <div className="container">
        <div className="categories-grid">
          {categories.map(category => (
            <Link
              key={category.id}
              to={`/${category.slug}`}
              className="category-card"
            >
              <div className="category-card-content">
                {/* Icon */}
                <div className="category-icon">
                  {category.icon_url || '🎭'}
                </div>

                {/* Info */}
                <div className="category-info">
                  <h3 className="category-name">{category.name}</h3>
                  {category.description && (
                    <p className="category-description">{category.description}</p>
                  )}
                  <div className="category-count">
                    {category.performer_count || 0} performers
                  </div>
                </div>

                {/* Arrow */}
                <div className="category-arrow">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Popular searches */}
        <div className="popular-searches">
          <h2>Popular Searches</h2>
          <div className="popular-links">
            <Link to="/magicians/london" className="popular-link">
              Magicians in London
            </Link>
            <Link to="/singers/manchester" className="popular-link">
              Singers in Manchester
            </Link>
            <Link to="/djs/birmingham" className="popular-link">
              DJs in Birmingham
            </Link>
            <Link to="/caricaturists/leeds" className="popular-link">
              Caricaturists in Leeds
            </Link>
            <Link to="/bands/liverpool" className="popular-link">
              Bands in Liverpool
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesListPage;
