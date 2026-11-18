import sys
from pathlib import Path
import uvicorn

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from backend.config import settings

if __name__ == "__main__":
    print(f"Starting ReadmitExplain AI Backend on http://{settings.APP_HOST}:{settings.APP_PORT}...")
    uvicorn.run("backend.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)
