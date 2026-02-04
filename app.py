from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from models import db, Game, Player
import csv

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fifa.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db.init_app(app)

# Cache en mémoire pour les team ratings
_team_ratings_cache = None

def load_team_ratings():
    """Charge les ratings des équipes depuis le CSV (avec cache)"""
    global _team_ratings_cache
    
    if _team_ratings_cache is not None:
        return _team_ratings_cache
    
    teams = []
    try:
        with open('team_ratings.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                teams.append({
                    'id': row['id'],
                    'name': row['name'],
                    'league': row['league'],
                    'overall': int(row['overall']),
                    'attack': int(row['attack']),
                    'midfield': int(row['midfield']),
                    'defence': int(row['defence'])
                })
        _team_ratings_cache = teams
        print(f"✅ Team ratings loaded in cache: {len(teams)} teams")
    except Exception as e:
        print(f"❌ Error loading team ratings: {e}")
        return []
    
    return teams

# Créer les tables et charger le cache au démarrage
with app.app_context():
    db.create_all()
    load_team_ratings()  # Précharger le cache

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/players-page')
def players_page():
    return render_template('players.html')

@app.route('/add-match-page')
def add_match_page():
    return render_template('add-match-alt.html')

@app.route('/history-page')
def history_page():
    return render_template('history.html')

@app.route('/leaderboard-page')
def leaderboard_page():
    return render_template('leaderboard.html')

@app.route('/randomize-teams-page')
def randomize_teams_page():
    return render_template('randomize-teams.html')

@app.route('/api/teams', methods=['GET'])
def get_teams():
    """Retourne la liste des équipes depuis teams.txt"""
    try:
        with open('teams.txt', 'r', encoding='utf-8') as f:
            teams = [line.strip() for line in f if line.strip()]
        return jsonify(teams)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/favorite-teams/<int:player_id>', methods=['GET'])
def get_favorite_teams(player_id):
    """Retourne les équipes les plus utilisées par un joueur"""
    try:
        # Get all games for this player
        games = Game.query.filter(
            (Game.player_one_id == player_id) | (Game.player_two_id == player_id)
        ).all()
        
        # Count team usage
        team_counts = {}
        for game in games:
            if game.player_one_id == player_id:
                team = game.team_one
            else:
                team = game.team_two
            team_counts[team] = team_counts.get(team, 0) + 1
        
        # Sort by usage and get top 5
        sorted_teams = sorted(team_counts.items(), key=lambda x: x[1], reverse=True)
        favorite_teams = [team for team, count in sorted_teams[:5]]
        
        return jsonify(favorite_teams)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/team-ratings', methods=['GET'])
def get_team_ratings():
    """Retourne toutes les équipes avec leurs ratings (depuis le cache)"""
    teams = load_team_ratings()
    if not teams:
        return jsonify({"error": "Failed to load team ratings"}), 500
    return jsonify(teams)

@app.route('/api/randomize-teams', methods=['POST'])
def randomize_teams():
    """Randomise deux équipes selon les critères (depuis le cache)"""
    import random
    
    data = request.get_json()
    min_rating = data.get('min_rating', 70)
    max_rating = data.get('max_rating', 90)
    excluded_teams = data.get('excluded_teams', [])
    
    try:
        # Utiliser le cache au lieu de relire le CSV
        all_teams = load_team_ratings()
        
        # Filtrer selon les critères
        teams = [
            team for team in all_teams
            if team['name'] not in excluded_teams 
            and min_rating <= team['overall'] <= max_rating
        ]
        
        if len(teams) < 2:
            return jsonify({"error": "Pas assez d'équipes disponibles avec ces critères"}), 400
        
        # Sélectionner la première équipe
        team1 = random.choice(teams)
        
        # Trouver des équipes avec un rating similaire (±2)
        team1_rating = team1['overall']
        balanced_teams = [t for t in teams if t['name'] != team1['name'] 
                         and abs(t['overall'] - team1_rating) <= 1]
        
        # Si pas assez d'équipes équilibrées, élargir la recherche
        if not balanced_teams:
            balanced_teams = [t for t in teams if t['name'] != team1['name']]
        
        team2 = random.choice(balanced_teams) if balanced_teams else None
        
        if not team2:
            return jsonify({"error": "Impossible de trouver un matchup équilibré"}), 400
        
        return jsonify({
            'team1': team1,
            'team2': team2,
            'rating_difference': abs(team1['overall'] - team2['overall'])
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api')
def api_home():
    return jsonify({"message": "API FIFA Match Tracker", "endpoints": [
        "GET /players",
        "POST /players",
        "GET /games",
        "POST /games",
        "GET /leaderboard"
    ]})

@app.route('/players', methods=['GET'])
def get_players():
    players = Player.query.all()
    return jsonify([{
        "id": p.id, 
        "name": p.name,
        "wins": p.wins,
        "losses": p.losses,
        "draws": p.draws,
        "goals_for": p.goals_for,
        "goals_against": p.goals_against
    } for p in players])

@app.route('/players', methods=['POST'])
def add_player():
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"error": "Le nom du joueur est requis"}), 400
    
    # Vérifier si un joueur avec ce nom existe déjà (insensible à la casse)
    existing_player = Player.query.filter(Player.name.ilike(data['name'])).first()
    if existing_player:
        return jsonify({"error": f"Un joueur avec le nom '{data['name']}' existe déjà"}), 409
    
    player = Player(name=data['name'])
    db.session.add(player)
    db.session.commit()
    return jsonify({"id": player.id, "name": player.name}), 201

@app.route('/games', methods=['GET'])
def get_games():
    games = Game.query.all()
    result = []
    for g in games:
        result.append({
            "id": g.id,
            "player_one_id": g.player_one_id,
            "player_two_id": g.player_two_id,
            "team_one": g.team_one,
            "team_two": g.team_two,
            "score": f"{g.score_player_one}-{g.score_player_two}",
            "penalty": g.penalty,
            "penalty_score": f"{g.penalty_score_player_one}-{g.penalty_score_player_two}" if g.penalty else None,
            "winner_id": g.winner_id,
            "created_at": g.created_at.isoformat() if g.created_at else None
        })
    return jsonify(result)

@app.route('/games', methods=['POST'])
def add_game():
    data = request.get_json()
    
    # Validation
    required = ['player_one_id', 'player_two_id', 'team_one', 'team_two', 
                'score_player_one', 'score_player_two']
    for field in required:
        if field not in data:
            return jsonify({"error": f"Le champ '{field}' est requis"}), 400
    
    # Créer le match
    game = Game(
        player_one_id=data['player_one_id'],
        player_two_id=data['player_two_id'],
        team_one=data['team_one'],
        team_two=data['team_two'],
        score_player_one=data['score_player_one'],
        score_player_two=data['score_player_two'],
        penalty=data.get('penalty', False),
        penalty_score_player_one=data.get('penalty_score_player_one'),
        penalty_score_player_two=data.get('penalty_score_player_two')
    )
    
    # Calculer le gagnant
    game.calculate_winner()
    
    # Mettre à jour les stats des joueurs
    player1 = Player.query.get(data['player_one_id'])
    player2 = Player.query.get(data['player_two_id'])
    
    if player1 and player2:
        # Update goals
        player1.goals_for += data['score_player_one']
        player1.goals_against += data['score_player_two']
        player2.goals_for += data['score_player_two']
        player2.goals_against += data['score_player_one']
        
        # Update wins/losses/draws
        if game.winner_id == player1.id:
            player1.wins += 1
            player2.losses += 1
        elif game.winner_id == player2.id:
            player2.wins += 1
            player1.losses += 1
        else:
            player1.draws += 1
            player2.draws += 1
    
    db.session.add(game)
    db.session.commit()
    
    return jsonify({
        "id": game.id,
        "winner_id": game.winner_id,
        "message": "Match enregistré avec succès"
    }), 201

@app.route('/leaderboard', methods=['GET'])
def leaderboard():
    players = Player.query.all()
    stats = []
    
    for player in players:
        total_games = player.wins + player.losses + player.draws
        goal_difference = player.goals_for - player.goals_against
        
        stats.append({
            "player_id": player.id,
            "name": player.name,
            "wins": player.wins,
            "losses": player.losses,
            "draws": player.draws,
            "total_games": total_games,
            "win_rate": round(player.wins / total_games * 100, 2) if total_games > 0 else 0,
            "goals_for": player.goals_for,
            "goals_against": player.goals_against,
            "goal_difference": goal_difference
        })
    
    # Trier par nombre de victoires
    stats.sort(key=lambda x: x['wins'], reverse=True)
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)