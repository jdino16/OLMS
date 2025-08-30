-- Database Schema for OLMS (Online Learning Management System)

-- Create database
CREATE DATABASE IF NOT EXISTS olms;
USE olms;

-- Admin table
CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Instructors table
CREATE TABLE instructors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    instructor_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    description TEXT,
    duration VARCHAR(50),
    level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Modules table
CREATE TABLE modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    course_id INT NOT NULL,
    description TEXT,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Lessons table
CREATE TABLE lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_name VARCHAR(200) NOT NULL,
    module_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(200) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT,
    description TEXT,
    total_slides INT DEFAULT 10,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Course Enrollments table
CREATE TABLE course_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Completed', 'Dropped') DEFAULT 'Active',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    completed_modules INT DEFAULT 0,
    total_study_time INT DEFAULT 0, -- in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id)
);

-- Lesson Progress table to track PDF page progress
CREATE TABLE lesson_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    lesson_id INT NOT NULL,
    current_page INT DEFAULT 1,
    total_pages INT DEFAULT 1,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_lesson_progress (student_id, lesson_id)
);

-- Insert default admin user
INSERT INTO admin (username, password) VALUES 
('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918');

-- Insert sample data
INSERT INTO courses (course_name, description, duration, level) VALUES
('Web Development Fundamentals', 'Learn the basics of HTML, CSS, and JavaScript', '8 weeks', 'Beginner'),
('Advanced JavaScript', 'Master JavaScript ES6+ and modern frameworks', '10 weeks', 'Advanced'),
('Database Management', 'Learn SQL and database design principles', '6 weeks', 'Intermediate');

INSERT INTO modules (module_name, course_id, description) VALUES
('HTML Basics', 1, 'Introduction to HTML structure and elements'),
('CSS Styling', 1, 'Learn CSS for styling web pages'),
('JavaScript Fundamentals', 1, 'Basic JavaScript programming concepts'),
('ES6 Features', 2, 'Modern JavaScript features and syntax'),
('React Framework', 2, 'Building user interfaces with React'),
('Database Design', 3, 'Understanding database relationships'),
('SQL Queries', 3, 'Writing efficient SQL queries');

-- Insert sample instructors
INSERT INTO instructors (username, instructor_name, password, dob, gender, phone_number, email) VALUES
('john.doe', 'John Doe', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '1985-03-15', 'Male', '+1234567890', 'john.doe@example.com'),
('jane.smith', 'Jane Smith', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '1990-07-22', 'Female', '+1234567891', 'jane.smith@example.com'),
('mike.wilson', 'Mike Wilson', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '1988-11-08', 'Male', '+1234567892', 'mike.wilson@example.com');

-- Insert sample students
INSERT INTO students (username, student_name, password, dob, gender, phone_number, email) VALUES
('alice.johnson', 'Alice Johnson', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '2000-05-12', 'Female', '+1234567893', 'alice.johnson@example.com'),
('bob.brown', 'Bob Brown', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '1999-09-30', 'Male', '+1234567894', 'bob.brown@example.com'),
('carol.davis', 'Carol Davis', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '2001-02-18', 'Female', '+1234567895', 'carol.davis@example.com'),
('david.miller', 'David Miller', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '1998-12-03', 'Male', '+1234567896', 'david.miller@example.com'),
('emma.wilson', 'Emma Wilson', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '2002-08-25', 'Female', '+1234567897', 'emma.wilson@example.com');

-- Messages table for student-admin communication
CREATE TABLE messages (
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
    INDEX idx_parent (parent_message_id),
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Insert sample course enrollments
INSERT INTO course_enrollments (student_id, course_id, enrollment_date, status, progress_percentage, completed_modules) VALUES
(1, 1, '2024-01-15 10:00:00', 'Completed', 100.00, 3),
(1, 2, '2024-02-01 14:30:00', 'Active', 60.00, 2),
(2, 1, '2024-01-20 09:15:00', 'Completed', 100.00, 3),
(2, 3, '2024-02-10 16:45:00', 'Active', 40.00, 1),
(3, 1, '2024-01-25 11:20:00', 'Active', 80.00, 2),
(4, 2, '2024-02-05 13:00:00', 'Active', 30.00, 1),
(5, 1, '2024-01-30 15:30:00', 'Completed', 100.00, 3),
(5, 3, '2024-02-15 10:45:00', 'Active', 20.00, 0);

-- Insert sample lessons
INSERT INTO lessons (lesson_name, module_id, file_path, file_name, file_type, file_size, description, total_slides) VALUES
('HTML Fundamentals & Structure', 1, '/uploads/html_intro.pdf', 'html_intro.pdf', 'pdf', 1024000, 'Learn the basics of HTML markup and document structure', 15),
('HTML Elements & Tags', 1, '/uploads/html_elements.pdf', 'html_elements.pdf', 'pdf', 850000, 'Understanding HTML tags, attributes, and semantic elements', 12),
('CSS Fundamentals & Selectors', 2, '/uploads/css_selectors.pdf', 'css_selectors.pdf', 'pdf', 1200000, 'CSS selectors, specificity, and basic styling', 18),
('CSS Layouts & Flexbox', 2, '/uploads/css_layouts.pdf', 'css_layouts.pdf', 'pdf', 1500000, 'CSS Grid, Flexbox, and modern layout techniques', 20),
('JavaScript Basics & Variables', 3, '/uploads/js_variables.pdf', 'js_variables.pdf', 'pdf', 950000, 'Variables, data types, and basic JavaScript concepts', 14),
('JavaScript Functions & Scope', 3, '/uploads/js_functions.pdf', 'js_functions.pdf', 'pdf', 1100000, 'Function declarations, expressions, and scope', 16),
('ES6+ Features: Arrow Functions', 4, '/uploads/es6_arrows.pdf', 'es6_arrows.pdf', 'pdf', 800000, 'Modern arrow function syntax and usage', 12),
('ES6+ Features: Destructuring', 4, '/uploads/es6_destructuring.pdf', 'es6_destructuring.pdf', 'pdf', 700000, 'Object and array destructuring patterns', 10),
('React Fundamentals: Components', 5, '/uploads/react_components.pdf', 'react_components.pdf', 'pdf', 1800000, 'Building reusable React components', 22),
('React Hooks & State Management', 5, '/uploads/react_hooks.pdf', 'react_hooks.pdf', 'pdf', 2000000, 'Using React hooks for state and effects', 25),
('Database Design: Relationships', 6, '/uploads/db_relationships.pdf', 'db_relationships.pdf', 'pdf', 1300000, 'Understanding primary and foreign keys', 16),
('Database Normalization', 6, '/uploads/db_normalization.pdf', 'db_normalization.pdf', 'pdf', 1400000, 'Database normalization principles and forms', 18),
('SQL Fundamentals: SELECT Queries', 7, '/uploads/sql_select.pdf', 'sql_select.pdf', 'pdf', 1000000, 'Writing basic SELECT queries and filtering', 14),
('SQL Advanced: JOINs & Relationships', 7, '/uploads/sql_joins.pdf', 'sql_joins.pdf', 'pdf', 1600000, 'Joining multiple tables and complex queries', 20);
