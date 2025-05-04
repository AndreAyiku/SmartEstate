import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Contact.module.css';
import Navigation from '@/components/Navigation';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', content: '' });

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', content: '' });

    // Simulate form submission
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      setSubmitMessage({
        type: 'success',
        content: 'Your message has been sent successfully! We will get back to you soon.'
      });
      
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        content: 'Failed to send message. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Contact Us | SmartEstate</title>
        <meta name="description" content="Contact SmartEstate for inquiries about real estate properties and services" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Navigation />

      {/* Background Image */}
      <div className={styles.imageBg} style={{ backgroundImage: 'url(/bg2.jpeg)' }}></div>

      {/* Dark Overlay */}
      <div className={styles.overlay}></div>

      <main className={styles.main}>
        <div className={styles.contactContainer}>
          <div className={styles.contactHeader}>
            <h1>Get In Touch</h1>
            <p>We are here to answer any questions you might have about our services. Reach out to us and we will respond as soon as we can.</p>
          </div>

          <div className={styles.contactContent}>
            <div className={styles.contactInfoSection}>
              <div className={styles.contactInfo}>
                <h2>Contact Information</h2>
                <p className={styles.contactSubtitle}>
                  Feel free to contact us using the information below
                </p>

                <div className={styles.contactDetails}>
                  <div className={styles.contactItem}>
                    <i className="bx bx-envelope"></i>
                    <div>
                      <h3>Email</h3>
                      <a href="mailto:smartestate.service@gmail.com">smartestate.service@gmail.com</a>
                    </div>
                  </div>
                  
                  <div className={styles.contactItem}>
                    <i className="bx bx-phone"></i>
                    <div>
                      <h3>Phone</h3>
                      <a href="tel:+233508822990">+233 508822990</a>
                    </div>
                  </div>
                  
                  <div className={styles.contactItem}>
                    <i className="bx bx-map"></i>
                    <div>
                      <h3>Address</h3>
                      <p>123 Real Estate Avenue, Accra, Ghana</p>
                    </div>
                  </div>
                </div>

                <div className={styles.socialLinks}>
                  <h3>Connect with us</h3>
                  <div className={styles.socialIcons}>
                    <a href="#" aria-label="Facebook"><i className="bx bxl-facebook"></i></a>
                    <a href="#" aria-label="Twitter"><i className="bx bxl-twitter"></i></a>
                    <a href="#" aria-label="Instagram"><i className="bx bxl-instagram"></i></a>
                    <a href="#" aria-label="LinkedIn"><i className="bx bxl-linkedin"></i></a>
                  </div>
                </div>
              </div>

              <div className={styles.businessHours}>
                <h3>Business Hours</h3>
                <ul>
                  <li><span>Monday - Friday:</span> 8:00 AM - 6:00 PM</li>
                  <li><span>Saturday:</span> 9:00 AM - 4:00 PM</li>
                  <li><span>Sunday:</span> Closed</li>
                </ul>
              </div>
            </div>

            <div className={styles.contactFormSection}>
              <div className={styles.formWrapper}>
                <h2>Send us a Message</h2>
                
                {submitMessage.content && (
                  <div className={`${styles.messageAlert} ${styles[submitMessage.type]}`}>
                    <i className={`bx ${submitMessage.type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}`}></i>
                    <p>{submitMessage.content}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className={styles.contactForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      placeholder="Enter your subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      rows="5"
                      placeholder="Enter your message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <i className='bx bx-loader-alt bx-spin'></i>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className='bx bx-send'></i>
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.socialIcons}>
            <a href="#"><i className="bx bxl-twitter"></i></a>
            <a href="https://www.instagram.com/smartestatee?igsh=MTI1enVvdHNtN3c1NA%3D%3D&utm_source=qr"><i className="bx bxl-instagram"></i></a>
            <a href="#"><i className="bx bxl-linkedin"></i></a>
          </div>
        </div>
        <p className={styles.footerText}>
          <span>&copy; {new Date().getFullYear()} SmartEstate. All rights reserved.</span>
        </p>
      </footer>
    </div>
  );
}