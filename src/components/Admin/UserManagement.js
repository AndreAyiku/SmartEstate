import { useState, useEffect } from 'react';
import styles from '@/styles/AdminDashboard.module.css';

const UserManagement = ({ user }) => {  // Accept user prop
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    // Only fetch users when user object is valid and has an id
    if (user && user.id) {
      fetchUsers();
    }
  }, [currentPage, searchTerm, userTypeFilter, user]);

  const fetchUsers = async () => {
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
      if (userTypeFilter) queryParams.append('userType', userTypeFilter);
      
      console.log(`Fetching users with params: ${queryParams.toString()}`);
      console.log(`User ID in headers: ${user.id.toString()}`);
      
      const response = await fetch(`/api/admin/users?${queryParams.toString()}`, {
        headers: {
          'user-id': user.id.toString() // Add user ID to headers
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Error response (${response.status}):`, errorData);
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Users data received:', data);
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to load users: ${err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchUsers();
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/users?userId=${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'user-id': user.id.toString() // Add user ID to headers
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Remove user from the list
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
      setShowConfirmModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };

  return (
    <div className={styles.managementContainer}>
      {error ? (
        <div className={styles.errorMessage}>
          <i className="bx bx-error-circle"></i>
          <p>{error}</p>
          <button onClick={() => user?.id && fetchUsers()} className={styles.retryButton}>
            <i className="bx bx-refresh"></i> Retry
          </button>
        </div>
      ) : loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <>
          <div className={styles.managementHeader}>
            <h2><i className="bx bx-user"></i> User Management</h2>
            <p>View and manage all users in the system</p>
          </div>
          
          <div className={styles.filtersContainer}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <div className={styles.searchInputWrapper}>
                <i className="bx bx-search"></i>
                <input 
                  type="text" 
                  placeholder="Search users by name, email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <button type="submit" className={styles.searchButton}>
                Search
              </button>
            </form>
            
            <div className={styles.filterDropdown}>
              <select 
                value={userTypeFilter}
                onChange={(e) => {
                  setUserTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.filterSelect}
              >
                <option value="">All User Types</option>
                <option value="User">Regular Users</option>
                <option value="Realtor">Realtors</option>
                <option value="Admin">Admins</option>
              </select>
            </div>
          </div>
          
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>User Type</th>
                  <th>Properties</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`${styles.userTypeBadge} ${
                        user.user_type === 'Admin' ? styles.adminBadge : 
                        user.user_type === 'Realtor' ? styles.realtorBadge : 
                        styles.userBadge
                      }`}>
                        {user.user_type}
                      </span>
                    </td>
                    <td>{user.property_count || 0}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.viewButton}
                          onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                        >
                          <i className="bx bx-show"></i>
                        </button>
                        <button 
                          className={styles.deleteButton}
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.user_type === 'Admin'} // Can't delete admins
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
          
          {users.length === 0 && (
            <div className={styles.noResults}>
              <i className="bx bx-info-circle"></i>
              <h3>No users found</h3>
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
      {showConfirmModal && userToDelete && (
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
              <p>Are you sure you want to delete the user <strong>{userToDelete.username}</strong>?</p>
              <p className={styles.warningText}>This action cannot be undone. All user data including properties, messages, and favorites will be deleted.</p>
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
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;