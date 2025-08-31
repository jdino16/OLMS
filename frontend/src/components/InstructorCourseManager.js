import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InstructorCourseManager.css';

const InstructorCourseManager = ({ instructor }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    course_name: '',
    description: '',
    duration: '',
    level: 'Beginner',
    status: 'Active'
  });

  useEffect(() => {
    if (instructor) {
      fetchInstructorCourses();
    }
  }, [instructor]);

  const fetchInstructorCourses = async () => {
    try {
      const response = await axios.get('/api/instructor/courses');
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        // Update existing course
        const response = await axios.put(`/api/instructor/courses/${editingCourse.id}`, formData);
        if (response.data.success) {
          setCourses(prev => prev.map(course => 
            course.id === editingCourse.id ? response.data.course : course
          ));
          setEditingCourse(null);
          resetForm();
        }
      } else {
        // Add new course
        const response = await axios.post('/api/instructor/courses', formData);
        if (response.data.success) {
          setCourses(prev => [...prev, response.data.course]);
          resetForm();
          setShowAddForm(false);
        }
      }
    } catch (error) {
      console.error('Error saving course:', error);
      setError('Failed to save course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      course_name: course.course_name,
      description: course.description,
      duration: course.duration,
      level: course.level,
      status: course.status
    });
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await axios.delete(`/api/instructor/courses/${courseId}`);
        if (response.data.success) {
          setCourses(prev => prev.filter(course => course.id !== courseId));
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        setError('Failed to delete course');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      course_name: '',
      description: '',
      duration: '',
      level: 'Beginner',
      status: 'Active'
    });
  };

  const cancelEdit = () => {
    setEditingCourse(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="instructor-course-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-course-manager">
      <div className="manager-header">
        <h2>
          <i className="fas fa-book"></i>
          Course Management
        </h2>
        <p>Create, edit, and manage your courses</p>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="add-course-btn"
          onClick={() => setShowAddForm(true)}
          disabled={showAddForm || editingCourse}
        >
          <i className="fas fa-plus"></i>
          Add New Course
        </button>
        {editingCourse && (
          <button className="cancel-btn" onClick={cancelEdit}>
            <i className="fas fa-times"></i>
            Cancel Edit
          </button>
        )}
      </div>

      {/* Add/Edit Course Form */}
      {(showAddForm || editingCourse) && (
        <div className="course-form-container">
          <h3>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
          <form onSubmit={handleSubmit} className="course-form">
            <div className="form-group">
              <label htmlFor="course_name">Course Name *</label>
              <input
                type="text"
                id="course_name"
                name="course_name"
                value={formData.course_name}
                onChange={handleInputChange}
                required
                placeholder="Enter course name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Enter course description"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Duration</label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 8 weeks"
                />
              </div>

              <div className="form-group">
                <label htmlFor="level">Level</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                <i className="fas fa-save"></i>
                {editingCourse ? 'Update Course' : 'Create Course'}
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowAddForm(false);
                  cancelEdit();
                }}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List */}
      <div className="courses-list">
        <h3>Your Courses ({courses.length})</h3>
        {courses.length === 0 ? (
          <div className="no-courses">
            <i className="fas fa-book-open"></i>
            <p>No courses created yet. Start by adding your first course!</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <h4>{course.course_name}</h4>
                  <span className={`status ${course.status.toLowerCase()}`}>
                    {course.status}
                  </span>
                </div>
                
                <div className="course-details">
                  <p className="description">{course.description || 'No description'}</p>
                  <div className="course-meta">
                    <span className="duration">
                      <i className="fas fa-clock"></i>
                      {course.duration || 'Not specified'}
                    </span>
                    <span className="level">
                      <i className="fas fa-signal"></i>
                      {course.level}
                    </span>
                    <span className="modules">
                      <i className="fas fa-cubes"></i>
                      {course.module_count || 0} modules
                    </span>
                    <span className="students">
                      <i className="fas fa-users"></i>
                      {course.student_count || 0} students
                    </span>
                  </div>
                </div>

                <div className="course-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(course)}
                    disabled={editingCourse}
                  >
                    <i className="fas fa-edit"></i>
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(course.id)}
                    disabled={editingCourse}
                  >
                    <i className="fas fa-trash"></i>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}
    </div>
  );
};

export default InstructorCourseManager;
