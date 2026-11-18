import logging
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from backend.config import settings

logger = logging.getLogger(__name__)

_client: MongoClient = None

def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            connectTimeoutMS=settings.MONGODB_TIMEOUT_MS
        )
    return _client

def get_database(db_name: str = None) -> Database:
    client = get_mongo_client()
    target_name = db_name or settings.MONGODB_DB_NAME
    return client[target_name]

def ping_database() -> bool:
    try:
        client = get_mongo_client()
        res = client.admin.command("ping")
        return bool(res.get("ok"))
    except Exception as e:
        logger.error(f"MongoDB ping failed: {e}")
        return False

def ensure_indexes(db: Database = None):
    if db is None:
        db = get_database()
    
    # users
    db.users.create_index([("email", ASCENDING)], unique=True)
    
    # encounters
    db.encounters.create_index([("dataset_id", ASCENDING), ("encounter_id", ASCENDING)], unique=True)
    db.encounters.create_index([("dataset_id", ASCENDING), ("discharge_month", ASCENDING)])
    db.encounters.create_index([("dataset_id", ASCENDING), ("readmit_30d", ASCENDING)])
    
    # datasets
    db.datasets.create_index([("created_at", DESCENDING)])
    
    # dictionary
    db.data_dictionary.create_index([("dataset_id", ASCENDING), ("variable", ASCENDING)], unique=True)
    
    # model_runs
    db.model_runs.create_index([("dataset_id", ASCENDING), ("created_at", DESCENDING)])
    db.model_runs.create_index([("status", ASCENDING)])
    
    # explanations
    db.explanations.create_index([("model_id", ASCENDING)])
    
    # cohorts
    db.cohorts.create_index([("dataset_id", ASCENDING), ("name", ASCENDING)])
    
    # expert_reviews
    db.expert_reviews.create_index([("model_id", ASCENDING), ("created_at", DESCENDING)])
    
    # alerts
    db.alerts.create_index([("model_id", ASCENDING), ("created_at", DESCENDING)])
    
    # audit_log
    db.audit_log.create_index([("timestamp", DESCENDING)])
    
    # import_jobs
    db.import_jobs.create_index([("created_at", DESCENDING)])
    
    logger.info("MongoDB indexes verified.")
