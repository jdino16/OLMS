#!/usr/bin/env python3
"""
Script to add sample enrollments for IT courses
"""

import pymysql
import sys
import os
import random
from datetime import datetime, timedelta

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.config import Config

def add_sample_enrollments():
    """Add sample enrollments for IT courses"""
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
            
            # Get all students
            cursor.execute("SELECT id FROM students")
            students = cursor.fetchall()
            
            # Get all courses
            cursor.execute("SELECT id FROM courses")
            courses = cursor.fetchall()
            
            if not students or not courses:
                print("No students or courses found in database")
                return
            
            # Generate sample enrollments
            enrollments = []
            statuses = ['Active', 'Completed']
            
            for student in students:
                # Each student enrolls in 2-5 random courses
                num_enrollments = random.randint(2, 5)
                selected_courses = random.sample(courses, min(num_enrollments, len(courses)))
                
                for course in selected_courses:
                    status = random.choice(statuses)
                    progress = random.randint(20, 100) if status == 'Active' else 100
                    completed_modules = random.randint(1, 6) if status == 'Active' else 6
                    
                    # Random enrollment date within last 6 months
                    days_ago = random.randint(1, 180)
                    enrollment_date = datetime.now() - timedelta(days=days_ago)
                    
                    enrollments.append((
                        student['id'],
                        course['id'],
                        enrollment_date.strftime('%Y-%m-%d %H:%M:%S'),
                        status,
                        progress,
                        completed_modules
                    ))
            
            # Insert enrollments
            insert_query = """
                INSERT INTO course_enrollments 
                (student_id, course_id, enrollment_date, status, progress_percentage, completed_modules) 
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                status = VALUES(status),
                progress_percentage = VALUES(progress_percentage),
                completed_modules = VALUES(completed_modules)
            """
            
            cursor.executemany(insert_query, enrollments)
            connection.commit()
            
            print(f"Successfully added {len(enrollments)} sample enrollments to the database.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    add_sample_enrollments()
