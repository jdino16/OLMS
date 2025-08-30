#!/usr/bin/env python3
"""
Script to add sample course enrollments to the database
"""

import pymysql
from pymysql import Error
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from config import DB_CONFIG

def add_sample_enrollments():
    """Add sample course enrollments to the database"""
    try:
        # Connect to the database
        connection = pymysql.connect(**DB_CONFIG)
        
        if connection:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            
            # Check if enrollments already exist
            cursor.execute("SELECT COUNT(*) as count FROM course_enrollments")
            result = cursor.fetchone()
            
            if result['count'] > 0:
                print("Sample enrollments already exist. Skipping...")
                return
            
            # Add sample enrollments
            enrollments = [
                (1, 1, '2024-01-15 10:00:00', 'Completed', 100.00, 3),
                (1, 2, '2024-02-01 14:30:00', 'Active', 60.00, 2),
                (2, 1, '2024-01-20 09:15:00', 'Completed', 100.00, 3),
                (2, 3, '2024-02-10 16:45:00', 'Active', 40.00, 1),
                (3, 1, '2024-01-25 11:20:00', 'Active', 80.00, 2),
                (4, 2, '2024-02-05 13:00:00', 'Active', 30.00, 1),
                (5, 1, '2024-01-30 15:30:00', 'Completed', 100.00, 3),
                (5, 3, '2024-02-15 10:45:00', 'Active', 20.00, 0)
            ]
            
            insert_query = """
                INSERT INTO course_enrollments 
                (student_id, course_id, enrollment_date, status, progress_percentage, completed_modules) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            
            cursor.executemany(insert_query, enrollments)
            connection.commit()
            
            print(f"Successfully added {len(enrollments)} sample enrollments to the database.")
            
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    add_sample_enrollments()
