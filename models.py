from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import validates
from datetime import datetime

db = SQLAlchemy()


class Game(db.Model):
    __tablename__ = 'games'
    
    id = db.Column(db.Integer, primary_key=True)
    
    player_one_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    player_two_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    
    team_one = db.Column(db.String(100), nullable=False)
    team_two = db.Column(db.String(100), nullable=False)
    
    score_player_one = db.Column(db.Integer, nullable=False)
    score_player_two = db.Column(db.Integer, nullable=False)
    
    winner_id = db.Column(db.Integer, db.ForeignKey('players.id'))
    
    penalty = db.Column(db.Boolean, default=False)
    penalty_score_player_one = db.Column(db.Integer, nullable=True)
    penalty_score_player_two = db.Column(db.Integer, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    @validates('team_one', 'team_two')
    def validate_team(self, key, team):
        """Validate team names"""
        if not team or not team.strip():
            raise ValueError(f"{key} cannot be empty")
        if len(team) > 100:
            raise ValueError(f"{key} is too long (max 100 characters)")
        return team.strip()
    
    @validates('player_one_id', 'player_two_id')
    def validate_different_players(self, key, player_id):
        """Validate that both players are different"""
        if key == 'player_two_id' and hasattr(self, 'player_one_id') and self.player_one_id:
            if player_id == self.player_one_id:
                raise ValueError("Both players must be different")
        return player_id
    
    @validates('score_player_one', 'score_player_two')
    def validate_score(self, key, score):
        """Validate that scores are non-negative"""
        if score < 0:
            raise ValueError(f"{key} cannot be negative")
        return score
    
    def calculate_winner(self):
        """Calculate winner based on scores"""
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
