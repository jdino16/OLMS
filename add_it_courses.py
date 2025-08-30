#!/usr/bin/env python3
"""
Script to add 50 IT-related courses and lessons to the database
"""

import pymysql
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.config import Config

def add_it_courses():
    """Add 50 IT-related courses to the database"""
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
            
            # IT Courses data
            courses = [
                # Programming Languages
                ("Python Programming", "Master Python from basics to advanced concepts", "12 weeks", "Beginner"),
                ("Java Development", "Learn Java programming and object-oriented design", "14 weeks", "Intermediate"),
                ("C++ Programming", "Advanced C++ programming and system development", "16 weeks", "Advanced"),
                ("C# and .NET", "Modern C# development with .NET framework", "10 weeks", "Intermediate"),
                ("Go Programming", "Learn Go language for cloud and microservices", "8 weeks", "Intermediate"),
                ("Rust Programming", "Systems programming with Rust", "12 weeks", "Advanced"),
                ("Swift Development", "iOS app development with Swift", "10 weeks", "Intermediate"),
                ("Kotlin for Android", "Android development with Kotlin", "12 weeks", "Intermediate"),
                
                # Web Development
                ("React.js Mastery", "Build modern web applications with React", "10 weeks", "Intermediate"),
                ("Vue.js Framework", "Progressive JavaScript framework for web apps", "8 weeks", "Intermediate"),
                ("Angular Development", "Enterprise web applications with Angular", "12 weeks", "Advanced"),
                ("Node.js Backend", "Server-side JavaScript with Node.js", "10 weeks", "Intermediate"),
                ("PHP Web Development", "Dynamic web applications with PHP", "8 weeks", "Beginner"),
                ("Ruby on Rails", "Rapid web development with Rails", "10 weeks", "Intermediate"),
                ("Django Framework", "Python web development with Django", "10 weeks", "Intermediate"),
                ("Flask Web Development", "Lightweight Python web framework", "8 weeks", "Intermediate"),
                
                # Database Technologies
                ("MySQL Database Design", "Relational database design and optimization", "8 weeks", "Intermediate"),
                ("PostgreSQL Advanced", "Advanced PostgreSQL features and administration", "10 weeks", "Advanced"),
                ("MongoDB NoSQL", "Document database with MongoDB", "8 weeks", "Intermediate"),
                ("Redis Caching", "In-memory data structure store", "6 weeks", "Intermediate"),
                ("Oracle Database", "Enterprise database management", "12 weeks", "Advanced"),
                ("SQL Server Administration", "Microsoft SQL Server management", "10 weeks", "Advanced"),
                
                # Cloud and DevOps
                ("AWS Cloud Practitioner", "Amazon Web Services fundamentals", "8 weeks", "Beginner"),
                ("Azure Cloud Services", "Microsoft Azure cloud platform", "10 weeks", "Intermediate"),
                ("Google Cloud Platform", "Google Cloud services and solutions", "10 weeks", "Intermediate"),
                ("Docker Containerization", "Container technology with Docker", "8 weeks", "Intermediate"),
                ("Kubernetes Orchestration", "Container orchestration with Kubernetes", "12 weeks", "Advanced"),
                ("Terraform Infrastructure", "Infrastructure as Code with Terraform", "10 weeks", "Advanced"),
                ("Jenkins CI/CD", "Continuous Integration and Deployment", "8 weeks", "Intermediate"),
                ("Git Version Control", "Source code management with Git", "6 weeks", "Beginner"),
                
                # Data Science and AI
                ("Machine Learning Basics", "Introduction to machine learning algorithms", "12 weeks", "Intermediate"),
                ("Deep Learning with Python", "Neural networks and deep learning", "14 weeks", "Advanced"),
                ("Data Analysis with Python", "Data manipulation and analysis", "10 weeks", "Intermediate"),
                ("R Programming for Data Science", "Statistical computing with R", "10 weeks", "Intermediate"),
                ("Big Data with Hadoop", "Distributed data processing", "12 weeks", "Advanced"),
                ("Apache Spark", "Fast data processing with Spark", "10 weeks", "Advanced"),
                ("Natural Language Processing", "Text processing and analysis", "12 weeks", "Advanced"),
                ("Computer Vision", "Image and video processing", "12 weeks", "Advanced"),
                
                # Cybersecurity
                ("Cybersecurity Fundamentals", "Basic security concepts and practices", "10 weeks", "Beginner"),
                ("Ethical Hacking", "Penetration testing and security assessment", "12 weeks", "Advanced"),
                ("Network Security", "Securing network infrastructure", "10 weeks", "Intermediate"),
                ("Cryptography", "Encryption and security protocols", "12 weeks", "Advanced"),
                ("Security Auditing", "Security assessment and compliance", "10 weeks", "Advanced"),
                ("Incident Response", "Security incident handling", "8 weeks", "Intermediate"),
                
                # Mobile Development
                ("React Native", "Cross-platform mobile development", "10 weeks", "Intermediate"),
                ("Flutter Development", "Google's UI toolkit for mobile apps", "10 weeks", "Intermediate"),
                ("Xamarin Development", "Cross-platform C# mobile development", "10 weeks", "Intermediate"),
                ("Mobile App Security", "Securing mobile applications", "8 weeks", "Intermediate"),
                
                # System Administration
                ("Linux Administration", "Linux system administration", "10 weeks", "Intermediate"),
                ("Windows Server", "Windows server administration", "10 weeks", "Intermediate"),
                ("Network Administration", "Network infrastructure management", "12 weeks", "Intermediate"),
                ("Virtualization", "VMware and Hyper-V technologies", "8 weeks", "Intermediate"),
                
                # Software Engineering
                ("Software Architecture", "Designing scalable software systems", "12 weeks", "Advanced"),
                ("Design Patterns", "Software design patterns and best practices", "10 weeks", "Advanced"),
                ("Test-Driven Development", "TDD methodology and practices", "8 weeks", "Intermediate"),
                ("Agile Development", "Agile methodologies and practices", "6 weeks", "Beginner"),
                ("Microservices Architecture", "Building microservices applications", "12 weeks", "Advanced"),
                ("API Design", "RESTful API design and development", "8 weeks", "Intermediate"),
                ("GraphQL Development", "Modern API development with GraphQL", "8 weeks", "Intermediate")
            ]
            
            # Insert courses
            for course_name, description, duration, level in courses:
                cursor.execute("""
                    INSERT INTO courses (course_name, description, duration, level, status)
                    VALUES (%s, %s, %s, %s, 'Active')
                """, (course_name, description, duration, level))
            
            connection.commit()
            print(f"Successfully added {len(courses)} IT courses to the database.")
            
            # Get all course IDs for adding lessons
            cursor.execute("SELECT id, course_name FROM courses ORDER BY id")
            all_courses = cursor.fetchall()
            
            # Add modules and lessons for each course
            for course in all_courses:
                add_course_modules_and_lessons(cursor, course)
            
            connection.commit()
            print("Successfully added modules and lessons for all courses.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("Database connection closed.")

def add_course_modules_and_lessons(cursor, course):
    """Add modules and lessons for a specific course"""
    course_id = course['id']
    course_name = course['course_name']
    
    # Define modules based on course type
    modules = get_course_modules(course_name)
    
    for module_name, module_description in modules:
        # Insert module
        cursor.execute("""
            INSERT INTO modules (module_name, course_id, description, status)
            VALUES (%s, %s, %s, 'Active')
        """, (module_name, course_id, module_description))
        
        module_id = cursor.lastrowid
        
        # Add lessons for this module
        lessons = get_module_lessons(module_name, course_name)
        for lesson_name, lesson_description, total_slides in lessons:
            cursor.execute("""
                INSERT INTO lessons (lesson_name, module_id, file_path, file_name, file_type, 
                                   file_size, description, total_slides, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Active')
            """, (lesson_name, module_id, f"/uploads/{lesson_name.lower().replace(' ', '_')}.pdf",
                  f"{lesson_name.lower().replace(' ', '_')}.pdf", "pdf", 1000000, 
                  lesson_description, total_slides))

def get_course_modules(course_name):
    """Get modules for a specific course"""
    if "Python" in course_name:
        return [
            ("Python Basics", "Introduction to Python syntax and fundamentals"),
            ("Data Structures", "Lists, tuples, dictionaries, and sets"),
            ("Functions and Modules", "Function definition and module organization"),
            ("Object-Oriented Programming", "Classes, objects, and inheritance"),
            ("File Handling", "Reading and writing files in Python"),
            ("Error Handling", "Exception handling and debugging")
        ]
    elif "React" in course_name:
        return [
            ("React Fundamentals", "Components, JSX, and React basics"),
            ("State and Props", "Managing component state and props"),
            ("Hooks", "React hooks for functional components"),
            ("Routing", "Navigation with React Router"),
            ("State Management", "Redux and Context API"),
            ("Advanced Patterns", "Performance optimization and best practices")
        ]
    elif "Machine Learning" in course_name:
        return [
            ("Introduction to ML", "Basic concepts and types of machine learning"),
            ("Data Preprocessing", "Cleaning and preparing data for ML"),
            ("Supervised Learning", "Classification and regression algorithms"),
            ("Unsupervised Learning", "Clustering and dimensionality reduction"),
            ("Model Evaluation", "Cross-validation and performance metrics"),
            ("Feature Engineering", "Creating and selecting features")
        ]
    elif "AWS" in course_name:
        return [
            ("Cloud Fundamentals", "Introduction to cloud computing concepts"),
            ("EC2 and VPC", "Virtual machines and networking"),
            ("S3 and Storage", "Object storage and data management"),
            ("Database Services", "RDS, DynamoDB, and other database options"),
            ("Security and IAM", "Identity and access management"),
            ("Monitoring and Logging", "CloudWatch and monitoring tools")
        ]
    elif "Cybersecurity" in course_name:
        return [
            ("Security Fundamentals", "Basic security concepts and threats"),
            ("Network Security", "Securing network infrastructure"),
            ("Application Security", "Securing web and mobile applications"),
            ("Cryptography", "Encryption and cryptographic protocols"),
            ("Incident Response", "Handling security incidents"),
            ("Security Tools", "Penetration testing and security tools")
        ]
    else:
        # Default modules for other courses
        return [
            ("Introduction", f"Introduction to {course_name}"),
            ("Fundamentals", f"Core concepts and fundamentals of {course_name}"),
            ("Advanced Topics", f"Advanced features and techniques"),
            ("Best Practices", f"Industry best practices and standards"),
            ("Project Work", f"Hands-on project implementation"),
            ("Deployment", f"Deployment and production considerations")
        ]

def get_module_lessons(module_name, course_name):
    """Get lessons for a specific module"""
    if "Introduction" in module_name or "Basics" in module_name:
        return [
            ("Getting Started", f"Introduction to {course_name} concepts", 15),
            ("Setup and Installation", "Environment setup and tools installation", 12),
            ("First Steps", "Your first project and basic operations", 18),
            ("Core Concepts", "Understanding fundamental principles", 20)
        ]
    elif "Fundamentals" in module_name:
        return [
            ("Core Principles", "Understanding core principles and concepts", 16),
            ("Basic Operations", "Performing basic operations and tasks", 14),
            ("Working with Data", "Data manipulation and processing", 18),
            ("Common Patterns", "Common patterns and practices", 16)
        ]
    elif "Advanced" in module_name:
        return [
            ("Advanced Features", "Exploring advanced features and capabilities", 20),
            ("Optimization", "Performance optimization techniques", 16),
            ("Integration", "Integrating with other technologies", 18),
            ("Real-world Applications", "Applying concepts to real-world scenarios", 22)
        ]
    elif "Project" in module_name:
        return [
            ("Project Planning", "Planning and designing your project", 12),
            ("Implementation", "Building and implementing the project", 25),
            ("Testing", "Testing and quality assurance", 15),
            ("Deployment", "Deploying and maintaining the project", 18)
        ]
    else:
        # Default lessons
        return [
            ("Lesson 1", f"First lesson on {module_name}", 15),
            ("Lesson 2", f"Second lesson on {module_name}", 15),
            ("Lesson 3", f"Third lesson on {module_name}", 15),
            ("Lesson 4", f"Fourth lesson on {module_name}", 15)
        ]

if __name__ == "__main__":
    add_it_courses()
