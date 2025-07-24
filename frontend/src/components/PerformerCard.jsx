import React from 'react';
import { Link } from 'react-router-dom';

const PerformerCard = ({ performer, className = '' }) => {
  const {
    slug,
    stage_name,
    user,
    bio,
    base_price,
    city,
    county,
    average_rating,
    total_reviews,
    is_verified,
    is_featured,
    categories = [],
    media = []
  } = performer;

  const featuredImage = media.find(m => m.is_featured) || media[0];
  const displayName = stage_name || `${user?.first_name} ${user?.last_name}`;
  const location = county ? `${city}, ${county}` : city;
  const primaryCategory = categories[0];

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="rating-stars">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="star filled">★</span>
        ))}
        {hasHalfStar && <span className="star half">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="star empty">☆</span>
        ))}
      </div>
    );
  };

  return (
    <div className={`performer-card ${is_featured ? 'featured' : ''} ${className}`}>
      <Link to={`/performer/${slug}`} className="performer-card-link">
        {/* Image */}
        <div className="performer-image-container">
          {featuredImage ? (
            <img
              src={featuredImage.file_url}
              alt={`${displayName} - ${primaryCategory?.name || 'Performer'}`}
              className="performer-image"
              loading="lazy"
            />
          ) : (
            <div className="performer-image-placeholder">
              <span className="placeholder-icon">👤</span>
            </div>
          )}
          
          {/* Badges */}
          <div className="performer-badges">
            {is_featured && (
              <span className="badge featured-badge">Featured</span>
            )}
            {is_verified && (
              <span className="badge verified-badge">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="performer-content">
          {/* Header */}
          <div className="performer-header">
            <h3 className="performer-name">{displayName}</h3>
            {primaryCategory && (
              <span className="performer-category">{primaryCategory.name}</span>
            )}
          </div>

          {/* Location */}
          {location && (
            <div className="performer-location">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{location}</span>
            </div>
          )}

          {/* Bio */}
          {bio && (
            <p className="performer-bio">
              {bio.length > 120 ? `${bio.substring(0, 120)}...` : bio}
            </p>
          )}

          {/* Rating */}
          <div className="performer-rating">
            {renderStars(average_rating)}
            <span className="rating-text">
              {average_rating?.toFixed(1)} ({total_reviews} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="performer-price">
            <span className="price-label">From</span>
            <span className="price-amount">£{base_price?.toFixed(0)}</span>
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="performer-actions">
        <Link
          to={`/performer/${slug}`}
          className="btn btn-primary"
        >
          View Profile
        </Link>
        <Link
          to={`/performer/${slug}#enquire`}
          className="btn btn-secondary"
        >
          Get Quote
        </Link>
      </div>
    </div>
  );
};

export default PerformerCard;
