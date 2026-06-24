"""
SQLite-backed record store.
Implements the same contract as the frontend RecordRepository.
"""
import sqlite3
import json
import os
from models import RecordCard


class RecordStore:
    def __init__(self, db_path: str = "./otter_records.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with self._conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS records (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            conn.commit()

    def _conn(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def list(self) -> list[RecordCard]:
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT data FROM records ORDER BY created_at DESC"
            ).fetchall()
        return [RecordCard.model_validate_json(row[0]) for row in rows]

    def create(self, record: RecordCard) -> RecordCard:
        with self._conn() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO records (id, data, created_at) VALUES (?, ?, ?)",
                (record.id, record.model_dump_json(), record.createdAt)
            )
            conn.commit()
        return record

    def delete(self, record_id: str) -> bool:
        with self._conn() as conn:
            cursor = conn.execute("DELETE FROM records WHERE id = ?", (record_id,))
            conn.commit()
            return cursor.rowcount > 0
