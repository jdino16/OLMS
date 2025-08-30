#!/usr/bin/env python3
"""
Script to reset the database with the new enrollment table schema
"""

import pymysql
import sys
import os

# Add backend directory to path so we can import config
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from config import Config

def reset_database():
    try:
        # Connect to MySQL server (without specifying database)
        conn = pymysql.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            port=Config.MYSQL_PORT
        )
        
        with conn.cursor() as cursor:
            # Drop existing database if it exists
            cursor.execute("DROP DATABASE IF EXISTS olms")
            print("Dropped existing database")
            
            # Create new database
            cursor.execute("CREATE DATABASE olms")
            print("Created new database")
            
            # Use the new database
            cursor.execute("USE olms")
            
            # Read and execute schema
            with open('database/schema.sql', 'r') as f:
                schema = f.read()
                
            # Split by semicolon and execute each statement
            statements = schema.split(';')
            for statement in statements:
                statement = statement.strip()
                if statement and not statement.startswith('--') and not statement.startswith('/*'):
                    try:
                        cursor.execute(statement)
                        print(f"Executed: {statement[:50]}...")
                    except Exception as e:
                        print(f"Error executing statement: {e}")
                        print(f"Statement: {statement}")
            
            conn.commit()
            print("Database reset completed successfully!")
            
    except Exception as e:
        print(f"Error resetting database: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    reset_database()
