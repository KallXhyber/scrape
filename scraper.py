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
    if not cmd or not cmd.get('target'): 
        print("NO VALID TASK IN FIREBASE")
        return

    print(f"ATTACKING TARGET: {cmd['target']}")

    options = uc.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    # Bypass deteksi bot level tinggi
    driver = uc.Chrome(options=options)
    
    try:
        driver.get(cmd['target'])
        time.sleep(15) # Menunggu Cloudflare Turnstile/Challenge selesai

        elements = driver.find_elements(uc.By.CSS_SELECTOR, cmd['selector'])
        data = [{"content": e.text.strip(), "time": time.strftime("%H:%M:%S")} for e in elements if e.text.strip()]

        if data:
            df = pd.DataFrame(data)
            output = "results.csv"
            df.to_csv(output, index=False, mode='a', header=not os.path.exists(output))
            print(f"SUCCESS: {len(data)} ITEMS HARVESTED")
        else:
            print("FAILED: NO DATA FOUND OR BLOCKED BY CLOUDFLARE")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    harvest()
