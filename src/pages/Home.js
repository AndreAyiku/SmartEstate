import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/HomePage.module.css';
import MobileMenu from '../pages/MobileMenu';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }

    // Fetch properties (mock data for now)
    const mockProperties = [
      {
        id: 1,
        title: "Modern Apartment in Downtown",
        price: "$250,000",
        location: "Downtown, City Center",
        bedrooms: 2,
        bathrooms: 1,
        area: "1,200 sqft",
        type: "Apartment",
        image: "/property1.jpg"
      },
      {
        id: 2,
        title: "Luxury Villa with Pool",
        price: "$750,000",
        location: "Beachside, Ocean View",
        bedrooms: 4,
        bathrooms: 3,
        area: "3,500 sqft",
        type: "Villa",
        image: "/property2.jpg"
      },
      {
        id: 3,
        title: "Cozy Studio for Rent",
        price: "$1,200/month",
        location: "University District",
        bedrooms: 1,
        bathrooms: 1,
        area: "650 sqft",
        type: "Studio",
        image: "/property3.jpg"
      },
      {
        id: 4,
        title: "Family Home with Garden",
        price: "$450,000",
        location: "Suburban Area",
        bedrooms: 3,
        bathrooms: 2,
        area: "2,000 sqft",
        type: "House",
        image: "/property4.jpg"
      },
      {
        id: 5,
        title: "Commercial Office Space",
        price: "$2,500/month",
        location: "Business District",
        bedrooms: 0,
        bathrooms: 2,
        area: "1,800 sqft",
        type: "Commercial",
        image: "/property5.jpg"
      },
      {
        id: 6,
        title: "Renovated Townhouse",
        price: "$350,000",
        location: "Historic District",
        bedrooms: 3,
        bathrooms: 2.5,
        area: "1,800 sqft",
        type: "Townhouse",
        image: "/property6.jpg"
      }
    ];
    
    setProperties(mockProperties);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleClickOutside = (e) => {
    if (showDropdown && !e.target.closest(`.${styles.userMenu}`)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const filteredProperties = properties.filter(property => 
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <Head>
        <title>Properties | Smart Real Estate</title>
        <meta name="description" content="Browse available properties on Smart Real Estate" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <nav className={styles.navbar}>
        <div className={styles.navbarLeft}>
          <Link href="/" className={styles.logo}>
            <i className="bx bxs-building-house"></i> SmartEstate
          </Link>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/ai-chatbot" className={styles.navLink}>
            AI Chatbot
          </Link>
          <Link href="/maps" className={styles.navLink}>
            Maps
          </Link>
          <Link href="/properties" className={styles.navLink}>
            Properties
          </Link>
          <Link href="/favorites" className={styles.navLink}>
            Favorites
          </Link>
        </div>

        <div className={styles.navbarRight}>
          <div className={styles.mobileMenuButton} onClick={toggleMobileMenu}>
            <i className="bx bx-menu"></i>
          </div>
          
          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.userProfile} onClick={toggleDropdown}>
                <span className={styles.welcomeUser}>Welcome, {user.username}</span>
                <i className={`bx ${showDropdown ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
              </div>
              {showDropdown && (
                <div className={styles.dropdownMenu}>
                  <Link href="/dashboard" className={styles.dropdownItem}>
                    Dashboard
                  </Link>
                  <Link href="/profile" className={styles.dropdownItem}>
                    Profile
                  </Link>
                  <Link href="/my-properties" className={styles.dropdownItem}>
                    My Properties
                  </Link>
                  <Link href="/messages" className={styles.dropdownItem}>
                    Messages
                  </Link>
                  <div className={styles.divider}></div>
                  <button onClick={handleLogout} className={styles.dropdownItem}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.loginButton}>
                Login
              </Link>
              <Link href="/register" className={styles.registerButton}>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      <MobileMenu 
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        user={user}
        onLogout={handleLogout}
      />

      <main className={styles.main}>
        <div className={styles.searchContainer}>
          <div className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Search by location, property type, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className={styles.searchButton}>Search</button>
          </div>
          <div className={styles.searchFilters}>
            <select className={styles.filterSelect}>
              <option value="">Property Type</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="townhouse">Townhouse</option>
              <option value="commercial">Commercial</option>
            </select>
            <select className={styles.filterSelect}>
              <option value="">Price Range</option>
              <option value="0-100000">$0 - $100,000</option>
              <option value="100000-250000">$100,000 - $250,000</option>
              <option value="250000-500000">$250,000 - $500,000</option>
              <option value="500000-1000000">$500,000 - $1,000,000</option>
              <option value="1000000+">$1,000,000+</option>
            </select>
            <select className={styles.filterSelect}>
              <option value="">Bedrooms</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
            <select className={styles.filterSelect}>
              <option value="">Bathrooms</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
            </select>
          </div>
        </div>

        <div className={styles.propertiesGrid}>
          {filteredProperties.length > 0 ? (
            filteredProperties.map((property) => (
              <div key={property.id} className={styles.propertyCard}>
                <div className={styles.propertyImageContainer}>
                  <img src={property.image} alt={property.title} className={styles.propertyImage} />
                  <div className={styles.propertyType}>{property.type}</div>
                  <button className={styles.favoriteButton}>
                    <i className="bx bx-heart"></i>
                  </button>
                </div>
                <div className={styles.propertyInfo}>
                  <h3 className={styles.propertyTitle}>{property.title}</h3>
                  <p className={styles.propertyLocation}>
                    <i className="bx bx-map"></i> {property.location}
                  </p>
                  <div className={styles.propertyFeatures}>
                    <span><i className="bx bx-bed"></i> {property.bedrooms} Beds</span>
                    <span><i className="bx bx-bath"></i> {property.bathrooms} Baths</span>
                    <span><i className="bx bx-area"></i> {property.area}</span>
                  </div>
                  <div className={styles.propertyPriceRow}>
                    <p className={styles.propertyPrice}>{property.price}</p>
                    <Link href={`/properties/${property.id}`} className={styles.viewDetailsButton}>
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              <i className="bx bx-search-alt"></i>
              <h3>No properties found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        <div className={styles.pagination}>
          <button className={styles.paginationButton}><i className="bx bx-chevron-left"></i></button>
          <button className={`${styles.paginationButton} ${styles.active}`}>1</button>
          <button className={styles.paginationButton}>2</button>
          <button className={styles.paginationButton}>3</button>
          <button className={styles.paginationButton}><i className="bx bx-chevron-right"></i></button>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.socialIcons}>
            <a href="#"><i className="bx bxl-facebook"></i></a>
            <a href="#"><i className="bx bxl-twitter"></i></a>
            <a href="#"><i className="bx bxl-instagram"></i></a>
            <a href="#"><i className="bx bxl-linkedin"></i></a>
          </div>
        </div>
        <p className={styles.footerText}>
          <span>Need more info?</span> 
          <a href="contact.html">Contact us</a> or explore <a href="services.html">Our Services</a>.
        </p>
      </footer>
    </div>
  );
}