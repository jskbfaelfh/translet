import React, { useState, useEffect } from "react";
import { api } from "../api";
import { ShieldCheck, Check, X, RefreshCw, AlertCircle } from "lucide-react";

export const AdminPanel = ({ isOpen, onClose }) => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.getPendingPayments();
      setPendingPayments(res.pending_payments || []);
    } catch (err) {
      console.error("Failed to fetch pending payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPayments();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = async (paymentId, action) => {
    setActionLoading(paymentId);
    setMessage(null);
    try {
      await api.verifyPayment(paymentId, action);
      setMessage(`تمت المعالجة بنجاح (${action === "approve" ? "تم قبول وتفعيل الاشتراك" : "تم الرفض"})`);
      fetchPayments();
    } catch (err) {
      alert(err.message || "حدث خطأ أثناء معالجة الطلب");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "750px" }}>
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              background: "#fee2e2",
              color: "#dc2626",
              padding: "8px",
              borderRadius: "10px"
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                لوحة إدارة طلبات التحويل والاشتراكات
              </h2>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                مراجعة وتفعيل اشتراكات الطلاب يدوياً
              </div>
            </div>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={fetchPayments} 
            disabled={loading}
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            تحديث
          </button>
        </div>

        {message && (
          <div style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "16px"
          }}>
            {message}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
            جاري جلب الطلبات...
          </div>
        ) : pendingPayments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
            لا توجد أي طلبات دفع معلقة حالياً.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>
                  <th style={{ padding: "10px" }}>الطالب</th>
                  <th style={{ padding: "10px" }}>الطريقة</th>
                  <th style={{ padding: "10px" }}>المبلغ</th>
                  <th style={{ padding: "10px" }}>رقم الحوالة</th>
                  <th style={{ padding: "10px" }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 10px", fontWeight: 600 }}>{p.user_identifier}</td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{
                        background: "#e0f2fe",
                        color: "#0369a1",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: 700
                      }}>
                        {p.method}
                      </span>
                    </td>
                    <td style={{ padding: "12px 10px", fontWeight: 700 }}>
                      {Number(p.amount).toLocaleString()} د.ع
                    </td>
                    <td style={{ padding: "12px 10px", fontFamily: "monospace", color: "#2563eb" }}>
                      {p.reference_number}
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAction(p.id, "approve")}
                          disabled={actionLoading === p.id}
                          style={{ padding: "6px 10px", fontSize: "12px", background: "#16a34a" }}
                          title="قبول وتفعيل 30 يوم"
                        >
                          <Check size={14} />
                          تفعيل
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleAction(p.id, "reject")}
                          disabled={actionLoading === p.id}
                          style={{ padding: "6px 10px", fontSize: "12px", color: "#dc2626" }}
                          title="رفض"
                        >
                          <X size={14} />
                          رفض
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
