#!/usr/bin/env python3
"""
Script to test the instructor feedback system functionality
"""

import pymysql
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.config import Config

def test_instructor_feedback():
    """Test the instructor feedback system"""
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
            
            print("Testing Instructor Feedback System...")
            print("=" * 50)
            
            # Test 1: Check if feedback table exists
            print("\n1. Checking feedback table structure...")
            cursor.execute("DESCRIBE feedback")
            columns = cursor.fetchall()
            print(f"✅ Feedback table has {len(columns)} columns:")
            for col in columns:
                print(f"   - {col['Field']}: {col['Type']} ({col['Null']})")
            
            # Test 2: Check if there are instructors with courses
            print("\n2. Checking instructors with courses...")
            cursor.execute("""
                SELECT i.id, i.instructor_name, COUNT(c.id) as course_count
                FROM instructors i
                LEFT JOIN courses c ON i.id = c.instructor_id
                GROUP BY i.id, i.instructor_name
                HAVING course_count > 0
            """)
            instructors = cursor.fetchall()
            print(f"✅ Found {len(instructors)} instructors with courses:")
            for instructor in instructors:
                print(f"   - {instructor['instructor_name']}: {instructor['course_count']} courses")
            
            # Test 3: Check if there are courses with feedback
            print("\n3. Checking courses with feedback...")
            cursor.execute("""
                SELECT c.id, c.course_name, i.instructor_name, COUNT(f.id) as feedback_count
                FROM courses c
                JOIN instructors i ON c.instructor_id = i.id
                LEFT JOIN feedback f ON f.feedback_type = 'course' AND f.target_id = c.id
                GROUP BY c.id, c.course_name, i.instructor_name
                HAVING feedback_count > 0
                ORDER BY feedback_count DESC
                LIMIT 5
            """)
            courses_with_feedback = cursor.fetchall()
            print(f"✅ Found {len(courses_with_feedback)} courses with feedback:")
            for course in courses_with_feedback:
                print(f"   - {course['course_name']} (by {course['instructor_name']}): {course['feedback_count']} feedback")
            
            # Test 4: Check feedback analytics for a specific instructor
            if instructors:
                test_instructor = instructors[0]
                print(f"\n4. Testing feedback analytics for {test_instructor['instructor_name']}...")
                
                # Overall stats
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_feedback,
                        AVG(rating) as avg_rating,
                        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
                        COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedback
                    FROM feedback f
                    JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                    WHERE c.instructor_id = %s
                """, (test_instructor['id'],))
                overall_stats = cursor.fetchone()
                
                if overall_stats['total_feedback'] > 0:
                    print(f"   ✅ Overall stats:")
                    print(f"      - Total feedback: {overall_stats['total_feedback']}")
                    print(f"      - Average rating: {overall_stats['avg_rating']:.2f}")
                    print(f"      - Positive feedback: {overall_stats['positive_feedback']}")
                    print(f"      - Negative feedback: {overall_stats['negative_feedback']}")
                    
                    # Category breakdown
                    cursor.execute("""
                        SELECT 
                            f.category,
                            COUNT(*) as count,
                            AVG(f.rating) as avg_rating
                        FROM feedback f
                        JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                        WHERE c.instructor_id = %s
                        GROUP BY f.category
                        ORDER BY count DESC
                    """, (test_instructor['id'],))
                    category_stats = cursor.fetchall()
                    
                    print(f"   ✅ Category breakdown:")
                    for category in category_stats:
                        print(f"      - {category['category']}: {category['count']} reviews, avg {category['avg_rating']:.2f}")
                else:
                    print(f"   ⚠️  No feedback found for {test_instructor['instructor_name']}")
            
            # Test 5: Check recent feedback with student details
            print("\n5. Checking recent feedback with student details...")
            cursor.execute("""
                SELECT 
                    f.*,
                    s.student_name,
                    s.username,
                    s.email,
                    c.course_name,
                    l.lesson_name
                FROM feedback f
                JOIN students s ON f.student_id = s.id
                LEFT JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                LEFT JOIN lessons l ON f.feedback_type = 'lesson' AND f.target_id = l.id
                ORDER BY f.created_at DESC
                LIMIT 3
            """)
            recent_feedback = cursor.fetchall()
            
            if recent_feedback:
                print(f"   ✅ Recent feedback:")
                for feedback in recent_feedback:
                    target_name = feedback['course_name'] or feedback['lesson_name'] or 'Unknown'
                    print(f"      - {feedback['student_name']} rated {target_name} {feedback['rating']}/5 ({feedback['category']})")
                    if feedback['comment']:
                        print(f"        Comment: {feedback['comment'][:50]}...")
            else:
                print("   ⚠️  No feedback found in the system")
            
            # Test 6: Check monthly trends
            print("\n6. Checking monthly feedback trends...")
            cursor.execute("""
                SELECT 
                    DATE_FORMAT(f.created_at, '%Y-%m') as month,
                    COUNT(*) as feedback_count,
                    AVG(f.rating) as avg_rating
                FROM feedback f
                JOIN courses c ON f.feedback_type = 'course' AND f.target_id = c.id
                WHERE f.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(f.created_at, '%Y-%m')
                ORDER BY month DESC
            """)
            monthly_trends = cursor.fetchall()
            
            if monthly_trends:
                print(f"   ✅ Monthly trends (last 6 months):")
                for trend in monthly_trends:
                    print(f"      - {trend['month']}: {trend['feedback_count']} feedback, avg {trend['avg_rating']:.2f}")
            else:
                print("   ⚠️  No monthly trends data available")
            
            print("\n" + "=" * 50)
            print("✅ Instructor Feedback System Test Completed!")
            
            # Summary
            cursor.execute("SELECT COUNT(*) as total_feedback FROM feedback")
            total_feedback = cursor.fetchone()['total_feedback']
            
            cursor.execute("SELECT COUNT(DISTINCT student_id) as unique_students FROM feedback")
            unique_students = cursor.fetchone()['unique_students']
            
            cursor.execute("SELECT COUNT(DISTINCT target_id) as unique_targets FROM feedback")
            unique_targets = cursor.fetchone()['unique_targets']
            
            print(f"\n📊 System Summary:")
            print(f"   - Total feedback entries: {total_feedback}")
            print(f"   - Unique students providing feedback: {unique_students}")
            print(f"   - Unique courses/lessons with feedback: {unique_targets}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("\nDatabase connection closed.")

if __name__ == "__main__":
    test_instructor_feedback()
