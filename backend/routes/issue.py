from flask import Blueprint, request, jsonify
from models import db, CertificateRecord
from blockchain_utils import hash_certificate_data, hash_file_bytes, issue_certificate_on_chain

issue_bp = Blueprint("issue", __name__)


@issue_bp.route("/api/issue", methods=["POST"])
def issue_certificate():
    # Supports two modes:
    #  - form fields only  -> hash is derived from certificate_id + student_name + course_name
    #  - form fields + a certificate_file (PDF) -> hash is the PDF's own SHA-256,
    #    so the certificate is bound to that exact file, not just the text data.
    certificate_id = request.form.get("certificate_id") or (request.get_json(silent=True) or {}).get("certificate_id")
    student_name = request.form.get("student_name") or (request.get_json(silent=True) or {}).get("student_name")
    course_name = request.form.get("course_name") or (request.get_json(silent=True) or {}).get("course_name")

    if not all([certificate_id, student_name, course_name]):
        return jsonify({"error": "certificate_id, student_name and course_name are required"}), 400

    if CertificateRecord.query.filter_by(certificate_id=certificate_id).first():
        return jsonify({"error": "Certificate ID already exists"}), 409

    uploaded_file = request.files.get("certificate_file")
    if uploaded_file and uploaded_file.filename:
        cert_hash = hash_file_bytes(uploaded_file.read())
        hash_source = "file"
    else:
        cert_hash = hash_certificate_data(student_name, course_name, certificate_id)
        hash_source = "data"

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
        "hash_source": hash_source,
        "tx_hash": tx_hash,
    }), 201
