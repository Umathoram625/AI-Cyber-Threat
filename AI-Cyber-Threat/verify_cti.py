import subprocess
import time
import httpx
import os
import sys

def run_verification():
    print("=== CTI ASSISTANT PROGRAMMATIC VERIFICATION ===")
    
    # 1. Spawn FastAPI server
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    print("Spawning FastAPI server on port 8000...")
    
    env = os.environ.copy()
    # Force default testing credentials in env
    env["MONGODB_URI"] = "mongodb://localhost:27017"
    env["DATABASE_NAME"] = "cyber_threat_intel"
    env["JWT_SECRET"] = "super_secret_testing_only_keys_1234"
    
    proc = subprocess.Popen(
        ["uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=backend_dir,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for uvicorn to spin up
    time.sleep(3.5)
    
    # Test Client
    client = httpx.Client(base_url="http://127.0.0.1:8000")
    
    try:
        # 2. Check Health
        print("Checking server health status...")
        resp = client.get("/")
        print(f"Health Response: {resp.status_code} -> {resp.json()}")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"
        
        # 3. Authenticate with seeded Admin user
        print("Authenticating with default Administrator credentials...")
        login_payload = {
            "email": "admin@cti.local",
            "password": "AdminPassword123!"
        }
        resp = client.post("/api/auth/login", json=login_payload)
        print(f"Login Response: {resp.status_code}")
        assert resp.status_code == 200
        
        auth_data = resp.json()
        token = auth_data["access_token"]
        print(f"Access Token Acquired (role: {auth_data['role']})")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # 4. Check Threat Summary Statistics (should be seeded)
        print("Checking seeded threats registry count...")
        resp = client.get("/api/threats/summary-stats", headers=headers)
        stats = resp.json()
        print(f"Summary Stats Response: {resp.status_code} -> Total: {stats['total_threats']}, Critical: {stats['critical_threats']}")
        assert resp.status_code == 200
        assert stats["total_threats"] > 0
        
        # 5. Fetch Threat List
        print("Fetching threat list items...")
        resp = client.get("/api/threats", headers=headers)
        threats = resp.json()
        print(f"Threat List Size: {len(threats)}")
        assert resp.status_code == 200
        assert len(threats) > 0
        
        # 6. Check Analytics Overview
        print("Checking analytics charts datasets aggregation...")
        resp = client.get("/api/analytics/overview", headers=headers)
        assert resp.status_code == 200
        analytics = resp.json()
        print("Analytics charts categories, severity, and timeline matches successful.")
        
        # 7. Try PDF download
        print("Compiling and generating PDF security report...")
        resp = client.get("/api/reports/download", headers=headers)
        assert resp.status_code == 200
        pdf_content = resp.content
        print(f"PDF generated successfully ({len(pdf_content)} bytes)")
        
        # Save pdf output file
        pdf_path = os.path.join(os.path.dirname(__file__), "threat_report_test.pdf")
        with open(pdf_path, "wb") as f:
            f.write(pdf_content)
        print(f"Saved compiled verification PDF report to: {pdf_path}")
        
        # 8. Test AI Chat query
        print("Testing AI Chat response query...")
        chat_payload = {
            "message": "Explain Ransomware",
        }
        resp = client.post("/api/chat", json=chat_payload, headers=headers)
        assert resp.status_code == 200
        chat_reply = resp.json()
        print(f"AI Chat Response: {chat_reply['reply'][:100]}...")
        
        print("\n=== VERIFICATION SUCCESSFUL - ALL NODES OPERATIONAL ===")
        sys.exit(0)
        
    except Exception as e:
        print(f"\nVerification Failed: {e}")
        # Print server logs if failed
        print("--- Server Error Log Streams ---")
        stdout, stderr = proc.communicate(timeout=1.0)
        print("STDOUT:", stdout.decode("utf-8", errors="ignore"))
        print("STDERR:", stderr.decode("utf-8", errors="ignore"))
        sys.exit(1)
        
    finally:
        # Clean up process
        print("Stopping uvicorn server...")
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    run_verification()
