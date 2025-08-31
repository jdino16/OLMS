import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Modules.css';

const Modules = () => {
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [formData, setFormData] = useState({
    module_name: '',
    course_id: '',
    description: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchModules();
    fetchCourses();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/modules');
      setModules(response.data);
    } catch (error) {
      setError('Failed to fetch modules');
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
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
      module_name: '',
      course_id: '',
      description: '',
      status: 'Active'
    });
    setEditingModule(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingModule) {
        await axios.put(`/api/modules/${editingModule.id}`, formData);
      } else {
        await axios.post('/api/modules', formData);
      }
      
      fetchModules();
      setShowForm(false);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save module');
    }
  };

  const handleEdit = (module) => {
    setEditingModule(module);
    setFormData({
      module_name: module.module_name,
      course_id: module.course_id,
      description: module.description || '',
      status: module.status || 'Active'
    });
    setShowForm(true);
  };

  const handleDelete = async (moduleId) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      try {
        await axios.delete(`/api/modules/${moduleId}`);
        fetchModules();
      } catch (error) {
        setError('Failed to delete module');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusClass = status === 'Active' ? 'status-active' : 'status-inactive';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading modules...</p>
      </div>
    );
  }

  return (
    <div className="modules-container">
      <div className="page-header">
        <h2>Manage Modules</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <i className="fas fa-plus"></i>
          Add Module
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
              <h3>{editingModule ? 'Edit Module' : 'Add New Module'}</h3>
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
            
            <form onSubmit={handleSubmit} className="module-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Module Name *</label>
                  <input
                    type="text"
                    name="module_name"
                    value={formData.module_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter module name"
                  />
                </div>
                <div className="form-group">
                  <label>Course *</label>
                  <select
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Enter module description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
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
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingModule ? 'Update' : 'Create'} Module
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
              <th>Module Name</th>
              <th>Course</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module.id}>
                <td>{module.id}</td>
                <td className="module-name">{module.module_name}</td>
                <td className="course-name">{module.course_name}</td>
                <td className="module-description">
                  {module.description ? (
                    module.description.length > 50 
                      ? `${module.description.substring(0, 50)}...` 
                      : module.description
                  ) : '-'}
                </td>
                <td>{getStatusBadge(module.status)}</td>
                <td>{formatDate(module.created_at)}</td>
                <td className="actions">
                  <button 
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(module)}
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(module.id)}
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {modules.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-cube"></i>
            <p>No modules found</p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Add First Module
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modules;
