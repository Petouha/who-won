const API_URL = window.location.origin;
let teams = [];
let players = [];

// Load teams and players
async function loadData() {
    try {
        // Load teams
        const teamsResponse = await fetch(`${API_URL}/api/teams`);
        teams = await teamsResponse.json();
        
        // Load players
        const playersResponse = await fetch(`${API_URL}/players`);
        players = await playersResponse.json();
        
        // Populate player selects
        const player1Select = document.getElementById('player1');
        const player2Select = document.getElementById('player2');
        
        players.forEach(player => {
            const option1 = document.createElement('option');
            option1.value = player.id;
            option1.textContent = player.name;
            player1Select.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = player.id;
            option2.textContent = player.name;
            player2Select.appendChild(option2);
        });
        
        // Charger les données pré-remplies si elles existent
        loadPrefilledData();
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Error loading data', 'error');
    }
}

// Charger les données pré-remplies depuis le randomizer
function loadPrefilledData() {
    const prefilledData = sessionStorage.getItem('prefilledMatch');
    if (!prefilledData) return;
    
    try {
        const data = JSON.parse(prefilledData);
        
        // Remplir les joueurs
        if (data.player1Id) {
            document.getElementById('player1').value = data.player1Id;
        }
        if (data.player2Id) {
            document.getElementById('player2').value = data.player2Id;
        }
        
        // Remplir les équipes
        if (data.team1) {
            document.getElementById('team1').value = data.team1;
        }
        if (data.team2) {
            document.getElementById('team2').value = data.team2;
        }
        
        // Nettoyer le sessionStorage
        sessionStorage.removeItem('prefilledMatch');
        
        // Afficher un message
        showMessage('✨ Teams loaded from randomizer', 'success');
    } catch (error) {
        console.error('Error loading prefilled data:', error);
    }
}

// Autocomplete for teams
function setupAutocomplete(inputId, autocompleteId) {
    const input = document.getElementById(inputId);
    const autocompleteList = document.getElementById(autocompleteId);
    
    input.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        
        if (!value) {
            autocompleteList.classList.remove('active');
            return;
        }
        
        const filtered = teams.filter(team => 
            team.toLowerCase().includes(value)
        ).slice(0, 10);
        
        if (filtered.length === 0) {
            autocompleteList.classList.remove('active');
            return;
        }
        
        autocompleteList.innerHTML = '';
        filtered.forEach(team => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.textContent = team;
            div.addEventListener('click', () => {
                input.value = team;
                autocompleteList.classList.remove('active');
            });
            autocompleteList.appendChild(div);
        });
        
        autocompleteList.classList.add('active');
    });
    
    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== input) {
            autocompleteList.classList.remove('active');
        }
    });
}

// Toggle penalty scores
document.getElementById('penaltyCheck').addEventListener('change', (e) => {
    const penaltyScores = document.getElementById('penaltyScores');
    if (e.target.checked) {
        penaltyScores.classList.remove('hidden');
    } else {
        penaltyScores.classList.add('hidden');
        document.getElementById('penScore1').value = '';
        document.getElementById('penScore2').value = '';
    }
});

// Submit match
document.getElementById('matchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    setButtonLoading(button, true);
    
    const formData = {
        player_one_id: parseInt(document.getElementById('player1').value),
        player_two_id: parseInt(document.getElementById('player2').value),
        team_one: document.getElementById('team1').value,
        team_two: document.getElementById('team2').value,
        score_player_one: parseInt(document.getElementById('score1').value),
        score_player_two: parseInt(document.getElementById('score2').value),
        penalty: document.getElementById('penaltyCheck').checked
    };
    
    if (formData.penalty) {
        formData.penalty_score_player_one = parseInt(document.getElementById('penScore1').value) || 0;
        formData.penalty_score_player_two = parseInt(document.getElementById('penScore2').value) || 0;
    }
    
    try {
        const response = await fetch(`${API_URL}/games`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('✅ Match saved successfully!', 'success');
            e.target.reset();
            document.getElementById('penaltyScores').classList.add('hidden');
        } else {
            showMessage(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        showMessage('❌ Error saving match', 'error');
        console.error('Error:', error);
    } finally {
        setButtonLoading(button, false);
    }
});

// Initialize
loadData();
setupAutocomplete('team1', 'autocomplete1');
setupAutocomplete('team2', 'autocomplete2');
