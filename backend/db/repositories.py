from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from backend.db.mongo import get_database

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def sanitize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
        elif isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc

class BaseRepository:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    @property
    def col(self):
        return get_database()[self.collection_name]

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__("users")

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        doc = self.col.find_one({"email": email.strip().lower()})
        return sanitize_doc(doc)

    def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = self.col.find_one({"_id": ObjectId(user_id)})
            return sanitize_doc(doc)
        except Exception:
            return None

    def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        data = dict(user_data)
        data["email"] = data["email"].strip().lower()
        data["created_at"] = utc_now()
        data["failed_logins"] = 0
        data["locked_until"] = None
        res = self.col.insert_one(data)
        data["id"] = str(res.inserted_id)
        if "_id" in data:
            del data["_id"]
        return data

    def update_login_attempt(self, email: str, success: bool, lockout_minutes: int = 15, max_failed: int = 5):
        email = email.strip().lower()
        user = self.get_by_email(email)
        if not user:
            return
        if success:
            self.col.update_one({"email": email}, {"$set": {"failed_logins": 0, "locked_until": None, "last_login": utc_now()}})
        else:
            failed = user.get("failed_logins", 0) + 1
            update_data = {"failed_logins": failed}
            if failed >= max_failed:
                from datetime import timedelta
                update_data["locked_until"] = utc_now() + timedelta(minutes=lockout_minutes)
            self.col.update_one({"email": email}, {"$set": update_data})

    def list_all(self) -> List[Dict[str, Any]]:
        docs = list(self.col.find({}, {"password_hash": 0}).sort("created_at", -1))
        return [sanitize_doc(d) for d in docs]

class DatasetRepository(BaseRepository):
    def __init__(self):
        super().__init__("datasets")

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(data)
        doc["created_at"] = utc_now()
        res = self.col.insert_one(doc)
        doc["id"] = str(res.inserted_id)
        if "_id" in doc:
            del doc["_id"]
        return doc

    def get_by_id(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = self.col.find_one({"_id": ObjectId(dataset_id)})
            return sanitize_doc(doc)
        except Exception:
            return None

    def get_latest_or_default(self) -> Optional[Dict[str, Any]]:
        doc = self.col.find_one({}, sort=[("created_at", -1)])
        return sanitize_doc(doc)

    def list_all(self) -> List[Dict[str, Any]]:
        docs = list(self.col.find().sort("created_at", -1))
        return [sanitize_doc(d) for d in docs]

    def update_stats(self, dataset_id: str, row_count: int, readmit_rate: float):
        try:
            self.col.update_one(
                {"_id": ObjectId(dataset_id)},
                {"$set": {"row_count": row_count, "readmit_rate": readmit_rate, "updated_at": utc_now()}}
            )
        except Exception:
            pass

class EncounterRepository(BaseRepository):
    def __init__(self):
        super().__init__("encounters")

    def insert_batch(self, dataset_id: str, records: List[Dict[str, Any]]):
        if not records:
            return 0
        docs = []
        for r in records:
            doc = dict(r)
            doc["dataset_id"] = dataset_id
            docs.append(doc)
        res = self.col.insert_many(docs, ordered=False)
        return len(res.inserted_ids)

    def count(self, dataset_id: str, query: Dict[str, Any] = None) -> int:
        q = {"dataset_id": dataset_id}
        if query:
            q.update(query)
        return self.col.count_documents(q)

    def get_records(self, dataset_id: str, query: Dict[str, Any] = None, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        q = {"dataset_id": dataset_id}
        if query:
            q.update(query)
        docs = list(self.col.find(q).skip(skip).limit(limit))
        return [sanitize_doc(d) for d in docs]

    def get_all_records(self, dataset_id: str, projection: Dict[str, int] = None) -> List[Dict[str, Any]]:
        docs = list(self.col.find({"dataset_id": dataset_id}, projection))
        return [sanitize_doc(d) for d in docs]

    def get_by_encounter_id(self, dataset_id: str, encounter_id: str) -> Optional[Dict[str, Any]]:
        doc = self.col.find_one({"dataset_id": dataset_id, "encounter_id": encounter_id})
        return sanitize_doc(doc)

    def upsert_one(self, dataset_id: str, record: Dict[str, Any]) -> str:
        data = dict(record)
        data["dataset_id"] = dataset_id
        enc_id = data.get("encounter_id")
        res = self.col.update_one(
            {"dataset_id": dataset_id, "encounter_id": enc_id},
            {"$set": data},
            upsert=True
        )
        return str(res.upserted_id) if res.upserted_id else enc_id

    def delete_one(self, dataset_id: str, encounter_id: str) -> bool:
        res = self.col.delete_one({"dataset_id": dataset_id, "encounter_id": encounter_id})
        return res.deleted_count > 0

class DataDictionaryRepository(BaseRepository):
    def __init__(self):
        super().__init__("data_dictionary")

    def set_dictionary(self, dataset_id: str, items: List[Dict[str, Any]]):
        self.col.delete_many({"dataset_id": dataset_id})
        for it in items:
            it_doc = dict(it)
            it_doc["dataset_id"] = dataset_id
            self.col.insert_one(it_doc)

    def get_for_dataset(self, dataset_id: str) -> List[Dict[str, Any]]:
        docs = list(self.col.find({"dataset_id": dataset_id}).sort("variable", 1))
        return [sanitize_doc(d) for d in docs]

    def update_variable(self, dataset_id: str, variable: str, patch: Dict[str, Any]):
        self.col.update_one({"dataset_id": dataset_id, "variable": variable}, {"$set": patch})

class CohortRepository(BaseRepository):
    def __init__(self):
        super().__init__("cohorts")

    def create(self, dataset_id: str, name: str, filters: Dict[str, Any], owner: str) -> Dict[str, Any]:
        doc = {
            "dataset_id": dataset_id,
            "name": name,
            "filters": filters,
            "owner": owner,
            "created_at": utc_now()
        }
        res = self.col.insert_one(doc)
        return sanitize_doc(self.col.find_one({"_id": res.inserted_id}))

    def list_for_dataset(self, dataset_id: str) -> List[Dict[str, Any]]:
        docs = list(self.col.find({"dataset_id": dataset_id}).sort("created_at", -1))
        return [sanitize_doc(d) for d in docs]

class ModelRunRepository(BaseRepository):
    def __init__(self):
        super().__init__("model_runs")

    def create(self, run_data: Dict[str, Any]) -> str:
        doc = dict(run_data)
        doc["created_at"] = utc_now()
        res = self.col.insert_one(doc)
        return str(res.inserted_id)

    def update_status(self, run_id: str, status: str, result: Dict[str, Any] = None, error: str = None):
        try:
            update = {"status": status, "updated_at": utc_now()}
            if result:
                update.update(result)
            if error:
                update["error"] = error
            self.col.update_one({"_id": ObjectId(run_id)}, {"$set": update})
        except Exception:
            pass

    def get_by_id(self, run_id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = self.col.find_one({"_id": ObjectId(run_id)})
            return sanitize_doc(doc)
        except Exception:
            return None

    def list_for_dataset(self, dataset_id: str) -> List[Dict[str, Any]]:
        docs = list(self.col.find({"dataset_id": dataset_id}).sort("created_at", -1))
        return [sanitize_doc(d) for d in docs]

    def set_active_status(self, run_id: str, status: str):
        try:
            self.col.update_one({"_id": ObjectId(run_id)}, {"$set": {"status": status}})
        except Exception:
            pass

class ExplanationRepository(BaseRepository):
    def __init__(self):
        super().__init__("explanations")

    def upsert_for_model(self, model_id: str, data: Dict[str, Any]):
        doc = dict(data)
        doc["model_id"] = model_id
        doc["updated_at"] = utc_now()
        self.col.update_one({"model_id": model_id}, {"$set": doc}, upsert=True)

    def get_for_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        doc = self.col.find_one({"model_id": model_id})
        return sanitize_doc(doc)

class ExpertReviewRepository(BaseRepository):
    def __init__(self):
        super().__init__("expert_reviews")

    def create(self, review: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(review)
        doc["created_at"] = utc_now()
        res = self.col.insert_one(doc)
        return sanitize_doc(self.col.find_one({"_id": res.inserted_id}))

    def list_for_model(self, model_id: str) -> List[Dict[str, Any]]:
        docs = list(self.col.find({"model_id": model_id}).sort("created_at", -1))
        return [sanitize_doc(d) for d in docs]

class AuditLogRepository(BaseRepository):
    def __init__(self):
        super().__init__("audit_log")

    def log(self, user_email: str, action: str, details: Dict[str, Any]):
        self.col.insert_one({
            "user_email": user_email,
            "action": action,
            "details": details,
            "timestamp": utc_now()
        })

    def list_recent(self, limit: int = 100) -> List[Dict[str, Any]]:
        docs = list(self.col.find().sort("timestamp", -1).limit(limit))
        return [sanitize_doc(d) for d in docs]

class AlertRepository(BaseRepository):
    def __init__(self):
        super().__init__("alerts")

    def create(self, alert_data: Dict[str, Any]):
        doc = dict(alert_data)
        doc["created_at"] = utc_now()
        doc["status"] = "active"
        self.col.insert_one(doc)

    def list_for_dataset(self, dataset_id: str) -> List[Dict[str, Any]]:
        docs = list(self.col.find({"dataset_id": dataset_id}).sort("created_at", -1))
        return [sanitize_doc(d) for d in docs]
