
import requests
import os
from dotenv import load_dotenv

# Try to find .env in backend directory
load_dotenv(dotenv_path="backend/.env")

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not URL:
    print("❌ ERROR: SUPABASE_URL not found in backend/.env")
    exit(1)

print(f"Checking Supabase API connection to {URL}...")

try:
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}"
    }
    # Try fetching the health or just a generic request to the REST API
    response = requests.get(f"{URL}/rest/v1/", headers=headers)
    
    if response.status_code == 200:
        print("✅ SUCCESS: Successfully connected to Supabase API.")
        print(f"Status Code: {response.status_code}")
    else:
        print(f"❌ FAILURE: Connected but received error status.")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

except Exception as e:
    print(f"❌ ERROR: Could not connect to Supabase.")
    print(f"Details: {e}")
