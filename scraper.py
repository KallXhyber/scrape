import os
import time
import requests
import json
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium_stealth import stealth

# URL DATABASE TUAN
FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/scraper/request.json"

PATTERNS = {
    "api_endpoints": r'https?://[\w\.-]+(?:/api/[\w\.-/]+|/v\d/[\w\.-/]+|/graphql)',
    "keys": r'(?i)(?:key|api|token|secret|auth|jwt|password)["\s:=>]+["\']?([a-zA-Z0-9-_\.]{16,})["\']?',
    "firebase_links": r'https://[\w\.-]+\.firebaseio\.com',
    "google_api": r'AIza[0-9A-Za-z-_]{35}'
}

def harvest():
    print("CHECKING COMMAND CENTER...")
    try:
        res = requests.get(FIREBASE_URL).json()
    except Exception as e:
        print(f"FAILED TO CONNECT FIREBASE: {e}")
        return

    # FIX SCREENSHOT 7: Cek apakah data ada
    if not res:
        print("DATABASE EMPTY (NULL).")
        return

    # Ambil data dengan aman (pake .get agar tidak error key)
    target = res.get('target')
    file_path = res.get('path') or res.get('name') or 'default/output'
    
    if not target:
        print("NO TARGET URL DEFINED IN FIREBASE.")
        return

    print(f"DEPLOYING ATTACK ON: {target}")

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    stealth(driver, languages=["en-US"], vendor="Google Inc.", platform="Win32", fix_hairline=True)

    try:
        driver.get(target)
        time.sleep(20) # Tunggu render & bypass

        # Sniffing Network
        logs = driver.get_log('performance')
        hidden_apis = []
        for entry in logs:
            msg = json.loads(entry['message'])['message']
            if 'Network.request' in msg['method']:
                u = msg['params']['request']['url']
                if any(k in u.lower() for k in ['api', 'v1', 'v2', 'json', 'gql']):
                    hidden_apis.append(u)

        # Mining Source Code
        page_source = driver.page_source
        treasures = {}
        for key, pattern in PATTERNS.items():
            matches = re.findall(pattern, page_source)
            if matches: treasures[key] = list(set(matches))

        # Build Output
        final_data = {
            "meta": {"url": target, "time": time.ctime(), "status": "HackedByTrojan"},
            "found_apis": list(set(hidden_apis)),
            "leaked_secrets": treasures
        }

        # Save Logic
        output_content = f"export const XY_EXTRACTED = {json.dumps(final_data, indent=4)};"
        
        # Buat Path
        save_path = f"hasil/{file_path}.js"
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(output_content)
        
        print(f"DATA SECURED AT: {save_path}")

    except Exception as e:
        print(f"CRITICAL ERROR DURING DEPLOY: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    harvest()
