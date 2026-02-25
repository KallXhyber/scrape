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

FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/scraper/request.json"

# POLA HARTA KARUN (Regex Gacor)
PATTERNS = {
    "api_endpoints": r'https?://[\w\.-]+(?:/api/[\w\.-/]+|/v\d/[\w\.-/]+|/graphql)',
    "keys": r'(?i)(?:key|api|token|secret|auth|jwt|password)["\s:=>]+["\']?([a-zA-Z0-9-_\.]{16,})["\']?',
    "firebase_links": r'https://[\w\.-]+\.firebaseio\.com',
    "google_api": r'AIza[0-9A-Za-z-_]{35}'
}

def harvest():
    # 1. Ambil Perintah dari Markas (Firebase)
    res = requests.get(FIREBASE_URL).json()
    if not res or not res.get('target'): return print("SYSTEM IDLE: NO TARGET")

    target = res['target']
    file_path = res.get('path', 'default/output')
    print(f"DEPLOYING ATTACK ON: {target}")

    # 2. Setup Driver Gacor
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # Aktifkan Logging Performance untuk Sniffing API
    options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    stealth(driver, languages=["en-US"], vendor="Google Inc.", platform="Win32", fix_hairline=True)

    try:
        driver.get(target)
        time.sleep(20) # Tunggu bypass Cloudflare & Render API

        # 3. Network Sniffing (Mencari URL API tersembunyi)
        logs = driver.get_log('performance')
        hidden_apis = []
        for entry in logs:
            msg = json.loads(entry['message'])['message']
            if 'Network.request' in msg['method']:
                url = msg['params']['request']['url']
                if any(k in url.lower() for k in ['api', 'v1', 'v2', 'json', 'gql']):
                    hidden_apis.append(url)

        # 4. Deep Regex Mining (Cari API Key di Source Code)
        page_source = driver.page_source
        treasures = {}
        for key, pattern in PATTERNS.items():
            matches = re.findall(pattern, page_source)
            if matches: treasures[key] = list(set(matches))

        # 5. Bungkus Hasil
        final_data = {
            "meta": {"url": target, "time": time.ctime(), "engine": "Trojan-v2"},
            "hidden_api_routes": list(set(hidden_apis)),
            "leaked_keys": treasures,
            "html_summary": {"title": driver.title, "links_count": len(driver.find_elements(By.TAG_NAME, "a"))}
        }

        # 6. Simpan secara Terstruktur
        output_js = f"// XY-TREASURE-REPORT\nexport const XY_DATA = {json.dumps(final_data, indent=4)};"
        
        full_dir = os.path.join('hasil', os.path.dirname(file_path))
        if not os.path.exists(full_dir): os.makedirs(full_dir)
        
        target_file = f"hasil/{file_path}.js"
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(output_js)
        
        print(f"SUCCESS: Data tersimpan di {target_file}")

    except Exception as e: print(f"CRITICAL ERROR: {e}")
    finally: driver.quit()

if __name__ == "__main__":
    harvest()
