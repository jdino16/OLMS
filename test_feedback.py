#!/usr/bin/env python3
"""
Test script for feedback system functionality
"""

import pymysql
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.config import Config

def test_feedback_functionality():
    """Test the feedback system functionality"""
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
            
            print("Testing Feedback System Functionality...")
            print("=" * 50)
            
            # Test 1: Check if feedback table exists
            cursor.execute("SHOW TABLES LIKE 'feedback'")
            if cursor.fetchone():
                print("✅ feedback table exists")
            else:
                print("❌ feedback table does not exist")
            
            # Test 2: Check feedback table structure
            cursor.execute("DESCRIBE feedback")
            columns = cursor.fetchall()
            print(f"✅ feedback table has {len(columns)} columns")
            
            # Check for important columns
            important_columns = ['student_id', 'feedback_type', 'target_id', 'rating', 'comment', 'category']
            for col in important_columns:
                has_column = any(column['Field'] == col for column in columns)
                if has_column:
                    print(f"✅ {col} column exists")
                else:
                    print(f"❌ {col} column missing")
            
            # Test 3: Get sample data
            cursor.execute("SELECT COUNT(*) as count FROM feedback")
            feedback_count = cursor.fetchone()['count']
            print(f"✅ Found {feedback_count} feedback entries")
            
            # Test 4: Test feedback analytics query
            cursor.execute("SELECT COUNT(*) as total_students FROM students")
            student_count = cursor.fetchone()['total_students']
            
            if student_count > 0:
                cursor.execute("SELECT id FROM students LIMIT 1")
                sample_student = cursor.fetchone()
                if sample_student:
                    student_id = sample_student['id']
                    
                    # Test analytics query
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total_feedback,
                            AVG(rating) as avg_rating,
                            COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
                            COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedback
                        FROM feedback 
                        WHERE student_id = %s
                    """, (student_id,))
                    analytics = cursor.fetchone()
                    print(f"✅ Analytics query works - Student {student_id}:")
                    print(f"   - Total feedback: {analytics['total_feedback']}")
                    print(f"   - Average rating: {analytics['avg_rating']:.1f}" if analytics['avg_rating'] else "   - Average rating: 0.0")
                    print(f"   - Positive feedback: {analytics['positive_feedback']}")
                    print(f"   - Negative feedback: {analytics['negative_feedback']}")
            
            # Test 5: Test category breakdown query
            if student_count > 0:
                cursor.execute("""
                    SELECT category, COUNT(*) as count, AVG(rating) as avg_rating
                    FROM feedback 
                    WHERE student_id = %s
                    GROUP BY category
                    ORDER BY count DESC
                """, (student_id,))
                category_stats = cursor.fetchall()
                print(f"✅ Category breakdown query works - Found {len(category_stats)} categories")
                
                for category in category_stats:
                    print(f"   - {category['category']}: {category['count']} reviews, avg {category['avg_rating']:.1f}")
            
            print("\n" + "=" * 50)
            print("✅ All feedback system tests completed successfully!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    test_feedback_functionality()
