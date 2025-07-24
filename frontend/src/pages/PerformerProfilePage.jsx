import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

// Components
import LoadingSpinner from '../components/LoadingSpinner';
import MediaGallery from '../components/MediaGallery';
import ReviewsList from '../components/ReviewsList';
import EnquiryForm from '../components/EnquiryForm';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

const PerformerProfilePage = () => {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('about');
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);

  // Fetch performer data
  const {
    data: performer,
    isLoading,
    error
  } = useQuery({
    queryKey: ['performer', slug],
    queryFn: () => api.performers.getBySlug(slug),
    enabled: !!slug
  });

  // Fetch reviews
  const {
    data: reviewsData,
    isLoading: reviewsLoading
  } = useQuery({
    queryKey: ['reviews', performer?.id],
    queryFn: () => api.reviews.getByPerformer(performer.id),
    enabled: !!performer?.id
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p>Loading performer profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Performer Not Found</h2>
          <p>Sorry, we couldn't find the performer you're looking for.</p>
          <Link to="/search" className="btn btn-primary">
            Browse All Performers
          </Link>
        </div>
      </div>
    );
  }

  if (!performer) {
    return null;
  }

  const {
    stage_name,
    user,
    bio,
    years_experience,
    base_price,
    city,
    county,
    average_rating,
    total_reviews,
    total_bookings,
    is_verified,
    is_professional,
    insurance_coverage,
    dbs_checked,
    categories = [],
    media = [],
    equipment_provided,
    space_requirements,
    min_performance_duration,
    max_performance_duration
  } = performer;

  const displayName = stage_name || `${user?.first_name} ${user?.last_name}`;
  const location = county ? `${city}, ${county}` : city;
  const primaryCategory = categories[0];
  const featuredImage = media.find(m => m.is_featured) || media[0];

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="rating-stars large">
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

  const tabs = [
    { id: 'about', label: 'About', count: null },
    { id: 'media', label: 'Photos & Videos', count: media.length },
    { id: 'reviews', label: 'Reviews', count: total_reviews },
    { id: 'availability', label: 'Availability', count: null }
  ];

  return (
    <div className="performer-profile-page">
      {/* Hero section */}
      <div className="performer-hero">
        <div className="container">
          <div className="hero-content">
            {/* Image */}
            <div className="hero-image">
              {featuredImage ? (
                <img
                  src={featuredImage.file_url}
                  alt={`${displayName} - ${primaryCategory?.name || 'Performer'}`}
                  className="performer-main-image"
                />
              ) : (
                <div className="performer-image-placeholder">
                  <span className="placeholder-icon">👤</span>
                </div>
              )}
              
              {/* Badges */}
              <div className="performer-badges">
                {is_verified && (
                  <span className="badge verified-badge">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
                {is_professional && (
                  <span className="badge professional-badge">Professional</span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="hero-info">
              <div className="performer-header">
                <h1 className="performer-name">{displayName}</h1>
                {primaryCategory && (
                  <p className="performer-category">{primaryCategory.name}</p>
                )}
                {location && (
                  <div className="performer-location">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{location}</span>
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="performer-rating">
                {renderStars(average_rating)}
                <span className="rating-text">
                  {average_rating?.toFixed(1)} ({total_reviews} reviews)
                </span>
              </div>

              {/* Quick stats */}
              <div className="performer-stats">
                <div className="stat">
                  <span className="stat-value">{years_experience || 0}</span>
                  <span className="stat-label">Years Experience</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{total_bookings || 0}</span>
                  <span className="stat-label">Bookings</span>
                </div>
                <div className="stat">
                  <span className="stat-value">£{base_price?.toFixed(0) || 0}</span>
                  <span className="stat-label">Starting Price</span>
                </div>
              </div>

              {/* Features */}
              <div className="performer-features">
                {insurance_coverage && (
                  <span className="feature">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Insured
                  </span>
                )}
                {dbs_checked && (
                  <span className="feature">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    DBS Checked
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="hero-actions">
                <button
                  onClick={() => setShowEnquiryForm(true)}
                  className="btn btn-primary btn-large"
                >
                  Get Quote
                </button>
                <button
                  onClick={() => setActiveTab('availability')}
                  className="btn btn-secondary btn-large"
                >
                  Check Availability
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content tabs */}
      <div className="performer-content">
        <div className="container">
          {/* Tab navigation */}
          <div className="tab-navigation">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="tab-count">({tab.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="tab-content">
            {/* About tab */}
            {activeTab === 'about' && (
              <div className="about-content">
                <div className="content-grid">
                  <div className="main-content">
                    {/* Bio */}
                    <section className="content-section">
                      <h2>About {displayName}</h2>
                      <div className="bio-content">
                        {bio ? (
                          <p>{bio}</p>
                        ) : (
                          <p>No description available.</p>
                        )}
                      </div>
                    </section>

                    {/* Performance details */}
                    <section className="content-section">
                      <h2>Performance Details</h2>
                      <div className="details-grid">
                        {min_performance_duration && (
                          <div className="detail-item">
                            <strong>Performance Duration:</strong>
                            <span>
                              {min_performance_duration === max_performance_duration 
                                ? `${min_performance_duration} minutes`
                                : `${min_performance_duration}-${max_performance_duration} minutes`
                              }
                            </span>
                          </div>
                        )}
                        {equipment_provided && (
                          <div className="detail-item">
                            <strong>Equipment Provided:</strong>
                            <span>{equipment_provided}</span>
                          </div>
                        )}
                        {space_requirements && (
                          <div className="detail-item">
                            <strong>Space Requirements:</strong>
                            <span>{space_requirements}</span>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  <div className="sidebar-content">
                    {/* Key info */}
                    <div className="info-card">
                      <h3>Key Information</h3>
                      <div className="info-list">
                        <div className="info-item">
                          <span className="info-label">Location:</span>
                          <span className="info-value">{location}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Starting Price:</span>
                          <span className="info-value">£{base_price?.toFixed(0)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Experience:</span>
                          <span className="info-value">{years_experience} years</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Total Bookings:</span>
                          <span className="info-value">{total_bookings}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media tab */}
            {activeTab === 'media' && (
              <div className="media-content">
                <MediaGallery media={media} performerName={displayName} />
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === 'reviews' && (
              <div className="reviews-content">
                <ReviewsList
                  reviews={reviewsData?.results || []}
                  isLoading={reviewsLoading}
                  performerName={displayName}
                />
              </div>
            )}

            {/* Availability tab */}
            {activeTab === 'availability' && (
              <div className="availability-content">
                <AvailabilityCalendar performerId={performer.id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enquiry form modal */}
      {showEnquiryForm && (
        <EnquiryForm
          performer={performer}
          onClose={() => setShowEnquiryForm(false)}
        />
      )}
    </div>
  );
};

export default PerformerProfilePage;
