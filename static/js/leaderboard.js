const API_URL = window.location.origin;

async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_URL}/leaderboard`);
        const stats = await response.json();
        
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = '';
        
        if (stats.length === 0) {
            leaderboard.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No matches recorded</p>';
            return;
        }
        
        stats.forEach((player, index) => {
            const div = document.createElement('div');
            div.className = 'leaderboard-item';
            div.style.animationDelay = `${index * 0.1}s`;
            
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            // Déterminer les couleurs
            const rateColor = player.win_rate >= 50 ? '#10b981' : '#ef4444';
            const diffColor = player.goal_difference > 0 ? '#10b981' : player.goal_difference < 0 ? '#ef4444' : '#00d4ff';
            
            div.innerHTML = `
                <div class="rank">${medal || `#${index + 1}`}</div>
                <div class="player-name">${player.name}</div>
                <div class="player-stats">
                    <div class="stat">
                        <span class="stat-label">Wins</span>
                        <span class="stat-value" style="color: #10b981;">${player.wins}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Losses</span>
                        <span class="stat-value" style="color: #ef4444;">${player.losses}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Draws</span>
                        <span class="stat-value" style="color: #fbbf24;">${player.draws}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Matches</span>
                        <span class="stat-value">${player.total_games}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Rate</span>
                        <span class="stat-value" style="color: ${rateColor};">${player.win_rate}%</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Goals For</span>
                        <span class="stat-value" style="color: #10b981;">${player.goals_for}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Goals Against</span>
                        <span class="stat-value" style="color: #ef4444;">${player.goals_against}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Difference</span>
                        <span class="stat-value" style="color: ${diffColor};">${player.goal_difference > 0 ? '+' : ''}${player.goal_difference}</span>
                    </div>
                </div>
            `;
            
            leaderboard.appendChild(div);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

loadLeaderboard();
