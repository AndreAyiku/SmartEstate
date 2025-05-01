import React from 'react';
import styles from '@/styles/AdminDashboard.module.css';

const UserStats = ({ stats }) => {
  // Add a check for null or undefined values
  const newUsers = stats.newUsersThisMonth ?? 0;
  const newProperties = stats.newPropertiesThisMonth ?? 0;

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statsHeader}>
        <h2>System Overview</h2>
        <p>Summary of all users and properties in the system</p>
      </div>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="bx bx-user"></i>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Users</p>
            <h3 className={styles.statValue}>{stats.totalUsers}</h3>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fef9c3' }}>
            <i className="bx bx-building-house" style={{ color: '#ca8a04' }}></i>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Properties</p>
            <h3 className={styles.statValue}>{stats.totalProperties}</h3>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dcfce7' }}>
            <i className="bx bx-check-circle" style={{ color: '#16a34a' }}></i>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Active Properties</p>
            <h3 className={styles.statValue}>{stats.activeProperties}</h3>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dbeafe' }}>
            <i className="bx bx-id-card" style={{ color: '#2563eb' }}></i>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Realtors</p>
            <h3 className={styles.statValue}>{stats.realtorCount}</h3>
          </div>
        </div>
      </div>
      
      <div className={styles.statsChartSection}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>User Distribution</h3>
          <div className={styles.userTypeChart}>
            {Object.entries(stats.userTypeDistribution).map(([type, count]) => (
              <div key={type} className={styles.chartItem}>
                <div className={styles.chartLabel}>{type}</div>
                <div className={styles.chartBarContainer}>
                  <div 
                    className={styles.chartBar} 
                    style={{ 
                      width: `${(count / stats.totalUsers) * 100}%`,
                      backgroundColor: 
                        type === 'Admin' ? '#f43f5e' : 
                        type === 'Realtor' ? '#3b82f6' : '#10b981'
                    }}
                  ></div>
                  <span className={styles.chartValue}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Property Status</h3>
          <div className={styles.userTypeChart}>
            {Object.entries(stats.propertyStatusDistribution).map(([status, count]) => (
              <div key={status} className={styles.chartItem}>
                <div className={styles.chartLabel}>{status}</div>
                <div className={styles.chartBarContainer}>
                  <div 
                    className={styles.chartBar} 
                    style={{ 
                      width: `${(count / stats.totalProperties) * 100}%`,
                      backgroundColor: 
                        status === 'Available' ? '#10b981' : 
                        status === 'Sold' ? '#6366f1' :
                        status === 'Pending' ? '#f59e0b' :
                        status === 'Rented' ? '#8b5cf6' : '#94a3b8'
                    }}
                  ></div>
                  <span className={styles.chartValue}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className={styles.summarySection}>
        <div className={styles.summaryCard}>
          <h3><i className="bx bx-line-chart"></i> Quick Summary</h3>
          <ul className={styles.summaryList}>
            <li>
              <span>New users this month:</span>
              <strong>{newUsers}</strong>
            </li>
            <li>
              <span>New properties this month:</span>
              <strong>{newProperties}</strong>
            </li>
            <li>
              <span>Total messages in system:</span>
              <strong>{stats.totalMessages}</strong>
            </li>
            <li>
              <span>Total favorites saved:</span>
              <strong>{stats.totalFavorites}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserStats;