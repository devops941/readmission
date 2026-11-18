import sys
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_DIR.parent

if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

__path__ = [str(_BACKEND_DIR)]

# Expose main submodule so uvicorn backend.main:app works seamlessly from inside backend/
try:
    import main
    sys.modules["backend.main"] = main
except ImportError:
    pass
