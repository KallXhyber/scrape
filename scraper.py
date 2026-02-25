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

# POLA HARTA KARUN (API Keys, Endpoints, Secrets)
PATTERNS = {
    "api_endpoints": r'https?://[\w\.-]+(?:/api/[\w\.-/]+|/v\d/[\w\.-/]+)',
    "google_api": r'AIza[0-9A-Za-z-_]{35}',
    "firebase_url": r'https://[\w\.-]+\.firebaseio\.com',
    "jwt_token": r'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+',
    "generic_key": r'(?i)(?:key|api|token|secret|auth|password|pwd)["\s:=>]+["\']?([a-zA-Z0-9-_\.]{16,})["\']?',
    "email_pattern": r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
}

def deep_mining(source_code):
    findings = {}
    for key, pattern in PATTERNS.items():
        matches = re.findall(pattern, source_code)
        if matches:
            findings[key] = list(set(matches)) # Unik saja
    return findings

def harvest():
    res = requests.get(FIREBASE_URL).json()
    if not res or not res.get('target'): return print("NO TARGET")

    target = res['target']
    file_name = res.get('name', 'treasure_hunt')

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    stealth(driver, languages=["en-US"], vendor="Google Inc.", platform="Win32", fix_hairline=True)

    try:
        print(f"BREACHING TARGET: {target}")
        driver.get(target)
        time.sleep(15) # Bypass Cloudflare

        # Ambil seluruh HTML dan Script internal
        page_source = driver.page_source
        scripts = [s.get_attribute('innerHTML') for s in driver.find_elements(By.TAG_NAME, "script") if s.get_attribute('innerHTML')]
        full_text_to_scan = page_source + "\n".join(scripts)

        # MULAI PENAMBANGAN HARTA KARUN
        treasures = deep_mining(full_text_to_scan)

        # Konten standar (Standard Content)
        standard_content = {
            "title": driver.title,
            "all_links": [a.get_attribute('href') for a in driver.find_elements(By.TAG_NAME, "a") if a.get_attribute('href')],
            "images": [img.get_attribute('src') for img in driver.find_elements(By.TAG_NAME, "img") if img.get_attribute('src')]
        }

        # BUNGKUS KE DALAM JAVASCRIPT
        final_output = {
            "target_info": {"url": target, "time": time.ctime()},
            "treasures_found": treasures,
            "standard_data": standard_content
        }

        js_wrapper = f"// TROJAN DEEP EXTRACTOR RESULT\nconst XY_TREASURE = {json.dumps(final_output, indent=4)};\nexport default XY_TREASURE;"
        
        if not os.path.exists('hasil'): os.makedirs('hasil')
        with open(f"hasil/{file_name}.js", "w", encoding="utf-8") as f:
            f.write(js_wrapper)
        
        print(f"HARTA KARUN BERHASIL DIAMANKAN: hasil/{file_name}.js")

    except Exception as e: print(f"CRITICAL ERROR: {e}")
    finally: driver.quit()

if __name__ == "__main__":
    harvest()
