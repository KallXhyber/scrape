const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Ganti URL ini dengan URL Realtime Database tuan
const FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/scraper/request.json";

async function hunt() {
    console.log(" [SYS] XY-DARK-OS STARTING...");
    
    try {
        // 1. Ambil Perintah dari Firebase
        const { data } = await axios.get(FIREBASE_URL);
        if (!data || !data.target) return console.log(" [!] NO SIGNAL DETECTED.");

        const target = data.target;
        const domain = new URL(target).hostname.replace(/\./g, '_');
        const savePath = path.join(__dirname, 'hasil', 'auto', `${domain}.js`);

        console.log(` [>] BREACHING: ${target}`);

        // 2. Launch Stealth Browser
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // 3. Sniffing Network & Tokens
        const treasures = {
            api_endpoints: [],
            tokens: []
        };

        page.on('request', request => {
            const url = request.url();
            if (url.includes('api') || url.includes('v1') || url.includes('token')) {
                treasures.api_endpoints.push(url);
            }
        });

        await page.goto(target, { waitUntil: 'networkidle2', timeout: 60000 });

        // Mining Token dari Source Code (Regex Gacor)
        const content = await page.content();
        const tokenMatch = content.match(/["']accessToken["']\s*:\s*["']([^"']+)["']/g);
        if (tokenMatch) treasures.tokens = tokenMatch;

        // 4. Save to Result Folder
        const finalData = {
            meta: { target, time: new Date().toLocaleString(), author: "Kall & XyTeam" },
            data: treasures
        };

        const outputJS = `// XY-REPORT-GENERATED\nexport const XY_TREASURE = ${JSON.stringify(finalData, null, 4)};`;
        
        fs.mkdirSync(path.dirname(savePath), { recursive: true });
        fs.writeFileSync(savePath, outputJS);

        console.log(` [OK] DATA SECURED: hasil/auto/${domain}.js`);
        await browser.close();

    } catch (err) {
        console.log(` [ERR] CRITICAL_CRASH: ${err.message}`);
    }
}

hunt();
