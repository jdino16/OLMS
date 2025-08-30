import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import Instructors from './Instructors';
import Students from './Students';
import Courses from './Courses';
import Modules from './Modules';
import Profile from './Profile';
import PendingInstructors from './PendingInstructors';
import AdminMessages from './AdminMessages';

const AdminApp = ({ admin, onLogout }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const handlePageChange = (page) => {
    setActivePage(page);
  };

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/admin/pending-instructors');
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.instructors.length);
      }
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const fetchUnreadMessageCount = async () => {
    try {
      const response = await fetch('/api/admin/messages/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadMessageCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    }
  };

  useEffect(() => {
    fetchPendingCount();
    fetchUnreadMessageCount();
    // Refresh counts every 30 seconds
    const interval = setInterval(() => {
      fetchPendingCount();
      fetchUnreadMessageCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <div className="dashboard-layout">
        <Sidebar 
          admin={admin} 
          onLogout={onLogout}
          activePage={activePage}
          onPageChange={handlePageChange}
          pendingCount={pendingCount}
          unreadMessageCount={unreadMessageCount}
        />
        <div className="main-content">
          <Header admin={admin} onLogout={onLogout} />
          <div className="content-area">
            {activePage === 'dashboard' && <Dashboard />}
            {activePage === 'pending-instructors' && <PendingInstructors onCountUpdate={fetchPendingCount} />}
            {activePage === 'instructors' && <Instructors />}
            {activePage === 'students' && <Students />}
            {activePage === 'courses' && <Courses />}
            {activePage === 'modules' && <Modules />}
            {activePage === 'messages' && <AdminMessages admin={admin} />}
            {activePage === 'profile' && <Profile admin={admin} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sidebar component
const Sidebar = ({ admin, onLogout, activePage, onPageChange, pendingCount, unreadMessageCount }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'pending-instructors', label: 'Pending Approvals', icon: 'fas fa-clock' },
    { id: 'instructors', label: 'Manage Instructors', icon: 'fas fa-chalkboard-teacher' },
    { id: 'students', label: 'Manage Students', icon: 'fas fa-user-graduate' },
    { id: 'courses', label: 'Manage Courses', icon: 'fas fa-book' },
    { id: 'modules', label: 'Manage Modules', icon: 'fas fa-cube' },
    { 
      id: 'messages', 
      label: 'Messages', 
      icon: 'fas fa-envelope',
      badge: unreadMessageCount > 0 ? unreadMessageCount : null
    },
    { id: 'profile', label: 'Profile Edit', icon: 'fas fa-user-cog' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
        <div className="admin-info">
          <div className="admin-avatar">
            {admin?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="admin-details">
            <span className="admin-name">{admin?.username}</span>
            <span className="admin-role">Administrator</span>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {menuItems.map((item) => (
            <li key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`}>
              <button 
                onClick={() => onPageChange(item.id)} 
                className="nav-link"
              >
                <i className={`nav-icon ${item.icon}`}></i>
                <span className="nav-label">{item.label}</span>
                {item.id === 'pending-instructors' && pendingCount > 0 && (
                  <span className="pending-badge">{pendingCount}</span>
                )}
                {item.id === 'messages' && unreadMessageCount > 0 && (
                  <span className="pending-badge">{unreadMessageCount}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-btn">
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

// Header component
const Header = ({ admin, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>Welcome back, {admin?.username}!</h1>
        </div>
        
        <div className="header-right">
          <div className="notification-dropdown">
            <button 
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <i className="fas fa-bell"></i>
              <span className="notification-badge">3</span>
            </button>
            
            {showNotifications && (
              <div className="notification-menu">
                <div className="notification-item">
                  <i className="fas fa-user-plus"></i>
                  <span>New instructor registered</span>
                </div>
                <div className="notification-item">
                  <i className="fas fa-book"></i>
                  <span>New course added</span>
                </div>
                <div className="notification-item">
                  <i className="fas fa-cube"></i>
                  <span>Module updated</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="user-dropdown">
            <button 
              className="user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                {admin?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{admin?.username}</span>
              <i className="fas fa-chevron-down"></i>
            </button>
            
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-info">
                  <div className="user-avatar">
                    {admin?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{admin?.username}</span>
                    <span className="user-role">Administrator</span>
                  </div>
                </div>
                <div className="menu-items">
                  <button className="menu-item">
                    <i className="fas fa-user"></i>
                    <span>Profile</span>
                  </button>
                  <button className="menu-item">
                    <i className="fas fa-cog"></i>
                    <span>Settings</span>
                  </button>
                  <button className="menu-item logout" onClick={onLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminApp;
