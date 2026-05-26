document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const authData = await chrome.storage.local.get("cybershield_token");
    if (!authData.cybershield_token) {
        document.querySelector('main').innerHTML = `
            <div style="text-align: center; padding: 30px 20px;">
                <h2 style="color: #ef4444; margin-bottom: 12px; font-size: 20px;">Not Logged In</h2>
                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">Please log in to your CyberShield AI dashboard to use the extension features.</p>
                <a href="http://localhost:5173/login" target="_blank" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Open Dashboard</a>
            </div>
        `;
        return;
    }

    const statusCard = document.getElementById('status-card');
    const statusText = document.getElementById('status-text');
    const riskScoreEl = document.getElementById('risk-score');
    const currentUrlEl = document.getElementById('current-url');
    const scanBtn = document.getElementById('scan-btn');
    const scanEmailBtn = document.getElementById('scan-email-btn');
    const historyBtn = document.getElementById('history-btn');
    const summaryContainer = document.getElementById('email-summary');
    const summaryTextEl = document.getElementById('summary-text');
    const findingsContainer = document.getElementById('email-findings');
    const findingsList = document.getElementById('findings-list');
    
    // Security elements
    const analyzeSecurityBtn = document.getElementById('analyze-security-btn');
    const securityResultsContainer = document.getElementById('security-results');
    const portsList = document.getElementById('ports-list');
    const vulnList = document.getElementById('vuln-list');

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url) {
        currentUrlEl.textContent = tab.url;
        
        // Try to get cached result first
        chrome.storage.local.get(['lastScan'], (result) => {
            if (result.lastScan && result.lastScan.url === tab.url) {
                updateUI(result.lastScan);
            } else {
                // Trigger a new scan
                triggerScan(tab.url);
            }
        });
    }

    scanBtn.addEventListener('click', () => {
        if (tab && tab.url) {
            statusCard.className = 'status-card unknown';
            statusText.textContent = 'Scanning...';
            riskScoreEl.textContent = '-';
            summaryContainer.style.display = 'none';
            findingsContainer.style.display = 'none';
            securityResultsContainer.style.display = 'none';
            triggerScan(tab.url);
        }
    });

    scanEmailBtn.addEventListener('click', () => {
        if (tab && tab.id) {
            statusCard.className = 'status-card unknown';
            statusText.textContent = 'Scanning Email...';
            riskScoreEl.textContent = '-';
            summaryContainer.style.display = 'none';
            findingsContainer.style.display = 'none';
            securityResultsContainer.style.display = 'none';
            currentUrlEl.textContent = "Analyzing page content...";
            
            // Use scripting API to extract text reliably without needing a page refresh
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    return document.body.innerText || document.body.textContent;
                }
            }).then((injectionResults) => {
                if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                    // Send to background for API call
                    triggerEmailScan(injectionResults[0].result);
                } else {
                    statusText.textContent = "No Text Found";
                }
            }).catch((err) => {
                statusText.textContent = "Error: Cannot Scan";
                currentUrlEl.textContent = "Cannot scan this page (e.g. browser settings pages). Try a normal website.";
                console.error("Script injection error:", err);
            });
        }
    });

    historyBtn.addEventListener('click', () => {
        // Open the history page in a new full browser tab
        chrome.tabs.create({ url: chrome.runtime.getURL("history/history.html") });
    });

    analyzeSecurityBtn.addEventListener('click', () => {
        if (tab && tab.url) {
            statusCard.className = 'status-card unknown';
            statusText.textContent = 'Checking Security...';
            riskScoreEl.textContent = '-';
            summaryContainer.style.display = 'none';
            findingsContainer.style.display = 'none';
            securityResultsContainer.style.display = 'none';
            
            chrome.runtime.sendMessage({ action: "analyze_security", url: tab.url }, (response) => {
                if (response && response.result) {
                    updateSecurityUI(response.result);
                } else {
                    statusText.textContent = "Error";
                    console.error(response?.error);
                }
            });
        }
    });

    function triggerScan(url) {
        chrome.runtime.sendMessage({ action: "scan_url", url: url }, (response) => {
            if (response && response.result) {
                updateUI(response.result);
            } else {
                statusText.textContent = "Error";
                console.error(response?.error);
            }
        });
    }

    function triggerEmailScan(content) {
        chrome.runtime.sendMessage({ action: "scan_email", content: content }, (response) => {
            if (response && response.result) {
                updateUI(response.result, true);
            } else {
                statusText.textContent = "Error";
                console.error(response?.error);
            }
        });
    }

    function updateUI(data, isEmail = false) {
        // Update classes based on classification
        statusCard.className = 'status-card';
        statusCard.classList.add(data.classification); // "safe", "suspicious", "phishing"

        // Update text
        statusText.textContent = data.classification.toUpperCase();
        riskScoreEl.textContent = data.risk_score;
        
        if (isEmail) {
            currentUrlEl.textContent = "Email Analysis Complete";
            
            if (data.summary) {
                summaryContainer.style.display = 'block';
                summaryTextEl.textContent = `"${data.summary}"`;
            } else {
                summaryContainer.style.display = 'none';
            }
            
            if (data.findings && data.findings.length > 0) {
                findingsContainer.style.display = 'block';
                findingsList.innerHTML = '';
                data.findings.forEach(finding => {
                    const li = document.createElement('li');
                    li.textContent = finding;
                    findingsList.appendChild(li);
                });
            } else {
                findingsContainer.style.display = 'none';
            }
        } else {
            // Hide email-specific UI when scanning URLs
            summaryContainer.style.display = 'none';
            findingsContainer.style.display = 'none';
        }
    }

    function updateSecurityUI(data) {
        statusCard.className = 'status-card';
        statusCard.classList.add("safe"); // Neutral for security scan
        statusText.textContent = "ANALYSIS COMPLETE";
        currentUrlEl.textContent = data.url;
        
        securityResultsContainer.style.display = 'block';
        
        // Update Ports
        portsList.innerHTML = '';
        if (data.open_ports && data.open_ports.length > 0) {
            data.open_ports.forEach(port => {
                const li = document.createElement('li');
                li.textContent = `Port ${port}`;
                li.style.color = "#ef4444"; // Red for open ports
                portsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "No common open ports detected.";
            li.style.color = "#10b981"; // Green for safe
            portsList.appendChild(li);
        }
        
        // Update Vulnerabilities
        vulnList.innerHTML = '';
        if (data.vulnerabilities && data.vulnerabilities.length > 0) {
            data.vulnerabilities.forEach(vuln => {
                const li = document.createElement('li');
                li.textContent = vuln;
                li.style.color = "#ef4444";
                vulnList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "No common header vulnerabilities detected.";
            li.style.color = "#10b981";
            vulnList.appendChild(li);
        }
    }
});
