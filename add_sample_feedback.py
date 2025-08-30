#!/usr/bin/env python3
"""
Script to add sample feedback data
"""

import pymysql
import sys
import os
import random
from datetime import datetime, timedelta

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.config import Config

def add_sample_feedback():
    """Add sample feedback data"""
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
            
            print("Adding sample feedback data...")
            print("=" * 50)
            
            # Get students and courses
            cursor.execute("SELECT id FROM students LIMIT 5")
            students = cursor.fetchall()
            
            cursor.execute("SELECT id, course_name FROM courses LIMIT 10")
            courses = cursor.fetchall()
            
            cursor.execute("SELECT id, lesson_name FROM lessons LIMIT 15")
            lessons = cursor.fetchall()
            
            print(f"Found {len(students)} students, {len(courses)} courses, {len(lessons)} lessons")
            
            # Sample feedback comments
            course_comments = [
                "Great course! The content is well-structured and easy to follow.",
                "Excellent explanations and practical examples.",
                "The course covers all the important topics thoroughly.",
                "Good pace and clear instructions throughout.",
                "Very informative and engaging course material.",
                "The instructor explains complex concepts very well.",
                "Lots of hands-on practice opportunities.",
                "The course exceeded my expectations.",
                "Well-organized content with good progression.",
                "Highly recommended for beginners and intermediates."
            ]
            
            lesson_comments = [
                "Clear and concise explanation.",
                "Good practical examples provided.",
                "Easy to understand and follow along.",
                "The lesson was very helpful.",
                "Great introduction to the topic.",
                "Well-paced and informative.",
                "Good use of visual aids.",
                "The exercises were challenging but doable.",
                "Excellent step-by-step guidance.",
                "Very comprehensive coverage of the topic."
            ]
            
            categories = ['content', 'difficulty', 'instructor', 'technical', 'general']
            
            feedback_count = 0
            
            # Add course feedback
            for student in students:
                # Add 2-4 course feedback per student
                num_course_feedback = random.randint(2, 4)
                selected_courses = random.sample(courses, min(num_course_feedback, len(courses)))
                
                for course in selected_courses:
                    rating = random.randint(3, 5)  # Mostly positive ratings
                    category = random.choice(categories)
                    comment = random.choice(course_comments)
                    
                    cursor.execute("""
                        INSERT INTO feedback (student_id, feedback_type, target_id, rating, comment, category)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE 
                        rating = VALUES(rating),
                        comment = VALUES(comment),
                        category = VALUES(category),
                        updated_at = NOW()
                    """, (student['id'], 'course', course['id'], rating, comment, category))
                    
                    print(f"Added course feedback: {course['course_name']} - {rating} stars ({category})")
                    feedback_count += 1
            
            # Add lesson feedback
            for student in students:
                # Add 1-3 lesson feedback per student
                num_lesson_feedback = random.randint(1, 3)
                selected_lessons = random.sample(lessons, min(num_lesson_feedback, len(lessons)))
                
                for lesson in selected_lessons:
                    rating = random.randint(3, 5)  # Mostly positive ratings
                    category = random.choice(categories)
                    comment = random.choice(lesson_comments)
                    
                    cursor.execute("""
                        INSERT INTO feedback (student_id, feedback_type, target_id, rating, comment, category)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE 
                        rating = VALUES(rating),
                        comment = VALUES(comment),
                        category = VALUES(category),
                        updated_at = NOW()
                    """, (student['id'], 'lesson', lesson['id'], rating, comment, category))
                    
                    print(f"Added lesson feedback: {lesson['lesson_name']} - {rating} stars ({category})")
                    feedback_count += 1
            
            # Add some negative feedback for variety
            negative_comments = [
                "Could be more detailed in some sections.",
                "The pace was a bit too fast for me.",
                "Some concepts could be explained better.",
                "Would benefit from more examples.",
                "The difficulty level was higher than expected."
            ]
            
            for student in students[:2]:  # Only for first 2 students
                # Add 1 negative feedback per student
                course = random.choice(courses)
                rating = random.randint(1, 2)
                comment = random.choice(negative_comments)
                
                cursor.execute("""
                    INSERT INTO feedback (student_id, feedback_type, target_id, rating, comment, category)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE 
                    rating = VALUES(rating),
                    comment = VALUES(comment),
                    category = VALUES(category),
                    updated_at = NOW()
                """, (student['id'], 'course', course['id'], rating, comment, 'general'))
                
                print(f"Added negative feedback: {course['course_name']} - {rating} stars")
                feedback_count += 1
            
            connection.commit()
            print(f"\n✅ Successfully added {feedback_count} feedback entries!")
            
            # Show summary
            cursor.execute("SELECT COUNT(*) as total FROM feedback")
            total_feedback = cursor.fetchone()['total']
            print(f"Total feedback in database: {total_feedback}")
            
            cursor.execute("SELECT AVG(rating) as avg_rating FROM feedback")
            avg_rating = cursor.fetchone()['avg_rating']
            print(f"Average rating: {avg_rating:.2f}")
            
            cursor.execute("SELECT category, COUNT(*) as count FROM feedback GROUP BY category")
            category_stats = cursor.fetchall()
            print("Feedback by category:")
            for stat in category_stats:
                print(f"  - {stat['category']}: {stat['count']}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    add_sample_feedback()
