import React from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Upload, Crown, ShieldAlert, LogOut, LogIn, Sparkles } from "lucide-react";

export const Navbar = ({ onOpenUpload, onOpenPricing, onOpenAdmin, onOpenAuth, activeView, setActiveView }) => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      height: "70px",
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      {/* Brand */}
      <div 
        onClick={() => setActiveView("library")}
        style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
      >
        <div style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff"
        }}>
          <BookOpen size={24} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a" }}>
            لِـثْ <span style={{ color: "#2563eb", fontSize: "14px", fontWeight: 600 }}>LITH</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>
            الترجمة التفاعلية المتزامنة للمحاضرات
          </div>
        </div>
      </div>

      {/* Center Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {user && (
          <button 
            className="btn btn-primary"
            onClick={onOpenUpload}
            style={{ borderRadius: "20px" }}
          >
            <Upload size={18} />
            رفع محاضرة PDF
          </button>
        )}
      </div>

      {/* Right User Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {user ? (
          <>
            {/* Subscription / Quota Badge */}
            {user.is_subscribed ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "#fef3c7",
                color: "#92400e",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 700
              }}>
                <Crown size={16} color="#d97706" />
                اشتراك فعّال (VIP)
              </div>
            ) : (
              <div 
                onClick={onOpenPricing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
                title="اضغط للترقية لفتح صفحات غير محدودة"
              >
                <Sparkles size={16} />
                <span>المتبقي: {Math.max(0, 15 - user.free_pages_used)} صفحة مجانية</span>
              </div>
            )}

            {/* Upgrade Button */}
            {!user.is_subscribed && (
              <button 
                className="btn btn-accent"
                onClick={onOpenPricing}
                style={{ padding: "6px 14px", fontSize: "13px", borderRadius: "20px" }}
              >
                <Crown size={15} />
                ترقية الحساب
              </button>
            )}

            {/* Admin Badge */}
            {user.role === "admin" && (
              <button
                className="btn btn-secondary"
                onClick={onOpenAdmin}
                style={{ padding: "6px 14px", fontSize: "13px", borderRadius: "20px" }}
              >
                <ShieldAlert size={16} color="#dc2626" />
                لوحة الإدارة
              </button>
            )}

            {/* User Identifier & Logout */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginRight: "10px" }}>
              <span className="navbar-email-text" style={{ fontSize: "13px", color: "#475569", fontWeight: 500 }}>
                {user.phone_or_email}
              </span>
              <button 
                onClick={logout} 
                className="btn btn-secondary" 
                style={{ padding: "6px 10px", borderRadius: "8px" }}
                title="تسجيل الخروج"
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <button 
            className="btn btn-primary"
            onClick={onOpenAuth}
            style={{ borderRadius: "20px" }}
          >
            <LogIn size={18} />
            تسجيل الدخول / إنشاء حساب
          </button>
        )}
      </div>
    </header>
  );
};
