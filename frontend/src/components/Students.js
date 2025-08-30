import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Students.css';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    student_name: '',
    password: '',
    dob: '',
    gender: 'Male',
    phone_number: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students');
      setStudents(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch students. Please try again.');
      console.error('Error fetching students:', error);
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
      student_name: '',
      password: '',
      dob: '',
      gender: 'Male',
      phone_number: '',
      email: '',
      address: ''
    });
    setEditingStudent(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingStudent) {
        await axios.put(`/api/students/${editingStudent.id}`, formData);
      } else {
        await axios.post('/api/students', formData);
      }
      
      // Add success animation
      document.querySelector('.form-modal').classList.add('success-animation');
      
      setTimeout(() => {
        fetchStudents();
        setShowForm(false);
        resetForm();
      }, 500);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save student. Please try again.');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      username: student.username,
      student_name: student.student_name,
      password: '',
      dob: student.dob,
      gender: student.gender,
      phone_number: student.phone_number,
      email: student.email || '',
      address: student.address || ''
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`/api/students/${studentId}`);
        fetchStudents();
      } catch (error) {
        setError('Failed to delete student. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <i className="fas fa-spinner"></i>
        <p>Loading students...</p>
      </div>
    );
  }

  return (
    <div className="students-container">
      <div className="page-header">
        <h2>
          <i className="fas fa-user-graduate"></i>
          Manage Students
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <i className="fas fa-plus-circle"></i>
          Add Student
        </button>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
          <button 
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: 'auto', cursor: 'pointer' }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h3>
                <i className={`fas ${editingStudent ? 'fa-user-edit' : 'fa-user-plus'}`}></i>
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h3>
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
            
            <form onSubmit={handleSubmit} className="student-form">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="fas fa-user"></i>
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-id-card"></i>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="student_name"
                    value={formData.student_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="fas fa-lock"></i>
                    Password {!editingStudent && '*'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingStudent}
                    placeholder={editingStudent ? 'Leave blank to keep current' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-calendar"></i>
                    Date of Birth *
                  </label>
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
                  <label>
                    <i className="fas fa-venus-mars"></i>
                    Gender *
                  </label>
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
                  <label>
                    <i className="fas fa-phone"></i>
                    Phone Number *
                  </label>
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
                <label>
                  <i className="fas fa-envelope"></i>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-map-marker-alt"></i>
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className={`fas ${editingStudent ? 'fa-save' : 'fa-user-plus'}`}></i>
                  {editingStudent ? 'Update' : 'Create'} Student
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
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>
                  <i className="fas fa-user" style={{marginRight: '8px', color: '#6c757d'}}></i>
                  {student.username}
                </td>
                <td>
                  <i className="fas fa-id-card" style={{marginRight: '8px', color: '#6c757d'}}></i>
                  {student.student_name}
                </td>
                <td>
                  <i className={`fas ${student.gender === 'Male' ? 'fa-mars' : student.gender === 'Female' ? 'fa-venus' : 'fa-genderless'}`} 
                     style={{marginRight: '8px', color: '#6c757d'}}></i>
                  {student.gender}
                </td>
                <td>
                  <i className="fas fa-phone" style={{marginRight: '8px', color: '#6c757d'}}></i>
                  {student.phone_number}
                </td>
                <td>
                  <i className="fas fa-envelope" style={{marginRight: '8px', color: '#6c757d'}}></i>
                  {student.email || '-'}
                </td>
                <td>
                  <i className="fas fa-calendar" style={{marginRight: '8px', color: '#6c757d'}}></i>
                  {formatDate(student.created_at)}
                </td>
                <td className="actions">
                  <button 
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(student)}
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(student.id)}
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {students.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-user-graduate"></i>
            <p>No students found</p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <i className="fas fa-plus-circle"></i>
              Add First Student
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;