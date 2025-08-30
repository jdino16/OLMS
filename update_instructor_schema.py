#!/usr/bin/env python3
"""
Script to update the existing instructors table with approval fields
Run this script after updating the database.py file
"""

import pymysql
from config import Config

def update_instructor_schema():
    try:
        # Connect to database
        conn = pymysql.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DB,
            port=Config.MYSQL_PORT
        )
        
        with conn.cursor() as cursor:
            # Check if approval_status column already exists
            cursor.execute("SHOW COLUMNS FROM instructors LIKE 'approval_status'")
            if cursor.fetchone():
                print("Approval fields already exist in instructors table")
                return
            
            # Add approval fields
            print("Adding approval fields to instructors table...")
            
            # Add approval_status column
            cursor.execute("""
                ALTER TABLE instructors 
                ADD COLUMN approval_status ENUM('Pending', 'Approved', 'Rejected') 
                DEFAULT 'Pending' AFTER address
            """)
            
            # Add approved_by column
            cursor.execute("""
                ALTER TABLE instructors 
                ADD COLUMN approved_by INT AFTER approval_status
            """)
            
            # Add approved_at column
            cursor.execute("""
                ALTER TABLE instructors 
                ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by
            """)
            
            # Set existing instructors as approved by default
            cursor.execute("""
                UPDATE instructors 
                SET approval_status = 'Approved' 
                WHERE approval_status IS NULL OR approval_status = 'Pending'
            """)
            
            conn.commit()
            print("Successfully updated instructors table with approval fields")
            print("Existing instructors have been set to 'Approved' status")
            
    except Exception as e:
        print(f"Error updating schema: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    update_instructor_schema()
