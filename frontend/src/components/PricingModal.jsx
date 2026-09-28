import React, { useState } from "react";
import { api } from "../api";
import { Crown, Check, X, Send, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";

export const PricingModal = ({ isOpen, onClose }) => {
  const [method, setMethod] = useState("zaincash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amount, setAmount] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      setError("يرجى إدخال رقم الحوالة أو إشعار التحويل");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.submitPayment({
        method,
        reference_number: referenceNumber.trim(),
        amount: Number(amount)
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "فشل إرسال طلب الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "600px" }}>
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

        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#dcfce7",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              تم استلام إشعار التحويل بنجاح!
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "24px" }}>
              يقوم فريق الدعم بالتحقق من الإشعار وتفعيل اشتراكك الـ VIP خلال دقائق. ستتمكن من ترجمة وتصفح محاضرات غير محدودة.
            </p>
            <button className="btn btn-primary" onClick={onClose}>
              إغلاق ومتابعة القراءة
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{
                background: "#fef3c7",
                color: "#d97706",
                padding: "8px",
                borderRadius: "10px"
              }}>
                <Crown size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                  ترقية الحساب — الباقة الأكاديمية الشاملة
                </h2>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  وصول غير محدود لترجمة جميع محاضرات فصولك الدراسية
                </div>
              </div>
            </div>

            {/* Plan Card */}
            <div style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              color: "#ffffff",
              borderRadius: "14px",
              padding: "20px",
              margin: "18px 0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>اشتراك شهري كامل (VIP)</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>صلاحية 30 يوماً متواصلة</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: "#facc15" }}>10,000</span>
                  <span style={{ fontSize: "12px", color: "#94a3b8", marginRight: "4px" }}>د.ع / شهرياً</span>
                </div>
              </div>

              <div style={{ marginTop: "14px", borderTop: "1px solid #334155", paddingTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Check size={14} color="#4ade80" /> صفحات ومحاضرات غير محدودة
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Check size={14} color="#4ade80" /> كاش فوري فائق السرعة
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Check size={14} color="#4ade80" /> تحميل وقراءة دون قيود
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Check size={14} color="#4ade80" /> دعم دائم طوال الفصل
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                اختر طريقة التحويل:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {[
                  { id: "zaincash", name: "زين كاش", num: "07801234567" },
                  { id: "asiahawala", name: "آسيا حوالة", num: "07701234567" },
                  { id: "fib", name: "FIB العراقي", num: "IBAN: IQ..." },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setMethod(item.id)}
                    style={{
                      border: `2px solid ${method === item.id ? "#2563eb" : "#e2e8f0"}`,
                      background: method === item.id ? "#eff6ff" : "#f8fafc",
                      borderRadius: "10px",
                      padding: "10px",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>{item.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }} className="ltr">
                      {item.num}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "12px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  رقم العملية / الحوالة (من تطبيق محفظتك)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="مثال: 987654321 أو رقم الهاتف المحول منه"
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
                style={{ width: "100%", padding: "12px", fontSize: "15px" }}
              >
                {loading ? "جاري الإرسال..." : "إرسال إشعار الدفع لتفعيل الحساب"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
