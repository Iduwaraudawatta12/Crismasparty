let db;

// Initialize IndexedDB
function initDB() {
    const request = indexedDB.open('VotingSystemDB', 1);

    request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.errorCode);
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        loadVotes(); // Load existing votes when DB is ready
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.createObjectStore('votes', { keyPath: 'wattage' });
        objectStore.createIndex('voteCount', 'voteCount', { unique: false });
    };
}

// Cast a vote and update the database
function castVote() {
    const wattageInput = document.getElementById('wattage-input');
    const wattage = parseInt(wattageInput.value, 10);

    if (isNaN(wattage) || wattage < 1 || wattage > 1000) {
        alert('Please enter a valid wattage between 1 and 1000.');
        return;
    }

    const transaction = db.transaction(['votes'], 'readwrite');
    const objectStore = transaction.objectStore('votes');
    const getRequest = objectStore.get(wattage);

    getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
            data.voteCount += 1;
            objectStore.put(data);
        } else {
            objectStore.add({ wattage, voteCount: 1 });
        }
        wattageInput.value = '';
        loadVotes(); // Refresh results
    };
}

// Load votes from IndexedDB and update the UI
function loadVotes() {
    const resultsTable = document.getElementById('results-table');
    resultsTable.innerHTML = '';

    const transaction = db.transaction(['votes'], 'readonly');
    const objectStore = transaction.objectStore('votes');

    const votes = [];
    objectStore.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            votes.push(cursor.value);
            cursor.continue();
        } else {
            // Sort and render results
            votes.sort((a, b) => b.voteCount - a.voteCount);
            votes.forEach((vote) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-4 py-3 border-b border-gray-200">${vote.wattage}W</td>
                    <td class="px-4 py-3 border-b border-gray-200">${vote.voteCount}</td>
                `;
                resultsTable.appendChild(row);
            });
        }
    };
}

// Initialize the database when the page loads
document.addEventListener('DOMContentLoaded', initDB);
