import { useState, useEffect } from 'react';
import styles from '@/styles/AdminDashboard.module.css';

const PropertyManagement = ({ user }) => {  // Accept user prop
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  useEffect(() => {
    // Only fetch properties when user object is valid and has an id
    if (user && user.id) {
      fetchProperties();
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter, user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      // Safety check to prevent the TypeError
      if (!user || !user.id) {
        throw new Error('User information is missing');
      }
      
      // Add a timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage);
      if (searchTerm) queryParams.append('search', searchTerm);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (typeFilter) queryParams.append('type', typeFilter);
      
      console.log(`Fetching properties with params: ${queryParams.toString()}`);
      console.log(`User ID in headers: ${user.id.toString()}`);
      
      const response = await fetch(`/api/admin/properties?${queryParams.toString()}`, {
        headers: {
          'user-id': user.id.toString() // Add user ID to headers
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Error response (${response.status}):`, errorData);
        throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Properties data received:', data);
      setProperties(data.properties || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(`Failed to load properties: ${err.message}`);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchProperties();
  };

  const handleDeleteProperty = (property) => {
    setPropertyToDelete(property);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/properties?propertyId=${propertyToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'user-id': user.id.toString() // Add user ID to headers
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete property');
      }
      
      // Remove property from the list
      setProperties(prevProperties => prevProperties.filter(property => property.id !== propertyToDelete.id));
      setShowConfirmModal(false);
      setPropertyToDelete(null);
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={styles.managementContainer}>
      <div className={styles.managementHeader}>
        <h2><i className="bx bx-building-house"></i> Property Management</h2>
        <p>View and manage all properties in the system</p>
      </div>
      
      <div className={styles.filtersContainer}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <i className="bx bx-search"></i>
            <input 
              type="text" 
              placeholder="Search properties by title, location..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>
        
        <div className={styles.filterGroup}>
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Sold">Sold</option>
            <option value="Pending">Pending</option>
            <option value="Rented">Rented</option>
            <option value="Off Market">Off Market</option>
          </select>
          
          <select 
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="">All Types</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Villa">Villa</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Studio">Studio</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>
      </div>
      
      {loading && properties.length === 0 ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading properties...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <i className="bx bx-error-circle"></i>
          <p>{error}</p>
          <button 
            onClick={fetchProperties} 
            className={styles.retryButton}
          >
            <i className="bx bx-refresh"></i> Retry
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Realtor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id}>
                    <td>{property.id}</td>
                    <td>{property.title}</td>
                    <td>{formatPrice(property.price)}</td>
                    <td>{property.property_type}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${
                        property.status === 'Available' ? styles.availableBadge : 
                        property.status === 'Sold' ? styles.soldBadge : 
                        property.status === 'Pending' ? styles.pendingBadge :
                        property.status === 'Rented' ? styles.rentedBadge :
                        styles.offMarketBadge
                      }`}>
                        {property.status}
                      </span>
                    </td>
                    <td>
                      {property.realtor ? (
                        <span className={styles.realtorName}>
                          {property.realtor.username}
                        </span>
                      ) : (
                        <span className={styles.noRealtor}>No Realtor</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.viewButton}
                          onClick={() => window.open(`/properties/${property.id}`, '_blank')}
                        >
                          <i className="bx bx-show"></i>
                        </button>
                        <button 
                          className={styles.deleteButton}
                          onClick={() => handleDeleteProperty(property)}
                        >
                          <i className="bx bx-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {properties.length === 0 && (
            <div className={styles.noResults}>
              <i className="bx bx-info-circle"></i>
              <h3>No properties found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                className={styles.paginationButton}
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="bx bx-chevron-left"></i>
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button 
                      key={pageNum}
                      className={`${styles.paginationButton} ${currentPage === pageNum ? styles.active : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } 
                else if (
                  pageNum === currentPage - 2 || 
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className={styles.paginationButton}>...</span>;
                }
                return null;
              })}
              
              <button 
                className={styles.paginationButton}
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Confirmation Modal */}
      {showConfirmModal && propertyToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3><i className="bx bx-error-circle"></i> Confirm Deletion</h3>
              <button 
                className={styles.modalCloseButton} 
                onClick={() => setShowConfirmModal(false)}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to delete the property <strong>{propertyToDelete.title}</strong>?</p>
              <p className={styles.warningText}>This action cannot be undone. All property data including images, features, and messages will be deleted.</p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton} 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={confirmDelete}
              >
                Delete Property
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;