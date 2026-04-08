
from database.connection import SessionLocal
from database.models import AuditLog

db = SessionLocal()
logs = db.query(AuditLog).filter(AuditLog.method == "DELETE").all()
for log in logs:
    print(f"Log ID: {log.id}, Action: {log.action}, Status: {log.status_code}")
db.close()
