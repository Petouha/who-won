const API_URL = window.location.origin;

// Load players
async function loadPlayers() {
    try {
        const response = await fetch(`${API_URL}/players`);
        const players = await response.json();
        
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        players.forEach(player => {
            const div = document.createElement('div');
            div.className = 'player-item';
            div.textContent = player.name;
            playersList.appendChild(div);
        });
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Add player
document.getElementById('playerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    setButtonLoading(button, true);
    
    const playerName = document.getElementById('playerName').value;
    
    try {
        const response = await fetch(`${API_URL}/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: playerName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(`✅ Player "${playerName}" added successfully!`, 'success');
            document.getElementById('playerName').value = '';
            loadPlayers();
        } else {
            showMessage(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        showMessage('❌ Error adding player', 'error');
        console.error('Error:', error);
    } finally {
        setButtonLoading(button, false);
    }
});

// Load players on page load
loadPlayers();
