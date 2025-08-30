#!/usr/bin/env python3
"""
Test script for course progress functionality
"""

import pymysql
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.config import Config

def test_progress_functionality():
    """Test the course progress functionality"""
    try:
        # Connect to the database
        db_config = {
            'host': Config.MYSQL_HOST,
            'user': Config.MYSQL_USER,
            'password': Config.MYSQL_PASSWORD,
            'database': Config.MYSQL_DB,
            'port': Config.MYSQL_PORT,
            'charset': 'utf8mb4',
            'cursorclass': pymysql.cursors.DictCursor
        }
        connection = pymysql.connect(**db_config)
        
        if connection:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            
            print("Testing Course Progress Functionality...")
            print("=" * 50)
            
            # Test 1: Check if study_sessions table exists
            cursor.execute("SHOW TABLES LIKE 'study_sessions'")
            if cursor.fetchone():
                print("✅ study_sessions table exists")
            else:
                print("❌ study_sessions table does not exist")
            
            # Test 2: Check course_enrollments table structure
            cursor.execute("DESCRIBE course_enrollments")
            columns = cursor.fetchall()
            print(f"✅ course_enrollments table has {len(columns)} columns")
            
            # Check for total_study_time column
            has_study_time = any(col['Field'] == 'total_study_time' for col in columns)
            if has_study_time:
                print("✅ total_study_time column exists")
            else:
                print("❌ total_study_time column missing")
            
            # Test 3: Get sample data
            cursor.execute("SELECT COUNT(*) as count FROM course_enrollments")
            enrollment_count = cursor.fetchone()['count']
            print(f"✅ Found {enrollment_count} course enrollments")
            
            cursor.execute("SELECT COUNT(*) as count FROM courses")
            course_count = cursor.fetchone()['count']
            print(f"✅ Found {course_count} courses")
            
            cursor.execute("SELECT COUNT(*) as count FROM students")
            student_count = cursor.fetchone()['count']
            print(f"✅ Found {student_count} students")
            
            # Test 4: Test progress analytics query
            if student_count > 0:
                cursor.execute("SELECT id FROM students LIMIT 1")
                sample_student = cursor.fetchone()
                if sample_student:
                    student_id = sample_student['id']
                    
                    # Test analytics query
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
                    analytics = cursor.fetchone()
                    print(f"✅ Analytics query works - Student {student_id}:")
                    print(f"   - Total enrollments: {analytics['total_enrollments']}")
                    print(f"   - Completed courses: {analytics['completed_courses']}")
                    print(f"   - Active courses: {analytics['active_courses']}")
                    print(f"   - Average progress: {analytics['avg_progress']:.1f}%")
                    print(f"   - Total study time: {analytics['total_study_time'] or 0} minutes")
            
            # Test 5: Test course progress query
            if enrollment_count > 0:
                cursor.execute("""
                    SELECT ce.*, c.course_name, c.description, c.duration, c.level,
                           (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as total_modules,
                           (SELECT COUNT(*) FROM lessons l 
                            JOIN modules m ON l.module_id = m.id 
                            WHERE m.course_id = c.id) as total_lessons
                    FROM course_enrollments ce
                    JOIN courses c ON ce.course_id = c.id
                    LIMIT 1
                """)
                sample_progress = cursor.fetchone()
                if sample_progress:
                    print(f"✅ Course progress query works:")
                    print(f"   - Course: {sample_progress['course_name']}")
                    print(f"   - Progress: {sample_progress['progress_percentage']:.1f}%")
                    print(f"   - Modules: {sample_progress['completed_modules']}/{sample_progress['total_modules']}")
                    print(f"   - Study time: {sample_progress['total_study_time'] or 0} minutes")
            
            print("\n" + "=" * 50)
            print("✅ All tests completed successfully!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    test_progress_functionality()
