const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/scraper/request.json";

// Middleware agar file di folder hasil bisa diakses publik
app.use('/harta-karun', express.static(path.join(__dirname, 'hasil')));

// Fungsi Utama: Scraper
async function runScraper() {
    console.log(" [SYS] INITIATING DEEP SCAN...");
    try {
        const { data } = await axios.get(FIREBASE_URL);
        if (!data || !data.target) return;

        const target = data.target;
        const domain = new URL(target).hostname.replace(/\./g, '_');
        const savePath = path.join(__dirname, 'hasil', 'auto', `${domain}.js`);

        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const treasures = { endpoints: [], tokens: [] };
        page.on('request', req => {
            if (req.url().match(/api|v1|graphql|token/i)) treasures.endpoints.push(req.url());
        });

        await page.goto(target, { waitUntil: 'networkidle2', timeout: 60000 });
        const content = await page.content();
        const tokens = content.match(/["']accessToken["']\s*:\s*["']([^"']+)["']/g);
        if (tokens) treasures.tokens = tokens;

        const report = {
            meta: { target, time: new Date().toLocaleString(), author: "PoweredBy Kall & XyTeam" },
            data: treasures
        };

        fs.mkdirSync(path.dirname(savePath), { recursive: true });
        fs.writeFileSync(savePath, `export const XY_DATA = ${JSON.stringify(report, null, 4)};`);

        console.log(` [OK] BREACH SUCCESS: ${domain}.js`);
        await browser.close();
    } catch (err) {
        console.log(` [ERR] ${err.message}`);
    }
}

// Route untuk cek status server
app.get('/', (req, res) => {
    res.send({ status: "XY-SYSTEMS ACTIVE", message: "Use /harta-karun to see results" });
});

app.listen(PORT, () => {
    console.log(` [SYS] OS SERVER RUNNING ON PORT ${PORT}`);
    // Jalankan scraper otomatis setiap 1 jam jika di server, 
    // atau biarkan GitHub Actions yang pemicunya.
});

// Jalankan sekali saat start
runScraper();
