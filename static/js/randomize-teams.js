const API_URL = 'http://localhost:5000';
let allTeams = [];
let excludedTeams = [];
let currentMatchup = null;
let players = [];
let selectedPlayers = { player1: null, player2: null };

// Charger les données au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

async function loadData() {
    try {
        const [teamsResponse, playersResponse] = await Promise.all([
            fetch(`${API_URL}/api/team-ratings`),
            fetch(`${API_URL}/players`)
        ]);
        
        allTeams = await teamsResponse.json();
        players = await playersResponse.json();
        
        displayPlayerCards();
        setupTeamSearch();
        updateExcludedTeamsDisplay(); // Initialiser l'affichage vide
    } catch (error) {
        console.error('Error loading data:', error);
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
    // Si on clique sur un joueur déjà sélectionné, le désélectionner
    if (selectedPlayers.player1 && selectedPlayers.player1.id === player.id) {
        selectedPlayers.player1 = null;
        selectedPlayers.player2 = null;
        hideConfigAndResult();
        updatePlayerSelection();
        return;
    }
    
    if (selectedPlayers.player2 && selectedPlayers.player2.id === player.id) {
        selectedPlayers.player2 = null;
        hideConfigAndResult();
        updatePlayerSelection();
        return;
    }
    
    // Sélectionner les joueurs
    if (!selectedPlayers.player1) {
        selectedPlayers.player1 = player;
        updatePlayerSelection();
    } else if (!selectedPlayers.player2 && player.id !== selectedPlayers.player1.id) {
        selectedPlayers.player2 = player;
        updatePlayerSelection();
        showConfigSection();
    } else if (selectedPlayers.player1 && selectedPlayers.player2) {
        // Si les deux joueurs sont déjà sélectionnés, remplacer le deuxième
        selectedPlayers.player2 = player;
        updatePlayerSelection();
        showConfigSection();
    }
}

// Hide config and result sections
function hideConfigAndResult() {
    document.getElementById('playerSelection').classList.remove('completed');
    document.getElementById('configSection').classList.add('hidden');
    document.getElementById('configSection').classList.remove('completed');
    document.getElementById('matchupResult').classList.add('hidden');
}

// Update player selection display
function updatePlayerSelection() {
    const cards = document.querySelectorAll('.player-card');
    cards.forEach(card => {
        card.classList.remove('selected', 'disabled');
        // Les cartes restent toujours cliquables
        card.style.pointerEvents = 'auto';
        card.style.opacity = '1';
    });
    
    if (selectedPlayers.player1) {
        const p1Card = Array.from(cards).find(c => c.textContent.includes(selectedPlayers.player1.name));
        if (p1Card) {
            p1Card.classList.add('selected');
        }
    }
    
    if (selectedPlayers.player2) {
        const p2Card = Array.from(cards).find(c => c.textContent.includes(selectedPlayers.player2.name));
        if (p2Card) {
            p2Card.classList.add('selected');
        }
    }
}

// Show configuration section
function showConfigSection() {
    document.getElementById('playerSelection').classList.add('completed');
    document.getElementById('configSection').classList.remove('hidden');
    document.getElementById('configSection').scrollIntoView({ behavior: 'smooth' });
}

// Setup team search with autocomplete
function setupTeamSearch() {
    const searchInput = document.getElementById('teamSearch');
    const dropdown = document.getElementById('teamSuggestions');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm.length < 2) {
            dropdown.classList.remove('active');
            dropdown.innerHTML = '';
            return;
        }
        
        const matches = allTeams.filter(team => 
            team.name.toLowerCase().includes(searchTerm) && 
            !excludedTeams.includes(team.name)
        ).slice(0, 10);
        
        if (matches.length === 0) {
            dropdown.innerHTML = '<div class="team-dropdown-item">No teams found</div>';
            dropdown.classList.add('active');
            return;
        }
        
        dropdown.innerHTML = matches.map(team => `
            <div class="team-dropdown-item" onclick="addExcludedTeam('${team.name.replace(/'/g, "\\'")}')">
                <span>${team.name}</span>
                <span class="team-rating-small">${team.overall}</span>
            </div>
        `).join('');
        
        dropdown.classList.add('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.team-search-container')) {
            dropdown.classList.remove('active');
        }
    });
}

function addExcludedTeam(teamName) {
    if (excludedTeams.includes(teamName)) return;
    
    excludedTeams.push(teamName);
    updateExcludedTeamsDisplay();
    
    document.getElementById('teamSearch').value = '';
    document.getElementById('teamSuggestions').classList.remove('active');
    document.getElementById('teamSuggestions').innerHTML = '';
}

function removeExcludedTeam(teamName) {
    excludedTeams = excludedTeams.filter(t => t !== teamName);
    updateExcludedTeamsDisplay();
}

function updateExcludedTeamsDisplay() {
    const container = document.getElementById('excludedTeamsContainer');
    
    if (excludedTeams.length === 0) {
        container.innerHTML = '<div class="empty-state">No teams excluded</div>';
        return;
    }
    
    container.innerHTML = excludedTeams.map(team => `
        <span class="tag">
            ${team}
            <button class="tag-remove" onclick="removeExcludedTeam('${team.replace(/'/g, "\\'")}')">×</button>
        </span>
    `).join('');
}

async function randomizeTeams(event) {
    const minRating = parseInt(document.getElementById('minRating').value);
    const maxRating = parseInt(document.getElementById('maxRating').value);
    
    if (minRating > maxRating) {
        showMessage('❌ Minimum rating cannot be greater than maximum rating', 'error');
        return;
    }
    
    // Détecter si c'est la première fois ou un re-randomize
    const isFirstTime = document.getElementById('matchupResult').classList.contains('hidden');
    
    const button = event ? event.target.closest('.btn') : document.querySelector('.btn-randomize');
    setButtonLoading(button, true);
    
    try {
        const response = await fetch(`${API_URL}/api/randomize-teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                min_rating: minRating,
                max_rating: maxRating,
                excluded_teams: excludedTeams
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            showMessage(error.error || 'Error randomizing teams', 'error');
            return;
        }
        
        currentMatchup = await response.json();
        currentMatchup.player1Id = selectedPlayers.player1.id;
        currentMatchup.player2Id = selectedPlayers.player2.id;
        
        displayMatchup(isFirstTime);
    } catch (error) {
        console.error('Error randomizing teams:', error);
        showMessage('❌ Error randomizing teams', 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

function displayMatchup(isFirstTime = true) {
    // Update player badges
    document.getElementById('player1Badge').innerHTML = `
        <div class="badge-icon">👤</div>
        <div class="badge-name">${selectedPlayers.player1.name}</div>
    `;
    document.getElementById('player2Badge').innerHTML = `
        <div class="badge-icon">👤</div>
        <div class="badge-name">${selectedPlayers.player2.name}</div>
    `;
    
    // Team 1
    document.getElementById('team1Name').textContent = currentMatchup.team1.name;
    document.getElementById('team1League').textContent = currentMatchup.team1.league;
    document.getElementById('team1Overall').textContent = currentMatchup.team1.overall;
    document.getElementById('team1Attack').textContent = currentMatchup.team1.attack;
    document.getElementById('team1Midfield').textContent = currentMatchup.team1.midfield;
    document.getElementById('team1Defence').textContent = currentMatchup.team1.defence;
    
    // Team 2
    document.getElementById('team2Name').textContent = currentMatchup.team2.name;
    document.getElementById('team2League').textContent = currentMatchup.team2.league;
    document.getElementById('team2Overall').textContent = currentMatchup.team2.overall;
    document.getElementById('team2Attack').textContent = currentMatchup.team2.attack;
    document.getElementById('team2Midfield').textContent = currentMatchup.team2.midfield;
    document.getElementById('team2Defence').textContent = currentMatchup.team2.defence;
    
    // Rating difference
    document.getElementById('ratingDiff').textContent = currentMatchup.rating_difference;
    
    // Show result section only the first time
    if (isFirstTime) {
        document.getElementById('configSection').classList.add('completed');
        document.getElementById('matchupResult').classList.remove('hidden');
        document.getElementById('matchupResult').scrollIntoView({ behavior: 'smooth' });
    }
}

function reRandomize() {
    // Just re-randomize without hiding the result section
    randomizeTeams(null);
}

function acceptMatchup() {
    if (!currentMatchup) return;
    
    // Store data in sessionStorage for add-match-alt
    const matchData = {
        player1Id: currentMatchup.player1Id,
        player2Id: currentMatchup.player2Id,
        team1: currentMatchup.team1.name,
        team2: currentMatchup.team2.name
    };
    
    sessionStorage.setItem('prefilledMatch', JSON.stringify(matchData));
    
    // Navigate to add-match-alt
    window.location.href = '/add-match-alt-page';
}

function showMessage(message, type = 'success') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type} show`;
    
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 3000);
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}
