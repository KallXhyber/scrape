import os
import time
import requests
import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

# KONFIGURASI FIREBASE TUAN
# Pastikan tambahkan .json di akhir URL untuk akses REST API
FIREBASE_URL = "# SESUAIKAN DENGAN URL DATABASE TUAN
FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/scraper/request.json""

def get_remote_command():
    """Mengambil perintah dari dashboard web tuan"""
    try:
        response = requests.get(FIREBASE_URL)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"FAILED TO FETCH COMMAND: {e}")
        return None

def trojan_execute_scrape():
    print("INITIALIZING TROJAN SCRAPER...")
    command = get_remote_command()
    
    if not command:
        print("NO COMMAND FOUND OR FIREBASE ERROR. ABORTING.")
        return

    target_url = command.get('target')
    selector = command.get('selector')
    
    print(f"TARGET ACQUIRED: {target_url}")
    print(f"SELECTOR SET: {selector}")

    # Headless Mode untuk Cloud Execution
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    
    try:
        driver.get(target_url)
        time.sleep(10) # Menunggu loading halaman, bisa disesuaikan

        # Eksekusi pengambilan data secara massal
        elements = driver.find_elements(By.CSS_SELECTOR, selector)
        harvested_data = []

        for index, el in enumerate(elements):
            text_content = el.text.strip()
            if text_content:
                harvested_data.append({
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "source": target_url,
                    "id": index + 1,
                    "data": text_content
                })

        if harvested_data:
            df = pd.DataFrame(harvested_data)
            output_file = "results.csv"
            # Append data jika file sudah ada, jika tidak buat baru
            df.to_csv(output_file, index=False, mode='a', header=not os.path.exists(output_file))
            print(f"SUCCESS: {len(harvested_data)} ITEMS HARVESTED.")
        else:
            print("WARNING: NO DATA FOUND WITH THAT SELECTOR.")

    except Exception as e:
        print(f"CRITICAL ERROR DURING SCRAPE: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    trojan_execute_scrape()
