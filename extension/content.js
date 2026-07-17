// Content script runs in the context of the web page
console.log("Cyber content script loaded");

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_email") {
        // Extract visible text from the page body
        const pageText = document.body.innerText || document.body.textContent;
        sendResponse({ text: pageText });
    }
});

// Listen for authentication events from the Dashboard website
window.addEventListener("message", (event) => {
    // In production, you should verify event.origin matches the dashboard domain
    if (event.data && event.data.type === 'CYBERSHIELD_LOGIN') {
        chrome.runtime.sendMessage({ 
            action: 'store_auth_token', 
            token: event.data.token,
            origin: event.origin || window.location.origin
        });
        console.log("CyberShield AI: Auth token synced from dashboard via message.");
    }
    if (event.data && event.data.type === 'CYBERSHIELD_LOGOUT') {
        chrome.runtime.sendMessage({ 
            action: 'clear_auth_token' 
        });
        console.log("CyberShield AI: Auth token cleared.");
    }
    // Respond to dashboard status checks
    if (event.data && event.data.type === 'CHECK_EXTENSION_STATUS') {
        window.postMessage({ type: 'EXTENSION_STATUS_REPLY' }, '*');
    }
});

// Proactively check for token if on the dashboard domain (fixes race condition if message is missed)
if (window.location.hostname.includes("cybershield-ai-0007.netlify.app") || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    const token = window.localStorage.getItem("token");
    if (token) {
        chrome.runtime.sendMessage({ 
            action: 'store_auth_token', 
            token: token,
            origin: window.location.origin
        });
        console.log("CyberShield AI: Auth token synced proactively from localStorage.");
    }
}

function detectFakeLoginForm() {
    const forms = document.querySelectorAll('form');
    let hasSuspiciousForm = false;
    let reasons = [];

    forms.forEach(form => {
        const passwordFields = form.querySelectorAll('input[type="password"]');
        if (passwordFields.length > 0) {
            // It's a login form
            const action = form.getAttribute('action');
            if (action) {
                try {
                    const actionUrl = new URL(action, window.location.href);
                    const currentUrl = new URL(window.location.href);
                    
                    // If the form submits to a different domain, it's suspicious
                    if (actionUrl.hostname !== currentUrl.hostname) {
                        hasSuspiciousForm = true;
                        reasons.push("Login form submits to a different domain.");
                    }
                    
                    // If the form submits via HTTP instead of HTTPS
                    if (actionUrl.protocol === 'http:' && currentUrl.protocol === 'https:') {
                        hasSuspiciousForm = true;
                        reasons.push("Login form submits via insecure HTTP.");
                    }
                } catch (e) {
                    console.error("Error parsing form action URL:", e);
                }
            } else {
                 // Form has no action, might be handled by JS (could be normal, but sometimes suspicious)
            }
        }
    });

    return { hasSuspiciousForm, reasons };
}

function scanCurrentPage() {
    const currentUrl = window.location.href;
    
    // Analyze forms on the page
    const formAnalysis = detectFakeLoginForm();
    
    // Send URL and form data to background script for analysis
    chrome.runtime.sendMessage({ 
        action: "scan_url", 
        url: currentUrl,
        formAnalysis: formAnalysis
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error communicating with background script:", chrome.runtime.lastError);
            return;
        }
        
        if (response && response.result) {
            console.log("Scan Result:", response.result);
            
            // Override result if we found a highly suspicious form on a non-phishing scored site
            if (formAnalysis.hasSuspiciousForm && response.result.classification !== "phishing") {
                 response.result.classification = "suspicious";
                 response.result.risk_score = Math.max(response.result.risk_score, 65);
                 console.warn("Cyber: Adjusted classification due to suspicious login form.");
            }

            if (response.result.classification === "phishing") {
                showWarningOverlay(response.result);
            }
        }
    });
}

function showWarningOverlay(result) {
    // Stage 3: Full-page warning overlay
    const overlay = document.createElement('div');
    overlay.id = "phishguard-warning-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(239, 68, 68, 0.95);
        color: white;
        z-index: 9999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        text-align: center;
        padding: 20px;
    `;
    
    overlay.innerHTML = `
        <h1 style="font-size: 3rem; margin-bottom: 10px;">⚠️ Cyber Warning</h1>
        <h2 style="font-size: 2rem; margin-bottom: 20px;">DANGEROUS WEBSITE DETECTED</h2>
        <p style="font-size: 1.2rem; max-width: 600px; margin-bottom: 30px;">
            This website has been classified as a phishing threat. It may attempt to steal your passwords, personal information, or credit card details.
        </p>
        <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p><strong>URL:</strong> ${result.url}</p>
            <p><strong>Threat Score:</strong> ${result.risk_score}/100</p>
        </div>
        <div>
            <button id="phishguard-leave-btn" style="padding: 15px 30px; font-size: 1.2rem; font-weight: bold; background: white; color: #ef4444; border: none; border-radius: 8px; cursor: pointer; margin-right: 15px;">
                Leave this site (Recommended)
            </button>
            <button id="phishguard-proceed-btn" style="padding: 15px 30px; font-size: 1rem; background: transparent; color: white; border: 2px solid white; border-radius: 8px; cursor: pointer;">
                Ignore risk and proceed
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('phishguard-leave-btn').addEventListener('click', () => {
        window.history.back();
        // Fallback if no history
        setTimeout(() => { window.location.href = "https://www.google.com"; }, 100);
    });
    
    document.getElementById('phishguard-proceed-btn').addEventListener('click', () => {
        overlay.remove();
    });
}

// Initial scan when page loads
// Small delay to allow DOM to render forms
setTimeout(scanCurrentPage, 1000);
