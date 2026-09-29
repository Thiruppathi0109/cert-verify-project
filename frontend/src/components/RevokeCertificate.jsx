import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../web3Config";

export default function RevokeCertificate() {
  const [certificateId, setCertificateId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/revoke`, { certificate_id: certificateId });
      setResult(res.data);
      setConfirming(false);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel panel--revoke">
      <div className="panel-head">
        <span className="panel-title">REVOKE CREDENTIAL</span>
        <span className="panel-tag">ADMIN ONLY — IRREVERSIBLE</span>
      </div>

      <div className="panel-body">
        <form onSubmit={handleSubmit}>
          <div className="field field--symbol">
            <label>Certificate ID</label>
            <input
              placeholder="CERT001"
              value={certificateId}
              onChange={(e) => {
                setCertificateId(e.target.value);
                setConfirming(false);
              }}
              required
            />
          </div>

          <button className="btn-action btn-action--revoke" type="submit" disabled={loading}>
            {loading
              ? "REVOKING ON CHAIN..."
              : confirming
              ? "CONFIRM REVOKE — CANNOT BE UNDONE"
              : "REVOKE CERTIFICATE"}
          </button>
        </form>

        {result && (
          <div className="readout readout--err">
            <div className="readout-line">
              <b>Certificate revoked</b>
            </div>
            <div className="readout-line">TX HASH — {result.tx_hash}</div>
          </div>
        )}

        {error && (
          <div className="readout readout--err">
            <div className="readout-line">{error}</div>
          </div>
        )}
      </div>
    </section>
  );
}
