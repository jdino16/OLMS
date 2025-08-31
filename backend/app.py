from flask import Flask, request, jsonify, session, make_response
from flask_cors import CORS
from database import Database
from config import Config
import os
import requests

app = Flask(__name__)
app.config.from_object(Config)

# Initialize CORS
CORS(app, supports_credentials=True)

# Initialize database
db = Database(
    host=Config.MYSQL_HOST,
    user=Config.MYSQL_USER,
    password=Config.MYSQL_PASSWORD,
    database=Config.MYSQL_DB,
    port=Config.MYSQL_PORT
)

# Create tables on startup
db.create_tables()

@app.route('/api/login', methods=['POST'])
def login():
    try:
        print("Admin login attempt...")
        data = request.get_json()
        print(f"Received data: {data}")
        username = data.get('username')
        password = data.get('password')
        
        print(f"Username: {username}, Password provided: {'Yes' if password else 'No'}")
        
        if not username or not password:
            print("Missing username or password")
            return jsonify({'success': False, 'error': 'Username and password are required'}), 400
        
        print("Authenticating admin...")
        admin = db.authenticate_admin(username, password)
        print(f"Authentication result: {admin}")
        
        if admin:
            session['admin_id'] = admin['id']
            session['admin_username'] = admin['username']
            print(f"Admin logged in successfully: {admin['username']}")
            return jsonify({
                'success': True, 
                'admin': {
                    'id': admin['id'],
                    'username': admin['username']
                }
            })
        else:
            print("Admin authentication failed")
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Error in admin login: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/instructor/login', methods=['POST'])
def instructor_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password are required'}), 400
    
    instructor = db.authenticate_instructor(username, password)
    if instructor:
        session['instructor_id'] = instructor['id']
        session['instructor_username'] = instructor['username']
        session['instructor_name'] = instructor['instructor_name']
        return jsonify({
            'success': True, 
            'instructor': {
                'id': instructor['id'],
                'username': instructor['username'],
                'instructor_name': instructor['instructor_name']
            }
        })
    else:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@app.route('/api/instructor/check-auth', methods=['GET'])
def check_instructor_auth():
    instructor_id = session.get('instructor_id')
    if instructor_id:
        instructor = db.get_instructor_by_id(instructor_id)
        if instructor:
            return jsonify({
                'authenticated': True,
                'instructor': {
                    'id': instructor['id'],
                    'username': instructor['username'],
                    'instructor_name': instructor['instructor_name']
                }
            })
    return jsonify({'authenticated': False}), 401

@app.route('/api/instructor/profile', methods=['GET'])
def get_instructor_profile():
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    instructor = db.get_instructor_by_id(instructor_id)
    if instructor:
        return jsonify({
            'id': instructor['id'],
            'username': instructor['username'],
            'instructor_name': instructor['instructor_name'],
            'email': instructor['email'],
            'phone_number': instructor['phone_number'],
            'created_at': instructor['created_at']
        })
    return jsonify({'error': 'Instructor not found'}), 404

@app.route('/api/instructor/profile', methods=['PUT'])
def update_instructor_profile():
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        success = db.update_instructor_profile(instructor_id, data)
        if success:
            return jsonify({'success': True, 'message': 'Profile updated successfully'})
        else:
            return jsonify({'error': 'Failed to update profile'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instructor/change-password', methods=['POST'])
def change_instructor_password():
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Verify current password
        if not db.verify_instructor_password(instructor_id, current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Update password
        success = db.update_instructor_password(instructor_id, new_password)
        if success:
            return jsonify({'success': True, 'message': 'Password changed successfully'})
        else:
            return jsonify({'error': 'Failed to change password'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instructor/modules', methods=['GET'])
def get_instructor_modules():
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        modules = db.get_instructor_modules(instructor_id)
        return jsonify({'success': True, 'modules': modules})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instructor/courses', methods=['GET'])
def get_instructor_courses():
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        courses = db.get_instructor_courses(instructor_id)
        return jsonify({'success': True, 'courses': courses})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instructor/courses', methods=['POST'])
def create_instructor_course():
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    required_fields = ['course_name', 'description', 'duration', 'level', 'status']
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        # Add instructor_id to the course data
        data['instructor_id'] = instructor_id
        course_id = db.create_course(data)
        if course_id:
            # Fetch the created course to return
            course = db.get_course_by_id(course_id)
            return jsonify({'success': True, 'course': course}), 201
        return jsonify({'error': 'Failed to create course'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instructor/courses/<int:course_id>', methods=['PUT'])
def update_instructor_course(course_id):
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Verify the course belongs to this instructor
    try:
        course = db.get_course_by_id(course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        if course.get('instructor_id') != instructor_id:
            return jsonify({'error': 'Unauthorized to modify this course'}), 403
        
        data = request.get_json()
        if db.update_course(course_id, data):
            updated_course = db.get_course_by_id(course_id)
            return jsonify({'success': True, 'course': updated_course})
        return jsonify({'error': 'Failed to update course'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instructor/courses/<int:course_id>', methods=['DELETE'])
def delete_instructor_course(course_id):
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Verify the course belongs to this instructor
    try:
        course = db.get_course_by_id(course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        if course.get('instructor_id') != instructor_id:
            return jsonify({'error': 'Unauthorized to delete this course'}), 403
        
        if db.delete_course(course_id):
            return jsonify({'success': True})
        return jsonify({'error': 'Failed to delete course'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instructor/stats', methods=['GET'])
def get_instructor_stats():
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        stats = db.get_instructor_stats(instructor_id)
        return jsonify({'stats': stats})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Instructor - Students overview (basic list with enrollment/quiz counts)
@app.route('/api/instructor/students', methods=['GET'])
def instructor_students():
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        # Return all students with simple aggregates (no instructor filter due to schema)
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT s.id,
                           s.username,
                           s.student_name,
                           s.email,
                           s.phone_number,
                           s.created_at,
                           COALESCE(enr.enrollment_count, 0) AS enrollment_count,
                           COALESCE(qr.quiz_count, 0) AS quiz_count,
                           ROUND(COALESCE(qr.avg_score, 0), 2) AS avg_score
                    FROM students s
                    LEFT JOIN (
                        SELECT student_id, COUNT(*) AS enrollment_count
                        FROM course_enrollments
                        GROUP BY student_id
                    ) enr ON enr.student_id = s.id
                    LEFT JOIN (
                        SELECT student_id, COUNT(*) AS quiz_count, AVG(score_percentage) AS avg_score
                        FROM quiz_results
                        GROUP BY student_id
                    ) qr ON qr.student_id = s.id
                    ORDER BY s.created_at DESC
                    """
                )
                students = cursor.fetchall()
                return jsonify({'success': True, 'students': students})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Instructor - Single student details (profile, enrollments, quiz history)
@app.route('/api/instructor/student/<int:student_id>/details', methods=['GET'])
def instructor_student_details(student_id):
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        profile = db.get_student_by_id(student_id)
        if not profile:
            return jsonify({'success': False, 'error': 'Student not found'}), 404

        enrollments = db.get_student_enrollments(student_id)
        quiz_history = db.get_student_quiz_history(student_id)
        quiz_stats = db.get_student_quiz_stats(student_id)

        return jsonify({
            'success': True,
            'profile': profile,
            'enrollments': enrollments,
            'quiz_history': quiz_history,
            'quiz_stats': quiz_stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/instructor/register', methods=['POST'])
def register_instructor():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'instructor_name', 'password', 'dob', 'gender', 'phone_number']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'success': False, 'error': f'{field.replace("_", " ").title()} is required'}), 400
    
    try:
        # Check if username already exists
        existing_instructor = db.get_instructor_by_username(data['username'])
        if existing_instructor:
            return jsonify({'success': False, 'error': 'Username already exists'}), 400
        
        # Create instructor (status will be 'Pending' by default)
        instructor_id = db.create_instructor(data)
        if instructor_id:
            return jsonify({
                'success': True, 
                'message': 'Registration submitted successfully! Your account is pending admin approval. You will be able to login once approved.'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to create instructor account'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Admin endpoints for instructor approval
@app.route('/api/admin/pending-instructors', methods=['GET'])
def get_pending_instructors():
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        pending_instructors = db.get_pending_instructors()
        return jsonify({'instructors': pending_instructors})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/approve-instructor/<int:instructor_id>', methods=['POST'])
def approve_instructor(instructor_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        if db.approve_instructor(instructor_id, session['admin_id']):
            return jsonify({'success': True, 'message': 'Instructor approved successfully'})
        else:
            return jsonify({'error': 'Failed to approve instructor'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/reject-instructor/<int:instructor_id>', methods=['POST'])
def reject_instructor(instructor_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        if db.reject_instructor(instructor_id, session['admin_id']):
            return jsonify({'success': True, 'message': 'Instructor rejected successfully'})
        else:
            return jsonify({'error': 'Failed to reject instructor'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    admin_id = session.get('admin_id')
    if admin_id:
        admin = db.get_admin_by_id(admin_id)
        if admin:
            return jsonify({
                'authenticated': True,
                'admin': {
                    'id': admin['id'],
                    'username': admin['username']
                }
            })
    return jsonify({'authenticated': False}), 401

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        stats = db.get_dashboard_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/profile', methods=['GET'])
def get_admin_profile():
    admin_id = session.get('admin_id')
    if not admin_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    admin = db.get_admin_by_id(admin_id)
    if admin:
        return jsonify({
            'id': admin['id'],
            'username': admin['username'],
            'created_at': admin['created_at']
        })
    return jsonify({'error': 'Admin not found'}), 404

@app.route('/api/admin/change-password', methods=['POST'])
def change_admin_password():
    admin_id = session.get('admin_id')
    if not admin_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password are required'}), 400
    
    admin = db.get_admin_by_id(admin_id)
    if not admin:
        return jsonify({'error': 'Admin not found'}), 404
    
    if not db.verify_password(current_password, admin['password']):
        return jsonify({'error': 'Current password is incorrect'}), 400
    
    if db.update_admin_password(admin_id, new_password):
        return jsonify({'success': True, 'message': 'Password updated successfully'})
    else:
        return jsonify({'error': 'Failed to update password'}), 500

# Instructor endpoints
@app.route('/api/instructors', methods=['GET'])
def get_instructors():
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        instructors = db.get_all_instructors()
        return jsonify(instructors)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instructors/<int:instructor_id>', methods=['GET'])
def get_instructor(instructor_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        instructor = db.get_instructor_by_id(instructor_id)
        if instructor:
            return jsonify(instructor)
        return jsonify({'error': 'Instructor not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instructors', methods=['POST'])
def create_instructor():
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    required_fields = ['username', 'instructor_name', 'password', 'dob', 'gender', 'phone_number']
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        instructor_id = db.create_instructor(data)
        return jsonify({'success': True, 'id': instructor_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instructors/<int:instructor_id>', methods=['PUT'])
def update_instructor(instructor_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    required_fields = ['username', 'instructor_name', 'dob', 'gender', 'phone_number']
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        if db.update_instructor(instructor_id, data):
            return jsonify({'success': True})
        return jsonify({'error': 'Instructor not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/instructors/<int:instructor_id>', methods=['DELETE'])
def delete_instructor(instructor_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        if db.delete_instructor(instructor_id):
            return jsonify({'success': True})
        return jsonify({'error': 'Instructor not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Student endpoints
@app.route('/api/students', methods=['GET'])
def get_students():
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        students = db.get_all_students()
        return jsonify(students)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        student = db.get_student_by_id(student_id)
        if student:
            return jsonify(student)
        return jsonify({'error': 'Student not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students', methods=['POST'])
def create_student():
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    required_fields = ['username', 'student_name', 'password', 'email', 'dob', 'gender', 'phone_number', 'address']
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        student_id = db.create_student(data)
        return jsonify({'success': True, 'id': student_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    required_fields = ['username', 'student_name', 'email', 'dob', 'gender', 'phone_number', 'address']
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        if db.update_student(student_id, data):
            return jsonify({'success': True})
        return jsonify({'error': 'Student not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        if db.delete_student(student_id):
            return jsonify({'success': True})
        return jsonify({'error': 'Student not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Course endpoints
@app.route('/api/courses', methods=['GET'])
def get_courses():
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        courses = db.get_all_courses()
        return jsonify(courses)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        course = db.get_course_by_id(course_id)
        if course:
            return jsonify(course)
        return jsonify({'error': 'Course not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/courses', methods=['POST'])
def create_course():
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    if not data.get('course_name'):
        return jsonify({'error': 'Course name is required'}), 400
    
    try:
        course_id = db.create_course(data)
        return jsonify({'success': True, 'id': course_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    if not data.get('course_name'):
        return jsonify({'error': 'Course name is required'}), 400
    
    try:
        if db.update_course(course_id, data):
            return jsonify({'success': True})
        return jsonify({'error': 'Course not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        if db.delete_course(course_id):
            return jsonify({'success': True})
        return jsonify({'error': 'Course not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Module endpoints
@app.route('/api/modules', methods=['GET'])
def get_modules():
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        modules = db.get_all_modules()
        return jsonify(modules)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/modules/course/<int:course_id>', methods=['GET'])
def get_modules_by_course(course_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        modules = db.get_modules_by_course(course_id)
        return jsonify(modules)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/modules/<int:module_id>', methods=['GET'])
def get_module(module_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        module = db.get_module_by_id(module_id)
        if module:
            return jsonify(module)
        return jsonify({'error': 'Module not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/modules', methods=['POST'])
def create_module():
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    required_fields = ['module_name', 'course_id']
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        module_id = db.create_module(data)
        return jsonify({'success': True, 'id': module_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/modules/<int:module_id>', methods=['PUT'])
def update_module(module_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    required_fields = ['module_name', 'course_id']
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        if db.update_module(module_id, data):
            return jsonify({'success': True})
        return jsonify({'error': 'Module not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/modules/<int:module_id>', methods=['DELETE'])
def delete_module(module_id):
    if not session.get('admin_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        if db.delete_module(module_id):
            return jsonify({'success': True})
        return jsonify({'error': 'Module not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Lesson endpoints
@app.route('/api/lessons/module/<int:module_id>', methods=['GET'])
def get_lessons_by_module(module_id):
    try:
        lessons = db.get_lessons_by_module(module_id)
        return jsonify({'success': True, 'lessons': lessons})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lessons', methods=['POST'])
def create_lesson():
    if 'instructor_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # Handle file upload
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Create uploads directory if it doesn't exist
        import os
        upload_dir = 'uploads'
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
            print(f"Created uploads directory: {upload_dir}")
        
        # Generate unique filename
        import uuid
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        file.save(file_path)
        print(f"File saved: {file_path}")
        
        # Prepare lesson data
        lesson_data = {
            'lesson_name': request.form.get('lesson_name'),
            'module_id': int(request.form.get('module_id')),
            'file_path': filename,
            'file_name': file.filename,
            'file_type': 'pdf',
            'file_size': os.path.getsize(file_path),
            'description': request.form.get('description', '')
        }
        
        print(f"Creating lesson with data: {lesson_data}")
        lesson_id = db.create_lesson(lesson_data)
        print(f"Lesson created with ID: {lesson_id}")
        
        return jsonify({'success': True, 'lesson_id': lesson_id, 'message': 'Lesson created successfully'})
    except Exception as e:
        print(f"Error creating lesson: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/lessons/<int:lesson_id>', methods=['GET'])
def get_lesson(lesson_id):
    try:
        lesson = db.get_lesson_by_id(lesson_id)
        if lesson:
            return jsonify({'success': True, 'lesson': lesson})
        else:
            return jsonify({'error': 'Lesson not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lessons/<int:lesson_id>', methods=['DELETE'])
def delete_lesson(lesson_id):
    if 'instructor_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        success = db.delete_lesson(lesson_id)
        if success:
            return jsonify({'success': True, 'message': 'Lesson deleted successfully'})
        else:
            return jsonify({'error': 'Failed to delete lesson'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Student authentication endpoints
@app.route('/api/student/register', methods=['POST'])
def student_register():
    try:
        data = request.get_json()
        required_fields = ['student_name', 'username', 'email', 'phone_number', 'dob', 'gender', 'address', 'password', 'confirm_password']
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field.replace("_", " ").title()} is required'}), 400
        
        if data['password'] != data['confirm_password']:
            return jsonify({'error': 'Passwords do not match'}), 400
        
        # Check if username already exists
        existing_student = db.get_student_by_username(data['username'])
        if existing_student:
            return jsonify({'error': 'Username already exists'}), 400
        
        # Check if email already exists
        existing_email = db.get_student_by_email(data['email'])
        if existing_email:
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create student data
        student_data = {
            'username': data['username'],
            'student_name': data['student_name'],
            'password': data['password'],
            'email': data['email'],
            'phone_number': data['phone_number'],
            'dob': data.get('dob', '2000-01-01'),
            'gender': data.get('gender', 'Other'),
            'address': data.get('address', '')
        }
        
        student_id = db.create_student(student_data)
        return jsonify({'success': True, 'message': 'Student registered successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/login', methods=['POST'])
def student_login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Authenticate student
        student = db.authenticate_student(username, password)
        if student:
            session['student_id'] = student['id']
            return jsonify({
                'success': True, 
                'message': 'Login successful',
                'student': {
                    'id': student['id'],
                    'username': student['username'],
                    'student_name': student['student_name'],
                    'email': student['email'],
                    'phone_number': student['phone_number']
                }
            })
        else:
            return jsonify({'error': 'Invalid username or password'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/check-auth', methods=['GET'])
def check_student_auth():
    if 'student_id' in session:
        try:
            student = db.get_student_by_id(session['student_id'])
            if student:
                return jsonify({
                    'authenticated': True,
                    'student': {
                        'id': student['id'],
                        'username': student['username'],
                        'student_name': student['student_name'],
                        'email': student['email'],
                        'phone_number': student['phone_number']
                    }
                })
        except Exception as e:
            pass
    
    return jsonify({'authenticated': False})

@app.route('/api/student/logout', methods=['POST'])
def student_logout():
    session.pop('student_id', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/student/profile', methods=['GET'])
def get_student_profile():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        student = db.get_student_by_id(student_id)
        if student:
            return jsonify({
                'success': True,
                'student': {
                    'id': student['id'],
                    'username': student['username'],
                    'student_name': student['student_name'],
                    'email': student.get('email'),
                    'phone_number': student.get('phone_number'),
                    'address': student.get('address'),
                    'dob': student.get('dob'),
                    'gender': student.get('gender'),
                    'created_at': student.get('created_at')
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Student not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/profile', methods=['PUT'])
def update_student_profile():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        success = db.update_student_profile(student_id, data)
        if success:
            return jsonify({'success': True, 'message': 'Profile updated successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to update profile'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/change-password', methods=['PUT'])
def change_student_password():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({'success': False, 'error': 'Current and new password are required'}), 400
        
        success = db.change_student_password(student_id, current_password, new_password)
        if success:
            return jsonify({'success': True, 'message': 'Password changed successfully'})
        else:
            return jsonify({'success': False, 'error': 'Invalid current password or failed to update'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Public course viewing endpoints (no authentication required)
@app.route('/api/courses/public', methods=['GET'])
def get_public_courses():
    try:
        print("Fetching public courses...")
        courses = db.get_all_courses()
        print(f"Found {len(courses) if courses else 0} courses")
        if courses:
            print("First course:", courses[0] if courses else "None")
        return jsonify({'success': True, 'courses': courses})
    except Exception as e:
        print(f"Error in get_public_courses: {e}")
        # Try to provide a more helpful error message
        if "Unknown column" in str(e):
            return jsonify({
                'success': False, 
                'error': 'Database structure needs to be updated. Please restart the application to auto-upgrade the database.'
            }), 500
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/courses/<int:course_id>/modules', methods=['GET'])
def get_course_modules_public(course_id):
    try:
        modules = db.get_modules_by_course(course_id)
        # Get lessons for each module
        for module in modules:
            lessons = db.get_lessons_by_module(module['id'])
            module['lessons'] = lessons
            # Add lesson count if not already present
            if 'lesson_count' not in module:
                module['lesson_count'] = len(lessons)
        return jsonify({'success': True, 'modules': modules})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/enrolled-courses', methods=['GET'])
def get_student_enrolled_courses():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        enrollments = db.get_student_enrollments(student_id)
        return jsonify({'success': True, 'courses': enrollments})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/enroll-course', methods=['POST'])
def enroll_student_in_course():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        course_id = data.get('course_id')
        
        if not course_id:
            return jsonify({'success': False, 'error': 'Course ID is required'}), 400
        
        # Check if already enrolled
        if db.is_student_enrolled(student_id, course_id):
            return jsonify({'success': False, 'error': 'Already enrolled in this course'}), 400
        
        # Enroll the student
        if db.enroll_student_in_course(student_id, course_id):
            return jsonify({'success': True, 'message': 'Successfully enrolled in course'})
        else:
            return jsonify({'success': False, 'error': 'Failed to enroll in course'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/update-progress', methods=['PUT'])
def update_student_progress():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        course_id = data.get('course_id')
        completed_modules = data.get('completed_modules', 0)
        study_time = data.get('study_time', 0)
        
        if not course_id:
            return jsonify({'success': False, 'error': 'Course ID is required'}), 400
        
        # Update the enrollment progress
        if db.update_enrollment_progress(student_id, course_id, completed_modules, study_time):
            return jsonify({'success': True, 'message': 'Progress updated successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to update progress'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/complete-course', methods=['PUT'])
def complete_student_course():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        course_id = data.get('course_id')
        
        if not course_id:
            return jsonify({'success': False, 'error': 'Course ID is required'}), 400
        
        # Update the enrollment status to completed
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE course_enrollments 
                    SET status = 'Completed', updated_at = NOW()
                    WHERE student_id = %s AND course_id = %s
                """, (student_id, course_id))
                conn.commit()
                
                if cursor.rowcount > 0:
                    return jsonify({'success': True, 'message': 'Course marked as completed'})
                else:
                    return jsonify({'success': False, 'error': 'Course not found or already completed'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/lesson-progress', methods=['GET'])
def get_student_lesson_progress():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        lesson_id = request.args.get('lesson_id')
        if lesson_id:
            # Get specific lesson progress
            progress = db.get_lesson_progress(student_id, int(lesson_id))
            return jsonify({'success': True, 'progress': progress})
        else:
            # Get all lesson progress for the student
            progress = db.get_student_lesson_progress(student_id)
            return jsonify({'success': True, 'progress': progress})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/lesson-progress', methods=['PUT'])
def update_student_lesson_progress():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        lesson_id = data.get('lesson_id')
        current_page = data.get('current_page', 1)
        total_pages = data.get('total_pages', 1)
        
        if not lesson_id:
            return jsonify({'success': False, 'error': 'Lesson ID is required'}), 400
        
        if db.update_lesson_progress(student_id, lesson_id, current_page, total_pages):
            return jsonify({'success': True, 'message': 'Progress updated successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to update progress'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/course-progress', methods=['GET'])
def get_course_progress():
    """Get detailed course progress for a student"""
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        course_id = request.args.get('course_id')
        if course_id:
            # Get specific course progress
            progress = db.get_course_progress(student_id, int(course_id))
            return jsonify({'success': True, 'progress': progress})
        else:
            # Get all course progress for the student
            progress = db.get_all_course_progress(student_id)
            return jsonify({'success': True, 'progress': progress})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/course-progress', methods=['PUT'])
def update_course_progress():
    """Update course progress including study time"""
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        course_id = data.get('course_id')
        completed_modules = data.get('completed_modules', 0)
        study_time = data.get('study_time', 0)  # in minutes
        status = data.get('status', 'Active')
        
        if not course_id:
            return jsonify({'success': False, 'error': 'Course ID is required'}), 400
        
        # Update the course progress
        if db.update_course_progress(student_id, course_id, completed_modules, study_time, status):
            return jsonify({'success': True, 'message': 'Course progress updated successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to update course progress'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/study-session', methods=['POST'])
def start_study_session():
    """Start a new study session"""
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        course_id = data.get('course_id')
        lesson_id = data.get('lesson_id')
        
        if not course_id:
            return jsonify({'success': False, 'error': 'Course ID is required'}), 400
        
        session_id = db.start_study_session(student_id, course_id, lesson_id)
        if session_id:
            return jsonify({'success': True, 'session_id': session_id})
        else:
            return jsonify({'success': False, 'error': 'Failed to start study session'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/study-session', methods=['PUT'])
def end_study_session():
    """End a study session and update progress"""
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        study_time = data.get('study_time', 0)  # in minutes
        completed_pages = data.get('completed_pages', 0)
        
        if not session_id:
            return jsonify({'success': False, 'error': 'Session ID is required'}), 400
        
        if db.end_study_session(session_id, study_time, completed_pages):
            return jsonify({'success': True, 'message': 'Study session ended successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to end study session'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/progress-analytics', methods=['GET'])
def get_progress_analytics():
    """Get comprehensive progress analytics for a student"""
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        analytics = db.get_progress_analytics(student_id)
        return jsonify({'success': True, 'analytics': analytics})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/generate-quiz', methods=['POST'])
def generate_quiz():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        lesson_id = data.get('lesson_id')
        
        if not lesson_id:
            return jsonify({'success': False, 'error': 'Lesson ID is required'}), 400
        
        # Get lesson details to get the lesson name and file path
        lesson = db.get_lesson_by_id(lesson_id)
        if not lesson:
            return jsonify({'success': False, 'error': 'Lesson not found'}), 404
        
        lesson_name = lesson.get('lesson_name', 'Lesson')
        file_path = lesson.get('file_path')
        
        if not file_path:
            return jsonify({'success': False, 'error': 'Lesson file not found'}), 404
        
        # Construct full file path
        full_pdf_path = os.path.join('uploads', file_path)
        
        if not os.path.exists(full_pdf_path):
            return jsonify({'success': False, 'error': 'PDF file not found'}), 404
        
        try:
            # Import and use the quiz generator
            from quiz_generator import QuizGenerator
            
            # Initialize quiz generator with Gemini API key
            api_key = "AIzaSyCWhMT1nVvlq_4K1ws2ACVdjfXGwD2eKB4"
            quiz_gen = QuizGenerator(api_key)
            
            # Generate quiz from PDF
            quiz_questions = quiz_gen.generate_quiz_from_pdf(full_pdf_path, lesson_name)
            
            return jsonify({
                'success': True,
                'questions': quiz_questions
            })
            
        except ImportError:
            # Fallback to sample questions if quiz generator is not available
            sample_questions = [
                {
                    "count": 1,
                    "question": "What does HTML stand for?",
                    "options": {
                        "A": "HyperText Markup Language",
                        "B": "High Tech Modern Language",
                        "C": "Home Tool Markup Language",
                        "D": "Hyperlink and Text Markup Language"
                    },
                    "correct_answer": "A"
                },
                {
                    "count": 2,
                    "question": "Which HTML tag is used to define a paragraph?",
                    "options": {
                        "A": "<p>",
                        "B": "<paragraph>",
                        "C": "<text>",
                        "D": "<para>"
                    },
                    "correct_answer": "A"
                },
                {
                    "count": 3,
                    "question": "What is the correct HTML element for inserting a line break?",
                    "options": {
                        "A": "<break>",
                        "B": "<br>",
                        "C": "<lb>",
                        "D": "<line>"
                    },
                    "correct_answer": "B"
                },
                {
                    "count": 4,
                    "question": "Which HTML attribute specifies an alternate text for an image?",
                    "options": {
                        "A": "title",
                        "B": "alt",
                        "C": "src",
                        "D": "href"
                    },
                    "correct_answer": "B"
                },
                {
                    "count": 5,
                    "question": "What does CSS stand for?",
                    "options": {
                        "A": "Computer Style Sheets",
                        "B": "Creative Style Sheets",
                        "C": "Cascading Style Sheets",
                        "D": "Colorful Style Sheets"
                    },
                    "correct_answer": "C"
                },
                {
                    "count": 6,
                    "question": "Which CSS property controls the text size?",
                    "options": {
                        "A": "font-style",
                        "B": "text-size",
                        "C": "font-size",
                        "D": "text-style"
                    },
                    "correct_answer": "C"
                },
                {
                    "count": 7,
                    "question": "How do you add a background color for all <h1> elements?",
                    "options": {
                        "A": "h1 {background-color:#FFFFFF;}",
                        "B": "h1.all {background-color:#FFFFFF;}",
                        "C": "all.h1 {background-color:#FFFFFF;}",
                        "D": "h1 {background-color:#FFFFFF;}"
                    },
                    "correct_answer": "A"
                },
                {
                    "count": 8,
                    "question": "How do you change the left margin of an element?",
                    "options": {
                        "A": "margin-left:",
                        "B": "margin:",
                        "C": "indent:",
                        "D": "text-indent:"
                    },
                    "correct_answer": "A"
                },
                {
                    "count": 9,
                    "question": "Which HTML element is used to specify a footer for a document or section?",
                    "options": {
                        "A": "<footer>",
                        "B": "<bottom>",
                        "C": "<section>",
                        "D": "<div>"
                    },
                    "correct_answer": "A"
                },
                {
                    "count": 10,
                    "question": "What is the correct HTML for making a checkbox?",
                    "options": {
                        "A": "<check>",
                        "B": "<input type=\"checkbox\">",
                        "C": "<checkbox>",
                        "D": "<input type=\"check\">"
                    },
                    "correct_answer": "B"
                }
            ]
            
            return jsonify({
                'success': True,
                'questions': sample_questions
            })
        
    except Exception as e:
        print(f"Error in generate_quiz: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/submit-quiz', methods=['POST'])
def submit_quiz():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        lesson_id = data.get('lesson_id')
        module_id = data.get('module_id')
        course_id = data.get('course_id')
        answers = data.get('answers', [])
        time_taken = data.get('time_taken_seconds', 0)
        
        if not lesson_id or not module_id or not course_id:
            return jsonify({'success': False, 'error': 'Lesson ID, module ID, and course ID are required'}), 400
        
        # Get the lesson to get the correct answers
        lesson = db.get_lesson_by_id(lesson_id)
        if not lesson:
            return jsonify({'success': False, 'error': 'Lesson not found'}), 404
        
        # Calculate actual score based on student answers
        total_questions = len(answers)
        correct_answers = 0
        question_responses = []
        
        # Process each answer and calculate correct score
        for i, answer_data in enumerate(answers):
            student_answer = answer_data.get('answer', '')
            correct_answer = answer_data.get('correct_answer', '')
            is_correct = answer_data.get('is_correct', False)
            
            # Double-check if the answer is actually correct
            if is_correct:
                correct_answers += 1
            
            # Store question response for database
            question_responses.append({
                'question_number': i + 1,
                'student_answer': student_answer,
                'correct_answer': correct_answer,
                'is_correct': is_correct
            })
        
        # Ensure time_taken is a valid number
        if not isinstance(time_taken, (int, float)) or time_taken < 0:
            time_taken = 0
        
        # Save quiz result to database
        quiz_result_id = db.save_quiz_result(
            student_id, lesson_id, module_id, course_id,
            total_questions, correct_answers, time_taken,
            question_responses
        )
        
        if quiz_result_id:
            score_percentage = round((correct_answers / total_questions) * 100, 2)
            return jsonify({
                'success': True,
                'message': 'Quiz submitted successfully',
                'quiz_result_id': quiz_result_id,
                'score': correct_answers,
                'total_questions': total_questions,
                'percentage': score_percentage,
                'time_taken_seconds': time_taken
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to save quiz result'}), 500
            
    except Exception as e:
        print(f"Error in submit_quiz: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/quiz-history', methods=['GET'])
def get_student_quiz_history():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        quiz_history = db.get_student_quiz_history(student_id)
        quiz_stats = db.get_student_quiz_stats(student_id)
        
        return jsonify({
            'success': True,
            'quiz_history': quiz_history,
            'quiz_stats': quiz_stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/quiz-stats', methods=['GET'])
def get_student_quiz_stats():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        quiz_stats = db.get_student_quiz_stats(student_id)
        return jsonify({
            'success': True,
            'quiz_stats': quiz_stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Chatbot API endpoint
@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    try:
        print("Chatbot endpoint called")
        data = request.get_json()
        print(f"Received data: {data}")
        
        message = data.get('message', '')
        student_name = data.get('student_name', 'Student')
        
        print(f"Message: {message}")
        print(f"Student name: {student_name}")
        
        if not message:
            return jsonify({'success': False, 'error': 'Message is required'}), 400
        
        # Google Gemini API configuration
        API_KEY = 'AIzaSyCyrg_eLjS8iOE6Ohh2SWVg9OFySmWCa2U'
        API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'
        
        # Create context about the student's learning environment
        context = f"""You are an AI learning assistant for a Learning Management System (LMS). 
        The student {student_name} is asking you a question. 
        Provide helpful, educational responses related to learning, studying, course materials, assignments, and academic topics.
        Keep responses concise but informative. If the question is not related to learning, politely redirect to learning topics."""
        
        request_data = {
            "contents": [{
                "parts": [{
                    "text": f"{context}\n\nStudent Question: {message}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 800,
            },
            "safetySettings": [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        }
        
        # Make request to Google Gemini API
        print(f"Making request to Gemini API: {API_URL}")
        print(f"Request data: {request_data}")
        
        response = requests.post(
            f"{API_URL}?key={API_KEY}",
            json=request_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"Gemini API response status: {response.status_code}")
        print(f"Gemini API response: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            bot_response = response_data['candidates'][0]['content']['parts'][0]['text']
            print(f"Bot response: {bot_response}")
            return jsonify({
                'success': True,
                'response': bot_response
            })
        else:
            print(f"Gemini API error: {response.status_code} - {response.text}")
            return jsonify({
                'success': False,
                'error': f'Failed to get response from AI service: {response.status_code}'
            }), 500
            
    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': 'Request timeout. Please try again.'
        }), 408
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return jsonify({
            'success': False,
            'error': 'Network error. Please try again.'
        }), 500
    except Exception as e:
        print(f"Chatbot error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

def ensure_messages_table_exists():
    """Ensure the messages table exists in the database with correct structure"""
    try:
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                # Check if messages table exists
                cursor.execute("SHOW TABLES LIKE 'messages'")
                if not cursor.fetchone():
                    print("Creating messages table...")
                    # Create the messages table
                    cursor.execute("""
                        CREATE TABLE messages (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            sender_id INT NOT NULL,
                            sender_type ENUM('student', 'admin') NOT NULL,
                            receiver_id INT NOT NULL,
                            receiver_type ENUM('student', 'admin') NOT NULL,
                            subject VARCHAR(255) NOT NULL,
                            message TEXT NOT NULL,
                            message_type ENUM('issue', 'question', 'general', 'reply') DEFAULT 'general',
                            status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
                            parent_message_id INT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            INDEX idx_sender (sender_id, sender_type),
                            INDEX idx_receiver (receiver_id, receiver_type),
                            INDEX idx_status (status),
                            INDEX idx_parent (parent_message_id)
                        )
                    """)
                    conn.commit()
                    print("Messages table created successfully")
                else:
                    # Check if table has the correct structure
                    print("Messages table exists, checking structure...")
                    cursor.execute("SHOW COLUMNS FROM messages")
                    columns_result = cursor.fetchall()
                    
                    # Handle different column result formats
                    if columns_result and len(columns_result) > 0:
                        # Try different ways to extract column names
                        if isinstance(columns_result[0], (list, tuple)):
                            columns = [col[0] for col in columns_result]
                        elif isinstance(columns_result[0], dict):
                            columns = [col['Field'] for col in columns_result]
                        else:
                            columns = [str(col) for col in columns_result]
                    else:
                        columns = []
                    
                    print(f"Current columns: {columns}")
                    
                    # Check if this is the old table structure that needs to be replaced
                    if 'student_id' in columns and 'admin_id' in columns and 'sender' in columns:
                        print("Detected old messages table structure. Dropping and recreating...")
                        cursor.execute("DROP TABLE messages")
                        conn.commit()
                        print("Old messages table dropped")
                        
                        # Create the new table with correct structure
                        cursor.execute("""
                            CREATE TABLE messages (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                sender_id INT NOT NULL,
                                sender_type ENUM('student', 'admin') NOT NULL,
                                receiver_id INT NOT NULL,
                                receiver_type ENUM('student', 'admin') NOT NULL,
                                subject VARCHAR(255) NOT NULL,
                                message TEXT NOT NULL,
                                message_type ENUM('issue', 'question', 'general', 'reply') DEFAULT 'general',
                                status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
                                parent_message_id INT NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                INDEX idx_sender (sender_id, sender_type),
                                INDEX idx_receiver (receiver_id, receiver_type),
                                INDEX idx_status (status),
                                INDEX idx_parent (parent_message_id)
                            )
                        """)
                        conn.commit()
                        print("New messages table created with correct structure")
                        return
                    
                    # Check if receiver_id column exists
                    if 'receiver_id' not in columns:
                        print("Adding missing receiver_id column...")
                        try:
                            cursor.execute("ALTER TABLE messages ADD COLUMN receiver_id INT NOT NULL AFTER sender_type")
                            conn.commit()
                            print("receiver_id column added")
                        except Exception as e:
                            print(f"Error adding receiver_id: {e}")
                    
                    # Check if receiver_type column exists
                    if 'receiver_type' not in columns:
                        print("Adding missing receiver_type column...")
                        try:
                            cursor.execute("ALTER TABLE messages ADD COLUMN receiver_type ENUM('student', 'admin') NOT NULL AFTER receiver_id")
                            conn.commit()
                            print("receiver_type column added")
                        except Exception as e:
                            print(f"Error adding receiver_type: {e}")
                    
                    # Check if other required columns exist
                    required_columns = ['subject', 'message', 'message_type', 'status', 'parent_message_id']
                    for col in required_columns:
                        if col not in columns:
                            print(f"Adding missing {col} column...")
                            try:
                                if col == 'subject':
                                    cursor.execute("ALTER TABLE messages ADD COLUMN subject VARCHAR(255) NOT NULL AFTER receiver_type")
                                elif col == 'message':
                                    cursor.execute("ALTER TABLE messages ADD COLUMN message TEXT NOT NULL AFTER subject")
                                elif col == 'message_type':
                                    cursor.execute("ALTER TABLE messages ADD COLUMN message_type ENUM('issue', 'question', 'general', 'reply') DEFAULT 'general' AFTER message")
                                elif col == 'status':
                                    cursor.execute("ALTER TABLE messages ADD COLUMN status ENUM('unread', 'read', 'replied') DEFAULT 'unread' AFTER message_type")
                                elif col == 'parent_message_id':
                                    cursor.execute("ALTER TABLE messages ADD COLUMN parent_message_id INT NULL AFTER status")
                                conn.commit()
                                print(f"{col} column added")
                            except Exception as e:
                                print(f"Error adding {col}: {e}")
                    
                    print("Messages table structure verified and updated")
    except Exception as e:
        print(f"Error ensuring messages table exists: {e}")
        import traceback
        traceback.print_exc()

# Messaging API endpoints
@app.route('/api/messages/send', methods=['POST'])
def send_message():
    try:
        # Ensure messages table exists
        ensure_messages_table_exists()
        
        data = request.get_json()
        sender_id = data.get('sender_id')
        sender_type = data.get('sender_type')
        receiver_id = data.get('receiver_id')
        receiver_type = data.get('receiver_type')
        subject = data.get('subject')
        message = data.get('message')
        message_type = data.get('message_type', 'general')
        parent_message_id = data.get('parent_message_id')
        
        if not all([sender_id, sender_type, receiver_id, receiver_type, subject, message]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        message_id = db.send_message(
            sender_id, sender_type, receiver_id, receiver_type, 
            subject, message, message_type, parent_message_id
        )
        
        return jsonify({
            'success': True,
            'message_id': message_id,
            'message': 'Message sent successfully'
        })
    except Exception as e:
        print(f"Error sending message: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/messages/inbox', methods=['GET'])
def get_inbox():
    try:
        # Ensure messages table exists
        ensure_messages_table_exists()
        
        user_id = session.get('student_id') or session.get('admin_id')
        user_type = 'student' if session.get('student_id') else 'admin'
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
        messages = db.get_messages_for_user(user_id, user_type)
        return jsonify({
            'success': True,
            'messages': messages
        })
    except Exception as e:
        print(f"Error getting inbox: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/messages/sent', methods=['GET'])
def get_sent_messages():
    try:
        # Ensure messages table exists
        ensure_messages_table_exists()
        
        user_id = session.get('student_id') or session.get('admin_id')
        user_type = 'student' if session.get('student_id') else 'admin'
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
        messages = db.get_sent_messages(user_id, user_type)
        return jsonify({
            'success': True,
            'messages': messages
        })
    except Exception as e:
        print(f"Error getting sent messages: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/messages/<int:message_id>', methods=['GET'])
def get_message_thread(message_id):
    try:
        # Ensure messages table exists
        ensure_messages_table_exists()
        
        user_id = session.get('student_id') or session.get('admin_id')
        user_type = 'student' if session.get('student_id') else 'admin'
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
        thread = db.get_message_thread(message_id)
        if not thread:
            return jsonify({'success': False, 'error': 'Message not found'}), 404
        
        # Mark as read if user is the receiver
        if thread['parent']['receiver_id'] == user_id and thread['parent']['receiver_type'] == user_type:
            db.mark_message_as_read(message_id)
        
        return jsonify({
            'success': True,
            'thread': thread
        })
    except Exception as e:
        print(f"Error getting message thread: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/messages/<int:message_id>/read', methods=['POST'])
def mark_as_read(message_id):
    try:
        # Ensure messages table exists
        ensure_messages_table_exists()
        
        user_id = session.get('student_id') or session.get('admin_id')
        user_type = 'student' if session.get('student_id') else 'admin'
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
        success = db.mark_message_as_read(message_id)
        return jsonify({
            'success': success,
            'message': 'Message marked as read' if success else 'Failed to mark as read'
        })
    except Exception as e:
        print(f"Error marking message as read: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/messages/unread-count', methods=['GET'])
def get_unread_count():
    try:
        # Ensure messages table exists
        ensure_messages_table_exists()
        
        user_id = session.get('student_id') or session.get('admin_id')
        user_type = 'student' if session.get('student_id') else 'admin'
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
        count = db.get_unread_message_count(user_id, user_type)
        return jsonify({
            'success': True,
            'count': count
        })
    except Exception as e:
        print(f"Error getting unread count: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/students', methods=['GET'])
def get_all_students():
    try:
        admin_id = session.get('admin_id')
        if not admin_id:
            return jsonify({'success': False, 'error': 'Admin not authenticated'}), 401
        
        students = db.get_all_students_for_admin()
        return jsonify({
            'success': True,
            'students': students
        })
    except Exception as e:
        print(f"Error getting students: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Admin messaging endpoints
@app.route('/api/admin/messages', methods=['GET'])
def get_admin_messages():
    """Get all messages for admin (inbox)"""
    try:
        ensure_messages_table_exists()
        
        admin_id = session.get('admin_id')
        if not admin_id:
            return jsonify({'success': False, 'error': 'Admin not authenticated'}), 401
        
        messages = db.get_messages_for_user(admin_id, 'admin')
        return jsonify({
            'success': True,
            'messages': messages
        })
    except Exception as e:
        print(f"Error getting admin messages: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/messages/sent', methods=['GET'])
def get_admin_sent_messages():
    """Get all messages sent by admin"""
    try:
        ensure_messages_table_exists()
        
        admin_id = session.get('admin_id')
        if not admin_id:
            return jsonify({'success': False, 'error': 'Admin not authenticated'}), 401
        
        messages = db.get_sent_messages(admin_id, 'admin')
        return jsonify({
            'success': True,
            'messages': messages
        })
    except Exception as e:
        print(f"Error getting admin sent messages: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/messages/<int:message_id>', methods=['GET'])
def get_admin_message_thread(message_id):
    """Get message thread for admin"""
    try:
        ensure_messages_table_exists()
        
        admin_id = session.get('admin_id')
        if not admin_id:
            return jsonify({'success': False, 'error': 'Admin not authenticated'}), 401
        
        thread = db.get_message_thread(message_id)
        return jsonify({
            'success': True,
            'thread': thread
        })
    except Exception as e:
        print(f"Error getting admin message thread: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/messages/<int:message_id>/reply', methods=['POST'])
def admin_reply_to_message(message_id):
    """Admin replies to a student message"""
    try:
        ensure_messages_table_exists()
        
        admin_id = session.get('admin_id')
        if not admin_id:
            return jsonify({'success': False, 'error': 'Admin not authenticated'}), 401
        
        data = request.get_json()
        reply_message = data.get('message')
        subject = data.get('subject', 'Re: Student Message')
        
        if not reply_message:
            return jsonify({'success': False, 'error': 'Reply message is required'}), 400
        
        # Get the original message to find the student
        original_message = db.get_message_by_id(message_id)
        if not original_message:
            return jsonify({'success': False, 'error': 'Original message not found'}), 404
        
        # Send reply from admin to student
        reply_id = db.send_message(
            sender_id=admin_id,
            sender_type='admin',
            receiver_id=original_message['sender_id'],
            receiver_type='student',
            subject=subject,
            message=reply_message,
            message_type='reply',
            parent_message_id=message_id
        )
        
        # Mark original message as replied
        db.mark_message_as_read(message_id)
        
        return jsonify({
            'success': True,
            'reply_id': reply_id,
            'message': 'Reply sent successfully'
        })
    except Exception as e:
        print(f"Error sending admin reply: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/messages/unread-count', methods=['GET'])
def get_admin_unread_count():
    """Get unread message count for admin"""
    try:
        ensure_messages_table_exists()
        
        admin_id = session.get('admin_id')
        if not admin_id:
            return jsonify({'success': False, 'error': 'Admin not authenticated'}), 401
        
        count = db.get_unread_message_count(admin_id, 'admin')
        return jsonify({
            'success': True,
            'count': count
        })
    except Exception as e:
        print(f"Error getting admin unread count: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# AI Course Recommendations
@app.route('/api/ai/recommendations', methods=['GET'])
def get_ai_recommendations():
    """Get AI-powered course recommendations for a student"""
    try:
        if 'student_id' not in session:
            return jsonify({'success': False, 'error': 'Student not authenticated'}), 401
        
        student_id = session['student_id']
        limit = request.args.get('limit', 5, type=int)
        
        # Get student data
        student_data = db.get_student_by_id(student_id)
        if not student_data:
            return jsonify({'success': False, 'error': 'Student not found'}), 404
        
        # Get enrolled and completed courses
        enrolled_courses = db.get_enrolled_courses(student_id)
        completed_courses = db.get_completed_courses(student_id)
        
        # Get all courses for AI analysis
        all_courses = db.get_all_courses()
        
        # Initialize AI recommendation engine
        from ai_recommendations_simple import recommendation_engine
        recommendation_engine.db = db
        
        # Prepare course features for AI
        recommendation_engine.prepare_course_features(all_courses)
        
        # Get recommendations
        recommendations = recommendation_engine.get_course_recommendations(
            student_id, student_data, enrolled_courses, completed_courses, limit
        )
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'student_profile': {
                'skill_level': recommendation_engine._get_student_level(completed_courses),
                'completion_rate': len(completed_courses) / (len(enrolled_courses) + len(completed_courses)) if (len(enrolled_courses) + len(completed_courses)) > 0 else 0,
                'total_courses_taken': len(completed_courses)
            }
        })
        
    except Exception as e:
        print(f"Error getting AI recommendations: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ai/learning-path/<int:target_course_id>', methods=['GET'])
def get_learning_path(target_course_id):
    """Get AI-generated learning path to a target course"""
    try:
        if 'student_id' not in session:
            return jsonify({'success': False, 'error': 'Student not authenticated'}), 401
        
        student_id = session['student_id']
        
        # Get student data
        student_data = db.get_student_by_id(student_id)
        if not student_data:
            return jsonify({'success': False, 'error': 'Student not found'}), 404
        
        # Get completed courses
        completed_courses = db.get_completed_courses(student_id)
        
        # Get all courses for AI analysis
        all_courses = db.get_all_courses()
        
        # Initialize AI recommendation engine
        from ai_recommendations_simple import recommendation_engine
        recommendation_engine.db = db
        
        # Prepare course features for AI
        recommendation_engine.prepare_course_features(all_courses)
        
        # Get learning path
        learning_path = recommendation_engine.get_learning_path(
            student_id, target_course_id, student_data, completed_courses
        )
        
        return jsonify({
            'success': True,
            'learning_path': learning_path,
            'target_course_id': target_course_id
        })
        
    except Exception as e:
        print(f"Error getting learning path: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ai/course-insights/<int:course_id>', methods=['GET'])
def get_course_insights(course_id):
    """Get AI-generated insights about a course"""
    try:
        # Get all courses for AI analysis
        all_courses = db.get_all_courses()
        
        # Initialize AI recommendation engine
        from ai_recommendations_simple import recommendation_engine
        recommendation_engine.db = db
        
        # Prepare course features for AI
        recommendation_engine.prepare_course_features(all_courses)
        
        # Get course insights
        insights = recommendation_engine.get_course_insights(course_id)
        
        return jsonify({
            'success': True,
            'course_id': course_id,
            'insights': insights
        })
        
    except Exception as e:
        print(f"Error getting course insights: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Test endpoint to verify backend is working
@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({'message': 'Backend is working!', 'status': 'success'})

# Test database connection
@app.route('/api/test-db', methods=['GET'])
def test_database():
    try:
        # Test admin table
        admin_count = db.get_admin_count()
        return jsonify({
            'message': 'Database connection successful',
            'admin_count': admin_count,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'message': 'Database connection failed',
            'error': str(e),
            'status': 'error'
        }), 500

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    import os
    from flask import send_file, abort, request
    upload_dir = 'uploads'
    file_path = os.path.join(upload_dir, filename)
    
    print(f"Requested file: {filename}")
    print(f"Full file path: {file_path}")
    print(f"File exists: {os.path.exists(file_path)}")
    
    if os.path.exists(file_path):
        try:
            print(f"Serving file: {file_path}")
            
            # Check if download is requested
            download = request.args.get('download', 'false').lower() == 'true'
            
            if download:
                # Force download
                return send_file(
                    file_path, 
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name=filename
                )
            else:
                # View in browser
                return send_file(
                    file_path, 
                    mimetype='application/pdf'
                )
        except Exception as e:
            print(f"Error serving file {filename}: {e}")
            abort(500)
    else:
        print(f"File not found: {file_path}")
        abort(404)

# Feedback System Endpoints
@app.route('/api/student/feedback', methods=['POST'])
def submit_feedback():
    """Submit feedback for a course or lesson"""
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        feedback_type = data.get('feedback_type')  # 'course' or 'lesson'
        target_id = data.get('target_id')  # course_id or lesson_id
        rating = data.get('rating')  # 1-5 stars
        comment = data.get('comment', '')
        category = data.get('category', 'general')  # 'content', 'difficulty', 'instructor', etc.
        
        if not feedback_type or not target_id or not rating:
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        if not (1 <= rating <= 5):
            return jsonify({'success': False, 'error': 'Rating must be between 1 and 5'}), 400
        
        feedback_id = db.submit_feedback(student_id, feedback_type, target_id, rating, comment, category)
        if feedback_id:
            return jsonify({'success': True, 'feedback_id': feedback_id, 'message': 'Feedback submitted successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to submit feedback'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/feedback', methods=['GET'])
def get_feedback():
    """Get feedback for a student"""
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        feedback_type = request.args.get('feedback_type')  # 'course' or 'lesson'
        target_id = request.args.get('target_id')  # course_id or lesson_id
        
        if feedback_type and target_id:
            # Get specific feedback
            feedback = db.get_feedback(student_id, feedback_type, target_id)
            return jsonify({'success': True, 'feedback': feedback})
        else:
            # Get all feedback for the student
            feedback = db.get_student_feedback(student_id)
            return jsonify({'success': True, 'feedback': feedback})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/feedback', methods=['PUT'])
def update_feedback():
    """Update existing feedback"""
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        feedback_id = data.get('feedback_id')
        rating = data.get('rating')
        comment = data.get('comment')
        
        if not feedback_id:
            return jsonify({'success': False, 'error': 'Feedback ID is required'}), 400
        
        if db.update_feedback(student_id, feedback_id, rating, comment):
            return jsonify({'success': True, 'message': 'Feedback updated successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to update feedback'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/feedback', methods=['DELETE'])
def delete_feedback():
    """Delete feedback"""
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        feedback_id = data.get('feedback_id')
        
        if not feedback_id:
            return jsonify({'success': False, 'error': 'Feedback ID is required'}), 400
        
        if db.delete_feedback(student_id, feedback_id):
            return jsonify({'success': True, 'message': 'Feedback deleted successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to delete feedback'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/student/feedback-analytics', methods=['GET'])
def get_feedback_analytics():
    """Get feedback analytics for a student"""
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        analytics = db.get_feedback_analytics(student_id)
        return jsonify({'success': True, 'analytics': analytics})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Instructor Feedback Management Endpoints
@app.route('/api/instructor/feedback', methods=['GET'])
def get_instructor_feedback():
    """Get all feedback for courses taught by the instructor"""
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        feedback_type = request.args.get('feedback_type')  # 'course' or 'lesson' or None for all
        course_id = request.args.get('course_id')  # Optional: filter by specific course
        category = request.args.get('category')  # Optional: filter by category
        rating = request.args.get('rating')  # Optional: filter by rating
        
        feedback = db.get_instructor_feedback(instructor_id, feedback_type, course_id, category, rating)
        return jsonify({'success': True, 'feedback': feedback})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/instructor/feedback-analytics', methods=['GET'])
def get_instructor_feedback_analytics():
    """Get comprehensive feedback analytics for instructor's courses"""
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        analytics = db.get_instructor_feedback_analytics(instructor_id)
        return jsonify({'success': True, 'analytics': analytics})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/instructor/feedback-summary', methods=['GET'])
def get_instructor_feedback_summary():
    """Get feedback summary for instructor's courses"""
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        summary = db.get_instructor_feedback_summary(instructor_id)
        return jsonify({'success': True, 'summary': summary})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/instructor/feedback-export', methods=['GET'])
def export_instructor_feedback():
    """Export feedback data for instructor's courses"""
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        feedback_data = db.export_instructor_feedback(instructor_id)
        return jsonify({'success': True, 'data': feedback_data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/instructor/student-progress-analytics', methods=['GET'])
def get_student_progress_analytics():
    instructor_id = session.get('instructor_id')
    if not instructor_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        course_id = request.args.get('course_id')
        student_id = request.args.get('student_id')
        time_range = request.args.get('time_range', 'month')
        
        print(f"Fetching analytics for instructor {instructor_id}, course: {course_id}, student: {student_id}, time: {time_range}")
        
        analytics = db.get_student_progress_analytics(
            instructor_id, 
            course_id, 
            student_id, 
            time_range
        )
        
        print(f"Analytics fetched successfully: {len(analytics.get('courses', []))} courses, {len(analytics.get('students', []))} students")
        
        return jsonify({'success': True, 'analytics': analytics})
    except Exception as e:
        print(f"Error in student progress analytics: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/certificates', methods=['GET'])
def get_student_certificates():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        certificates = db.get_student_certificates(student_id)
        return jsonify({'success': True, 'certificates': certificates})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/completed-courses', methods=['GET'])
def get_completed_courses():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        courses = db.get_completed_courses_for_certificates(student_id)
        return jsonify({'success': True, 'courses': courses})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/generate-certificate', methods=['POST'])
def generate_certificate():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        course_id = data.get('course_id')
        
        print(f"Generating certificate for student {student_id}, course {course_id}")
        print(f"Request data: {data}")
        
        if not course_id:
            return jsonify({'error': 'Course ID is required'}), 400
        
        success, result = db.generate_certificate(student_id, course_id)
        
        print(f"Certificate generation result: success={success}, result={result}")
        
        if success:
            return jsonify({
                'success': True, 
                'message': 'Certificate generated successfully',
                'certificate_id': result
            })
        else:
            return jsonify({'error': result}), 400
            
    except Exception as e:
        print(f"Error in generate_certificate endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/student/download-certificate/<certificate_id>', methods=['GET'])
def download_certificate(certificate_id):
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        certificate = db.get_certificate_by_id(certificate_id)
        if not certificate:
            return jsonify({'error': 'Certificate not found'}), 404
        
        # Check if certificate belongs to the student
        if certificate['student_id'] != student_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Update status to downloaded
        db.update_certificate_status(certificate_id, 'Downloaded')
        
        # For now, return a simple text response
        # In a real implementation, you would generate a PDF
        certificate_text = f"""
Certificate of Completion

This is to certify that
{certificate['student_name']}
has successfully completed the course
{certificate['course_name']}

Completion Date: {certificate['completion_date']}
Certificate ID: {certificate['certificate_id']}
Final Score: {certificate['final_score']}%

This certificate is issued by the Learning Management System.
        """
        
        response = make_response(certificate_text)
        response.headers['Content-Type'] = 'text/plain'
        response.headers['Content-Disposition'] = f'attachment; filename=certificate-{certificate_id}.txt'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
