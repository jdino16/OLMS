#!/usr/bin/env python3
"""
Simple Database Setup Script for OLMS
This script will create the database and populate it with sample data.
"""

import os
import sys
import subprocess

def run_sql_script():
    """Run the SQL script using mysql command line"""
    
    # Database configuration (update these as needed)
    DB_HOST = "localhost"
    DB_USER = "root"
    DB_PASSWORD = ""
    DB_NAME = "olms"
    
    # Path to the schema file
    schema_file = "database/schema.sql"
    
    if not os.path.exists(schema_file):
        print(f"❌ Error: Schema file not found at {schema_file}")
        return False
    
    try:
        # Build mysql command
        mysql_cmd = [
            "mysql",
            f"--host={DB_HOST}",
            f"--user={DB_USER}"
        ]
        
        if DB_PASSWORD:
            mysql_cmd.append(f"--password={DB_PASSWORD}")
        
        # Read the schema file
        with open(schema_file, 'r') as f:
            schema_content = f.read()
        
        # Run the mysql command
        print("🚀 Setting up OLMS Database...")
        print(f"📁 Using schema file: {schema_file}")
        
        result = subprocess.run(
            mysql_cmd,
            input=schema_content.encode(),
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Database setup completed successfully!")
            
            # Verify the setup by checking table counts
            verify_cmd = [
                "mysql",
                f"--host={DB_HOST}",
                f"--user={DB_USER}",
                f"--database={DB_NAME}",
                "--execute=SELECT 'admin' as table_name, COUNT(*) as count FROM admin UNION ALL SELECT 'instructors', COUNT(*) FROM instructors UNION ALL SELECT 'students', COUNT(*) FROM students UNION ALL SELECT 'courses', COUNT(*) FROM courses UNION ALL SELECT 'modules', COUNT(*) FROM modules;"
            ]
            
            if DB_PASSWORD:
                verify_cmd.insert(-2, f"--password={DB_PASSWORD}")
            
            verify_result = subprocess.run(verify_cmd, capture_output=True, text=True)
            
            if verify_result.returncode == 0:
                print("\n📊 Database Statistics:")
                lines = verify_result.stdout.strip().split('\n')
                for line in lines:
                    if line and not line.startswith('table_name'):
                        parts = line.split('\t')
                        if len(parts) == 2:
                            table_name, count = parts
                            print(f"   {table_name.capitalize()}: {count}")
            else:
                print("⚠️  Could not verify database statistics")
            
            return True
        else:
            print(f"❌ Error setting up database:")
            print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ Error: 'mysql' command not found")
        print("💡 Please make sure MySQL is installed and 'mysql' command is available in PATH")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main function"""
    print("🎯 OLMS Database Setup")
    print("=" * 40)
    
    success = run_sql_script()
    
    if success:
        print("\n🎉 Database setup complete!")
        print("💡 You can now start the application:")
        print("   Backend: cd backend && python app.py")
        print("   Frontend: cd frontend && npm start")
    else:
        print("\n❌ Database setup failed!")
        print("💡 Please check your MySQL installation and try again")

if __name__ == "__main__":
    main()
