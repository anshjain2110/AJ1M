#!/usr/bin/env python3

import requests
import json
import sys
import uuid
from datetime import datetime

class LocalJewelAPITester:
    def __init__(self, base_url="https://prod-priority.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.lead_id = None
        self.token = None
        self.test_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        self.test_phone = f"+1555{uuid.uuid4().hex[:7]}"

    def log_result(self, test_name, success, response=None, error=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED")
            if error:
                print(f"   Error: {error}")
            if response:
                print(f"   Response: {response.status_code} - {response.text[:200]}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "error": error,
            "status_code": response.status_code if response else None
        })

    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/health", timeout=10)
            expected_data = {"status": "ok", "service": "thelocaljewel-api"}
            
            if response.status_code == 200:
                data = response.json()
                if data == expected_data:
                    self.log_result("Health Check API", True, response)
                    return True
                else:
                    self.log_result("Health Check API", False, response, f"Expected {expected_data}, got {data}")
                    return False
            else:
                self.log_result("Health Check API", False, response)
                return False
        except Exception as e:
            self.log_result("Health Check API", False, error=str(e))
            return False

    def test_wizard_start(self):
        """Test wizard start endpoint"""
        try:
            payload = {
                "anonymous_id": f"anon_{uuid.uuid4().hex[:10]}",
                "session_id": f"sess_{uuid.uuid4().hex[:10]}",
                "attribution": {"source": "test", "utm_source": "test"}
            }
            response = self.session.post(f"{self.base_url}/api/wizard/start", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "lead_id" in data and "status" in data and data["status"] == "started":
                    self.lead_id = data["lead_id"]
                    self.log_result("Wizard Start API", True, response)
                    return True
                else:
                    self.log_result("Wizard Start API", False, response, f"Missing required fields in response: {data}")
                    return False
            else:
                self.log_result("Wizard Start API", False, response)
                return False
        except Exception as e:
            self.log_result("Wizard Start API", False, error=str(e))
            return False

    def test_wizard_autosave(self):
        """Test wizard autosave endpoint"""
        if not self.lead_id:
            self.log_result("Wizard Autosave API", False, error="No lead_id from previous test")
            return False
        
        try:
            payload = {
                "answers": {"product_type": "engagement_ring", "occasion": "proposal"},
                "current_step": "product_type",
                "frozen_step_total": 12
            }
            response = self.session.put(f"{self.base_url}/api/wizard/{self.lead_id}/autosave", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "saved":
                    self.log_result("Wizard Autosave API", True, response)
                    return True
                else:
                    self.log_result("Wizard Autosave API", False, response, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Wizard Autosave API", False, response)
                return False
        except Exception as e:
            self.log_result("Wizard Autosave API", False, error=str(e))
            return False

    def test_wizard_restore(self):
        """Test wizard restore endpoint"""
        if not self.lead_id:
            self.log_result("Wizard Restore API", False, error="No lead_id from previous test")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/api/wizard/{self.lead_id}/restore", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "lead_id" in data and "answers" in data and "current_step" in data:
                    self.log_result("Wizard Restore API", True, response)
                    return True
                else:
                    self.log_result("Wizard Restore API", False, response, f"Missing required fields: {data}")
                    return False
            else:
                self.log_result("Wizard Restore API", False, response)
                return False
        except Exception as e:
            self.log_result("Wizard Restore API", False, error=str(e))
            return False

    def test_lead_submission(self):
        """Test lead submission endpoint"""
        if not self.lead_id:
            self.log_result("Lead Submission API", False, error="No lead_id from previous test")
            return False
        
        try:
            payload = {
                "lead_id": self.lead_id,
                "first_name": "Test User",
                "email": self.test_email,
                "phone": self.test_phone,
                "notes": "Test submission",
                "answers": {
                    "product_type": "engagement_ring",
                    "occasion": "proposal",
                    "diamond_shape": "round",
                    "budget": "5000_10000"
                },
                "attribution": {"source": "test"}
            }
            response = self.session.post(f"{self.base_url}/api/leads/submit", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["status", "lead_id", "user_id", "token", "first_name"]
                if all(field in data for field in required_fields) and data["status"] == "submitted":
                    self.token = data["token"]
                    self.log_result("Lead Submission API", True, response)
                    return True
                else:
                    self.log_result("Lead Submission API", False, response, f"Missing fields or wrong status: {data}")
                    return False
            else:
                self.log_result("Lead Submission API", False, response)
                return False
        except Exception as e:
            self.log_result("Lead Submission API", False, error=str(e))
            return False

    def test_otp_request(self):
        """Test OTP request endpoint"""
        try:
            payload = {"identifier": self.test_email}
            response = self.session.post(f"{self.base_url}/api/auth/request-otp", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and "otp_dev" in data and data["status"] == "sent":
                    self.otp_code = data["otp_dev"]
                    self.log_result("OTP Request API", True, response)
                    return True
                else:
                    self.log_result("OTP Request API", False, response, f"Missing fields in response: {data}")
                    return False
            else:
                self.log_result("OTP Request API", False, response)
                return False
        except Exception as e:
            self.log_result("OTP Request API", False, error=str(e))
            return False

    def test_otp_verify(self):
        """Test OTP verification endpoint"""
        if not hasattr(self, 'otp_code'):
            self.log_result("OTP Verify API", False, error="No OTP code from previous test")
            return False
        
        try:
            payload = {
                "identifier": self.test_email,
                "otp_code": self.otp_code
            }
            response = self.session.post(f"{self.base_url}/api/auth/verify-otp", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and "token" in data and data["status"] == "verified":
                    self.token = data["token"]
                    self.log_result("OTP Verify API", True, response)
                    return True
                else:
                    self.log_result("OTP Verify API", False, response, f"Missing fields: {data}")
                    return False
            else:
                self.log_result("OTP Verify API", False, response)
                return False
        except Exception as e:
            self.log_result("OTP Verify API", False, error=str(e))
            return False

    def test_authenticated_endpoints(self):
        """Test authenticated endpoints"""
        if not self.token:
            self.log_result("Authenticated Endpoints", False, error="No token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.token}"}
        success_count = 0
        
        # Test /api/me
        try:
            response = self.session.get(f"{self.base_url}/api/me", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "user" in data:
                    self.log_result("GET /api/me", True, response)
                    success_count += 1
                else:
                    self.log_result("GET /api/me", False, response, f"Missing user field: {data}")
            else:
                self.log_result("GET /api/me", False, response)
        except Exception as e:
            self.log_result("GET /api/me", False, error=str(e))

        # Test /api/me/leads
        try:
            response = self.session.get(f"{self.base_url}/api/me/leads", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "leads" in data and isinstance(data["leads"], list):
                    self.log_result("GET /api/me/leads", True, response)
                    success_count += 1
                else:
                    self.log_result("GET /api/me/leads", False, response, f"Missing/invalid leads field: {data}")
            else:
                self.log_result("GET /api/me/leads", False, response)
        except Exception as e:
            self.log_result("GET /api/me/leads", False, error=str(e))

        # Test /api/me/orders
        try:
            response = self.session.get(f"{self.base_url}/api/me/orders", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "orders" in data and isinstance(data["orders"], list):
                    self.log_result("GET /api/me/orders", True, response)
                    success_count += 1
                else:
                    self.log_result("GET /api/me/orders", False, response, f"Missing/invalid orders field: {data}")
            else:
                self.log_result("GET /api/me/orders", False, response)
        except Exception as e:
            self.log_result("GET /api/me/orders", False, error=str(e))

        return success_count == 3

    def test_events_api(self):
        """Test events logging endpoint"""
        try:
            payload = {
                "event_name": "test_event",
                "event_data": {"test": "data"},
                "anonymous_id": f"anon_{uuid.uuid4().hex[:10]}",
                "session_id": f"sess_{uuid.uuid4().hex[:10]}",
                "lead_id": self.lead_id
            }
            response = self.session.post(f"{self.base_url}/api/events", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "logged":
                    self.log_result("Events API", True, response)
                    return True
                else:
                    self.log_result("Events API", False, response, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Events API", False, response)
                return False
        except Exception as e:
            self.log_result("Events API", False, error=str(e))
            return False

    def test_file_upload_api(self):
        """Test file upload endpoint"""
        try:
            # Create a small test file
            test_content = b"Test file content for upload"
            files = {"files": ("test.txt", test_content, "text/plain")}
            
            response = self.session.post(f"{self.base_url}/api/uploads", files=files, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if "files" in data and isinstance(data["files"], list) and len(data["files"]) > 0:
                    file_data = data["files"][0]
                    if "filename" in file_data and "url" in file_data:
                        self.log_result("File Upload API", True, response)
                        return True
                    else:
                        self.log_result("File Upload API", False, response, f"Missing file fields: {file_data}")
                        return False
                else:
                    self.log_result("File Upload API", False, response, f"Invalid files response: {data}")
                    return False
            else:
                self.log_result("File Upload API", False, response)
                return False
        except Exception as e:
            self.log_result("File Upload API", False, error=str(e))
            return False

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Local Jewel API Testing...")
        print(f"Backend URL: {self.base_url}")
        print("=" * 50)

        # Core API tests
        self.test_health_check()
        self.test_wizard_start()
        self.test_wizard_autosave()
        self.test_wizard_restore()
        self.test_lead_submission()
        self.test_otp_request()
        self.test_otp_verify()
        self.test_authenticated_endpoints()
        self.test_events_api()
        self.test_file_upload_api()

        # Print summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")

        # Print failed tests
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test.get('error', 'Unknown error')}")

        return self.tests_passed == self.tests_run

def main():
    tester = LocalJewelAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())