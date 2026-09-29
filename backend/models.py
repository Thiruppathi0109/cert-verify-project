from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class CertificateRecord(db.Model):
    """Off-chain record — mirrors what's on-chain, used for admin listing/search."""
    id = db.Column(db.Integer, primary_key=True)
    certificate_id = db.Column(db.String(100), unique=True, nullable=False)
    student_name = db.Column(db.String(200), nullable=False)
    course_name = db.Column(db.String(200), nullable=False)
    cert_hash = db.Column(db.String(256), nullable=False)
    tx_hash = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "certificate_id": self.certificate_id,
            "student_name": self.student_name,
            "course_name": self.course_name,
            "cert_hash": self.cert_hash,
            "tx_hash": self.tx_hash,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
