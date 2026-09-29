from flask import Blueprint, request, jsonify
from models import CertificateRecord
from blockchain_utils import hash_certificate_data, verify_certificate_on_chain, get_certificate_on_chain

verify_bp = Blueprint("verify", __name__)


@verify_bp.route("/api/verify", methods=["POST"])
def verify_certificate():
    """
    Verify using certificate_id + student_name + course_name
    (recomputes the hash the same way it was created at issue time).
    """
    data = request.get_json()
    certificate_id = data.get("certificate_id")
    student_name = data.get("student_name")
    course_name = data.get("course_name")

    if not all([certificate_id, student_name, course_name]):
        return jsonify({"error": "certificate_id, student_name and course_name are required"}), 400

    cert_hash = hash_certificate_data(student_name, course_name, certificate_id)

    try:
        result = verify_certificate_on_chain(certificate_id, cert_hash)
    except Exception as e:
        return jsonify({"error": f"Blockchain call failed: {str(e)}"}), 500

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
