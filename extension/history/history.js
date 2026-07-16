const API_URL = "http://localhost:8000";

document.addEventListener('DOMContentLoaded', () => {
    fetchHistory();
});

async function fetchHistory() {
    const tbody = document.getElementById('history-body');
    const errorEl = document.getElementById('error-message');
    
    try {
        const tokenData = await chrome.storage.local.get("cybershield_token");
        if (!tokenData.cybershield_token) {
            errorEl.textContent = "Please log in to your CyberShield AI dashboard to view history.";
            errorEl.style.display = 'block';
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">Not authenticated. Please log in.</td></tr>';
            return;
        }

        const response = await fetch(`${API_URL}/history`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tokenData.cybershield_token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token might be invalid/expired
                chrome.storage.local.remove("cybershield_token");
                throw new Error("Authentication failed. Please log in again.");
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        renderTable(data, tbody);
        
    } catch (error) {
        console.error("Failed to fetch history:", error);
        tbody.innerHTML = '';
        errorEl.textContent = error.message.includes("Authentication") 
            ? error.message 
            : "Failed to connect to the CyberShield AI Backend. Is the server running?";
        errorEl.style.display = 'block';
    }
}

function renderTable(data, tbody) {
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No scan history found.</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const tr = document.createElement('tr');
        
        // Format date
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleString();
        
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${formattedDate}</td>
            <td class="url-cell" title="${item.url}">${item.url}</td>
            <td>${item.risk_score}</td>
            <td class="classification-${item.classification}">${item.classification.toUpperCase()}</td>
        `;
        
        tbody.appendChild(tr);
    });
}
