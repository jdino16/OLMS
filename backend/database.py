import pymysql
import hashlib
from datetime import datetime

class Database:
    def __init__(self, host, user, password, database, port=3306):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.port = port

    def get_connection(self):
        return pymysql.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database,
            port=self.port,
            cursorclass=pymysql.cursors.DictCursor
        )

    def hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()

    def verify_password(self, password, hashed):
        hashed_input = self.hash_password(password)
        print(f"Input password: {password}")
        print(f"Input password hashed: {hashed_input}")
        print(f"Stored hash: {hashed}")
        print(f"Password match: {hashed_input == hashed}")
        return hashed_input == hashed

    def create_tables(self):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Create admin table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS admin (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(50) UNIQUE NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                """)

                # Create instructors table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS instructors (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(50) UNIQUE NOT NULL,
                        instructor_name VARCHAR(100) NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        dob DATE NOT NULL,
                        gender ENUM('Male', 'Female', 'Other') NOT NULL,
                        phone_number VARCHAR(20) NOT NULL,
                        email VARCHAR(100),
                        address TEXT,
                        approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
                        approved_by INT,
                        approved_at TIMESTAMP NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                """)

                # Create students table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS students (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(50) UNIQUE NOT NULL,
                        student_name VARCHAR(100) NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        dob DATE NOT NULL,
                        gender ENUM('Male', 'Female', 'Other') NOT NULL,
                        phone_number VARCHAR(20) NOT NULL,
                        email VARCHAR(100),
                        address TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                """)

                # Create courses table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS courses (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        course_name VARCHAR(100) NOT NULL,
                        description TEXT,
                        duration VARCHAR(50),
                        level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
                        status ENUM('Active', 'Inactive') DEFAULT 'Active',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                """)

                # Create modules table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS modules (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        module_name VARCHAR(100) NOT NULL,
                        course_id INT NOT NULL,
                        description TEXT,
                        status ENUM('Active', 'Inactive') DEFAULT 'Active',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                    )
                """)

                # Create lessons table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS lessons (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        lesson_name VARCHAR(200) NOT NULL,
                        module_id INT NOT NULL,
                        file_path VARCHAR(500) NOT NULL,
                        file_name VARCHAR(200) NOT NULL,
                        file_type VARCHAR(50) NOT NULL,
                        file_size INT,
                        description TEXT,
                        total_slides INT DEFAULT 10,
                        status ENUM('Active', 'Inactive') DEFAULT 'Active',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
                    )
                """)

                # Create course enrollments table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS course_enrollments (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        student_id INT NOT NULL,
                        course_id INT NOT NULL,
                        enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        status ENUM('Active', 'Completed', 'Dropped') DEFAULT 'Active',
                        progress_percentage DECIMAL(5,2) DEFAULT 0.00,
                        completed_modules INT DEFAULT 0,
                        total_study_time INT DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                        UNIQUE KEY unique_enrollment (student_id, course_id)
                    )
                """)

                # Create lesson progress table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS lesson_progress (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        student_id INT NOT NULL,
                        lesson_id INT NOT NULL,
                        current_page INT DEFAULT 1,
                        total_pages INT DEFAULT 1,
                        progress_percentage DECIMAL(5,2) DEFAULT 0.00,
                        last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
                        UNIQUE KEY unique_lesson_progress (student_id, lesson_id)
                    )
                """)

                # Create quiz results table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS quiz_results (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        student_id INT NOT NULL,
                        lesson_id INT NOT NULL,
                        module_id INT NOT NULL,
                        course_id INT NOT NULL,
                        total_questions INT NOT NULL,
                        correct_answers INT NOT NULL,
                        score_percentage DECIMAL(5,2) NOT NULL,
                        time_taken_seconds INT,
                        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
                        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
                        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
                    )
                """)

                # Create quiz question responses table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS quiz_question_responses (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        quiz_result_id INT NOT NULL,
                        question_number INT NOT NULL,
                        student_answer VARCHAR(1) NOT NULL,
                        correct_answer VARCHAR(1) NOT NULL,
                        is_correct BOOLEAN NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (quiz_result_id) REFERENCES quiz_results(id) ON DELETE CASCADE
                    )
                """)

                # Create messages table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS messages (
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
                        INDEX idx_parent (parent_message_id),
                        FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL
                    )
                """)

                # Create study sessions table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS study_sessions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        student_id INT NOT NULL,
                        course_id INT NOT NULL,
                        lesson_id INT NULL,
                        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        end_time TIMESTAMP NULL,
                        study_time INT DEFAULT 0 COMMENT 'Study time in minutes',
                        completed_pages INT DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_student (student_id),
                        INDEX idx_course (course_id),
                        INDEX idx_start_time (start_time),
                        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
                    )
                """)

                # Create feedback table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS feedback (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        student_id INT NOT NULL,
                        feedback_type ENUM('course', 'lesson') NOT NULL,
                        target_id INT NOT NULL COMMENT 'course_id or lesson_id',
                        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                        comment TEXT,
                        category ENUM('content', 'difficulty', 'instructor', 'technical', 'general') DEFAULT 'general',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_student (student_id),
                        INDEX idx_feedback_type (feedback_type),
                        INDEX idx_target (target_id),
                        INDEX idx_rating (rating),
                        INDEX idx_category (category),
                        UNIQUE KEY unique_feedback (student_id, feedback_type, target_id),
                        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
                    )
                """)

                # Insert default admin if not exists
                cursor.execute("SELECT COUNT(*) as count FROM admin")
                if cursor.fetchone()['count'] == 0:
                    cursor.execute("""
                        INSERT INTO admin (username, password) VALUES (%s, %s)
                    """, ('admin', self.hash_password('admin123')))

                conn.commit()
                
                # Upgrade existing tables if needed
                self.upgrade_tables()

    def upgrade_tables(self):
        """Upgrade existing tables by adding missing columns"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    # Check if lessons table has status column
                    cursor.execute("SHOW COLUMNS FROM lessons LIKE 'status'")
                    if not cursor.fetchone():
                        cursor.execute("ALTER TABLE lessons ADD COLUMN status ENUM('Active', 'Inactive') DEFAULT 'Active'")
                        print("Added status column to lessons table")
                    
                    # Check if lessons table has total_slides column
                    cursor.execute("SHOW COLUMNS FROM lessons LIKE 'total_slides'")
                    if not cursor.fetchone():
                        cursor.execute("ALTER TABLE lessons ADD COLUMN total_slides INT DEFAULT 10")
                        print("Added total_slides column to lessons table")
                    
                    conn.commit()
                except Exception as e:
                    print(f"Error upgrading tables: {e}")
                    conn.rollback()

    # Admin operations
    def authenticate_admin(self, username, password):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                print(f"Checking admin table for username: {username}")
                cursor.execute("SELECT * FROM admin WHERE username = %s", (username,))
                admin = cursor.fetchone()
                print(f"Admin found: {admin}")
                if admin:
                    print(f"Verifying password for admin: {admin['username']}")
                    password_valid = self.verify_password(password, admin['password'])
                    print(f"Password verification result: {password_valid}")
                    if password_valid:
                        return admin
                print("Admin authentication failed")
                return None

    def get_admin_by_id(self, admin_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM admin WHERE id = %s", (admin_id,))
                return cursor.fetchone()

    def update_admin_password(self, admin_id, new_password):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                hashed_password = self.hash_password(new_password)
                cursor.execute("""
                    UPDATE admin SET password = %s, updated_at = NOW() 
                    WHERE id = %s
                """, (hashed_password, admin_id))
                conn.commit()
                return cursor.rowcount > 0

    def get_admin_count(self):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) as count FROM admin")
                result = cursor.fetchone()
                return result['count'] if result else 0

    # Instructor authentication
    def authenticate_instructor(self, username, password):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM instructors WHERE username = %s AND approval_status = 'Approved'", (username,))
                instructor = cursor.fetchone()
                if instructor and self.verify_password(password, instructor['password']):
                    return instructor
                return None

    def get_instructor_by_id(self, instructor_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM instructors WHERE id = %s", (instructor_id,))
                return cursor.fetchone()

    def get_instructor_by_username(self, username):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM instructors WHERE username = %s", (username,))
                return cursor.fetchone()

    def update_instructor_profile(self, instructor_id, profile_data):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Build update query dynamically based on provided fields
                update_fields = []
                update_values = []
                
                if 'instructor_name' in profile_data:
                    update_fields.append("instructor_name = %s")
                    update_values.append(profile_data['instructor_name'])
                
                if 'email' in profile_data:
                    update_fields.append("email = %s")
                    update_values.append(profile_data['email'])
                
                if 'phone_number' in profile_data:
                    update_fields.append("phone_number = %s")
                    update_values.append(profile_data['phone_number'])
                
                if not update_fields:
                    return False
                
                # Add instructor_id to values and create query
                update_values.append(instructor_id)
                query = f"""
                    UPDATE instructors 
                    SET {', '.join(update_fields)}, updated_at = NOW()
                    WHERE id = %s
                """
                
                cursor.execute(query, update_values)
                conn.commit()
                return cursor.rowcount > 0

    def verify_instructor_password(self, instructor_id, password):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT password FROM instructors WHERE id = %s", (instructor_id,))
                result = cursor.fetchone()
                if result:
                    stored_password = result['password']
                    return self.verify_password(password, stored_password)
                return False

    def update_instructor_password(self, instructor_id, new_password):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                hashed_password = self.hash_password(new_password)
                cursor.execute(
                    "UPDATE instructors SET password = %s, updated_at = NOW() WHERE id = %s",
                    (hashed_password, instructor_id)
                )
                conn.commit()
                return cursor.rowcount > 0

    # Instructor CRUD operations
    def get_all_instructors(self):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM instructors ORDER BY created_at DESC")
                return cursor.fetchall()

    def get_instructor_by_id(self, instructor_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM instructors WHERE id = %s", (instructor_id,))
                return cursor.fetchone()

    def create_instructor(self, instructor_data):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                hashed_password = self.hash_password(instructor_data['password'])
                cursor.execute("""
                    INSERT INTO instructors (username, instructor_name, password, dob, gender, phone_number, email, address)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    instructor_data['username'],
                    instructor_data['instructor_name'],
                    hashed_password,
                    instructor_data['dob'],
                    instructor_data['gender'],
                    instructor_data['phone_number'],
                    instructor_data.get('email', ''),
                    instructor_data.get('address', '')
                ))
                conn.commit()
                return cursor.lastrowid

    def update_instructor(self, instructor_id, instructor_data):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                if 'password' in instructor_data and instructor_data['password']:
                    hashed_password = self.hash_password(instructor_data['password'])
                    cursor.execute("""
                        UPDATE instructors SET 
                        username = %s, instructor_name = %s, password = %s, dob = %s, 
                        gender = %s, phone_number = %s, email = %s, address = %s, updated_at = NOW()
                        WHERE id = %s
                    """, (
                        instructor_data['username'],
                        instructor_data['instructor_name'],
                        hashed_password,
                        instructor_data['dob'],
                        instructor_data['gender'],
                        instructor_data['phone_number'],
                        instructor_data.get('email', ''),
                        instructor_data.get('address', ''),
                        instructor_id
                    ))
                else:
                    cursor.execute("""
                        UPDATE instructors SET 
                        username = %s, instructor_name = %s, dob = %s, 
                        gender = %s, phone_number = %s, email = %s, address = %s, updated_at = NOW()
                        WHERE id = %s
                    """, (
                        instructor_data['username'],
                        instructor_data['instructor_name'],
                        instructor_data['dob'],
                        instructor_data['gender'],
                        instructor_data['phone_number'],
                        instructor_data.get('email', ''),
                        instructor_data.get('address', ''),
                        instructor_id
                    ))
                conn.commit()
                return cursor.rowcount > 0

    def delete_instructor(self, instructor_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM instructors WHERE id = %s", (instructor_id,))
                conn.commit()
                return cursor.rowcount > 0

    def get_pending_instructors(self):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM instructors WHERE approval_status = 'Pending' ORDER BY created_at DESC")
                return cursor.fetchall()

    def approve_instructor(self, instructor_id, admin_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE instructors 
                    SET approval_status = 'Approved', approved_by = %s, approved_at = NOW() 
                    WHERE id = %s
                """, (admin_id, instructor_id))
                conn.commit()
                return cursor.rowcount > 0

    def reject_instructor(self, instructor_id, admin_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE instructors 
                    SET approval_status = 'Rejected', approved_by = %s, approved_at = NOW() 
                    WHERE id = %s
                """, (admin_id, instructor_id))
                conn.commit()
                return cursor.rowcount > 0

    def get_instructor_stats(self, instructor_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
               
                cursor.execute("SELECT COUNT(*) as total_courses FROM courses")
                total_courses = cursor.fetchone()['total_courses']
                
                cursor.execute("SELECT COUNT(*) as total_students FROM students")
                total_students = cursor.fetchone()['total_students']
                
                cursor.execute("SELECT COUNT(*) as total_modules FROM modules")
                total_modules = cursor.fetchone()['total_modules']
                
                cursor.execute("SELECT COUNT(*) as active_courses FROM courses WHERE status = 'Active'")
                active_courses = cursor.fetchone()['active_courses']
                
                return {
                    'totalCourses': total_courses,
                    'totalStudents': total_students,
                    'totalModules': total_modules,
                    'activeCourses': active_courses
                }

    # Student CRUD operations
    def get_all_students(self):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM students ORDER BY created_at DESC")
                return cursor.fetchall()

    def get_student_by_id(self, student_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM students WHERE id = %s", (student_id,))
                return cursor.fetchone()

    def create_student(self, student_data):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                hashed_password = self.hash_password(student_data['password'])
                cursor.execute("""
                    INSERT INTO students (username, student_name, password, dob, gender, phone_number, email, address)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    student_data['username'],
                    student_data['student_name'],
                    hashed_password,
                    student_data['dob'],
                    student_data['gender'],
                    student_data['phone_number'],
                    student_data.get('email', ''),
                    student_data.get('address', '')
                ))
                conn.commit()
                return cursor.lastrowid

    def update_student(self, student_id, student_data):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                if 'password' in student_data and student_data['password']:
                    hashed_password = self.hash_password(student_data['password'])
                    cursor.execute("""
                        UPDATE students SET 
                        username = %s, student_name = %s, password = %s, dob = %s, 
                        gender = %s, phone_number = %s, email = %s, address = %s, updated_at = NOW()
                        WHERE id = %s
                    """, (
                        student_data['username'],
                        student_data['student_name'],
                        hashed_password,
                        student_data['dob'],
                        student_data['gender'],
                        student_data['phone_number'],
                        student_data.get('email', ''),
                        student_data.get('address', ''),
                        student_id
                    ))
                else:
                    cursor.execute("""
                        UPDATE students SET 
                        username = %s, student_name = %s, dob = %s, 
                        gender = %s, phone_number = %s, email = %s, address = %s, updated_at = NOW()
                        WHERE id = %s
                    """, (
                        student_data['username'],
                        student_data['student_name'],
                        student_data['dob'],
                        student_data['gender'],
                        student_data['phone_number'],
                        student_data.get('email', ''),
                        student_data.get('address', ''),
                        student_id
                    ))
                conn.commit()
                return cursor.rowcount > 0

    def delete_student(self, student_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
                conn.commit()
                return cursor.rowcount > 0

    def get_student_by_username(self, username):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM students WHERE username = %s", (username,))
                return cursor.fetchone()

    def get_student_by_email(self, email):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM students WHERE email = %s", (email,))
                return cursor.fetchone()

    def authenticate_student(self, username, password):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM students WHERE username = %s", (username,))
                student = cursor.fetchone()
                
                if student and self.verify_password(password, student['password']):
                    return student
                return None

    def update_student_profile(self, student_id, profile_data):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE students SET 
                    student_name = %s, email = %s, phone_number = %s, 
                    address = %s, updated_at = NOW()
                    WHERE id = %s
                """, (
                    profile_data.get('student_name'),
                    profile_data.get('email'),
                    profile_data.get('phone_number'),
                    profile_data.get('address'),
                    student_id
                ))
                conn.commit()
                return cursor.rowcount > 0

    def change_student_password(self, student_id, current_password, new_password):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # First verify current password
                cursor.execute("SELECT password FROM students WHERE id = %s", (student_id,))
                result = cursor.fetchone()
                if not result:
                    return False
                
                if not self.verify_password(current_password, result['password']):
                    return False
                
                # Update to new password
                hashed_new_password = self.hash_password(new_password)
                cursor.execute("""
                    UPDATE students SET 
                    password = %s, updated_at = NOW()
                    WHERE id = %s
                """, (hashed_new_password, student_id))
                conn.commit()
                return cursor.rowcount > 0

    # Course Enrollment operations
    def enroll_student_in_course(self, student_id, course_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    cursor.execute("""
                        INSERT INTO course_enrollments (student_id, course_id, enrollment_date, status)
                        VALUES (%s, %s, NOW(), 'Active')
                    """, (student_id, course_id))
                    conn.commit()
                    return True
                except Exception as e:
                    print(f"Error enrolling student: {e}")
                    conn.rollback()
                    return False

    def get_student_enrollments(self, student_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT ce.*, c.course_name, c.description, c.duration, c.level,
                           (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as module_count,
                           (SELECT COUNT(*) FROM lessons l 
                            JOIN modules m ON l.module_id = m.id 
                            WHERE m.course_id = c.id) as lesson_count
                    FROM course_enrollments ce
                    JOIN courses c ON ce.course_id = c.id
                    WHERE ce.student_id = %s AND ce.status = 'Active'
                    ORDER BY ce.enrollment_date DESC
                """, (student_id,))
                enrollments = cursor.fetchall()
                
                # Get modules and lessons for each enrolled course
                for enrollment in enrollments:
                    modules = self.get_modules_by_course(enrollment['course_id'])
                    enrollment['modules'] = modules
                
                return enrollments

    def is_student_enrolled(self, student_id, course_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id FROM course_enrollments 
                    WHERE student_id = %s AND course_id = %s AND status = 'Active'
                """, (student_id, course_id))
                return cursor.fetchone() is not None

    def update_enrollment_progress(self, student_id, course_id, completed_modules, study_time):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Calculate progress percentage based on completed modules
                cursor.execute("SELECT COUNT(*) as total FROM modules WHERE course_id = %s", (course_id,))
                total_modules = cursor.fetchone()['total']
                progress_percentage = (completed_modules / total_modules * 100) if total_modules > 0 else 0
                
                cursor.execute("""
                    UPDATE course_enrollments 
                    SET completed_modules = %s, total_study_time = %s, 
                        progress_percentage = %s, updated_at = NOW()
                    WHERE student_id = %s AND course_id = %s
                """, (completed_modules, study_time, progress_percentage, student_id, course_id))
                conn.commit()
                return cursor.rowcount > 0

    # Lesson Progress operations
    def get_lesson_progress(self, student_id, lesson_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM lesson_progress 
                    WHERE student_id = %s AND lesson_id = %s
                """, (student_id, lesson_id))
                return cursor.fetchone()

    def update_lesson_progress(self, student_id, lesson_id, current_page, total_pages):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                progress_percentage = (current_page / total_pages * 100) if total_pages > 0 else 0
                
                cursor.execute("""
                    INSERT INTO lesson_progress (student_id, lesson_id, current_page, total_pages, progress_percentage)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE 
                    current_page = VALUES(current_page),
                    total_pages = VALUES(total_pages),
                    progress_percentage = VALUES(progress_percentage),
                    last_viewed_at = NOW(),
                    updated_at = NOW()
                """, (student_id, lesson_id, current_page, total_pages, progress_percentage))
                conn.commit()
                return cursor.rowcount > 0

    def get_student_lesson_progress(self, student_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT lp.*, l.lesson_name, l.file_path, m.module_name, c.course_name
                    FROM lesson_progress lp
                    JOIN lessons l ON lp.lesson_id = l.id
                    JOIN modules m ON l.module_id = m.id
                    JOIN courses c ON m.course_id = c.id
                    WHERE lp.student_id = %s
                    ORDER BY lp.last_viewed_at DESC
                """, (student_id,))
                return cursor.fetchall()

    # Enhanced Course Progress Methods
    def get_course_progress(self, student_id, course_id):
        """Get detailed progress for a specific course"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT ce.*, c.course_name, c.description, c.duration, c.level,
                           (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as total_modules,
                           (SELECT COUNT(*) FROM lessons l 
                            JOIN modules m ON l.module_id = m.id 
                            WHERE m.course_id = c.id) as total_lessons
                    FROM course_enrollments ce
                    JOIN courses c ON ce.course_id = c.id
                    WHERE ce.student_id = %s AND ce.course_id = %s
                """, (student_id, course_id))
                return cursor.fetchone()

    def get_all_course_progress(self, student_id):
        """Get progress for all enrolled courses"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT ce.*, c.course_name, c.description, c.duration, c.level,
                           (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as total_modules,
                           (SELECT COUNT(*) FROM lessons l 
                            JOIN modules m ON l.module_id = m.id 
                            WHERE m.course_id = c.id) as total_lessons
                    FROM course_enrollments ce
                    JOIN courses c ON ce.course_id = c.id
                    WHERE ce.student_id = %s
                    ORDER BY ce.enrollment_date DESC
                """, (student_id,))
                return cursor.fetchall()

    def update_course_progress(self, student_id, course_id, completed_modules, study_time, status='Active'):
        """Update course progress with study time"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Get total modules for the course
                cursor.execute("SELECT COUNT(*) as total FROM modules WHERE course_id = %s", (course_id,))
                result = cursor.fetchone()
                total_modules = result['total'] if result else 0
                
                # Calculate progress percentage
                progress_percentage = (completed_modules / total_modules * 100) if total_modules > 0 else 0
                
                # Update enrollment with new progress and study time
                cursor.execute("""
                    UPDATE course_enrollments 
                    SET completed_modules = %s, 
                        progress_percentage = %s, 
                        total_study_time = total_study_time + %s,
                        status = %s,
                        updated_at = NOW()
                    WHERE student_id = %s AND course_id = %s
                """, (completed_modules, progress_percentage, study_time, status, student_id, course_id))
                conn.commit()
                return cursor.rowcount > 0

    def start_study_session(self, student_id, course_id, lesson_id=None):
        """Start a new study session"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO study_sessions (student_id, course_id, lesson_id, start_time)
                    VALUES (%s, %s, %s, NOW())
                """, (student_id, course_id, lesson_id))
                conn.commit()
                return cursor.lastrowid

    def end_study_session(self, session_id, study_time, completed_pages=0):
        """End a study session and update progress"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE study_sessions 
                    SET end_time = NOW(), 
                        study_time = %s,
                        completed_pages = %s
                    WHERE id = %s
                """, (study_time, completed_pages, session_id))
                conn.commit()
                return cursor.rowcount > 0

    def get_progress_analytics(self, student_id):
        """Get comprehensive progress analytics"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Get overall statistics
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_enrollments,
                        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_courses,
                        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_courses,
                        AVG(progress_percentage) as avg_progress,
                        SUM(total_study_time) as total_study_time
                    FROM course_enrollments 
                    WHERE student_id = %s
                """, (student_id,))
                overall_stats = cursor.fetchone()
                
                # Get study time by course
                cursor.execute("""
                    SELECT c.course_name, ce.total_study_time, ce.progress_percentage
                    FROM course_enrollments ce
                    JOIN courses c ON ce.course_id = c.id
                    WHERE ce.student_id = %s
                    ORDER BY ce.total_study_time DESC
                """, (student_id,))
                study_time_by_course = cursor.fetchall()
                
                # Get recent study sessions
                cursor.execute("""
                    SELECT ss.*, c.course_name, l.lesson_name
                    FROM study_sessions ss
                    JOIN courses c ON ss.course_id = c.id
                    LEFT JOIN lessons l ON ss.lesson_id = l.id
                    WHERE ss.student_id = %s
                    ORDER BY ss.start_time DESC
                    LIMIT 10
                """, (student_id,))
                recent_sessions = cursor.fetchall()
                
                return {
                    'overall_stats': overall_stats,
                    'study_time_by_course': study_time_by_course,
                    'recent_sessions': recent_sessions
                }

    # Feedback System Methods
    def submit_feedback(self, student_id, feedback_type, target_id, rating, comment, category):
        """Submit feedback for a course or lesson"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO feedback (student_id, feedback_type, target_id, rating, comment, category)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE 
                    rating = VALUES(rating),
                    comment = VALUES(comment),
                    category = VALUES(category),
                    updated_at = NOW()
                """, (student_id, feedback_type, target_id, rating, comment, category))
                conn.commit()
                return cursor.lastrowid

    def get_feedback(self, student_id, feedback_type, target_id):
        """Get specific feedback"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM feedback 
                    WHERE student_id = %s AND feedback_type = %s AND target_id = %s
                """, (student_id, feedback_type, target_id))
                return cursor.fetchone()

    def get_student_feedback(self, student_id):
        """Get all feedback for a student"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT f.*, 
                           CASE 
                               WHEN f.feedback_type = 'course' THEN c.course_name
                               WHEN f.feedback_type = 'lesson' THEN l.lesson_name
                           END as target_name
                    FROM feedback f
                    LEFT JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                    LEFT JOIN lessons l ON f.feedback_type = 'lesson' AND f.target_id = l.id
                    WHERE f.student_id = %s
                    ORDER BY f.created_at DESC
                """, (student_id,))
                return cursor.fetchall()

    def update_feedback(self, student_id, feedback_id, rating=None, comment=None):
        """Update existing feedback"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                update_fields = []
                params = []
                
                if rating is not None:
                    update_fields.append("rating = %s")
                    params.append(rating)
                
                if comment is not None:
                    update_fields.append("comment = %s")
                    params.append(comment)
                
                if not update_fields:
                    return False
                
                update_fields.append("updated_at = NOW()")
                params.extend([student_id, feedback_id])
                
                cursor.execute(f"""
                    UPDATE feedback 
                    SET {', '.join(update_fields)}
                    WHERE student_id = %s AND id = %s
                """, params)
                conn.commit()
                return cursor.rowcount > 0

    def delete_feedback(self, student_id, feedback_id):
        """Delete feedback"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM feedback 
                    WHERE student_id = %s AND id = %s
                """, (student_id, feedback_id))
                conn.commit()
                return cursor.rowcount > 0

    def get_feedback_analytics(self, student_id):
        """Get feedback analytics for a student"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Get overall stats
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_feedback,
                        AVG(rating) as avg_rating,
                        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
                        COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedback
                    FROM feedback 
                    WHERE student_id = %s
                """, (student_id,))
                overall_stats = cursor.fetchone()
                
                # Get category breakdown
                cursor.execute("""
                    SELECT 
                        category,
                        COUNT(*) as count,
                        AVG(rating) as avg_rating
                    FROM feedback 
                    WHERE student_id = %s
                    GROUP BY category
                    ORDER BY count DESC
                """, (student_id,))
                category_stats = cursor.fetchall()
                
                # Get recent feedback
                cursor.execute("""
                    SELECT 
                        f.*,
                        CASE 
                            WHEN f.feedback_type = 'course' THEN c.course_name
                            WHEN f.feedback_type = 'lesson' THEN l.lesson_name
                        END as target_name
                    FROM feedback f
                    LEFT JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                    LEFT JOIN lessons l ON f.feedback_type = 'lesson' AND f.target_id = l.id
                    WHERE f.student_id = %s
                    ORDER BY f.created_at DESC
                    LIMIT 10
                """, (student_id,))
                recent_feedback = cursor.fetchall()
                
                return {
                    'overall_stats': overall_stats,
                    'category_stats': category_stats,
                    'recent_feedback': recent_feedback
                }

    # Instructor Feedback Management Methods
    def get_instructor_feedback(self, instructor_id, feedback_type=None, course_id=None, category=None, rating=None):
        """Get all feedback for courses taught by the instructor"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Build the query with filters
                query = """
                    SELECT 
                        f.*,
                        s.student_name,
                        s.username,
                        s.email,
                        CASE 
                            WHEN f.feedback_type = 'course' THEN c.course_name
                            WHEN f.feedback_type = 'lesson' THEN l.lesson_name
                        END as target_name,
                        c.course_name as course_name,
                        m.module_name,
                        l.lesson_name
                    FROM feedback f
                    JOIN students s ON f.student_id = s.id
                    LEFT JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                    LEFT JOIN lessons l ON f.feedback_type = 'lesson' AND f.target_id = l.id
                    LEFT JOIN modules m ON l.module_id = m.id
                    WHERE c.instructor_id = %s
                """
                params = [instructor_id]
                
                if feedback_type:
                    query += " AND f.feedback_type = %s"
                    params.append(feedback_type)
                
                if course_id:
                    query += " AND c.id = %s"
                    params.append(course_id)
                
                if category:
                    query += " AND f.category = %s"
                    params.append(category)
                
                if rating:
                    query += " AND f.rating = %s"
                    params.append(rating)
                
                query += " ORDER BY f.created_at DESC"
                
                cursor.execute(query, params)
                return cursor.fetchall()

    def get_instructor_feedback_analytics(self, instructor_id):
        """Get comprehensive feedback analytics for instructor's courses"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Overall feedback stats
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_feedback,
                        AVG(rating) as avg_rating,
                        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
                        COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedback,
                        COUNT(CASE WHEN rating = 3 THEN 1 END) as neutral_feedback
                    FROM feedback f
                    JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                    WHERE c.instructor_id = %s
                """, (instructor_id,))
                overall_stats = cursor.fetchone()
                
                # Feedback by category
                cursor.execute("""
                    SELECT 
                        f.category,
                        COUNT(*) as count,
                        AVG(f.rating) as avg_rating,
                        COUNT(CASE WHEN f.rating >= 4 THEN 1 END) as positive_count,
                        COUNT(CASE WHEN f.rating <= 2 THEN 1 END) as negative_count
                    FROM feedback f
                    JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                    WHERE c.instructor_id = %s
                    GROUP BY f.category
                    ORDER BY count DESC
                """, (instructor_id,))
                category_stats = cursor.fetchall()
                
                # Feedback by course
                cursor.execute("""
                    SELECT 
                        c.id as course_id,
                        c.course_name,
                        COUNT(f.id) as feedback_count,
                        AVG(f.rating) as avg_rating,
                        COUNT(CASE WHEN f.rating >= 4 THEN 1 END) as positive_count,
                        COUNT(CASE WHEN f.rating <= 2 THEN 1 END) as negative_count
                    FROM courses c
                    LEFT JOIN feedback f ON f.feedback_type = 'course' AND f.target_id = c.id
                    WHERE c.instructor_id = %s
                    GROUP BY c.id, c.course_name
                    ORDER BY feedback_count DESC
                """, (instructor_id,))
                course_stats = cursor.fetchall()
                
                # Recent feedback with student details
                cursor.execute("""
                    SELECT 
                        f.*,
                        s.student_name,
                        s.username,
                        c.course_name,
                        l.lesson_name
                    FROM feedback f
                    JOIN students s ON f.student_id = s.id
                    LEFT JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                    LEFT JOIN lessons l ON f.feedback_type = 'lesson' AND f.target_id = l.id
                    WHERE c.instructor_id = %s
                    ORDER BY f.created_at DESC
                    LIMIT 20
                """, (instructor_id,))
                recent_feedback = cursor.fetchall()
                
                # Rating distribution
                cursor.execute("""
                    SELECT 
                        rating,
                        COUNT(*) as count
                    FROM feedback f
                    JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                    WHERE c.instructor_id = %s
                    GROUP BY rating
                    ORDER BY rating DESC
                """, (instructor_id,))
                rating_distribution = cursor.fetchall()
                
                return {
                    'overall_stats': overall_stats,
                    'category_stats': category_stats,
                    'course_stats': course_stats,
                    'recent_feedback': recent_feedback,
                    'rating_distribution': rating_distribution
                }

    def get_instructor_feedback_summary(self, instructor_id):
        """Get feedback summary for instructor's courses"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Get summary by month for the last 12 months
                cursor.execute("""
                    SELECT 
                        DATE_FORMAT(f.created_at, '%Y-%m') as month,
                        COUNT(*) as feedback_count,
                        AVG(f.rating) as avg_rating,
                        COUNT(CASE WHEN f.rating >= 4 THEN 1 END) as positive_count
                    FROM feedback f
                    JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                    WHERE c.instructor_id = %s 
                    AND f.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                    GROUP BY DATE_FORMAT(f.created_at, '%Y-%m')
                    ORDER BY month DESC
                """, (instructor_id,))
                monthly_trends = cursor.fetchall()
                
                # Get top performing courses
                cursor.execute("""
                    SELECT 
                        c.course_name,
                        AVG(f.rating) as avg_rating,
                        COUNT(f.id) as feedback_count
                    FROM courses c
                    LEFT JOIN feedback f ON f.feedback_type = 'course' AND f.target_id = c.id
                    WHERE c.instructor_id = %s
                    GROUP BY c.id, c.course_name
                    HAVING feedback_count > 0
                    ORDER BY avg_rating DESC
                    LIMIT 5
                """, (instructor_id,))
                top_courses = cursor.fetchall()
                
                # Get areas for improvement
                cursor.execute("""
                    SELECT 
                        f.category,
                        AVG(f.rating) as avg_rating,
                        COUNT(*) as feedback_count
                    FROM feedback f
                    JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                    WHERE c.instructor_id = %s
                    GROUP BY f.category
                    HAVING avg_rating < 4.0
                    ORDER BY avg_rating ASC
                """, (instructor_id,))
                improvement_areas = cursor.fetchall()
                
                return {
                    'monthly_trends': monthly_trends,
                    'top_courses': top_courses,
                    'improvement_areas': improvement_areas
                }

    def export_instructor_feedback(self, instructor_id):
        """Export feedback data for instructor's courses"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        f.id,
                        f.feedback_type,
                        f.rating,
                        f.category,
                        f.comment,
                        f.created_at,
                        f.updated_at,
                        s.student_name,
                        s.username,
                        s.email,
                        c.course_name,
                        l.lesson_name,
                        m.module_name
                    FROM feedback f
                    JOIN students s ON f.student_id = s.id
                    LEFT JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                    LEFT JOIN lessons l ON f.feedback_type = 'lesson' AND f.target_id = l.id
                    LEFT JOIN modules m ON l.module_id = m.id
                    WHERE c.instructor_id = %s
                    ORDER BY f.created_at DESC
                """, (instructor_id,))
                return cursor.fetchall()

    # Course CRUD operations
    def get_all_courses(self):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # First get all courses
                cursor.execute("SELECT * FROM courses ORDER BY created_at DESC")
                courses = cursor.fetchall()
                
                # Then get module and lesson counts for each course
                for course in courses:
                    # Get module count
                    cursor.execute("SELECT COUNT(*) as count FROM modules WHERE course_id = %s", (course['id'],))
                    module_result = cursor.fetchone()
                    course['module_count'] = module_result['count'] if module_result else 0
                    
                    # Get lesson count
                    cursor.execute("""
                        SELECT COUNT(*) as count 
                        FROM lessons l 
                        JOIN modules m ON l.module_id = m.id 
                        WHERE m.course_id = %s
                    """, (course['id'],))
                    lesson_result = cursor.fetchone()
                    course['lesson_count'] = lesson_result['count'] if lesson_result else 0
                
                return courses

    def get_course_by_id(self, course_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM courses WHERE id = %s", (course_id,))
                return cursor.fetchone()

    def create_course(self, course_data):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO courses (course_name, description, duration, level, status)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    course_data['course_name'],
                    course_data.get('description', ''),
                    course_data.get('duration', ''),
                    course_data.get('level', 'Beginner'),
                    course_data.get('status', 'Active')
                ))
                conn.commit()
                return cursor.lastrowid

    def update_course(self, course_id, course_data):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE courses SET 
                    course_name = %s, description = %s, duration = %s, 
                    level = %s, status = %s, updated_at = NOW()
                    WHERE id = %s
                """, (
                    course_data['course_name'],
                    course_data.get('description', ''),
                    course_data.get('duration', ''),
                    course_data.get('level', 'Beginner'),
                    course_data.get('status', 'Active'),
                    course_id
                ))
                conn.commit()
                return cursor.rowcount > 0

    def delete_course(self, course_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM courses WHERE id = %s", (course_id,))
                conn.commit()
                return cursor.rowcount > 0

    # Module CRUD operations
    def get_all_modules(self):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT m.*, c.course_name 
                    FROM modules m 
                    JOIN courses c ON m.course_id = c.id 
                    ORDER BY m.course_id, m.id
                """)
                return cursor.fetchall()

    def get_modules_by_course(self, course_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # First get all modules for the course
                cursor.execute("""
                    SELECT m.*, c.course_name
                    FROM modules m 
                    JOIN courses c ON m.course_id = c.id 
                    WHERE m.course_id = %s 
                    ORDER BY m.id
                """, (course_id,))
                modules = cursor.fetchall()
                
                # Then get lessons for each module
                for module in modules:
                    lessons = self.get_lessons_by_module(module['id'])
                    module['lessons'] = lessons
                    module['lesson_count'] = len(lessons) if lessons else 0
                
                return modules

    def get_module_by_id(self, module_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT m.*, c.course_name 
                    FROM modules m 
                    JOIN courses c ON m.course_id = c.id 
                    WHERE m.id = %s
                """, (module_id,))
                return cursor.fetchone()

    def create_module(self, module_data):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO modules (module_name, course_id, description, status)
                    VALUES (%s, %s, %s, %s)
                """, (
                    module_data['module_name'],
                    module_data['course_id'],
                    module_data.get('description', ''),
                    module_data.get('status', 'Active')
                ))
                conn.commit()
                return cursor.lastrowid

    def update_module(self, module_id, module_data):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE modules SET 
                    module_name = %s, course_id = %s, description = %s, 
                    status = %s, updated_at = NOW()
                    WHERE id = %s
                """, (
                    module_data['module_name'],
                    module_data['course_id'],
                    module_data.get('description', ''),
                    module_data.get('status', 'Active'),
                    module_id
                ))
                conn.commit()
                return cursor.rowcount > 0

    def delete_module(self, module_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM modules WHERE id = %s", (module_id,))
                conn.commit()
                return cursor.rowcount > 0

    # Dashboard statistics
    def get_dashboard_stats(self):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Get counts
                cursor.execute("SELECT COUNT(*) as count FROM instructors")
                instructors_count = cursor.fetchone()['count']

                cursor.execute("SELECT COUNT(*) as count FROM students")
                students_count = cursor.fetchone()['count']

                cursor.execute("SELECT COUNT(*) as count FROM courses")
                courses_count = cursor.fetchone()['count']

                cursor.execute("SELECT COUNT(*) as count FROM modules")
                modules_count = cursor.fetchone()['count']

                # Get recent activities
                cursor.execute("""
                    SELECT 'instructor' as type, instructor_name as name, created_at 
                    FROM instructors 
                    ORDER BY created_at DESC LIMIT 5
                """)
                recent_instructors = cursor.fetchall()

                cursor.execute("""
                    SELECT 'student' as type, student_name as name, created_at 
                    FROM students 
                    ORDER BY created_at DESC LIMIT 5
                """)
                recent_students = cursor.fetchall()

                # Combine recent activities
                recent_activities = []
                for instructor in recent_instructors:
                    recent_activities.append({
                        'action': f"New instructor '{instructor['name']}' added",
                        'time': instructor['created_at'].strftime('%Y-%m-%d %H:%M') if instructor['created_at'] else 'Unknown'
                    })
                
                for student in recent_students:
                    recent_activities.append({
                        'action': f"New student '{student['name']}' added",
                        'time': student['created_at'].strftime('%Y-%m-%d %H:%M') if student['created_at'] else 'Unknown'
                    })

                # Sort by time (most recent first)
                recent_activities.sort(key=lambda x: x['time'], reverse=True)
                recent_activities = recent_activities[:5]  # Keep only 5 most recent

                return {
                    'stats': {
                        'total_instructors': instructors_count,
                        'total_students': students_count,
                        'total_courses': courses_count,
                        'total_modules': modules_count
                    },
                    'recent_activities': recent_activities
                }

    # Lesson operations
    def get_lessons_by_module(self, module_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    # Try to use status column if it exists
                    cursor.execute("""
                        SELECT *, 
                               COALESCE(total_slides, 10) as total_slides
                        FROM lessons 
                        WHERE module_id = %s
                        ORDER BY id
                    """, (module_id,))
                    return cursor.fetchall()
                except Exception as e:
                    # Fallback if status column doesn't exist
                    cursor.execute("""
                        SELECT *, 
                               COALESCE(total_slides, 10) as total_slides
                        FROM lessons 
                        WHERE module_id = %s
                        ORDER BY id
                    """, (module_id,))
                    return cursor.fetchall()

    def get_lesson_by_id(self, lesson_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM lessons WHERE id = %s", (lesson_id,))
                return cursor.fetchone()

    def delete_lesson(self, lesson_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM lessons WHERE id = %s", (lesson_id,))
                conn.commit()
                return cursor.rowcount > 0

    def create_lesson(self, lesson_data):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO lessons (
                        lesson_name, module_id, file_path, file_name, 
                        file_type, file_size, description, total_slides, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    lesson_data['lesson_name'],
                    lesson_data['module_id'],
                    lesson_data['file_path'],
                    lesson_data['file_name'],
                    lesson_data['file_type'],
                    lesson_data['file_size'],
                    lesson_data.get('description', ''),
                    lesson_data.get('total_slides', 10),
                    lesson_data.get('status', 'Active')
                ))
                conn.commit()
                return cursor.lastrowid

    # Quiz operations
    def save_quiz_result(self, student_id, lesson_id, module_id, course_id, 
                        total_questions, correct_answers, time_taken_seconds, 
                        question_responses):
        """Save quiz result and individual question responses"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    # Calculate score percentage
                    score_percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
                    
                    # Insert quiz result with timestamp
                    cursor.execute("""
                        INSERT INTO quiz_results (
                            student_id, lesson_id, module_id, course_id,
                            total_questions, correct_answers, score_percentage,
                            time_taken_seconds, completed_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    """, (
                        student_id, lesson_id, module_id, course_id,
                        total_questions, correct_answers, score_percentage,
                        time_taken_seconds
                    ))
                    
                    quiz_result_id = cursor.lastrowid
                    
                    # Insert question responses
                    for response in question_responses:
                        cursor.execute("""
                            INSERT INTO quiz_question_responses (
                                quiz_result_id, question_number, student_answer,
                                correct_answer, is_correct
                            ) VALUES (%s, %s, %s, %s, %s)
                        """, (
                            quiz_result_id,
                            response['question_number'],
                            response['student_answer'],
                            response['correct_answer'],
                            response['is_correct']
                        ))
                    
                    conn.commit()
                    print(f"Quiz result saved successfully: ID={quiz_result_id}, Score={correct_answers}/{total_questions}, Percentage={score_percentage}%")
                    return quiz_result_id
                    
                except Exception as e:
                    print(f"Error saving quiz result: {e}")
                    conn.rollback()
                    return None

    def get_student_quiz_history(self, student_id):
        """Get quiz history for a student with lesson, module, and course details"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        qr.id,
                        qr.total_questions,
                        qr.correct_answers,
                        qr.score_percentage,
                        qr.time_taken_seconds,
                        qr.completed_at,
                        l.lesson_name,
                        m.module_name,
                        c.course_name
                    FROM quiz_results qr
                    JOIN lessons l ON qr.lesson_id = l.id
                    JOIN modules m ON qr.module_id = m.id
                    JOIN courses c ON qr.course_id = c.id
                    WHERE qr.student_id = %s
                    ORDER BY qr.completed_at DESC
                """, (student_id,))
                return cursor.fetchall()

    def get_student_quiz_stats(self, student_id):
        """Get quiz statistics for a student"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_quizzes,
                        AVG(score_percentage) as average_score,
                        MAX(score_percentage) as best_score,
                        SUM(time_taken_seconds) as total_time
                    FROM quiz_results
                    WHERE student_id = %s
                """, (student_id,))
                return cursor.fetchone()

    def get_lesson_quiz_stats(self, lesson_id):
        """Get quiz statistics for a specific lesson"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_attempts,
                        AVG(score_percentage) as average_score,
                        MIN(score_percentage) as lowest_score,
                        MAX(score_percentage) as highest_score
                    FROM quiz_results
                    WHERE lesson_id = %s
                """, (lesson_id,))
                return cursor.fetchone()

    def get_instructor_students(self, instructor_id):
        """Get all students enrolled in courses taught by a specific instructor"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT DISTINCT
                        s.id,
                        s.student_name,
                        s.email,
                        s.phone_number,
                        c.course_name,
                        ce.enrollment_date,
                        ce.status as enrollment_status,
                        ce.progress_percentage,
                        ce.completed_modules,
                        ce.total_study_time,
                        (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as total_modules
                    FROM students s
                    JOIN course_enrollments ce ON s.id = ce.student_id
                    JOIN courses c ON ce.course_id = c.id
                    WHERE c.instructor_id = %s AND ce.status = 'Active'
                    ORDER BY c.course_name, s.student_name
                """, (instructor_id,))
                return cursor.fetchall()

    def get_instructor_student_stats(self, instructor_id):
        """Get statistics about students for an instructor"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COUNT(DISTINCT s.id) as total_students,
                        COUNT(DISTINCT c.id) as total_courses,
                        AVG(ce.progress_percentage) as avg_progress,
                        SUM(ce.total_study_time) as total_study_time
                    FROM students s
                    JOIN course_enrollments ce ON s.id = ce.student_id
                    JOIN courses c ON ce.course_id = c.id
                    WHERE c.instructor_id = %s AND ce.status = 'Active'
                """, (instructor_id,))
                return cursor.fetchone()

    # Message operations
    def send_message(self, sender_id, sender_type, receiver_id, receiver_type, subject, message, message_type='general', parent_message_id=None):
        """Send a new message"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, subject, message, message_type, parent_message_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (sender_id, sender_type, receiver_id, receiver_type, subject, message, message_type, parent_message_id))
                conn.commit()
                return cursor.lastrowid

    def get_messages_for_user(self, user_id, user_type, limit=50):
        """Get messages for a specific user (inbox)"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        m.*,
                        CASE 
                            WHEN m.sender_type = 'student' THEN s.student_name
                            WHEN m.sender_type = 'admin' THEN 'Admin'
                        END as sender_name,
                        CASE 
                            WHEN m.receiver_type = 'student' THEN s2.student_name
                            WHEN m.receiver_type = 'admin' THEN 'Admin'
                        END as receiver_name
                    FROM messages m
                    LEFT JOIN students s ON m.sender_id = s.id AND m.sender_type = 'student'
                    LEFT JOIN students s2 ON m.receiver_id = s2.id AND m.receiver_type = 'student'
                    WHERE m.receiver_id = %s AND m.receiver_type = %s
                    ORDER BY m.created_at DESC
                    LIMIT %s
                """, (user_id, user_type, limit))
                return cursor.fetchall()

    def get_sent_messages(self, user_id, user_type, limit=50):
        """Get messages sent by a specific user"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        m.*,
                        CASE 
                            WHEN m.receiver_type = 'student' THEN s.student_name
                            WHEN m.receiver_type = 'admin' THEN 'Admin'
                        END as receiver_name
                    FROM messages m
                    LEFT JOIN students s ON m.receiver_id = s.id AND m.receiver_type = 'student'
                    WHERE m.sender_id = %s AND m.sender_type = %s
                    ORDER BY m.created_at DESC
                    LIMIT %s
                """, (user_id, user_type, limit))
                return cursor.fetchall()

    def get_message_thread(self, message_id):
        """Get a message and all its replies"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # First get the parent message
                cursor.execute("""
                    SELECT 
                        m.*,
                        CASE 
                            WHEN m.sender_type = 'student' THEN s.student_name
                            WHEN m.sender_type = 'admin' THEN 'Admin'
                        END as sender_name,
                        CASE 
                            WHEN m.receiver_type = 'student' THEN s2.student_name
                            WHEN m.receiver_type = 'admin' THEN 'Admin'
                        END as receiver_name
                    FROM messages m
                    LEFT JOIN students s ON m.sender_id = s.id AND m.sender_type = 'student'
                    LEFT JOIN students s2 ON m.receiver_id = s2.id AND m.receiver_type = 'student'
                    WHERE m.id = %s
                """, (message_id,))
                parent_message = cursor.fetchone()
                
                if not parent_message:
                    return None
                
                # Get all replies
                cursor.execute("""
                    SELECT 
                        m.*,
                        CASE 
                            WHEN m.sender_type = 'student' THEN s.student_name
                            WHEN m.sender_type = 'admin' THEN 'Admin'
                        END as sender_name,
                        CASE 
                            WHEN m.receiver_type = 'student' THEN s2.student_name
                            WHEN m.receiver_type = 'admin' THEN 'Admin'
                        END as receiver_name
                    FROM messages m
                    LEFT JOIN students s ON m.sender_id = s.id AND m.sender_type = 'student'
                    LEFT JOIN students s2 ON m.receiver_id = s2.id AND m.receiver_type = 'student'
                    WHERE m.parent_message_id = %s
                    ORDER BY m.created_at ASC
                """, (message_id,))
                replies = cursor.fetchall()
                
                return {
                    'parent': parent_message,
                    'replies': replies
                }

    def mark_message_as_read(self, message_id):
        """Mark a message as read"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE messages SET status = 'read', updated_at = NOW()
                    WHERE id = %s
                """, (message_id,))
                conn.commit()
                return cursor.rowcount > 0

    def get_unread_message_count(self, user_id, user_type):
        """Get count of unread messages for a user"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*) as count
                    FROM messages
                    WHERE receiver_id = %s AND receiver_type = %s AND status = 'unread'
                """, (user_id, user_type))
                result = cursor.fetchone()
                return result['count'] if result else 0

    def get_all_students_for_admin(self):
        """Get all students for admin messaging"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, student_name, email, phone_number, created_at
                    FROM students
                    ORDER BY student_name
                """)
                return cursor.fetchall()

    def get_student_by_id(self, student_id):
        """Get student details by ID"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM students WHERE id = %s", (student_id,))
                return cursor.fetchone()

    def get_enrolled_courses(self, student_id):
        """Get courses that a student is enrolled in"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT c.*, ce.status, ce.progress_percentage, ce.enrollment_date as enrolled_date
                    FROM courses c
                    JOIN course_enrollments ce ON c.id = ce.course_id
                    WHERE ce.student_id = %s
                    ORDER BY ce.enrollment_date DESC
                """, (student_id,))
                return cursor.fetchall()

    def get_completed_courses(self, student_id):
        """Get courses completed by a student"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT c.* FROM courses c
                    JOIN course_enrollments ce ON c.id = ce.course_id
                    WHERE ce.student_id = %s AND ce.status = 'Completed'
                """, (student_id,))
                return cursor.fetchall()

    def get_all_courses(self):
        """Get all courses for AI analysis"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM courses ORDER BY id")
                return cursor.fetchall()

    def get_message_by_id(self, message_id):
        """Get a single message by ID"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        m.*,
                        CASE 
                            WHEN m.sender_type = 'student' THEN s.student_name
                            WHEN m.sender_type = 'admin' THEN 'Admin'
                        END as sender_name,
                        CASE 
                            WHEN m.receiver_type = 'student' THEN s2.student_name
                            WHEN m.receiver_type = 'admin' THEN 'Admin'
                        END as receiver_name
                    FROM messages m
                    LEFT JOIN students s ON m.sender_id = s.id AND m.sender_type = 'student'
                    LEFT JOIN students s2 ON m.receiver_id = s2.id AND m.receiver_type = 'student'
                    WHERE m.id = %s
                """, (message_id,))
                return cursor.fetchone()
