import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InstructorDashboard.css';
import InstructorFeedbackDashboard from './InstructorFeedbackDashboard';
import InstructorCourseManager from './InstructorCourseManager';
import StudentProgressAnalytics from './StudentProgressAnalytics';

const InstructorDashboard = ({ instructor, onLogout }) => {
  const [activePage, setActivePage] = useState('overview');
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalModules: 0,
    activeCourses: 0
  });
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);

  useEffect(() => {
    fetchInstructorStats();
    fetchModules();
    fetchProfileData();
  }, []);

  const fetchInstructorStats = async () => {
    try {
      const response = await axios.get('/api/instructor/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await axios.get('/api/instructor/modules');
      if (response.data.success) {
        setModules(response.data.modules);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchLessonsForModule = async (moduleId) => {
    try {
      const response = await axios.get(`/api/lessons/module/${moduleId}`);
      if (response.data.success) {
        setLessons(prev => ({
          ...prev,
          [moduleId]: response.data.lessons
        }));
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const fetchProfileData = async () => {
    try {
      const response = await axios.get('/api/instructor/profile');
      setProfileData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentLoading(true);
      const response = await axios.get('/api/instructor/students');
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setStudentLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      setSelectedStudent(studentId);
      setStudentDetails(null);
      const response = await axios.get(`/api/instructor/student/${studentId}/details`);
      if (response.data.success) {
        setStudentDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  const handleDeleteLesson = async (lessonId, moduleId) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      try {
        const response = await axios.delete(`/api/lessons/${lessonId}`);
        if (response.data.success) {
          // Refresh lessons for this module
          fetchLessonsForModule(moduleId);
        }
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    }
  };

  const handlePageChange = (page) => {
    setActivePage(page);
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-book"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalCourses}</h3>
            <p>Total Courses</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-layer-group"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalModules}</h3>
            <p>Total Modules</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.activeCourses}</h3>
            <p>Active Courses</p>
          </div>
        </div>
      </div>
      
      <div className="welcome-section">
        <h2>Welcome back, {instructor?.instructor_name}!</h2>
        <p>Here's what's happening with your courses today.</p>
      </div>
    </div>
  );



  const renderStudents = () => (
    <div className="students-section">
      <h2>My Students</h2>
      <div className="table-container">
        <table className="modules-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Enrollments</th>
              <th>Quizzes</th>
              <th>Avg Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.student_name}</td>
                <td>{s.username}</td>
                <td>{s.email || '-'}</td>
                <td>{s.phone_number || '-'}</td>
                <td>{s.enrollment_count}</td>
                <td>{s.quiz_count}</td>
                <td>{s.avg_score}%</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-primary btn-small" onClick={() => fetchStudentDetails(s.id)}>
                      <i className="fas fa-eye"></i>
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>
                  {studentLoading ? 'Loading...' : 'No students found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {studentDetails && (
        <div className="add-lesson-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Student Details - {studentDetails.profile.student_name}</h3>
              <button className="close-btn" onClick={() => setStudentDetails(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="profile-info">
              <div className="profile-field"><label>Username:</label><span>{studentDetails.profile.username}</span></div>
              <div className="profile-field"><label>Email:</label><span>{studentDetails.profile.email || '-'}</span></div>
              <div className="profile-field"><label>Phone:</label><span>{studentDetails.profile.phone_number || '-'}</span></div>
            </div>
            <h4>Enrollments</h4>
            <div className="table-container">
              <table className="lessons-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Completed Modules</th>
                  </tr>
                </thead>
                <tbody>
                  {studentDetails.enrollments.map((e) => (
                    <tr key={e.id}>
                      <td>{e.course_name}</td>
                      <td>{e.status}</td>
                      <td>{e.progress_percentage}%</td>
                      <td>{e.completed_modules}/{e.module_count}</td>
                    </tr>
                  ))}
                  {studentDetails.enrollments.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>No enrollments</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <h4>Quiz History</h4>
            <div className="table-container">
              <table className="lessons-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Module</th>
                    <th>Lesson</th>
                    <th>Score</th>
                    <th>Time (s)</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {studentDetails.quiz_history.map((q) => (
                    <tr key={q.id}>
                      <td>{q.course_name}</td>
                      <td>{q.module_name}</td>
                      <td>{q.lesson_name}</td>
                      <td>{q.correct_answers}/{q.total_questions} ({q.score_percentage}%)</td>
                      <td>{q.time_taken_seconds || 0}</td>
                      <td>{new Date(q.completed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {studentDetails.quiz_history.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>No quiz attempts</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderModules = () => (
    <div className="modules-section">
      <h2>Course Modules</h2>
      
      <div className="table-container">
        <table className="modules-table">
          <thead>
            <tr>
              <th>Module Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module.id}>
                <td>{module.module_name}</td>
                <td>{module.description || 'No description available'}</td>
                <td>
                  <span className={`module-status ${module.status.toLowerCase()}`}>
                    {module.status}
                  </span>
                </td>
                                 <td>
                   <div className="table-actions">
                     <button 
                       className="btn btn-primary btn-small"
                       onClick={() => {
                         setSelectedModule(module);
                         setShowAddLesson(true);
                         if (!lessons[module.id]) {
                           fetchLessonsForModule(module.id);
                         }
                       }}
                     >
                       <i className="fas fa-plus"></i>
                       Add Lesson
                     </button>
                   </div>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

             {/* Lessons Display */}
       {modules.map((module) => (
         <div key={module.id} className="lessons-section">
           <h3>Lessons for {module.module_name}</h3>
           {lessons[module.id] && lessons[module.id].length > 0 ? (
             <div className="table-container">
               <table className="lessons-table">
                 <thead>
                   <tr>
                     <th>Lesson Name</th>
                     <th>File Name</th>
                     <th>Description</th>
                     <th>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {lessons[module.id].map((lesson) => (
                     <tr key={lesson.id}>
                       <td>{lesson.lesson_name}</td>
                       <td>{lesson.file_name}</td>
                       <td>{lesson.description || 'No description'}</td>
                                               <td>
                                                     <div className="table-actions">
                             <button 
                               className="btn btn-primary btn-small"
                               onClick={() => {
                                 // View PDF in new tab
                                 const pdfUrl = `http://localhost:5000/uploads/${lesson.file_path}`;
                                 window.open(pdfUrl, '_blank');
                               }}
                             >
                               <i className="fas fa-eye"></i>
                               View PDF
                             </button>
                             <button 
                               className="btn btn-success btn-small"
                               onClick={() => {
                                 // Download PDF file - use backend port 5000 with download parameter
                                 const pdfUrl = `http://localhost:5000/uploads/${lesson.file_path}?download=true`;
                                 
                                 console.log('Attempting to download from:', pdfUrl);
                                 
                                 // Create a temporary link to trigger download
                                 const link = document.createElement('a');
                                 link.href = pdfUrl;
                                 link.download = lesson.file_name;
                                 document.body.appendChild(link);
                                 link.click();
                                 document.body.removeChild(link);
                                 
                                 console.log('Download initiated for:', lesson.file_name);
                               }}
                             >
                               <i className="fas fa-download"></i>
                               Download PDF
                             </button>
                             <button 
                               className="btn btn-danger btn-small"
                               onClick={() => handleDeleteLesson(lesson.id, module.id)}
                             >
                               <i className="fas fa-trash"></i>
                               Delete
                             </button>
                           </div>
                        </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           ) : (
             <div className="no-lessons">
               <p>No lessons added yet. Click "Add Lesson" to get started.</p>
             </div>
           )}
         </div>
       ))}

      {showAddLesson && selectedModule && (
        <div className="add-lesson-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Lesson to {selectedModule.module_name}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddLesson(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <AddLessonForm 
              moduleId={selectedModule.id}
              onSuccess={() => {
                fetchLessonsForModule(selectedModule.id);
                setShowAddLesson(false);
              }}
              onCancel={() => setShowAddLesson(false)}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="profile-section">
      <div className="profile-header">
        <h2>My Profile</h2>
        <div className="profile-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowEditProfile(true)}
          >
            <i className="fas fa-edit"></i>
            Edit Profile
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowChangePassword(true)}
          >
            <i className="fas fa-key"></i>
            Change Password
          </button>
        </div>
      </div>
      
      {profileData ? (
        <div className="profile-info">
          <div className="profile-field">
            <label>Name:</label>
            <span>{profileData.instructor_name}</span>
          </div>
          <div className="profile-field">
            <label>Username:</label>
            <span>{profileData.username}</span>
          </div>
          <div className="profile-field">
            <label>Email:</label>
            <span>{profileData.email || 'Not provided'}</span>
          </div>
          <div className="profile-field">
            <label>Phone:</label>
            <span>{profileData.phone_number || 'Not provided'}</span>
          </div>
        </div>
      ) : (
        <div className="loading-profile">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading profile...</p>
        </div>
      )}

              {showEditProfile && (
          <div className="edit-profile-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Edit Profile</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowEditProfile(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <EditProfileForm 
                profileData={profileData}
                onSuccess={() => {
                  fetchProfileData();
                  setShowEditProfile(false);
                }}
                onCancel={() => setShowEditProfile(false)}
              />
            </div>
          </div>
        )}

        {showChangePassword && (
          <div className="change-password-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Change Password</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowChangePassword(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <ChangePasswordForm 
                onSuccess={() => {
                  setShowChangePassword(false);
                }}
                onCancel={() => setShowChangePassword(false)}
              />
            </div>
          </div>
        )}
    </div>
  );

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return renderOverview();
      case 'students':
        if (students.length === 0 && !studentLoading) {
          fetchStudents();
        }
        return renderStudents();
      case 'courses':
        return <InstructorCourseManager instructor={instructor} />;
      case 'analytics':
        return <StudentProgressAnalytics instructor={instructor} />;
      case 'modules':
        return renderModules();
      case 'feedback':
        return <InstructorFeedbackDashboard instructor={instructor} />;
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-dashboard">
      <div className="dashboard-layout">
        <div className="sidebar instructor">
          <div className="sidebar-header">
            <div className="logo-icon instructor">
              <i className="fas fa-chalkboard-teacher"></i>
            </div>
            <h3>Instructor Portal</h3>
          </div>
          
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activePage === 'overview' ? 'active' : ''}`}
              onClick={() => handlePageChange('overview')}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Overview</span>
            </button>
            

            
            <button
              className={`nav-item ${activePage === 'students' ? 'active' : ''}`}
              onClick={() => handlePageChange('students')}
            >
              <i className="fas fa-users"></i>
              <span>My Students</span>
            </button>
            
            <button
              className={`nav-item ${activePage === 'courses' ? 'active' : ''}`}
              onClick={() => handlePageChange('courses')}
            >
              <i className="fas fa-book"></i>
              <span>My Courses</span>
            </button>
            
            <button
              className={`nav-item ${activePage === 'analytics' ? 'active' : ''}`}
              onClick={() => handlePageChange('analytics')}
            >
              <i className="fas fa-chart-line"></i>
              <span>Analytics</span>
            </button>
            
            <button
              className={`nav-item ${activePage === 'modules' ? 'active' : ''}`}
              onClick={() => handlePageChange('modules')}
            >
              <i className="fas fa-layer-group"></i>
              <span>Modules</span>
            </button>
            
            <button
              className={`nav-item ${activePage === 'feedback' ? 'active' : ''}`}
              onClick={() => handlePageChange('feedback')}
            >
              <i className="fas fa-comments"></i>
              <span>Feedback</span>
            </button>
            
            <button
              className={`nav-item ${activePage === 'profile' ? 'active' : ''}`}
              onClick={() => handlePageChange('profile')}
            >
              <i className="fas fa-user"></i>
              <span>Profile</span>
            </button>
          </nav>
          
          <div className="sidebar-footer">
            <button className="logout-btn" onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
        
        <div className="main-content">
          <header className="dashboard-header">
            <div className="header-content">
              <h1>{activePage.charAt(0).toUpperCase() + activePage.slice(1)}</h1>
              <div className="user-info">
                <span>Welcome, {instructor?.instructor_name}</span>
                <div className="user-avatar">
                  <i className="fas fa-user"></i>
                </div>
              </div>
            </div>
          </header>
          
          <main className="dashboard-content">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

// AddLessonForm Component
const AddLessonForm = ({ moduleId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    lesson_name: '',
    description: '',
    file: null
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    if (e.target.name === 'file') {
      setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.lesson_name.trim()) {
      alert('Please enter a lesson name');
      return;
    }
    
    if (!formData.file) {
      alert('Please select a PDF file');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('lesson_name', formData.lesson_name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('module_id', moduleId);
      formDataToSend.append('file', formData.file);

      console.log('Submitting lesson data:', {
        lesson_name: formData.lesson_name,
        description: formData.description,
        module_id: moduleId,
        file: formData.file.name
      });

      const response = await axios.post('/api/lessons', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('Lesson created successfully!');
        onSuccess();
        // Reset form
        setFormData({
          lesson_name: '',
          description: '',
          file: null
        });
        // Reset file input
        const fileInput = document.getElementById('file');
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        alert('Failed to create lesson: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating lesson:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create lesson';
      alert('Error creating lesson: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-lesson-form">
             <div className="form-group">
         <label htmlFor="lesson_name">Lesson Name *</label>
         <input
           type="text"
           id="lesson_name"
           name="lesson_name"
           value={formData.lesson_name}
           onChange={handleChange}
           required
           className="form-control"
           placeholder="Enter lesson name"
         />
       </div>

       <div className="form-group">
         <label htmlFor="description">Description</label>
         <textarea
           id="description"
           name="description"
           value={formData.description}
           onChange={handleChange}
           className="form-control"
           placeholder="Enter lesson description (optional)"
           rows="3"
         />
       </div>

       <div className="form-group">
         <label htmlFor="file">PDF File *</label>
         <input
           type="file"
           id="file"
           name="file"
           onChange={handleChange}
           accept=".pdf"
           required
           className="form-control"
         />
       </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Lesson'}
        </button>
      </div>
    </form>
  );
};

// ChangePasswordForm Component
const ChangePasswordForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required';
    }
    
    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/instructor/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password
      });
      
      if (response.data.success) {
        alert('Password changed successfully!');
        onSuccess();
      }
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to change password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="change-password-form">
      <div className="form-group">
        <label htmlFor="current_password">Current Password *</label>
        <input
          type="password"
          id="current_password"
          name="current_password"
          value={formData.current_password}
          onChange={handleChange}
          required
          className={`form-control ${errors.current_password ? 'error' : ''}`}
          placeholder="Enter your current password"
        />
        {errors.current_password && (
          <span className="error-message">{errors.current_password}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="new_password">New Password *</label>
        <input
          type="password"
          id="new_password"
          name="new_password"
          value={formData.new_password}
          onChange={handleChange}
          required
          className={`form-control ${errors.new_password ? 'error' : ''}`}
          placeholder="Enter your new password"
        />
        {errors.new_password && (
          <span className="error-message">{errors.new_password}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirm_password">Confirm New Password *</label>
        <input
          type="password"
          id="confirm_password"
          name="confirm_password"
          value={formData.confirm_password}
          onChange={handleChange}
          required
          className={`form-control ${errors.confirm_password ? 'error' : ''}`}
          placeholder="Confirm your new password"
        />
        {errors.confirm_password && (
          <span className="error-message">{errors.confirm_password}</span>
        )}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
};

// EditProfileForm Component
const EditProfileForm = ({ profileData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    instructor_name: profileData?.instructor_name || '',
    email: profileData?.email || '',
    phone_number: profileData?.phone_number || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.put('/api/instructor/profile', formData);
      if (response.data.success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-profile-form">
      <div className="form-group">
        <label htmlFor="instructor_name">Full Name *</label>
        <input
          type="text"
          id="instructor_name"
          name="instructor_name"
          value={formData.instructor_name}
          onChange={handleChange}
          required
          className="form-control"
          placeholder="Enter your full name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter your email address"
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone_number">Phone Number</label>
        <input
          type="tel"
          id="phone_number"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter your phone number"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
};

export default InstructorDashboard;
