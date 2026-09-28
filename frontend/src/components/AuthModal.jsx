import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, UserPlus, X, AlertCircle } from "lucide-react";

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await register(identifier.trim(), password.trim());
      } else {
        await login(identifier.trim(), password.trim());
      }
      onClose();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء المصادقة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "420px" }}>
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

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "#eff6ff",
            color: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px"
          }}>
            {isRegister ? <UserPlus size={24} /> : <LogIn size={24} />}
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
            {isRegister ? "إنشاء حساب طالب جديد" : "تسجيل الدخول"}
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            {isRegister ? "سجل وابدأ بترجمة 15 صفحة مجاناً فوراً" : "أهلاً بك مجدداً في منصة لِـثْ"}
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "10px",
            borderRadius: "8px",
            fontSize: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              رقم الهاتف أو البريد الإلكتروني
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="0770... أو student@college.edu"
              className="ltr"
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

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="ltr"
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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "12px", fontSize: "15px", marginBottom: "14px" }}
          >
            {loading ? "جاري التحقق..." : isRegister ? "إنشاء الحساب وبدء التجربة" : "تسجيل الدخول"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "13px", color: "#64748b" }}>
          {isRegister ? "لديك حساب بالفعل؟ " : "ليس لديك حساب بعد؟ "}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#2563eb",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            {isRegister ? "تسجيل الدخول" : "أنشئ حسابك الآن"}
          </button>
        </div>
      </div>
    </div>
  );
};
