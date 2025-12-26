const API_URL = 'http://localhost:5000';
let teams = [];
let players = [];
let selectedPlayers = { player1: null, player2: null };
let selectedTeams = { team1: null, team2: null };
let scores = { score1: 0, score2: 0, penScore1: 0, penScore2: 0 };

// Load initial data
async function loadData() {
    try {
        const [teamsResponse, playersResponse] = await Promise.all([
            fetch(`${API_URL}/api/teams`),
            fetch(`${API_URL}/players`)
        ]);
        
        teams = await teamsResponse.json();
        players = await playersResponse.json();
        
        displayPlayerCards();
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Error loading data', 'error');
    }
}

// Display player cards
function displayPlayerCards() {
    const grid = document.getElementById('playerCardsGrid');
    grid.innerHTML = '';
    
    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <div class="player-card-icon">👤</div>
            <div class="player-card-name">${player.name}</div>
        `;
        card.onclick = () => selectPlayer(player);
        grid.appendChild(card);
    });
}

// Select player
function selectPlayer(player) {
    if (!selectedPlayers.player1) {
        selectedPlayers.player1 = player;
        updatePlayerSelection();
    } else if (!selectedPlayers.player2 && player.id !== selectedPlayers.player1.id) {
        selectedPlayers.player2 = player;
        updatePlayerSelection();
        showMatchDetails();
    }
}

// Update player selection display
function updatePlayerSelection() {
    const cards = document.querySelectorAll('.player-card');
    cards.forEach(card => card.classList.remove('selected', 'disabled'));
    
    if (selectedPlayers.player1) {
        const p1Card = Array.from(cards).find(c => c.textContent.includes(selectedPlayers.player1.name));
        if (p1Card) p1Card.classList.add('selected');
        
        // Disable player 1 card
        cards.forEach(card => {
            if (card.textContent.includes(selectedPlayers.player1.name)) {
                card.classList.add('disabled');
            }
        });
    }
    
    if (selectedPlayers.player2) {
        const p2Card = Array.from(cards).find(c => c.textContent.includes(selectedPlayers.player2.name));
        if (p2Card) p2Card.classList.add('selected');
    }
}

// Show match details section
async function showMatchDetails() {
    document.getElementById('playerSelection').classList.add('completed');
    document.getElementById('matchDetails').classList.remove('hidden');
    
    // Update player badges
    document.getElementById('player1Badge').innerHTML = `
        <div class="badge-icon">👤</div>
        <div class="badge-name">${selectedPlayers.player1.name}</div>
    `;
    document.getElementById('player2Badge').innerHTML = `
        <div class="badge-icon">👤</div>
        <div class="badge-name">${selectedPlayers.player2.name}</div>
    `;
    
    // Update penalty names
    document.getElementById('penaltyName1').textContent = selectedPlayers.player1.name;
    document.getElementById('penaltyName2').textContent = selectedPlayers.player2.name;
    
    // Load favorite teams
    await loadFavoriteTeams();
    
    // Setup team search
    setupTeamSearch(1);
    setupTeamSearch(2);
}

// Load favorite teams for each player
async function loadFavoriteTeams() {
    try {
        const [fav1Response, fav2Response] = await Promise.all([
            fetch(`${API_URL}/api/favorite-teams/${selectedPlayers.player1.id}`),
            fetch(`${API_URL}/api/favorite-teams/${selectedPlayers.player2.id}`)
        ]);
        
        const favorites1 = await fav1Response.json();
        const favorites2 = await fav2Response.json();
        
        displayFavoriteTeams(1, favorites1);
        displayFavoriteTeams(2, favorites2);
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

// Display favorite teams
function displayFavoriteTeams(playerNum, favorites) {
    const container = document.getElementById(`favoriteTeams${playerNum}`);
    container.innerHTML = '';
    
    if (favorites.length === 0) {
        container.innerHTML = '<p class="no-favorites">No favorites yet</p>';
        return;
    }
    
    favorites.forEach(team => {
        const chip = document.createElement('div');
        chip.className = 'team-chip';
        chip.textContent = team;
        chip.onclick = () => selectTeam(playerNum, team);
        container.appendChild(chip);
    });
}

// Setup team search with autocomplete
function setupTeamSearch(playerNum) {
    const input = document.getElementById(`teamSearch${playerNum}`);
    const dropdown = document.getElementById(`teamDropdown${playerNum}`);
    
    input.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        
        if (!value) {
            dropdown.classList.remove('active');
            return;
        }
        
        const filtered = teams.filter(team => 
            team.toLowerCase().includes(value)
        ).slice(0, 10);
        
        if (filtered.length === 0) {
            dropdown.classList.remove('active');
            return;
        }
        
        dropdown.innerHTML = '';
        filtered.forEach(team => {
            const item = document.createElement('div');
            item.className = 'team-dropdown-item';
            item.textContent = team;
            item.onclick = () => {
                selectTeam(playerNum, team);
                input.value = '';
                dropdown.classList.remove('active');
            };
            dropdown.appendChild(item);
        });
        
        dropdown.classList.add('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== input && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

// Select team
function selectTeam(playerNum, teamName) {
    selectedTeams[`team${playerNum}`] = teamName;
    document.getElementById(`selectedTeam${playerNum}`).textContent = teamName;
    document.getElementById(`selectedTeam${playerNum}`).classList.add('has-team');
}

// Change score
function changeScore(playerNum, delta) {
    const key = `score${playerNum}`;
    scores[key] = Math.max(0, scores[key] + delta);
    document.getElementById(key).textContent = scores[key];
}

// Change penalty score
function changePenaltyScore(playerNum, delta) {
    const key = `penScore${playerNum}`;
    scores[key] = Math.max(0, scores[key] + delta);
    document.getElementById(key).textContent = scores[key];
}

// Toggle penalties
function togglePenalties() {
    const isChecked = document.getElementById('penaltyToggle').checked;
    const section = document.getElementById('penaltySection');
    
    if (isChecked) {
        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
        scores.penScore1 = 0;
        scores.penScore2 = 0;
        document.getElementById('penScore1').textContent = '0';
        document.getElementById('penScore2').textContent = '0';
    }
}

// Save match
async function saveMatch() {
    // Validation
    if (!selectedPlayers.player1 || !selectedPlayers.player2) {
        showMessage('❌ Please select two players', 'error');
        return;
    }
    
    if (!selectedTeams.team1 || !selectedTeams.team2) {
        showMessage('❌ Please select teams for both players', 'error');
        return;
    }
    
    const isPenalty = document.getElementById('penaltyToggle').checked;
    
    const matchData = {
        player_one_id: selectedPlayers.player1.id,
        player_two_id: selectedPlayers.player2.id,
        team_one: selectedTeams.team1,
        team_two: selectedTeams.team2,
        score_player_one: scores.score1,
        score_player_two: scores.score2,
        penalty: isPenalty
    };
    
    if (isPenalty) {
        matchData.penalty_score_player_one = scores.penScore1;
        matchData.penalty_score_player_two = scores.penScore2;
    }
    
    const saveBtn = document.querySelector('.btn-save');
    setButtonLoading(saveBtn, true);
    
    try {
        const response = await fetch(`${API_URL}/games`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(matchData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('✅ Match saved successfully!', 'success');
            setTimeout(() => {
                window.location.href = '/history-page';
            }, 1500);
        } else {
            showMessage(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        showMessage('❌ Error saving match', 'error');
        console.error('Error:', error);
    } finally {
        setButtonLoading(saveBtn, false);
    }
}

// Initialize
loadData();
