const API_URL = "http://127.0.0.1:8000";

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "store_auth_token") {
        const dataToStore = { cybershield_token: request.token };
        if (request.origin) {
            dataToStore.dashboard_origin = request.origin;
        }
        chrome.storage.local.set(dataToStore);
        return false;
    }
    
    if (request.action === "clear_auth_token") {
        chrome.storage.local.remove(["cybershield_token", "dashboard_origin"]);
        return false;
    }

    if (request.action === "scan_url") {
        scanUrl(request.url)
            .then(data => sendResponse({ result: data }))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Keep the message channel open for async response
    }
    
    if (request.action === "scan_email") {
        scanEmail(request.content)
            .then(data => sendResponse({ result: data }))
            .catch(error => sendResponse({ error: error.message }));
        return true; 
    }

    if (request.action === "analyze_security") {
        analyzeSecurity(request.url)
            .then(data => sendResponse({ result: data }))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});

// Helper to get auth headers
async function getAuthHeaders() {
    const data = await chrome.storage.local.get("cybershield_token");
    if (data.cybershield_token) {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${data.cybershield_token}`
        };
    }
    return { "Content-Type": "application/json" };
}

// Function to call the backend API
async function scanUrl(url) {
    // Return early/mock response for internal pages or localhost/local IPs to avoid errors and self-scanning loops
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname;
        if (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname.startsWith("192.168.") ||
            hostname.startsWith("10.") ||
            hostname.endsWith(".local")
        ) {
            const mockData = {
                url: url,
                risk_score: 0.0,
                classification: "safe"
            };
            await chrome.storage.local.set({ lastScan: mockData });
            return mockData;
        }
    } catch (e) {
        // Fallback for invalid URLs or non-http/https protocols (like chrome-extension:// or file://)
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            const mockData = {
                url: url,
                risk_score: 0.0,
                classification: "safe"
            };
            await chrome.storage.local.set({ lastScan: mockData });
            return mockData;
        }
    }

    try {
        const response = await fetch(`${API_URL}/scan-url`, {
            method: "POST",
            headers: await getAuthHeaders(),
            body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Save scan result to local storage for the popup to read easily
        await chrome.storage.local.set({ lastScan: data });
        
        return data;
    } catch (error) {
        console.error("Error scanning URL:", error);
        throw error;
    }
}

async function scanEmail(content) {
    try {
        const response = await fetch(`${API_URL}/scan-email`, {
            method: "POST",
            headers: await getAuthHeaders(),
            body: JSON.stringify({ content: content })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error scanning email:", error);
        throw error;
    }
}

async function analyzeSecurity(url) {
    try {
        const response = await fetch(`${API_URL}/analyze-security`, {
            method: "POST",
            headers: await getAuthHeaders(),
            body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error analyzing security:", error);
        throw error;
    }
}

// Optionally: Auto-scan when navigation completes
chrome.webNavigation.onCompleted.addListener((details) => {
    // Only scan main frame
    if (details.frameId === 0) {
        // Exclude browser internal pages
        if (!details.url.startsWith("chrome://") && !details.url.startsWith("edge://") && !details.url.startsWith("about:") && !details.url.startsWith("chrome-extension://")) {
            scanUrl(details.url).then(result => {
                if (result.classification === "phishing") {
                    // Trigger warning (will implement in Stage 3)
                    console.log("PHISHING DETECTED:", details.url);
                }
            }).catch(e => console.error(e));
        }
    }
});

// Send heartbeat to backend so dashboard knows extension is active
setInterval(async () => {
    try {
        const headers = await getAuthHeaders();
        if (headers.Authorization) {
            await fetch(`${API_URL}/ping`, { 
                method: "POST",
                headers: headers 
            });
        }
    } catch (e) {
        // Ignore errors for heartbeat
    }
}, 15000);
