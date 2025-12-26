from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import validates
from datetime import datetime

db = SQLAlchemy()

with open("teams.txt", "r", encoding="utf-8") as f:
    TEAM_NAMES = [line.strip() for line in f.readlines()]



class Game(db.Model):
    __tablename__ = 'games'
    
    id = db.Column(db.Integer, primary_key=True)
    
    player_one_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    player_two_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    
    team_one = db.Column(db.Enum(*TEAM_NAMES,name="team_names"), nullable=False)
    team_two = db.Column(db.Enum(*TEAM_NAMES,name="team_names"), nullable=False)
    
    score_player_one = db.Column(db.Integer, nullable=False)
    score_player_two = db.Column(db.Integer, nullable=False)
    
    winner_id = db.Column(db.Integer, db.ForeignKey('players.id'))
    
    penalty = db.Column(db.Boolean, default=False)
    penalty_score_player_one = db.Column(db.Integer, nullable=True)
    penalty_score_player_two = db.Column(db.Integer, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def calculate_winner(self):
        """Calcule le gagnant basé sur les scores"""
        if self.score_player_one > self.score_player_two:
            self.winner_id = self.player_one_id
        elif self.score_player_two > self.score_player_one:
            self.winner_id = self.player_two_id
        else:
            # Match nul, vérifier les penalties
            if self.penalty:
                if self.penalty_score_player_one and self.penalty_score_player_two:
                    if self.penalty_score_player_one > self.penalty_score_player_two:
                        self.winner_id = self.player_one_id
                    elif self.penalty_score_player_two > self.penalty_score_player_one:
                        self.winner_id = self.player_two_id
                    else:
                        self.winner_id = None
                else:
                    self.winner_id = None
            else:
                self.winner_id = None
        
    
class Player(db.Model):
    __tablename__ = 'players'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    
    # Statistics
    wins = db.Column(db.Integer, default=0, nullable=False)
    losses = db.Column(db.Integer, default=0, nullable=False)
    draws = db.Column(db.Integer, default=0, nullable=False)
    goals_for = db.Column(db.Integer, default=0, nullable=False)
    goals_against = db.Column(db.Integer, default=0, nullable=False)
