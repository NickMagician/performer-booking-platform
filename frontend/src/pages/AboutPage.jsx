import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="about-page">
      {/* Page header */}
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <h1 className="page-title">About BookPerformers</h1>
            <p className="page-subtitle">
              Connecting amazing performers with unforgettable events across the UK
            </p>
          </div>

          {/* Breadcrumbs */}
          <nav className="breadcrumbs">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">About</span>
          </nav>
        </div>
      </div>

      <div className="container">
        <div className="about-content">
          {/* Mission Section */}
          <section className="content-section">
            <h2>Our Mission</h2>
            <p>
              At BookPerformers, we believe every event deserves exceptional entertainment. 
              We're dedicated to connecting event organizers with talented, professional 
              performers across the UK, making it easier than ever to find and book the 
              perfect entertainment for weddings, corporate events, parties, and special occasions.
            </p>
          </section>

          {/* How We Help Section */}
          <section className="content-section">
            <h2>How We Help</h2>
            <div className="help-grid">
              <div className="help-item">
                <h3>For Event Organizers</h3>
                <ul>
                  <li>Browse hundreds of verified performers</li>
                  <li>Read genuine reviews from past clients</li>
                  <li>Get quotes and compare prices easily</li>
                  <li>Secure booking with payment protection</li>
                  <li>Direct communication with performers</li>
                </ul>
              </div>
              <div className="help-item">
                <h3>For Performers</h3>
                <ul>
                  <li>Reach thousands of potential clients</li>
                  <li>Showcase your talent with photos and videos</li>
                  <li>Manage bookings and availability</li>
                  <li>Secure payments and timely payouts</li>
                  <li>Build your reputation with reviews</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="content-section">
            <h2>Why Choose BookPerformers?</h2>
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">🛡️</div>
                <h3>Safe & Secure</h3>
                <p>All performers are verified and payments are protected until after your event.</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⭐</div>
                <h3>Quality Assured</h3>
                <p>Read genuine reviews and ratings from real customers to make informed decisions.</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">💬</div>
                <h3>Direct Communication</h3>
                <p>Chat directly with performers to discuss your requirements and get personalized quotes.</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📱</div>
                <h3>Easy to Use</h3>
                <p>Our platform is designed to make finding and booking performers simple and stress-free.</p>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="content-section stats-section">
            <h2>Our Impact</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">10,000+</div>
                <div className="stat-label">Events Booked</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Active Performers</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Cities Covered</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">4.9/5</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="content-section contact-section">
            <h2>Get in Touch</h2>
            <p>
              Have questions or need help finding the perfect performer? 
              Our friendly support team is here to help.
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <strong>Email:</strong> hello@bookperformers.co.uk
              </div>
              <div className="contact-item">
                <strong>Phone:</strong> 0800 123 4567
              </div>
              <div className="contact-item">
                <strong>Hours:</strong> Monday - Friday, 9am - 6pm
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
