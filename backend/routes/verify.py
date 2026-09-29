from flask import Blueprint, request, jsonify
from models import CertificateRecord
from blockchain_utils import (
    hash_certificate_data,
    hash_file_bytes,
    verify_certificate_on_chain,
    get_certificate_on_chain,
)

verify_bp = Blueprint("verify", __name__)


@verify_bp.route("/api/verify", methods=["POST"])
def verify_certificate():
    """
    Two modes:
      - form fields only -> recomputes the data hash the same way issue did
      - form fields + certificate_file (PDF) -> hashes the uploaded PDF directly
        and checks that exact file against what's on-chain
    """
    certificate_id = request.form.get("certificate_id") or (request.get_json(silent=True) or {}).get("certificate_id")
    student_name = request.form.get("student_name") or (request.get_json(silent=True) or {}).get("student_name")
    course_name = request.form.get("course_name") or (request.get_json(silent=True) or {}).get("course_name")

    if not certificate_id:
        return jsonify({"error": "certificate_id is required"}), 400

    uploaded_file = request.files.get("certificate_file")
    if uploaded_file and uploaded_file.filename:
        cert_hash = hash_file_bytes(uploaded_file.read())
    else:
        if not all([student_name, course_name]):
            return jsonify({"error": "student_name and course_name are required when no file is attached"}), 400
        cert_hash = hash_certificate_data(student_name, course_name, certificate_id)

    record = CertificateRecord.query.filter_by(certificate_id=certificate_id).first()
    if record and record.revoked:
        return jsonify({
            "is_valid": False,
            "revoked": True,
            "student_name": record.student_name,
            "course_name": record.course_name,
            "issue_date": None,
        }), 200

    try:
        result = verify_certificate_on_chain(certificate_id, cert_hash)
    except Exception as e:
        return jsonify({"error": f"Blockchain call failed: {str(e)}"}), 500

    result["revoked"] = False
    return jsonify(result), 200


@verify_bp.route("/api/certificate/<certificate_id>", methods=["GET"])
def get_certificate(certificate_id):
    """Public lookup — just shows what's on-chain for this ID, no hash needed."""
    try:
        result = get_certificate_on_chain(certificate_id)
    except Exception as e:
        return jsonify({"error": f"Blockchain call failed: {str(e)}"}), 500

    if not result["exists"]:
        return jsonify({"error": "Certificate not found"}), 404

    return jsonify(result), 200
