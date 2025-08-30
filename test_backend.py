#!/usr/bin/env python3
"""
Test Backend Connection Script
This script tests if the backend server is running and accessible.
"""

import requests
import json

def test_backend():
    """Test if the backend is accessible"""
    
    print("🧪 Testing Backend Connection")
    print("=" * 40)
    
    # Test 1: Check if server is running
    try:
        response = requests.get("http://localhost:5000/api/test")
        if response.status_code == 200:
            print("✅ Backend server is running and accessible")
            print(f"   Response: {response.text}")
        else:
            print(f"⚠️  Backend responded with status: {response.status_code}")
            print(f"   Response: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server at http://localhost:5000")
        print("💡 Make sure the backend server is running")
        return False
    
    # Test 2: Test messaging endpoint (should return 401 for unauthenticated)
    try:
        response = requests.get("http://localhost:5000/api/messages/unread-count")
        if response.status_code == 401:
            print("✅ Messaging endpoint working (correctly requires authentication)")
        elif response.status_code == 500:
            print("⚠️  Messaging endpoint returned 500 error")
            print(f"   Error details: {response.text}")
        else:
            print(f"⚠️  Messaging endpoint returned: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing messaging endpoint: {e}")
    
    print("\n🎯 Backend Test Summary:")
    print("   - Backend server status checked")
    print("   - Messaging endpoint tested")
    
    return True

if __name__ == "__main__":
    test_backend()
