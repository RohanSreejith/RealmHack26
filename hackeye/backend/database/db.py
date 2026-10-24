"""
Database session management and initial seed data for Hack-Eye.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from hackeye.backend.config import settings
from hackeye.backend.database.models import Base, Worker, Machine

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

try:
    if "postgresql" in db_url:
        connect_args = {"sslmode": "require"} if "oregon-postgres" in db_url else {}
        engine = create_engine(db_url, connect_args=connect_args)
    else:
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
except Exception as e:
    print(f"[Hack-Eye DB] Warning initializing engine ({e}), falling back to local SQLite.")
    engine = create_engine("sqlite:///hackeye_edge.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[Hack-Eye DB] Metadata creation notice: {e}")
        return
    
    # Seed default workers and machinery if empty
    db = SessionLocal()
    try:
        if not db.query(Worker).first():
            db.add_all([
                Worker(worker_id="W-001", name="Marcus Vance", current_zone="ZONE_01"),
                Worker(worker_id="W-006", name="Alex Rivera", current_zone="ZONE_01"),
                Worker(worker_id="W-008", name="Kenji Sato", current_zone="ZONE_01"),
                Worker(worker_id="W-017", name="Elena Rostova", current_zone="ZONE_01"),
                Worker(worker_id="W-042", name="David Kim", current_zone="ZONE_02"),
                Worker(worker_id="W-103", name="Sarah Jenkins", current_zone="ZONE_03"),
            ])
            db.add_all([
                Machine(machine_id="F-004", machine_type="forklift", current_zone="ZONE_01", warning_radius=6.0, critical_radius=3.0),
                Machine(machine_id="F-012", machine_type="forklift", current_zone="ZONE_02", warning_radius=6.0, critical_radius=3.0),
                Machine(machine_id="F-025", machine_type="forklift", current_zone="ZONE_01", warning_radius=6.0, critical_radius=3.0),
                Machine(machine_id="T-088", machine_type="truck", current_zone="ZONE_03", warning_radius=8.0, critical_radius=4.0),
                Machine(machine_id="E-002", machine_type="excavator", current_zone="ZONE_03", warning_radius=10.0, critical_radius=5.0),
            ])
            db.commit()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
