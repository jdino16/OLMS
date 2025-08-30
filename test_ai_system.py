#!/usr/bin/env python3
"""
Test script for the AI Recommendation System
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_ai_imports():
    """Test if all required AI libraries can be imported"""
    print("🧪 Testing AI System Imports...")
    
    try:
        import numpy as np
        print("✅ NumPy imported successfully")
    except ImportError as e:
        print(f"❌ NumPy import failed: {e}")
        return False
    
    try:
        import sklearn
        print("✅ Scikit-learn imported successfully")
    except ImportError as e:
        print(f"❌ Scikit-learn import failed: {e}")
        return False
    
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        print("✅ TfidfVectorizer imported successfully")
    except ImportError as e:
        print(f"❌ TfidfVectorizer import failed: {e}")
        return False
    
    try:
        from sklearn.metrics.pairwise import cosine_similarity
        print("✅ Cosine similarity imported successfully")
    except ImportError as e:
        print(f"❌ Cosine similarity import failed: {e}")
        return False
    
    return True

def test_ai_recommendations():
    """Test the AI recommendation engine"""
    print("\n🧪 Testing AI Recommendation Engine...")
    
    try:
        from ai_recommendations import AIRecommendationEngine
        print("✅ AIRecommendationEngine imported successfully")
        
        # Create a mock database object
        class MockDB:
            def get_all_courses(self):
                return [
                    {
                        'id': 1,
                        'course_name': 'Python Basics',
                        'description': 'Learn Python programming fundamentals',
                        'level': 'Beginner',
                        'category': 'Programming'
                    },
                    {
                        'id': 2,
                        'course_name': 'Advanced Python',
                        'description': 'Advanced Python concepts and techniques',
                        'level': 'Advanced',
                        'category': 'Programming'
                    },
                    {
                        'id': 3,
                        'course_name': 'Web Development',
                        'description': 'Build modern web applications',
                        'level': 'Intermediate',
                        'category': 'Web Development'
                    }
                ]
        
        # Initialize the engine
        engine = AIRecommendationEngine(MockDB())
        print("✅ AIRecommendationEngine initialized successfully")
        
        # Test course feature preparation
        courses = MockDB().get_all_courses()
        success = engine.prepare_course_features(courses)
        if success:
            print("✅ Course features prepared successfully")
        else:
            print("❌ Course feature preparation failed")
            return False
        
        # Test course insights
        insights = engine.get_course_insights(1)
        if insights:
            print("✅ Course insights generated successfully")
            print(f"   Sample insight: {list(insights.keys())[0]}")
        else:
            print("❌ Course insights generation failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ AI recommendation engine test failed: {e}")
        return False

def test_backend_endpoints():
    """Test if the backend is running and AI endpoints are accessible"""
    print("\n🧪 Testing Backend AI Endpoints...")
    
    try:
        import requests
        
        # Test basic connectivity
        response = requests.get('http://localhost:5000/api/test', timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and accessible")
        else:
            print(f"❌ Backend responded with status: {response.status_code}")
            return False
        
        # Test AI recommendations endpoint (should return 401 for unauthenticated)
        response = requests.get('http://localhost:5000/api/ai/recommendations', timeout=5)
        if response.status_code == 401:
            print("✅ AI recommendations endpoint is working (requires authentication)")
        else:
            print(f"⚠️  AI recommendations endpoint returned unexpected status: {response.status_code}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running. Please start the Flask server first.")
        return False
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 AI System Test Suite")
    print("=" * 50)
    
    # Test imports
    imports_ok = test_ai_imports()
    
    # Test AI engine
    engine_ok = test_ai_recommendations()
    
    # Test backend
    backend_ok = test_backend_endpoints()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"   Imports: {'✅ PASS' if imports_ok else '❌ FAIL'}")
    print(f"   AI Engine: {'✅ PASS' if engine_ok else '❌ FAIL'}")
    print(f"   Backend: {'✅ PASS' if backend_ok else '❌ FAIL'}")
    
    if all([imports_ok, engine_ok, backend_ok]):
        print("\n🎉 All tests passed! AI system is ready to use.")
        return True
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
