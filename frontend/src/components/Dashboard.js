import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading">
          <div className="loading-spinner">
            <i className="fas fa-circle-notch fa-spin"></i>
          </div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-grid">
        {/* Stats Cards */}
        <div className="stats-section">
          <h2>Overview</h2>
          <div className="stats-grid">
            <div 
              className="stat-card"
              onMouseEnter={() => setHoveredCard('instructors')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`stat-icon users ${hoveredCard === 'instructors' ? 'pulse' : ''}`}>
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>{dashboardData?.stats?.total_instructors?.toLocaleString() || '0'}</h3>
                <p>Total Instructors</p>
              </div>
            </div>
            
            <div 
              className="stat-card"
              onMouseEnter={() => setHoveredCard('students')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`stat-icon orders ${hoveredCard === 'students' ? 'pulse' : ''}`}>
                <i className="fas fa-user-graduate"></i>
              </div>
              <div className="stat-content">
                <h3>{dashboardData?.stats?.total_students?.toLocaleString() || '0'}</h3>
                <p>Total Students</p>
              </div>
            </div>
            
            <div 
              className="stat-card"
              onMouseEnter={() => setHoveredCard('courses')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`stat-icon revenue ${hoveredCard === 'courses' ? 'pulse' : ''}`}>
                <i className="fas fa-book"></i>
              </div>
              <div className="stat-content">
                <h3>{dashboardData?.stats?.total_courses?.toLocaleString() || '0'}</h3>
                <p>Total Courses</p>
              </div>
            </div>
            
            <div 
              className="stat-card"
              onMouseEnter={() => setHoveredCard('modules')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`stat-icon pending ${hoveredCard === 'modules' ? 'pulse' : ''}`}>
                <i className="fas fa-cube"></i>
              </div>
              <div className="stat-content">
                <h3>{dashboardData?.stats?.total_modules || '0'}</h3>
                <p>Total Modules</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="activities-section">
          <h2>Recent Activities</h2>
          <div className="activities-list">
            {dashboardData?.recent_activities?.map((activity, index) => (
              <div 
                key={index} 
                className="activity-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="activity-icon">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="activity-content">
                  <p>{activity.action}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            )) || (
              <div className="no-activities">
                <i className="fas fa-inbox"></i>
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-btn">
              <span className="action-icon">
                <i className="fas fa-chalkboard-teacher"></i>
              </span>
              <span>Add Instructor</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">
                <i className="fas fa-user-graduate"></i>
              </span>
              <span>Add Student</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">
                <i className="fas fa-book"></i>
              </span>
              <span>Create Course</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">
                <i className="fas fa-cube"></i>
              </span>
              <span>Add Module</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;