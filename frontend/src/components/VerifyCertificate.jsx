import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../web3Config";

export default function VerifyCertificate() {
  const [form, setForm] = useState({ certificate_id: "", student_name: "", course_name: "" });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFile = (e) => setFile(e.target.files[0] || null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = new FormData();
      data.append("certificate_id", form.certificate_id);
      if (file) {
        data.append("certificate_file", file);
      } else {
        data.append("student_name", form.student_name);
        data.append("course_name", form.course_name);
      }

      const res = await axios.post(`${API_BASE_URL}/api/verify`, data);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const verdictLabel = () => {
    if (result.revoked) return "CERTIFICATE REVOKED";
    return result.is_valid ? "CERTIFICATE VALID" : "CERTIFICATE INVALID";
  };
  const verdictClass = () => {
    if (result.revoked) return "verdict--invalid";
    return result.is_valid ? "verdict--valid" : "verdict--invalid";
  };
  const verdictIcon = () => {
    if (result.revoked) return "⊘";
    return result.is_valid ? "✓" : "✕";
  };

  return (
    <section className="panel panel--verify">
      <div className="panel-head">
        <span className="panel-title">VERIFY CREDENTIAL</span>
        <span className="panel-tag">PUBLIC LOOKUP</span>
      </div>

      <div className="panel-body">
        <form onSubmit={handleSubmit}>
          <div className="field field--symbol">
            <label>Certificate ID</label>
            <input
              name="certificate_id"
              placeholder="CERT001"
              value={form.certificate_id}
              onChange={handleChange}
              required
            />
          </div>

          {!file && (
            <>
              <div className="field">
                <label>Student Name</label>
                <input
                  name="student_name"
                  placeholder="Full name"
                  value={form.student_name}
                  onChange={handleChange}
                  required={!file}
                />
              </div>
              <div className="field">
                <label>Course / Program</label>
                <input
                  name="course_name"
                  placeholder="e.g. CSE"
                  value={form.course_name}
                  onChange={handleChange}
                  required={!file}
                />
              </div>
            </>
          )}

          <div className="field">
            <label>Or attach the PDF to verify (skips the fields above)</label>
            <input type="file" accept="application/pdf" className="file-input" onChange={handleFile} />
          </div>

          <button className="btn-action btn-action--verify" type="submit" disabled={loading}>
            {loading ? "QUERYING CHAIN..." : "RUN VERIFICATION"}
          </button>
        </form>

        {result && (
          <div className={`verdict ${verdictClass()}`}>
            <span className="verdict-icon">{verdictIcon()}</span>
            {verdictLabel()}
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
