from flask import Blueprint, request, jsonify
from models import db, CertificateRecord
from blockchain_utils import hash_certificate_data, issue_certificate_on_chain

issue_bp = Blueprint("issue", __name__)


@issue_bp.route("/api/issue", methods=["POST"])
def issue_certificate():
    data = request.get_json()

    certificate_id = data.get("certificate_id")
    student_name = data.get("student_name")
    course_name = data.get("course_name")

    if not all([certificate_id, student_name, course_name]):
        return jsonify({"error": "certificate_id, student_name and course_name are required"}), 400

    if CertificateRecord.query.filter_by(certificate_id=certificate_id).first():
        return jsonify({"error": "Certificate ID already exists"}), 409

    cert_hash = hash_certificate_data(student_name, course_name, certificate_id)

    try:
        tx_hash = issue_certificate_on_chain(certificate_id, student_name, course_name, cert_hash)
    except Exception as e:
        return jsonify({"error": f"Blockchain transaction failed: {str(e)}"}), 500

    record = CertificateRecord(
        certificate_id=certificate_id,
        student_name=student_name,
        course_name=course_name,
        cert_hash=cert_hash,
        tx_hash=tx_hash,
    )
    db.session.add(record)
    db.session.commit()

    return jsonify({
        "message": "Certificate issued successfully",
        "certificate_id": certificate_id,
        "cert_hash": cert_hash,
        "tx_hash": tx_hash,
    }), 201
