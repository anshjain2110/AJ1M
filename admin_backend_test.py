#!/usr/bin/env python3

import requests
import json
import sys
import uuid
from datetime import datetime

class AdminAPITester:
    def __init__(self, base_url="https://prod-priority.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.admin_token = None
        self.test_lead_id = None

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

    def test_admin_login(self):
        """Test admin login endpoint"""
        try:
            payload = {
                "email": "admin@thelocaljewel.com",
                "password": "TLJadmin2024!"
            }
            response = self.session.post(f"{self.base_url}/api/admin/auth/login", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "email" in data:
                    self.admin_token = data["token"]
                    self.log_result("Admin Login", True, response)
                    return True
                else:
                    self.log_result("Admin Login", False, response, f"Missing token or email: {data}")
                    return False
            else:
                self.log_result("Admin Login", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Login", False, error=str(e))
            return False

    def test_admin_me(self):
        """Test admin me endpoint"""
        if not self.admin_token:
            self.log_result("Admin Me", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.base_url}/api/admin/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "email" in data and "role" in data and data["role"] == "admin":
                    self.log_result("Admin Me", True, response)
                    return True
                else:
                    self.log_result("Admin Me", False, response, f"Missing required fields: {data}")
                    return False
            else:
                self.log_result("Admin Me", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Me", False, error=str(e))
            return False

    def test_analytics_overview(self):
        """Test analytics overview endpoint"""
        if not self.admin_token:
            self.log_result("Analytics Overview", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.base_url}/api/admin/analytics/overview", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total", "today", "this_week", "this_month", "status_breakdown"]
                if all(field in data for field in required_fields):
                    self.log_result("Analytics Overview", True, response)
                    return True
                else:
                    self.log_result("Analytics Overview", False, response, f"Missing fields: {data}")
                    return False
            else:
                self.log_result("Analytics Overview", False, response)
                return False
        except Exception as e:
            self.log_result("Analytics Overview", False, error=str(e))
            return False

    def test_analytics_funnel(self):
        """Test analytics funnel endpoint"""
        if not self.admin_token:
            self.log_result("Analytics Funnel", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.base_url}/api/admin/analytics/funnel", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "funnel" in data and "step_views" in data and "step_completes" in data:
                    self.log_result("Analytics Funnel", True, response)
                    return True
                else:
                    self.log_result("Analytics Funnel", False, response, f"Missing fields: {data}")
                    return False
            else:
                self.log_result("Analytics Funnel", False, response)
                return False
        except Exception as e:
            self.log_result("Analytics Funnel", False, error=str(e))
            return False

    def test_analytics_sources(self):
        """Test analytics sources endpoint"""
        if not self.admin_token:
            self.log_result("Analytics Sources", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.base_url}/api/admin/analytics/sources", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "sources" in data and isinstance(data["sources"], list):
                    self.log_result("Analytics Sources", True, response)
                    return True
                else:
                    self.log_result("Analytics Sources", False, response, f"Invalid sources: {data}")
                    return False
            else:
                self.log_result("Analytics Sources", False, response)
                return False
        except Exception as e:
            self.log_result("Analytics Sources", False, error=str(e))
            return False

    def test_leads_list(self):
        """Test admin leads list endpoint"""
        if not self.admin_token:
            self.log_result("Admin Leads List", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.base_url}/api/admin/leads", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["leads", "total", "page", "limit", "pages"]
                if all(field in data for field in required_fields) and isinstance(data["leads"], list):
                    # Store first lead ID for later tests
                    if data["leads"]:
                        self.test_lead_id = data["leads"][0]["lead_id"]
                    self.log_result("Admin Leads List", True, response)
                    return True
                else:
                    self.log_result("Admin Leads List", False, response, f"Missing fields: {data}")
                    return False
            else:
                self.log_result("Admin Leads List", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Leads List", False, error=str(e))
            return False

    def test_lead_detail(self):
        """Test admin lead detail endpoint"""
        if not self.admin_token:
            self.log_result("Admin Lead Detail", False, error="No admin token")
            return False
        
        if not self.test_lead_id:
            self.log_result("Admin Lead Detail", False, error="No test lead ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.base_url}/api/admin/leads/{self.test_lead_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "lead" in data and "quotes" in data and "orders" in data:
                    self.log_result("Admin Lead Detail", True, response)
                    return True
                else:
                    self.log_result("Admin Lead Detail", False, response, f"Missing fields: {data}")
                    return False
            else:
                self.log_result("Admin Lead Detail", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Lead Detail", False, error=str(e))
            return False

    def test_lead_status_update(self):
        """Test admin lead status update endpoint"""
        if not self.admin_token or not self.test_lead_id:
            self.log_result("Admin Lead Status Update", False, error="No admin token or lead ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            payload = {"status": "contacted"}
            response = self.session.patch(f"{self.base_url}/api/admin/leads/{self.test_lead_id}", 
                                        json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "updated":
                    self.log_result("Admin Lead Status Update", True, response)
                    return True
                else:
                    self.log_result("Admin Lead Status Update", False, response, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Admin Lead Status Update", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Lead Status Update", False, error=str(e))
            return False

    def test_add_note(self):
        """Test admin add note endpoint"""
        if not self.admin_token or not self.test_lead_id:
            self.log_result("Admin Add Note", False, error="No admin token or lead ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            payload = {"text": "Test note from admin system"}
            response = self.session.post(f"{self.base_url}/api/admin/leads/{self.test_lead_id}/notes", 
                                       json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and "note" in data and data["status"] == "added":
                    self.log_result("Admin Add Note", True, response)
                    return True
                else:
                    self.log_result("Admin Add Note", False, response, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Admin Add Note", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Add Note", False, error=str(e))
            return False

    def test_create_quote(self):
        """Test admin create quote endpoint"""
        if not self.admin_token or not self.test_lead_id:
            self.log_result("Admin Create Quote", False, error="No admin token or lead ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            payload = {
                "items": [],
                "total": 5000.00,
                "currency": "USD",
                "notes": "Test quote from admin system",
                "template_name": "standard"
            }
            response = self.session.post(f"{self.base_url}/api/admin/leads/{self.test_lead_id}/quotes", 
                                       json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "quote_id" in data and "lead_id" in data and "total" in data:
                    self.log_result("Admin Create Quote", True, response)
                    return True
                else:
                    self.log_result("Admin Create Quote", False, response, f"Missing fields: {data}")
                    return False
            else:
                self.log_result("Admin Create Quote", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Create Quote", False, error=str(e))
            return False

    def test_orders_endpoint(self):
        """Test admin orders endpoint"""
        if not self.admin_token:
            self.log_result("Admin Orders", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.base_url}/api/admin/orders", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["orders", "total", "page", "limit"]
                if all(field in data for field in required_fields) and isinstance(data["orders"], list):
                    self.log_result("Admin Orders", True, response)
                    return True
                else:
                    self.log_result("Admin Orders", False, response, f"Missing fields: {data}")
                    return False
            else:
                self.log_result("Admin Orders", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Orders", False, error=str(e))
            return False

    def test_settings_get(self):
        """Test admin settings GET endpoint"""
        if not self.admin_token:
            self.log_result("Admin Settings GET", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.base_url}/api/admin/settings", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["phone_number", "whatsapp_link", "live_chat_enabled", "gia_logo_visible"]
                if any(field in data for field in expected_fields):
                    self.log_result("Admin Settings GET", True, response)
                    return True
                else:
                    self.log_result("Admin Settings GET", False, response, f"No expected settings fields: {data}")
                    return False
            else:
                self.log_result("Admin Settings GET", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Settings GET", False, error=str(e))
            return False

    def test_settings_patch(self):
        """Test admin settings PATCH endpoint"""
        if not self.admin_token:
            self.log_result("Admin Settings PATCH", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            payload = {"reviews_count": "75+", "customers_count": "105+"}
            response = self.session.patch(f"{self.base_url}/api/admin/settings", 
                                        json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "reviews_count" in data and "customers_count" in data:
                    self.log_result("Admin Settings PATCH", True, response)
                    return True
                else:
                    self.log_result("Admin Settings PATCH", False, response, f"Settings not updated: {data}")
                    return False
            else:
                self.log_result("Admin Settings PATCH", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Settings PATCH", False, error=str(e))
            return False

    def test_tracking_get(self):
        """Test admin tracking GET endpoint"""
        if not self.admin_token:
            self.log_result("Admin Tracking GET", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.base_url}/api/admin/tracking", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["meta_pixel_id", "google_ads_tag", "tiktok_pixel_id", "google_analytics_id"]
                if any(field in data for field in expected_fields):
                    self.log_result("Admin Tracking GET", True, response)
                    return True
                else:
                    self.log_result("Admin Tracking GET", False, response, f"No tracking fields: {data}")
                    return False
            else:
                self.log_result("Admin Tracking GET", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Tracking GET", False, error=str(e))
            return False

    def test_tracking_patch(self):
        """Test admin tracking PATCH endpoint"""
        if not self.admin_token:
            self.log_result("Admin Tracking PATCH", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            payload = {"meta_pixel_id": "123456789", "google_ads_tag": "AW-987654321"}
            response = self.session.patch(f"{self.base_url}/api/admin/tracking", 
                                        json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "meta_pixel_id" in data and "google_ads_tag" in data:
                    self.log_result("Admin Tracking PATCH", True, response)
                    return True
                else:
                    self.log_result("Admin Tracking PATCH", False, response, f"Tracking not updated: {data}")
                    return False
            else:
                self.log_result("Admin Tracking PATCH", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Tracking PATCH", False, error=str(e))
            return False

    def test_tracking_verify(self):
        """Test admin tracking verify endpoint"""
        if not self.admin_token:
            self.log_result("Admin Tracking Verify", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.base_url}/api/admin/tracking/verify", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "events" in data and isinstance(data["events"], list):
                    self.log_result("Admin Tracking Verify", True, response)
                    return True
                else:
                    self.log_result("Admin Tracking Verify", False, response, f"Invalid events: {data}")
                    return False
            else:
                self.log_result("Admin Tracking Verify", False, response)
                return False
        except Exception as e:
            self.log_result("Admin Tracking Verify", False, error=str(e))
            return False

    def test_csv_export(self):
        """Test admin CSV export endpoint"""
        if not self.admin_token:
            self.log_result("Admin CSV Export", False, error="No admin token")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.base_url}/api/admin/leads/export.csv", headers=headers, timeout=15)
            
            if response.status_code == 200:
                # Check if response is CSV format
                content_type = response.headers.get('content-type', '')
                if 'text/csv' in content_type or response.text.startswith('lead_id,first_name'):
                    self.log_result("Admin CSV Export", True, response)
                    return True
                else:
                    self.log_result("Admin CSV Export", False, response, f"Not CSV format: {content_type}")
                    return False
            else:
                self.log_result("Admin CSV Export", False, response)
                return False
        except Exception as e:
            self.log_result("Admin CSV Export", False, error=str(e))
            return False

    def test_public_settings(self):
        """Test public settings endpoint (no auth required)"""
        try:
            response = self.session.get(f"{self.base_url}/api/settings/public", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["phone_number", "whatsapp_link", "live_chat_enabled"]
                if any(field in data for field in expected_fields):
                    self.log_result("Public Settings", True, response)
                    return True
                else:
                    self.log_result("Public Settings", False, response, f"Missing fields: {data}")
                    return False
            else:
                self.log_result("Public Settings", False, response)
                return False
        except Exception as e:
            self.log_result("Public Settings", False, error=str(e))
            return False

    def run_all_admin_tests(self):
        """Run all admin API tests in sequence"""
        print("🚀 Starting Admin API Testing...")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)

        # Authentication
        self.test_admin_login()
        self.test_admin_me()

        # Analytics
        self.test_analytics_overview()
        self.test_analytics_funnel()
        self.test_analytics_sources()

        # Lead Management
        self.test_leads_list()
        self.test_lead_detail()
        self.test_lead_status_update()
        self.test_add_note()
        self.test_create_quote()

        # Order Management
        self.test_orders_endpoint()

        # Settings & Tracking
        self.test_settings_get()
        self.test_settings_patch()
        self.test_tracking_get()
        self.test_tracking_patch()
        self.test_tracking_verify()

        # Export & Public
        self.test_csv_export()
        self.test_public_settings()

        # Print summary
        print("\n" + "=" * 60)
        print("📊 ADMIN API TEST SUMMARY")
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
        else:
            print("\n🎉 ALL ADMIN API TESTS PASSED!")

        return self.tests_passed == self.tests_run

def main():
    tester = AdminAPITester()
    success = tester.run_all_admin_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())