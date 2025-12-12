from typing import Dict, List, Optional
from datetime import date, datetime, timedelta
from models import User, LeaderboardEntry, ActivePlayer, GameMode, Direction, Point

# Mock Data Store
class MockDatabase:
    def __init__(self):
        self.users: Dict[str, User] = {}
        # Store passwords separately for simplicity in this mock
        self.passwords: Dict[str, str] = {}
        self.leaderboard: List[LeaderboardEntry] = []
        self._init_data()

    def _init_data(self):
        # Initialize with data matching frontend mock
        
        # 1. Fake Users
        self._add_user("user-demo", "demo", "demo@example.com", "password", 5000)
        self._add_user("user-1", "SnakeMaster", "master@snake.com", "pass123", 2450)
        self._add_user("user-2", "PixelPro", "pixel@game.com", "pass123", 2100)
        self._add_user("user-3", "NeonNinja", "neon@city.com", "pass123", 1650)
        
        # 2. Leaderboard
        self._add_leaderboard_entry("1", "SnakeMaster", 2450, GameMode.WALLS, "2024-12-10")
        self._add_leaderboard_entry("2", "PixelPro", 2100, GameMode.PASS_THROUGH, "2024-12-10")
        self._add_leaderboard_entry("3", "RetroGamer", 1890, GameMode.WALLS, "2024-12-09")
        self._add_leaderboard_entry("4", "NeonNinja", 1650, GameMode.PASS_THROUGH, "2024-12-09")
        self._add_leaderboard_entry("5", "ArcadeKing", 1420, GameMode.WALLS, "2024-12-08")
        self._add_leaderboard_entry("6", "CyberSnake", 1200, GameMode.PASS_THROUGH, "2024-12-08")
        self._add_leaderboard_entry("7", "BitBiter", 980, GameMode.WALLS, "2024-12-07")
        self._add_leaderboard_entry("8", "GridRunner", 850, GameMode.PASS_THROUGH, "2024-12-07")
        self._add_leaderboard_entry("9", "VoidViper", 720, GameMode.WALLS, "2024-12-06")
        self._add_leaderboard_entry("10", "DigitalDragon", 600, GameMode.PASS_THROUGH, "2024-12-06")

    def _add_user(self, id: str, username: str, email: str, password: str, high_score: int):
        user = User(
            id=id,
            username=username,
            email=email,
            highScore=high_score,
            createdAt=datetime.now()
        )
        self.users[id] = user
        self.passwords[id] = password

    def _add_leaderboard_entry(self, id: str, username: str, score: int, mode: GameMode, date_str: str):
        self.leaderboard.append(LeaderboardEntry(
            id=id,
            username=username,
            score=score,
            mode=mode,
            date=date.fromisoformat(date_str)
        ))

    def create_user(self, user: User, password: str):
        self.users[user.id] = user
        self.passwords[user.id] = password

    def get_user_by_email(self, email: str) -> Optional[User]:
        for user in self.users.values():
            if user.email == email:
                return user
        return None

    def get_user_by_username(self, username: str) -> Optional[User]:
        for user in self.users.values():
            if user.username == username:
                return user
        return None

    def check_password(self, user_id: str, password: str) -> bool:
        return self.passwords.get(user_id) == password

    def add_score(self, entry: LeaderboardEntry):
        self.leaderboard.append(entry)
        self.leaderboard.sort(key=lambda x: x.score, reverse=True)

    def get_active_players(self) -> List[ActivePlayer]:
        # Return simulated active players
        return [
            ActivePlayer(
                id="player-1",
                username="SnakeMaster",
                score=340,
                mode=GameMode.WALLS,
                snake=[Point(x=10, y=10), Point(x=9, y=10), Point(x=8, y=10)],
                food=Point(x=15, y=12),
                direction=Direction.RIGHT,
            ),
             ActivePlayer(
                id="player-2",
                username="NeonNinja",
                score=180,
                mode=GameMode.PASS_THROUGH,
                snake=[Point(x=5, y=5), Point(x=5, y=4), Point(x=5, y=3)],
                food=Point(x=12, y=8),
                direction=Direction.DOWN,
            ),
        ]

db = MockDatabase()
