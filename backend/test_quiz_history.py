#!/usr/bin/env python3
"""
Test script to show quiz history data structure
"""

from database import Database
from config import Config
import json

def test_quiz_history_data():
    # Initialize database
    db = Database(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB,
        port=Config.MYSQL_PORT
    )
    
    print("Testing quiz history data structure...")
    
    # Get first student
    students = db.get_all_students()
    if not students:
        print("No students found")
        return
    
    student_id = students[0]['id']
    print(f"Using student ID: {student_id}")
    
    # Get quiz history
    quiz_history = db.get_student_quiz_history(student_id)
    
    if quiz_history:
        print(f"\nFound {len(quiz_history)} quiz attempts:")
        print("=" * 80)
        
        for i, attempt in enumerate(quiz_history, 1):
            print(f"\nQuiz Attempt #{i}:")
            print(f"  ID: {attempt['id']}")
            print(f"  Lesson: {attempt['lesson_name']}")
            print(f"  Module: {attempt['module_name']}")
            print(f"  Course: {attempt['course_name']}")
            print(f"  Score: {attempt['correct_answers']}/{attempt['total_questions']} ({attempt['score_percentage']:.1f}%)")
            print(f"  Time Taken: {attempt['time_taken_seconds']} seconds")
            print(f"  Completed: {attempt['completed_at']}")
            print("-" * 40)
    else:
        print("No quiz history found")
    
    # Get quiz stats
    quiz_stats = db.get_student_quiz_stats(student_id)
    if quiz_stats:
        print(f"\nQuiz Statistics:")
        print(f"  Total Quizzes: {quiz_stats['total_quizzes']}")
        print(f"  Average Score: {quiz_stats['average_score']:.1f}%")
        print(f"  Best Score: {quiz_stats['best_score']:.1f}%")
        print(f"  Total Time: {quiz_stats['total_time']} seconds")

if __name__ == "__main__":
    test_quiz_history_data()
