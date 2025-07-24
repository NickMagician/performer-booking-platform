import React from 'react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <div className="terms-page">
      {/* Page header */}
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <h1 className="page-title">Terms & Conditions</h1>
            <p className="page-subtitle">
              Please read these terms carefully before using our platform
            </p>
          </div>

          {/* Breadcrumbs */}
          <nav className="breadcrumbs">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">Terms & Conditions</span>
          </nav>
        </div>
      </div>

      <div className="container">
        <div className="terms-content">
          <section className="terms-section">
            <h2>1. Introduction</h2>
            <p>
              Welcome to BookPerformers. These terms and conditions govern your use of our platform 
              and services. By using our website, you agree to comply with and be bound by these terms.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. Platform Services</h2>
            <p>
              BookPerformers provides a marketplace platform that connects event organizers with 
              professional performers. We facilitate bookings, payments, and communication between parties.
            </p>
          </section>

          <section className="terms-section">
            <h2>3. User Accounts</h2>
            <p>
              Users must provide accurate information when creating accounts. You are responsible 
              for maintaining the security of your account and all activities under your account.
            </p>
          </section>

          <section className="terms-section">
            <h2>4. Bookings and Payments</h2>
            <ul>
              <li>All bookings are subject to performer availability and confirmation</li>
              <li>Payment is processed securely through our payment partners</li>
              <li>Deposits may be required to confirm bookings</li>
              <li>Platform fees apply to all confirmed bookings</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>5. Cancellation Policy</h2>
            <p>
              Cancellation terms vary by performer and timing. Generally:
            </p>
            <ul>
              <li>48+ hours notice: Full refund available</li>
              <li>24-48 hours notice: Partial refund may apply</li>
              <li>Less than 24 hours: Limited or no refund</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>6. User Responsibilities</h2>
            <p>Users agree to:</p>
            <ul>
              <li>Provide accurate event information</li>
              <li>Treat performers with respect and professionalism</li>
              <li>Pay agreed fees on time</li>
              <li>Leave honest and constructive reviews</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>7. Performer Responsibilities</h2>
            <p>Performers agree to:</p>
            <ul>
              <li>Provide accurate profile information</li>
              <li>Maintain appropriate insurance and certifications</li>
              <li>Deliver services as agreed</li>
              <li>Communicate professionally with clients</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>8. Limitation of Liability</h2>
            <p>
              BookPerformers acts as a platform facilitator. While we strive to ensure quality, 
              we are not liable for the actual performance services provided by third-party performers.
            </p>
          </section>

          <section className="terms-section">
            <h2>9. Contact Information</h2>
            <p>
              For questions about these terms, please contact us at:
            </p>
            <p>
              Email: legal@bookperformers.co.uk<br/>
              Phone: 0800 123 4567
            </p>
          </section>

          <section className="terms-section">
            <p className="last-updated">
              <em>Last updated: January 2024</em>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
