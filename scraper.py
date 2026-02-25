import os
import time
import requests
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium_stealth import stealth

FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/scraper/request.json"

def get_command():
    try:
        r = requests.get(FIREBASE_URL)
        return r.json()
    except: return None

def harvest():
    cmd = get_command()
    if not cmd or not cmd.get('target'):
        print("COMMAND KOSONG DI FIREBASE")
        return

    print(f"ATTACKING: {cmd['target']}")

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)

    # Otomatis download driver yang cocok dengan versi Chrome di Github
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    # TEKNOLOGI STEALTH: Menyamar jadi manusia asli
    stealth(driver,
        languages=["en-US", "en"],
        vendor="Google Inc.",
        platform="Win32",
        webgl_vendor="Intel Inc.",
        renderer="Intel Iris OpenGL Engine",
        fix_hairline=True,
    )

    try:
        driver.get(cmd['target'])
        time.sleep(15) # Menunggu Cloudflare Turnstile selesai

        elements = driver.find_elements(By.CSS_SELECTOR, cmd['selector'])
        harvested = []
        for el in elements:
            if el.text.strip():
                harvested.append({"data": el.text.strip(), "time": time.ctime()})

        if harvested:
            df = pd.DataFrame(harvested)
            output = "results.csv"
            df.to_csv(output, index=False, mode='a', header=not os.path.exists(output))
            print(f"SUCCESS: {len(harvested)} ITEMS HARVESTED")
        else:
            print("FAILED: DATA TIDAK DITEMUKAN (SELECTOR SALAH ATAU BLOKIR)")
            # Screenshot untuk debugging jika gagal
            driver.save_screenshot("error_debug.png")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    harvest()
