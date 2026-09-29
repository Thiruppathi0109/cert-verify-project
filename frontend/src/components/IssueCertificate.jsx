import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../web3Config";

export default function IssueCertificate() {
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
      data.append("student_name", form.student_name);
      data.append("course_name", form.course_name);
      if (file) data.append("certificate_file", file);

      const res = await axios.post(`${API_BASE_URL}/api/issue`, data);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel panel--issue">
      <div className="panel-head">
        <span className="panel-title">ISSUE CREDENTIAL</span>
        <span className="panel-tag">ADMIN ONLY</span>
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
          <div className="field">
            <label>Student Name</label>
            <input
              name="student_name"
              placeholder="Full name"
              value={form.student_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label>Course / Program</label>
            <input
              name="course_name"
              placeholder="e.g. CSE"
              value={form.course_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Certificate PDF (optional — binds hash to this exact file)</label>
            <input type="file" accept="application/pdf" className="file-input" onChange={handleFile} />
          </div>

          <button className="btn-action btn-action--issue" type="submit" disabled={loading}>
            {loading ? "SUBMITTING TO CHAIN..." : "ISSUE CERTIFICATE"}
          </button>
        </form>

        {result && (
          <div className="readout readout--ok">
            <div className="readout-line">
              <b>Certificate issued</b> — hash source: {result.hash_source === "file" ? "PDF file" : "form data"}
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
