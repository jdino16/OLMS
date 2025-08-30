import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Instructors.css';

const Instructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    instructor_name: '',
    password: '',
    dob: '',
    gender: 'Male',
    phone_number: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/instructors');
      setInstructors(response.data);
    } catch (error) {
      setError('Failed to fetch instructors');
      console.error('Error fetching instructors:', error);
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

  const resetForm = () => {
    setFormData({
      username: '',
      instructor_name: '',
      password: '',
      dob: '',
      gender: 'Male',
      phone_number: '',
      email: '',
      address: ''
    });
    setEditingInstructor(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingInstructor) {
        await axios.put(`/api/instructors/${editingInstructor.id}`, formData);
      } else {
        await axios.post('/api/instructors', formData);
      }
      
      fetchInstructors();
      setShowForm(false);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save instructor');
    }
  };

  const handleEdit = (instructor) => {
    setEditingInstructor(instructor);
    setFormData({
      username: instructor.username,
      instructor_name: instructor.instructor_name,
      password: '',
      dob: instructor.dob,
      gender: instructor.gender,
      phone_number: instructor.phone_number,
      email: instructor.email || '',
      address: instructor.address || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (instructorId) => {
    if (window.confirm('Are you sure you want to delete this instructor?')) {
      try {
        await axios.delete(`/api/instructors/${instructorId}`);
        fetchInstructors();
      } catch (error) {
        setError('Failed to delete instructor');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <i className="fas fa-spinner"></i>
        <p>Loading instructors...</p>
      </div>
    );
  }

  return (
    <div className="instructors-container">
      <div className="page-header">
        <h2>Manage Instructors</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <i className="fas fa-plus"></i>
          Add Instructor
        </button>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h3>{editingInstructor ? 'Edit Instructor' : 'Add New Instructor'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="instructor-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="instructor_name"
                    value={formData.instructor_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password {!editingInstructor && '*'}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingInstructor}
                    placeholder={editingInstructor ? 'Leave blank to keep current' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingInstructor ? 'Update' : 'Create'} Instructor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {instructors.map((instructor) => (
              <tr key={instructor.id}>
                <td data-label="ID">{instructor.id}</td>
                <td data-label="Username">{instructor.username}</td>
                <td data-label="Name">{instructor.instructor_name}</td>
                <td data-label="Gender">{instructor.gender}</td>
                <td data-label="Phone">{instructor.phone_number}</td>
                <td data-label="Email">{instructor.email || '-'}</td>
                <td data-label="Created">{formatDate(instructor.created_at)}</td>
                <td data-label="Actions" className="actions">
                  <button 
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(instructor)}
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(instructor.id)}
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {instructors.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-chalkboard-teacher"></i>
            <p>No instructors found</p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Add First Instructor
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Instructors;