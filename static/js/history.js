const API_URL = window.location.origin;
let allGames = [];
let allPlayers = [];
let playerMap = {};

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'chronological') {
        document.getElementById('chronologicalTab').classList.add('active');
    } else {
        document.getElementById('matchupTab').classList.add('active');
    }
}

// Load all data
async function loadData() {
    try {
        const [gamesResponse, playersResponse] = await Promise.all([
            fetch(`${API_URL}/games`),
            fetch(`${API_URL}/players`)
        ]);
        
        allGames = await gamesResponse.json();
        allPlayers = await playersResponse.json();
        
        // Create player lookup (store full object)
        allPlayers.forEach(p => playerMap[p.id] = p);
        
        loadChronological();
        populateMatchupSelectors();
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Error loading history', 'error');
    }
}

// Load chronological view
function loadChronological() {
    const chronologicalList = document.getElementById('chronologicalList');
    chronologicalList.innerHTML = '';
    
    if (allGames.length === 0) {
        chronologicalList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No matches recorded</p>';
        return;
    }
    
    // Sort by date (most recent first)
    const sortedGames = [...allGames].sort((a, b) => b.id - a.id);
    
    sortedGames.forEach((game, index) => {
        const matchDiv = createMatchCard(game, index);
        chronologicalList.appendChild(matchDiv);
    });
}

// Create match card
function createMatchCard(game, index) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match-item';
    matchDiv.style.animationDelay = `${index * 0.05}s`;
    
    const p1Name = playerMap[game.player_one_id]?.name || 'Unknown';
    const p2Name = playerMap[game.player_two_id]?.name || 'Unknown';
    const winner = game.winner_id ? (playerMap[game.winner_id]?.name || 'Unknown') : 'Draw';
    const isP1Winner = game.winner_id === game.player_one_id;
    const isP2Winner = game.winner_id === game.player_two_id;
    const isP1Loser = game.winner_id && game.winner_id === game.player_two_id;
    const isP2Loser = game.winner_id && game.winner_id === game.player_one_id;
    const isDraw = !game.winner_id;
    
    // Format date and time from created_at
    let dateStr = '';
    let timeStr = '';
    if (game.created_at) {
        const date = new Date(game.created_at);
        dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    matchDiv.innerHTML = `
        <div class="match-header">
            <span style="color: var(--text-muted); font-size: 0.9rem;">Match #${game.id}</span>
            <span style="color: var(--success); font-weight: 900; font-size: 1.3rem;">🏆 ${winner}</span>
            ${dateStr ? `<span style="color: var(--text-muted); font-size: 0.9rem;">📅 ${dateStr} • 🕐 ${timeStr}</span>` : '<span></span>'}
        </div>
        <div class="match-players-display">
            <div class="player-display ${isP1Winner ? 'winner' : ''} ${isP1Loser ? 'loser' : ''} ${isDraw ? 'draw' : ''}">
                <div style="font-size: 1.2rem; font-weight: 700;">${p1Name}</div>
                <div class="team-name">${game.team_one}</div>
            </div>
            <div class="score-display">
                <div class="main-score">${game.score}</div>
                ${game.penalty ? `<div class="penalty-badge">Penalties: ${game.penalty_score}</div>` : ''}
            </div>
            <div class="player-display ${isP2Winner ? 'winner' : ''} ${isP2Loser ? 'loser' : ''} ${isDraw ? 'draw' : ''}">
                <div style="font-size: 1.2rem; font-weight: 700;">${p2Name}</div>
                <div class="team-name">${game.team_two}</div>
            </div>
        </div>
    `;
    
    return matchDiv;
}

// Populate matchup selectors
function populateMatchupSelectors() {
    const select1 = document.getElementById('matchupPlayer1');
    const select2 = document.getElementById('matchupPlayer2');
    
    allPlayers.forEach(player => {
        const option1 = document.createElement('option');
        option1.value = player.id;
        option1.textContent = player.name;
        select1.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = player.id;
        option2.textContent = player.name;
        select2.appendChild(option2);
    });
    
    // Add change listeners
    select1.addEventListener('change', loadMatchup);
    select2.addEventListener('change', loadMatchup);
    
    // Show matchup suggestions
    displayMatchupSuggestions();
}

// Display matchup suggestions
function displayMatchupSuggestions() {
    const suggestionsDiv = document.getElementById('matchupSuggestions');
    
    // Find all unique matchups with at least 1 game
    const matchupMap = new Map();
    
    allGames.forEach(game => {
        const p1 = Math.min(game.player_one_id, game.player_two_id);
        const p2 = Math.max(game.player_one_id, game.player_two_id);
        const key = `${p1}-${p2}`;
        
        if (!matchupMap.has(key)) {
            matchupMap.set(key, {
                player1Id: p1,
                player2Id: p2,
                player1Name: playerMap[p1]?.name || 'Unknown',
                player2Name: playerMap[p2]?.name || 'Unknown',
                count: 0
            });
        }
        matchupMap.get(key).count++;
    });
    
    // Convert to array and sort by game count
    const matchups = Array.from(matchupMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, Math.min(10, matchupMap.size)); // Max 10 suggestions
    
    if (matchups.length === 0) {
        suggestionsDiv.innerHTML = '';
        return;
    }
    
    suggestionsDiv.innerHTML = `
        <div class="suggestions-title">Quick Access:</div>
        <div class="suggestions-chips">
            ${matchups.map(m => `
                <button class="suggestion-chip" 
                        onclick="selectMatchup(${m.player1Id}, ${m.player2Id})">
                    <span class="chip-players">${m.player1Name} vs ${m.player2Name}</span>
                    <span class="chip-count">${m.count}</span>
                </button>
            `).join('')}
        </div>
    `;
}

// Select a matchup from suggestions
function selectMatchup(player1Id, player2Id) {
    document.getElementById('matchupPlayer1').value = player1Id;
    document.getElementById('matchupPlayer2').value = player2Id;
    loadMatchup();
}

// Load matchup view
function loadMatchup() {
    const player1Id = parseInt(document.getElementById('matchupPlayer1').value);
    const player2Id = parseInt(document.getElementById('matchupPlayer2').value);
    
    if (!player1Id || !player2Id) {
        document.getElementById('matchupStats').classList.add('hidden');
        document.getElementById('matchupList').innerHTML = '';
        return;
    }
    
    if (player1Id === player2Id) {
        document.getElementById('matchupStats').classList.add('hidden');
        document.getElementById('matchupList').innerHTML = '<p style="text-align: center; color: var(--text-muted);">Please select two different players</p>';
        return;
    }
    
    // Filter games for this matchup
    const matchupGames = allGames.filter(game => 
        (game.player_one_id === player1Id && game.player_two_id === player2Id) ||
        (game.player_one_id === player2Id && game.player_two_id === player1Id)
    );
    
    if (matchupGames.length === 0) {
        document.getElementById('matchupStats').classList.add('hidden');
        document.getElementById('matchupList').innerHTML = '<p style="text-align: center; color: var(--text-muted);">No matches between these players</p>';
        return;
    }
    
    // Calculate stats
    const stats = calculateMatchupStats(matchupGames, player1Id, player2Id);
    displayMatchupStats(stats);
    displayMatchupGames(matchupGames);
}

// Calculate matchup statistics
function calculateMatchupStats(games, player1Id, player2Id) {
    const player1 = playerMap[player1Id];
    const player2 = playerMap[player2Id];
    
    // Calculate head-to-head stats from the filtered games
    let p1WinsRegular = 0, p1WinsPenalty = 0;
    let p2WinsRegular = 0, p2WinsPenalty = 0;
    let p1Losses = 0, p2Losses = 0;
    let p1Draws = 0, p2Draws = 0;
    let p1GoalsFor = 0, p1GoalsAgainst = 0;
    let p2GoalsFor = 0, p2GoalsAgainst = 0;
    
    games.forEach(game => {
        // Determine who is player_one and player_two in this game
        const isP1AsPlayerOne = game.player_one_id === player1Id;
        
        // Calculate goals
        if (isP1AsPlayerOne) {
            p1GoalsFor += game.score_player_one;
            p1GoalsAgainst += game.score_player_two;
            p2GoalsFor += game.score_player_two;
            p2GoalsAgainst += game.score_player_one;
        } else {
            p1GoalsFor += game.score_player_two;
            p1GoalsAgainst += game.score_player_one;
            p2GoalsFor += game.score_player_one;
            p2GoalsAgainst += game.score_player_two;
        }
        
        // Calculate wins/losses/draws
        if (game.winner_id === player1Id) {
            p1WinsRegular += game.penalty ? 0 : 1;
            p1WinsPenalty += game.penalty ? 1 : 0;
            p2Losses++;
        } else if (game.winner_id === player2Id) {
            p2WinsRegular += game.penalty ? 0 : 1;
            p2WinsPenalty += game.penalty ? 1 : 0;
            p1Losses++;
        } else {
            p1Draws++;
            p2Draws++;
        }
    });
    
    const stats = {
        player1: {
            id: player1Id,
            name: player1.name,
            wins: p1WinsRegular + p1WinsPenalty,
            winsRegular: p1WinsRegular,
            winsPenalty: p1WinsPenalty,
            losses: p1Losses,
            draws: p1Draws,
            goalsFor: p1GoalsFor,
            goalsAgainst: p1GoalsAgainst
        },
        player2: {
            id: player2Id,
            name: player2.name,
            wins: p2WinsRegular + p2WinsPenalty,
            winsRegular: p2WinsRegular,
            winsPenalty: p2WinsPenalty,
            losses: p2Losses,
            draws: p2Draws,
            goalsFor: p2GoalsFor,
            goalsAgainst: p2GoalsAgainst
        },
        totalGames: games.length
    };
    
    return stats;
}

// Display matchup stats
function displayMatchupStats(stats) {
    const statsDiv = document.getElementById('matchupStats');
    statsDiv.classList.remove('hidden');
    
    statsDiv.innerHTML = `
        <div class="matchup-stats-grid">
            <div class="player-stats-card">
                <h3>${stats.player1.name}</h3>
                <div class="stats-row">
                    <div class="stat-item">
                        <span class="stat-label">Wins</span>
                        <span class="stat-value success">${stats.player1.wins}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Regular</span>
                        <span class="stat-value">${stats.player1.winsRegular}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Penalties</span>
                        <span class="stat-value">${stats.player1.winsPenalty}</span>
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-item">
                        <span class="stat-label">Losses</span>
                        <span class="stat-value danger">${stats.player1.losses}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Draws</span>
                        <span class="stat-value">${stats.player1.draws}</span>
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-item">
                        <span class="stat-label">Goals For</span>
                        <span class="stat-value success">${stats.player1.goalsFor}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Goals Against</span>
                        <span class="stat-value danger">${stats.player1.goalsAgainst}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Difference</span>
                        <span class="stat-value ${stats.player1.goalsFor - stats.player1.goalsAgainst > 0 ? 'success' : stats.player1.goalsFor - stats.player1.goalsAgainst < 0 ? 'danger' : ''}">${stats.player1.goalsFor - stats.player1.goalsAgainst > 0 ? '+' : ''}${stats.player1.goalsFor - stats.player1.goalsAgainst}</span>
                    </div>
                </div>
            </div>
            
            <div class="vs-divider-stats">
                <div class="total-games">${stats.totalGames}</div>
                <div class="games-label">Matches</div>
            </div>
            
            <div class="player-stats-card">
                <h3>${stats.player2.name}</h3>
                <div class="stats-row">
                    <div class="stat-item">
                        <span class="stat-label">Wins</span>
                        <span class="stat-value success">${stats.player2.wins}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Regular</span>
                        <span class="stat-value">${stats.player2.winsRegular}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Penalties</span>
                        <span class="stat-value">${stats.player2.winsPenalty}</span>
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-item">
                        <span class="stat-label">Losses</span>
                        <span class="stat-value danger">${stats.player2.losses}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Draws</span>
                        <span class="stat-value">${stats.player2.draws}</span>
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-item">
                        <span class="stat-label">Goals For</span>
                        <span class="stat-value success">${stats.player2.goalsFor}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Goals Against</span>
                        <span class="stat-value danger">${stats.player2.goalsAgainst}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Difference</span>
                        <span class="stat-value ${stats.player2.goalsFor - stats.player2.goalsAgainst > 0 ? 'success' : stats.player2.goalsFor - stats.player2.goalsAgainst < 0 ? 'danger' : ''}">${stats.player2.goalsFor - stats.player2.goalsAgainst > 0 ? '+' : ''}${stats.player2.goalsFor - stats.player2.goalsAgainst}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Display matchup games
function displayMatchupGames(games) {
    const matchupList = document.getElementById('matchupList');
    matchupList.innerHTML = '';
    
    // Sort by most recent first
    const sortedGames = [...games].sort((a, b) => b.id - a.id);
    
    sortedGames.forEach((game, index) => {
        const matchDiv = createMatchCard(game, index);
        matchupList.appendChild(matchDiv);
    });
}

// Initialize
loadData();
