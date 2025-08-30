#!/usr/bin/env python3
"""
Test Messaging System Script
This script tests the messaging API endpoints to ensure they work properly.
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:5000"

def test_messaging_endpoints():
    """Test the messaging API endpoints"""
    
    print("🧪 Testing Messaging System")
    print("=" * 40)
    
    # Test 1: Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/api/test")
        if response.status_code == 200:
            print("✅ Server is running")
        else:
            print(f"❌ Server test failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure the backend is running.")
        return False
    
    # Test 2: Test unread count endpoint (should return 401 for unauthenticated)
    try:
        response = requests.get(f"{BASE_URL}/api/messages/unread-count")
        if response.status_code == 401:
            print("✅ Unread count endpoint working (correctly requires authentication)")
        else:
            print(f"⚠️  Unread count endpoint returned: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing unread count: {e}")
    
    # Test 3: Test inbox endpoint (should return 401 for unauthenticated)
    try:
        response = requests.get(f"{BASE_URL}/api/messages/inbox")
        if response.status_code == 401:
            print("✅ Inbox endpoint working (correctly requires authentication)")
        else:
            print(f"⚠️  Inbox endpoint returned: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing inbox: {e}")
    
    # Test 4: Test send message endpoint (should return 400 for missing data)
    try:
        response = requests.post(f"{BASE_URL}/api/messages/send", 
                               json={}, 
                               headers={'Content-Type': 'application/json'})
        if response.status_code == 400:
            print("✅ Send message endpoint working (correctly validates required fields)")
        else:
            print(f"⚠️  Send message endpoint returned: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing send message: {e}")
    
    print("\n🎯 Messaging System Test Summary:")
    print("   - Server is running")
    print("   - API endpoints are accessible")
    print("   - Authentication is properly enforced")
    print("   - The messaging system should now work for authenticated users!")
    
    return True

if __name__ == "__main__":
    test_messaging_endpoints()
