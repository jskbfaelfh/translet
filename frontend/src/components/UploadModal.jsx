import React, { useState, useRef } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Zap } from "lucide-react";

export const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const { user, refreshUser } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isCachedMatch, setIsCachedMatch] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith(".pdf")) {
        setError("يرجى اختيار ملف بصيغة PDF فقط");
        return;
      }
      setFile(selected);
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("يرجى اختيار ملف PDF للرفع");
      return;
    }

    setUploading(true);
    setStatusMessage("جاري رفع الملف وحساب الـ Hash...");
    setError(null);
    setIsCachedMatch(false);

    try {
      const res = await api.uploadDocument(file, title);
      await refreshUser();

      if (res.cached) {
        setIsCachedMatch(true);
        setStatusMessage("تمت مطابقة الملف بالكاش المركزي! الملف جاهز فوراً دون انتظار.");
        setTimeout(() => {
          onUploadSuccess(res.document.id);
          onClose();
        }, 1200);
      } else {
        setStatusMessage("تم الرفع بنجاح! جاري تحويل الصفحات والترجمة...");
        setTimeout(() => {
          onUploadSuccess(res.document.id);
          onClose();
        }, 1000);
      }
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#64748b"
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
          رفع محاضرة PDF
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
          سيتم استخراج السلايدات وترجمتها بدقة متناهية مع حفظ التنسيق والتظليل.
        </p>

        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px"
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div style={{
            background: isCachedMatch ? "#ecfdf5" : "#eff6ff",
            border: `1px solid ${isCachedMatch ? "#a7f3d0" : "#bfdbfe"}`,
            color: isCachedMatch ? "#065f46" : "#1e40af",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px"
          }}>
            {isCachedMatch ? <Zap size={18} color="#059669" /> : <CheckCircle2 size={18} />}
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed #cbd5e1",
              borderRadius: "12px",
              padding: "32px 16px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "#f8fafc",
              marginBottom: "16px",
              transition: "border-color 0.2s ease"
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              style={{ display: "none" }}
            />
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px"
            }}>
              <UploadCloud size={24} />
            </div>

            {file ? (
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>{file.name}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 700, color: "#334155", fontSize: "14px" }}>
                  انقر لاختيار ملف المحاضرة أو اسحبه إلى هنا
                </div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                  صيغة PDF فقط (حتى 30 ميجابايت)
                </div>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              عنوان المحاضرة (كما تريده في مكتبتك)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: محاضرة علم الأدوية 1 - د. أحمد"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                fontFamily: "inherit"
              }}
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading || !file}
            style={{ width: "100%", padding: "12px", fontSize: "15px" }}
          >
            {uploading ? "جاري الرفع والمعالجة..." : "بدء الترجمة المتزامنة"}
          </button>
        </form>
      </div>
    </div>
  );
};
