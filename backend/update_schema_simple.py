#!/usr/bin/env python3
"""
Simple script to update the existing instructors table with approval fields
Update the database connection details below before running
"""

import pymysql

# Update these database connection details
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',  # Change to your MySQL username
    'password': '',   # Change to your MySQL password
    'database': 'olms',  # Change to your database name
    'port': 3306
}

def update_instructor_schema():
    try:
        # Connect to database
        print("Connecting to database...")
        conn = pymysql.connect(**DB_CONFIG)
        
        with conn.cursor() as cursor:
            # Check if approval_status column already exists
            cursor.execute("SHOW COLUMNS FROM instructors LIKE 'approval_status'")
            if cursor.fetchone():
                print("✅ Approval fields already exist in instructors table")
                return
            
            # Add approval fields
            print("🔧 Adding approval fields to instructors table...")
            
            # Add approval_status column
            cursor.execute("""
                ALTER TABLE instructors 
                ADD COLUMN approval_status ENUM('Pending', 'Approved', 'Rejected') 
                DEFAULT 'Pending' AFTER address
            """)
            print("✅ Added approval_status column")
            
            # Add approved_by column
            cursor.execute("""
                ALTER TABLE instructors 
                ADD COLUMN approved_by INT AFTER approval_status
            """)
            print("✅ Added approved_by column")
            
            # Add approved_at column
            cursor.execute("""
                ALTER TABLE instructors 
                ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by
            """)
            print("✅ Added approved_at column")
            
            # Set existing instructors as approved by default
            cursor.execute("""
                UPDATE instructors 
                SET approval_status = 'Approved' 
                WHERE approval_status IS NULL OR approval_status = 'Pending'
            """)
            print("✅ Set existing instructors to 'Approved' status")
            
            conn.commit()
            print("\n🎉 Successfully updated instructors table with approval fields!")
            print("📋 New columns added:")
            print("   - approval_status (Pending/Approved/Rejected)")
            print("   - approved_by (Admin ID who approved)")
            print("   - approved_at (Timestamp of approval)")
            print("\n🔄 Please restart your Flask backend to use the new features!")
            
    except Exception as e:
        print(f"❌ Error updating schema: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("🚀 Starting database schema update...")
    print("⚠️  Make sure to update the DB_CONFIG values above before running!")
    print("=" * 50)
    
    # Ask for confirmation
    confirm = input("Do you want to proceed with the database update? (y/N): ")
    if confirm.lower() in ['y', 'yes']:
        update_instructor_schema()
    else:
        print("❌ Update cancelled")
