import undetected_chromedriver as uc
import pandas as pd
import requests
import time
import os

# API ENDPOINT FIREBASE TUAN
FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/scraper/request.json"

def get_command():
    try:
        r = requests.get(FIREBASE_URL)
        return r.json()
    except: return None

def harvest():
    cmd = get_command()
    if not cmd: return print("NO TASK")

    print(f"ATTACKING: {cmd['target']}")

    options = uc.ChromeOptions()
    options.add_argument('--headless') # Tetap bisa tembus meski headless
    options.add_argument('--no-sandbox')
    
    # Inisialisasi driver anti-detect
    driver = uc.Chrome(options=options)
    
    try:
        driver.get(cmd['target'])
        time.sleep(15) # Cloudflare butuh waktu untuk verifikasi 'Checking your browser'

        elements = driver.find_elements(uc.By.CSS_SELECTOR, cmd['selector'])
        data = [{"content": e.text, "time": time.ctime()} for e in elements if e.text]

        if data:
            df = pd.DataFrame(data)
            df.to_csv("results.csv", index=False, mode='a', header=not os.path.exists("results.csv"))
            print("HARVEST SUCCESS")
        else:
            print("FAILED: SELECTOR NOT FOUND OR BLOCKED")

    except Exception as e:
        print(f"CRITICAL: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    harvest()
