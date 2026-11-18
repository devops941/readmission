import sys
from pathlib import Path

# Add backend parent to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import settings
from backend.db.repositories import UserRepository
from backend.security import hash_password

def seed_users():
    user_repo = UserRepository()
    
    users_to_create = [
        {
            "email": settings.ADMIN_EMAIL,
            "password": settings.ADMIN_PASSWORD,
            "full_name": "System Administrator",
            "role": "Admin",
            "institution": "Hospital Health System"
        },
        {
            "email": "analyst@readmitexplain.local",
            "password": "Analyst@2026!",
            "full_name": "Devops Lead Analyst",
            "role": "Analyst",
            "institution": "Clinical Analytics & Quality Dept"
        },
        {
            "email": "reviewer@readmitexplain.local",
            "password": "Reviewer@2026!",
            "full_name": "Dr. Sarah Mitchell, MD",
            "role": "Clinical Reviewer",
            "institution": "Quality Review Board"
        }
    ]
    
    for u in users_to_create:
        existing = user_repo.get_by_email(u["email"])
        if not existing:
            pwd_hash = hash_password(u["password"])
            user_repo.create({
                "email": u["email"],
                "password_hash": pwd_hash,
                "full_name": u["full_name"],
                "role": u["role"],
                "institution": u["institution"]
            })
            print(f"Created user: {u['email']} [{u['role']}]")
        else:
            print(f"User already exists: {u['email']} [{existing.get('role')}]")

if __name__ == "__main__":
    seed_users()
