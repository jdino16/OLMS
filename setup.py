#!/usr/bin/env python3
"""
Setup script for Admin Dashboard Project
This script helps set up the project dependencies and configuration.
"""

import os
import subprocess
import sys

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def create_env_file():
    """Create .env file for backend"""
    env_content = """# Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=olms
MYSQL_PORT=3306

# Flask Configuration
SECRET_KEY=your-secret-key-change-this-in-production
DEBUG=True
"""
    
    backend_env_path = os.path.join('backend', '.env')
    if not os.path.exists(backend_env_path):
        with open(backend_env_path, 'w') as f:
            f.write(env_content)
        print("✅ Created backend/.env file")
    else:
        print("ℹ️  backend/.env file already exists")

def main():
    print("🚀 Setting up Admin Dashboard Project")
    print("=" * 50)
    
    # Check if Python is installed
    if not run_command("python --version", "Checking Python installation"):
        print("❌ Python is not installed or not in PATH")
        return False
    
    # Check if Node.js is installed
    if not run_command("node --version", "Checking Node.js installation"):
        print("❌ Node.js is not installed or not in PATH")
        return False
    
    # Check if npm is installed
    if not run_command("npm --version", "Checking npm installation"):
        print("❌ npm is not installed or not in PATH")
        return False
    
    # Create virtual environment for backend
    if not run_command("cd backend && python -m venv venv", "Creating Python virtual environment"):
        return False
    
    # Install backend dependencies
    if sys.platform == "win32":
        activate_cmd = "cd backend && venv\\Scripts\\activate && pip install -r requirements.txt"
    else:
        activate_cmd = "cd backend && source venv/bin/activate && pip install -r requirements.txt"
    
    if not run_command(activate_cmd, "Installing backend dependencies"):
        return False
    
    # Install frontend dependencies
    if not run_command("cd frontend && npm install", "Installing frontend dependencies"):
        return False
    
    # Create .env file
    create_env_file()
    
    print("\n" + "=" * 50)
    print("✅ Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Configure your MySQL database")
    print("2. Update backend/.env with your database credentials")
    print("3. Run database setup: mysql -u root -p < database/setup.sql")
    print("4. Start backend: cd backend && python app.py")
    print("5. Start frontend: cd frontend && npm start")
    print("\n🔑 Default admin credentials: admin / admin123")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
