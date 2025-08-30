#!/usr/bin/env python3
"""
Create Database Script for OLMS
This script will create the database, tables, and seed data.
"""

import pymysql
import hashlib

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'port': 3306,
    'database': 'olms'
}

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_database():
    """Create database and tables with seed data"""
    
    # Connect to MySQL server (without specifying database)
    try:
        connection = pymysql.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            port=DB_CONFIG['port']
        )
        
        with connection.cursor() as cursor:
            # Create database
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
            cursor.execute(f"USE {DB_CONFIG['database']}")
            print(f"✅ Database '{DB_CONFIG['database']}' created/selected successfully")
            
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
            print("✅ Admin table created")
            
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
            print("✅ Instructors table created")
            
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
            print("✅ Students table created")
            
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
            print("✅ Courses table created")
            
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
            print("✅ Modules table created")
            
            # Insert admin user
            admin_password = hash_password('admin123')
            cursor.execute("""
                INSERT IGNORE INTO admin (username, password) VALUES (%s, %s)
            """, ('admin', admin_password))
            print("✅ Admin user created")
            
            # Insert sample courses
            courses_data = [
                ('Web Development Fundamentals', 'Learn the basics of HTML, CSS, and JavaScript', '8 weeks', 'Beginner'),
                ('Advanced JavaScript', 'Master JavaScript ES6+ and modern frameworks', '10 weeks', 'Advanced'),
                ('Database Management', 'Learn SQL and database design principles', '6 weeks', 'Intermediate')
            ]
            
            for course in courses_data:
                cursor.execute("""
                    INSERT IGNORE INTO courses (course_name, description, duration, level) 
                    VALUES (%s, %s, %s, %s)
                """, course)
            print("✅ Sample courses inserted")
            
            # Insert sample modules
            modules_data = [
                ('HTML Basics', 1, 'Introduction to HTML structure and elements'),
                ('CSS Styling', 1, 'Learn CSS for styling web pages'),
                ('JavaScript Fundamentals', 1, 'Basic JavaScript programming concepts'),
                ('ES6 Features', 2, 'Modern JavaScript features and syntax'),
                ('React Framework', 2, 'Building user interfaces with React'),
                ('Database Design', 3, 'Understanding database relationships'),
                ('SQL Queries', 3, 'Writing efficient SQL queries')
            ]
            
            for module in modules_data:
                cursor.execute("""
                    INSERT IGNORE INTO modules (module_name, course_id, description) 
                    VALUES (%s, %s, %s)
                """, module)
            print("✅ Sample modules inserted")
            
            # Insert sample instructors
            instructor_password = hash_password('password123')
            instructors_data = [
                ('john.doe', 'John Doe', instructor_password, '1985-03-15', 'Male', '+1234567890', 'john.doe@example.com'),
                ('jane.smith', 'Jane Smith', instructor_password, '1990-07-22', 'Female', '+1234567891', 'jane.smith@example.com'),
                ('mike.wilson', 'Mike Wilson', instructor_password, '1988-11-08', 'Male', '+1234567892', 'mike.wilson@example.com')
            ]
            
            for instructor in instructors_data:
                cursor.execute("""
                    INSERT IGNORE INTO instructors (username, instructor_name, password, dob, gender, phone_number, email) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, instructor)
            print("✅ Sample instructors inserted")
            
            # Insert sample students
            student_password = hash_password('password123')
            students_data = [
                ('alice.johnson', 'Alice Johnson', student_password, '2000-05-12', 'Female', '+1234567893', 'alice.johnson@example.com'),
                ('bob.brown', 'Bob Brown', student_password, '1999-09-30', 'Male', '+1234567894', 'bob.brown@example.com'),
                ('carol.davis', 'Carol Davis', student_password, '2001-02-18', 'Female', '+1234567895', 'carol.davis@example.com'),
                ('david.miller', 'David Miller', student_password, '1998-12-03', 'Male', '+1234567896', 'david.miller@example.com'),
                ('emma.wilson', 'Emma Wilson', student_password, '2002-08-25', 'Female', '+1234567897', 'emma.wilson@example.com')
            ]
            
            for student in students_data:
                cursor.execute("""
                    INSERT IGNORE INTO students (username, student_name, password, dob, gender, phone_number, email) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, student)
            print("✅ Sample students inserted")
            
            connection.commit()
            print("✅ All data committed successfully!")
            
            # Verify data
            cursor.execute("SELECT COUNT(*) FROM admin")
            admin_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM instructors")
            instructors_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM students")
            students_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM courses")
            courses_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM modules")
            modules_count = cursor.fetchone()[0]
            
            print("\n📊 Database Statistics:")
            print(f"   Admin users: {admin_count}")
            print(f"   Instructors: {instructors_count}")
            print(f"   Students: {students_count}")
            print(f"   Courses: {courses_count}")
            print(f"   Modules: {modules_count}")
            
            print("\n🔑 Login Credentials:")
            print("   Admin: username=admin, password=admin123")
            print("   Instructor: username=john.doe, password=password123")
            print("   Student: username=alice.johnson, password=password123")
            
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False
    finally:
        if connection:
            connection.close()
    
    return True

if __name__ == "__main__":
    print("🚀 Creating OLMS Database...")
    print("=" * 50)
    
    success = create_database()
    
    if success:
        print("\n🎉 Database setup complete!")
        print("💡 You can now start the application:")
        print("   Backend: cd backend && python app.py")
        print("   Frontend: cd frontend && npm start")
    else:
        print("\n❌ Database setup failed!")
        print("💡 Please check your MySQL installation and try again")
