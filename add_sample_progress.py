#!/usr/bin/env python3
"""
Script to add sample progress data to existing enrollments
"""

import pymysql
import sys
import os
import random
from datetime import datetime, timedelta

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.config import Config

def add_sample_progress():
    """Add sample progress data to existing enrollments"""
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
            
            print("Adding sample progress data to enrollments...")
            print("=" * 50)
            
            # Get all enrollments
            cursor.execute("""
                SELECT ce.*, c.course_name,
                       (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as total_modules
                FROM course_enrollments ce
                JOIN courses c ON ce.course_id = c.id
            """)
            enrollments = cursor.fetchall()
            
            print(f"Found {len(enrollments)} enrollments to update")
            
            for enrollment in enrollments:
                # Generate realistic progress data
                total_modules = enrollment['total_modules'] or 6  # Default to 6 if no modules found
                
                # For completed courses, set 100% progress
                if enrollment['status'] == 'Completed':
                    completed_modules = total_modules
                    progress_percentage = 100.0
                    study_time = random.randint(120, 480)  # 2-8 hours in minutes
                else:
                    # For active courses, set random progress between 10-90%
                    progress_percentage = random.randint(10, 90)
                    completed_modules = max(1, int((progress_percentage / 100) * total_modules))
                    study_time = random.randint(30, 240)  # 30 minutes to 4 hours
                
                # Update the enrollment with progress data
                cursor.execute("""
                    UPDATE course_enrollments 
                    SET completed_modules = %s,
                        progress_percentage = %s,
                        total_study_time = %s,
                        updated_at = NOW()
                    WHERE student_id = %s AND course_id = %s
                """, (completed_modules, progress_percentage, study_time, 
                      enrollment['student_id'], enrollment['course_id']))
                
                print(f"Updated {enrollment['course_name']}: {progress_percentage:.1f}% ({completed_modules}/{total_modules} modules), {study_time} minutes")
            
            # Add some sample study sessions
            print("\nAdding sample study sessions...")
            
            # Get some recent enrollments for study sessions
            cursor.execute("SELECT * FROM course_enrollments ORDER BY enrollment_date DESC LIMIT 10")
            recent_enrollments = cursor.fetchall()
            
            for enrollment in recent_enrollments:
                # Add 2-5 study sessions per enrollment
                num_sessions = random.randint(2, 5)
                
                for i in range(num_sessions):
                    # Random date within last 30 days
                    days_ago = random.randint(1, 30)
                    session_date = datetime.now() - timedelta(days=days_ago)
                    
                    # Random study time between 15-120 minutes
                    study_time = random.randint(15, 120)
                    
                    # Random start time during the day
                    start_hour = random.randint(9, 21)  # 9 AM to 9 PM
                    start_minute = random.randint(0, 59)
                    start_time = session_date.replace(hour=start_hour, minute=start_minute)
                    
                    # End time
                    end_time = start_time + timedelta(minutes=study_time)
                    
                    cursor.execute("""
                        INSERT INTO study_sessions 
                        (student_id, course_id, start_time, end_time, study_time, completed_pages)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (enrollment['student_id'], enrollment['course_id'], 
                          start_time.strftime('%Y-%m-%d %H:%M:%S'),
                          end_time.strftime('%Y-%m-%d %H:%M:%S'),
                          study_time, random.randint(1, 10)))
                
                print(f"Added {num_sessions} study sessions for enrollment {enrollment['id']}")
            
            connection.commit()
            print(f"\n✅ Successfully updated {len(enrollments)} enrollments with progress data!")
            print("✅ Added sample study sessions!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    add_sample_progress()
