#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import uuid

class QuickQueueAPITester:
    def __init__(self, base_url="https://linemaster-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details="", error_msg=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {error_msg}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "error": error_msg
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json() if response.text else {}
            except:
                response_data = {"raw_response": response.text}

            if success:
                self.log_result(name, True, f"Status: {response.status_code}")
            else:
                self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}", 
                              f"Response: {response.text[:200]}")

            return success, response_data, response.status_code

        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            self.log_result(name, False, "", error_msg)
            return False, {}, 0

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_events_list(self):
        """Test events listing"""
        return self.run_test("Events List", "GET", "events", 200)

    def test_events_with_filters(self):
        """Test events with search and filters"""
        success1, _, _ = self.run_test("Events Search", "GET", "events?search=test", 200)
        success2, _, _ = self.run_test("Events Category Filter", "GET", "events?category=Music", 200)
        success3, _, _ = self.run_test("Events Time Filter", "GET", "events?filter_type=week", 200)
        return success1 and success2 and success3

    def test_contact_form(self):
        """Test contact form submission"""
        contact_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test.{datetime.now().strftime('%H%M%S')}@example.com",
            "message": "This is a test message from automated testing."
        }
        return self.run_test("Contact Form", "POST", "contact", 200, contact_data)

    def test_auth_without_session(self):
        """Test auth endpoint without session (should fail)"""
        success, _, status = self.run_test("Auth Without Session", "GET", "auth/me", 401)
        return success

    def create_test_user_session(self):
        """Create a test user and session in MongoDB for testing"""
        print("\n🔧 Creating test user and session...")
        
        # Generate test data
        timestamp = datetime.now().strftime('%H%M%S')
        self.user_id = f"test-user-{timestamp}"
        self.session_token = f"test_session_{timestamp}"
        
        # MongoDB commands to create test user and session
        mongo_commands = f"""
        use test_database;
        db.users.insertOne({{
            id: "{self.user_id}",
            email: "test.user.{timestamp}@example.com",
            name: "Test User {timestamp}",
            picture: "https://via.placeholder.com/150",
            role: "organizer",
            phone: "+91-9999999999",
            created_at: new Date(),
            is_verified_organizer: true
        }});
        db.user_sessions.insertOne({{
            user_id: "{self.user_id}",
            session_token: "{self.session_token}",
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        """
        
        try:
            import subprocess
            result = subprocess.run(['mongosh', '--eval', mongo_commands], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print(f"✅ Test user created: {self.user_id}")
                print(f"✅ Session token: {self.session_token}")
                return True
            else:
                print(f"❌ MongoDB command failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to create test user: {str(e)}")
            return False

    def test_auth_with_session(self):
        """Test auth endpoint with valid session"""
        if not self.session_token:
            return False
        return self.run_test("Auth With Session", "GET", "auth/me", 200)

    def test_create_event(self):
        """Test event creation (requires organizer role)"""
        if not self.session_token:
            return False
            
        event_data = {
            "title": f"Test Event {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test event created by automated testing.",
            "venue": "Test Venue, Test City",
            "date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "duration": 3,
            "category": "Music",
            "image_url": "https://images.unsplash.com/photo-1514701041007-014cfeef450e?q=80&w=2000&auto=format&fit=crop",
            "ticket_types": [
                {"name": "General", "price": 500, "available": 100},
                {"name": "VIP", "price": 1000, "available": 50}
            ],
            "terms": "Test terms and conditions for the event."
        }
        
        success, response_data, _ = self.run_test("Create Event", "POST", "events", 200, event_data)
        
        if success and 'id' in response_data:
            self.test_event_id = response_data['id']
            print(f"   Created event ID: {self.test_event_id}")
        
        return success

    def test_get_event_details(self):
        """Test getting specific event details"""
        if not hasattr(self, 'test_event_id'):
            # Try to get any event from the list
            success, events_data, _ = self.run_test("Get Events for Detail Test", "GET", "events", 200)
            if success and events_data and len(events_data) > 0:
                self.test_event_id = events_data[0]['id']
            else:
                self.log_result("Get Event Details", False, "", "No events available to test")
                return False
        
        return self.run_test("Get Event Details", "GET", f"events/{self.test_event_id}", 200)

    def test_create_booking(self):
        """Test booking creation"""
        if not hasattr(self, 'test_event_id'):
            self.log_result("Create Booking", False, "", "No event ID available")
            return False
            
        booking_data = {
            "event_id": self.test_event_id,
            "buyer_name": "Test Buyer",
            "buyer_email": "test.buyer@example.com",
            "buyer_phone": "+91-8888888888",
            "ticket_type": "General",
            "quantity": 2
        }
        
        success, response_data, _ = self.run_test("Create Booking", "POST", "bookings", 200, booking_data)
        
        if success and 'id' in response_data:
            self.test_booking_id = response_data['id']
            print(f"   Created booking ID: {self.test_booking_id}")
        
        return success

    def test_payment_order_creation(self):
        """Test Razorpay order creation"""
        if not hasattr(self, 'test_booking_id'):
            self.log_result("Payment Order Creation", False, "", "No booking ID available")
            return False
            
        payment_data = {
            "booking_id": self.test_booking_id,
            "amount": 1000.0
        }
        
        return self.run_test("Payment Order Creation", "POST", "payments/create-order", 200, payment_data)

    def test_dashboard_organizer(self):
        """Test organizer dashboard"""
        if not self.session_token:
            return False
        return self.run_test("Organizer Dashboard", "GET", "dashboard/organizer", 200)

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up test data...")
        
        if not self.user_id:
            return
            
        mongo_commands = f"""
        use test_database;
        db.users.deleteMany({{email: /test\\.user\\./}});
        db.user_sessions.deleteMany({{session_token: /test_session/}});
        db.events.deleteMany({{title: /Test Event/}});
        db.bookings.deleteMany({{buyer_email: "test.buyer@example.com"}});
        db.contact_messages.deleteMany({{email: /test\\./}});
        """
        
        try:
            import subprocess
            result = subprocess.run(['mongosh', '--eval', mongo_commands], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print("✅ Test data cleaned up")
            else:
                print(f"⚠️  Cleanup warning: {result.stderr}")
                
        except Exception as e:
            print(f"⚠️  Cleanup failed: {str(e)}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting QuickQueue API Tests")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        
        # Basic API tests (no auth required)
        print("\n" + "="*50)
        print("BASIC API TESTS (No Auth Required)")
        print("="*50)
        
        self.test_root_endpoint()
        self.test_events_list()
        self.test_events_with_filters()
        self.test_contact_form()
        self.test_auth_without_session()
        
        # Auth-required tests
        print("\n" + "="*50)
        print("AUTHENTICATED API TESTS")
        print("="*50)
        
        if self.create_test_user_session():
            self.test_auth_with_session()
            self.test_create_event()
            self.test_get_event_details()
            self.test_create_booking()
            self.test_payment_order_creation()
            self.test_dashboard_organizer()
        else:
            print("❌ Skipping authenticated tests - could not create test user")
        
        # Print summary
        print("\n" + "="*50)
        print("TEST SUMMARY")
        print("="*50)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Clean up
        self.cleanup_test_data()
        
        return self.tests_passed, self.tests_run, self.test_results

def main():
    tester = QuickQueueAPITester()
    passed, total, results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())