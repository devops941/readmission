from typing import Any, Dict, Optional
from backend.config import settings

def apply_cell_suppression(n: int, events: int, min_cell_size: int = None, min_events: int = None) -> Dict[str, Any]:
    min_size = min_cell_size or settings.MIN_CELL_SIZE
    min_ev = min_events or settings.MIN_EVENTS_SUBGROUP
    
    if n < min_size or events < min_ev:
        return {
            "n": n if n >= 5 else "< 5",
            "events": "< 5",
            "rate": None,
            "suppressed": True,
            "reason": f"Small cell count (n < {min_size} or events < {min_ev}) suppressed for privacy and statistical stability"
        }
    
    rate = round(float(events / n), 4) if n > 0 else 0.0
    return {
        "n": n,
        "events": events,
        "rate": rate,
        "suppressed": False,
        "reason": None
    }
