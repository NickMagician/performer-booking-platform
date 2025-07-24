import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQPage = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I book a performer?",
      answer: "Simply browse our performers, view their profiles, and click 'Get Quote' to send them a message with your event details. They'll respond with a personalized quote. Once you're happy, you can confirm the booking and make payment through our secure platform."
    },
    {
      id: 2,
      question: "Are all performers verified?",
      answer: "Yes, all performers on our platform go through a verification process including identity checks, DBS checks where applicable, and insurance verification. Look for the 'Verified' badge on performer profiles."
    },
    {
      id: 3,
      question: "How does payment work?",
      answer: "We use Stripe for secure payment processing. You'll typically pay a deposit to confirm your booking, with the remainder due closer to your event date. Your money is protected and only released to the performer after your event is completed successfully."
    },
    {
      id: 4,
      question: "What if I need to cancel my booking?",
      answer: "Cancellation policies vary by performer and timing. Generally, cancellations more than 48 hours before your event receive a full refund. Cancellations within 24-48 hours may incur a partial fee, and last-minute cancellations may not be refundable. Check the specific terms when booking."
    },
    {
      id: 5,
      question: "Can I communicate directly with performers?",
      answer: "Yes! Once you send an enquiry, you can chat directly with performers through our messaging system. This allows you to discuss your specific requirements, ask questions, and ensure they're the perfect fit for your event."
    },
    {
      id: 6,
      question: "What types of events do you cover?",
      answer: "We cover all types of events including weddings, birthday parties, corporate events, festivals, private parties, and more. Our performers are experienced in various event types and can adapt their performances accordingly."
    },
    {
      id: 7,
      question: "How far in advance should I book?",
      answer: "We recommend booking as early as possible, especially for popular dates like weekends and holidays. Many performers can accommodate last-minute bookings, but booking 2-4 weeks in advance gives you the best selection."
    },
    {
      id: 8,
      question: "What happens if a performer cancels?",
      answer: "While rare, if a performer needs to cancel, we'll immediately help you find a suitable replacement. If we can't find a replacement, you'll receive a full refund. We also have contingency measures in place for emergencies."
    },
    {
      id: 9,
      question: "Are there any hidden fees?",
      answer: "No hidden fees! Our platform fee is included in the quoted price. The only additional costs might be travel expenses for performers coming from far away, which will be clearly stated upfront."
    },
    {
      id: 10,
      question: "How do I leave a review?",
      answer: "After your event, you'll receive an email invitation to leave a review. You can rate the performer on various aspects like professionalism, quality, and value for money. Reviews help other customers and support our performers."
    }
  ];

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="faq-page">
      {/* Page header */}
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <h1 className="page-title">Frequently Asked Questions</h1>
            <p className="page-subtitle">
              Find answers to common questions about booking performers
            </p>
          </div>

          {/* Breadcrumbs */}
          <nav className="breadcrumbs">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">FAQ</span>
          </nav>
        </div>
      </div>

      <div className="container">
        <div className="faq-content">
          <div className="faq-list">
            {faqs.map(faq => (
              <div key={faq.id} className="faq-item">
                <button
                  className={`faq-question ${openFAQ === faq.id ? 'open' : ''}`}
                  onClick={() => toggleFAQ(faq.id)}
                >
                  <span>{faq.question}</span>
                  <svg
                    className={`faq-chevron ${openFAQ === faq.id ? 'rotate' : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {openFAQ === faq.id && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact section */}
          <div className="faq-contact">
            <h2>Still have questions?</h2>
            <p>
              Can't find the answer you're looking for? Our friendly support team is here to help.
            </p>
            <div className="contact-options">
              <a href="mailto:hello@bookperformers.co.uk" className="btn btn-primary">
                Email Support
              </a>
              <a href="tel:08001234567" className="btn btn-secondary">
                Call Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
