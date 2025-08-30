#!/usr/bin/env python3
"""
Add Messages Table Migration Script
This script adds the messages table to the existing OLMS database.
"""

import pymysql
from config import DB_CONFIG

def add_messages_table():
    """Add the messages table to the database"""
    
    # SQL to create the messages table
    create_messages_table_sql = """
    CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        sender_type ENUM('student', 'admin') NOT NULL,
        receiver_id INT NOT NULL,
        receiver_type ENUM('student', 'admin') NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        message_type ENUM('issue', 'question', 'general', 'reply') DEFAULT 'general',
        status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
        parent_message_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sender (sender_id, sender_type),
        INDEX idx_receiver (receiver_id, receiver_type),
        INDEX idx_status (status),
        INDEX idx_parent (parent_message_id)
    )
    """
    
    try:
        # Connect to database
        connection = pymysql.connect(**DB_CONFIG)
        
        with connection.cursor() as cursor:
            print("🚀 Adding messages table to database...")
            
            # Create the messages table
            cursor.execute(create_messages_table_sql)
            
            # Check if table was created
            cursor.execute("SHOW TABLES LIKE 'messages'")
            if cursor.fetchone():
                print("✅ Messages table created successfully!")
                
                # Show table structure
                cursor.execute("DESCRIBE messages")
                columns = cursor.fetchall()
                print("\n📋 Messages table structure:")
                for column in columns:
                    print(f"   {column[0]} - {column[1]} ({column[2]})")
                
                return True
            else:
                print("❌ Failed to create messages table")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if 'connection' in locals():
            connection.close()

def main():
    """Main function"""
    print("🎯 OLMS Messages Table Migration")
    print("=" * 40)
    
    success = add_messages_table()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("💡 The messaging system should now work properly.")
    else:
        print("\n💥 Migration failed!")
        print("🔧 Please check the error messages above.")

if __name__ == "__main__":
    main()
