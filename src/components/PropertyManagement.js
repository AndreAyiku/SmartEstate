import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/MyProperties.module.css';

const PropertyManagement = ({ properties, onDeleteProperty }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  
  // Filter properties based on search term and status
  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
      property.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || property.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'price_high':
        return b.price - a.price;
      case 'price_low':
        return a.price - b.price;
      case 'name_asc':
        return a.title.localeCompare(b.title);
      case 'name_desc':
        return b.title.localeCompare(a.title);
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Function to format price with commas and currency symbol
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Available':
        return styles.statusAvailable;
      case 'Sold':
        return styles.statusSold;
      case 'Pending':
        return styles.statusPending;
      case 'Rented':
        return styles.statusRented;
      case 'Off Market':
        return styles.statusOffMarket;
      default:
        return '';
    }
  };

  return (
    <div className={styles.propertyManagement}>
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <i className="bx bx-search"></i>
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.filterDropdowns}>
          <div className={styles.filterItem}>
            <label htmlFor="statusFilter">Status:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Sold">Sold</option>
              <option value="Pending">Pending</option>
              <option value="Rented">Rented</option>
              <option value="Off Market">Off Market</option>
            </select>
          </div>
          
          <div className={styles.filterItem}>
            <label htmlFor="sortBy">Sort by:</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_high">Price (High to Low)</option>
              <option value="price_low">Price (Low to High)</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className={styles.resultsInfo}>
        <p>
          Showing {sortedProperties.length} {sortedProperties.length === 1 ? 'property' : 'properties'}
          {statusFilter !== 'All' ? ` with status "${statusFilter}"` : ''}
          {searchTerm ? ` matching "${searchTerm}"` : ''}
        </p>
      </div>
      
      <div className={styles.propertiesList}>
        {sortedProperties.map((property) => (
          <div key={property.id} className={styles.propertyCard}>
            <div className={styles.propertyImage}>
              {property.images && property.images.length > 0 ? (
                <img 
                  src={property.images[0].url} 
                  alt={property.title}
                  className={styles.propertyImg}
                />
              ) : (
                <div className={styles.noImage}>
                  <i className="bx bx-building-house"></i>
                  <p>No Image</p>
                </div>
              )}
              <span className={`${styles.statusBadge} ${getStatusClass(property.status)}`}>
                {property.status}
              </span>
            </div>
            
            <div className={styles.propertyInfo}>
              <h3 className={styles.propertyTitle}>{property.title}</h3>
              <p className={styles.propertyLocation}>
                <i className="bx bx-map"></i>
                {property.address}, {property.city}
              </p>
              <p className={styles.propertyPrice}>{formatPrice(property.price)}</p>
              
              <div className={styles.propertyFeatures}>
                <div className={styles.feature}>
                  <i className="bx bx-bed"></i>
                  <span>{property.bedrooms} bd</span>
                </div>
                <div className={styles.feature}>
                  <i className="bx bx-bath"></i>
                  <span>{property.bathrooms} ba</span>
                </div>
                <div className={styles.feature}>
                  <i className="bx bx-area"></i>
                  <span>{property.area} sqft</span>
                </div>
              </div>
              
              <div className={styles.propertyMeta}>
                <p className={styles.propertyDate}>
                  Listed on {new Date(property.created_at).toLocaleDateString()}
                </p>
                <p className={styles.propertyType}>{property.property_type}</p>
              </div>
            </div>
            
            <div className={styles.propertyActions}>
              <Link href={`/properties/${property.id}`} className={styles.viewButton}>
                <i className="bx bx-show"></i> View
              </Link>
              <Link href={`/edit-property/${property.id}`} className={styles.editButton}>
                <i className="bx bx-edit"></i> Edit
              </Link>
              <button 
                onClick={() => onDeleteProperty(property.id)}
                className={styles.deleteButton}
              >
                <i className="bx bx-trash"></i> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyManagement;