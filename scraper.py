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

# POLA HARTA KARUN (Regex untuk cari Token seperti script Spotify)
PATTERNS = {
    "access_tokens": r'["\']accessToken["\']\s*:\s*["\']([^"\']+)["\']',
    "bearer_tokens": r'Bearer\s+([a-zA-Z0-9\-\._~\+\/]+=*)',
    "api_endpoints": r'https?://[\w\.-]+(?:/api/v\d|/v1/search|/graphql)',
    "client_ids": r'["\']clientId["\']\s*:\s*["\']([^"\']+)["\']'
}

def harvest():
    print("XY-SYSTEM: INITIATING DEEP SCAN...")
    res = requests.get(FIREBASE_URL).json()
    if not res or not res.get('target'): return print("NO TARGET")

    target = res['target']
    file_path = res.get('path') or 'default/output'

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    stealth(driver, languages=["en-US"], vendor="Google Inc.", platform="Win32", fix_hairline=True)

    try:
        driver.get(target)
        time.sleep(20) # Tunggu bypass & token muncul

        # 1. AMBIL SOURCE CODE (Cari Token seperti script Spotify)
        page_source = driver.page_source
        scripts = [s.get_attribute('innerHTML') for s in driver.find_elements(By.TAG_NAME, "script") if s.get_attribute('innerHTML')]
        full_scan_area = page_source + "\n".join(scripts)

        findings = {}
        for key, pattern in PATTERNS.items():
            matches = re.findall(pattern, full_scan_area)
            if matches: findings[key] = list(set(matches))

        # 2. AMBIL NETWORK LOGS (Cari URL API yang lagi dipanggil)
        logs = driver.get_log('performance')
        api_calls = []
        for entry in logs:
            msg = json.loads(entry['message'])['message']
            if 'Network.request' in msg['method']:
                u = msg['params']['request']['url']
                if 'api' in u.lower() or 'v1' in u.lower():
                    api_calls.append(u)

        # 3. BUNGKUS JADI JS (Hasil Gacor)
        final_report = {
            "target": target,
            "scraped_at": time.ctime(),
            "secret_tokens": findings, # Ini hasil 'accessToken' dll
            "detected_api_urls": list(set(api_calls)) # Ini hasil 'baseUrl' dll
        }

        output_js = f"// XY-TREASURE-REPORT\nexport const XY_DATA = {json.dumps(final_report, indent=4)};"
        
        save_path = f"hasil/{file_path}.js"
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(output_js)
        
        print(f"HARTA KARUN DIAMANKAN: {save_path}")

    except Exception as e: print(f"ERROR: {e}")
    finally: driver.quit()

if __name__ == "__main__":
    harvest()d
