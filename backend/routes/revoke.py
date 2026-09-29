from flask import Blueprint, request, jsonify
from models import db, CertificateRecord
from blockchain_utils import revoke_certificate_on_chain

revoke_bp = Blueprint("revoke", __name__)


@revoke_bp.route("/api/revoke", methods=["POST"])
def revoke_certificate():
    data = request.get_json(silent=True) or request.form
    certificate_id = data.get("certificate_id")

    if not certificate_id:
        return jsonify({"error": "certificate_id is required"}), 400

    record = CertificateRecord.query.filter_by(certificate_id=certificate_id).first()
    if not record:
        return jsonify({"error": "Certificate not found in local records"}), 404
    if record.revoked:
        return jsonify({"error": "Certificate is already revoked"}), 409

    try:
        tx_hash = revoke_certificate_on_chain(certificate_id)
    except Exception as e:
        return jsonify({"error": f"Blockchain transaction failed: {str(e)}"}), 500

    record.revoked = True
    db.session.commit()

    return jsonify({
        "message": "Certificate revoked successfully",
        "certificate_id": certificate_id,
        "tx_hash": tx_hash,
    }), 200
