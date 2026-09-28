import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { DualViewer } from "./components/DualViewer";
import { UploadModal } from "./components/UploadModal";
import { PricingModal } from "./components/PricingModal";
import { AdminPanel } from "./components/AdminPanel";
import { AuthModal } from "./components/AuthModal";
import { api } from "./api";
import { 
  BookOpen, 
  FileText, 
  Trash2, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Upload, 
  Layers,
  ChevronLeft,
  Crown
} from "lucide-react";

const MainContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [activeDocId, setActiveDocId] = useState(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const fetchDocuments = async () => {
    if (!user) return;
    setLoadingDocs(true);
    try {
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  // Polling for processing documents
  useEffect(() => {
    if (!user) return;
    const hasProcessing = documents.some((d) => d.status === "processing" || d.status === "queued");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 4000);

    return () => clearInterval(interval);
  }, [documents, user]);

  const handleDelete = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm("هل أنت متأكد من حذف هذه المحاضرة من مكتبتك؟")) return;
    try {
      await api.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (activeDocId === docId) setActiveDocId(null);
    } catch (err) {
      alert("فشل حذف المحاضرة");
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid #2563eb", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#64748b" }}>جاري تحميل المنصة...</p>
        </div>
      </div>
    );
  }

  // Active Document Dual Viewer (Fullscreen Study Mode)
  if (activeDocId) {
    return (
      <DualViewer documentId={activeDocId} onBack={() => setActiveDocId(null)} />
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        activeView="library"
        setActiveView={() => setActiveDocId(null)}
      />

      <main style={{ flex: 1, padding: "32px 24px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        {!user ? (
          /* Guest Hero Section */
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              background: "#eff6ff",
              color: "#2563eb",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "20px"
            }}>
              <Sparkles size={18} />
              المنصة الجامعية الأولى للترجمة المتزامنة
            </div>

            <h1 style={{ fontSize: "40px", fontWeight: 800, color: "#0f172a", lineHeight: "1.3", marginBottom: "16px" }}>
              ادرس محاضراتك الإنجليزية <br />
              <span style={{ color: "#2563eb" }}>بالعربية مع تظليل متزامن فوري</span>
            </h1>

            <p style={{ fontSize: "17px", color: "#64748b", maxWidth: "620px", margin: "0 auto 32px", lineHeight: "1.6" }}>
              ارفع ملف الـ PDF وشاهد الشريحة الأصلية بجانب الترجمة العربية الدقيقة. انقر على أي سطر لتحديده مباشرة، مع ميزة الكاش الفوري دون انتظار.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "14px" }}>
              <button 
                className="btn btn-primary"
                onClick={() => setIsAuthOpen(true)}
                style={{ padding: "14px 32px", fontSize: "16px", borderRadius: "12px" }}
              >
                ابدأ التجربة مجاناً (15 صفحة)
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setIsPricingOpen(true)}
                style={{ padding: "14px 24px", fontSize: "16px", borderRadius: "12px" }}
              >
                <Crown size={18} color="#d97706" />
                باقات الاشتراك (زين كاش / آسيا)
              </button>
            </div>

            {/* Feature Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginTop: "60px", textAlign: "right" }}>
              <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ background: "#eff6ff", width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", marginBottom: "14px" }}>
                  <Layers size={22} />
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>تظليل ومزامنة تفاعلية</h3>
                <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6" }}>
                  مستطيلات تفاعلية دقيقة فوق السلايد الأصلي تحدد الأسطر الممتدة وتتزامن فوراً مع النص العربي المقابل.
                </p>
              </div>

              <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ background: "#fef3c7", width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", marginBottom: "14px" }}>
                  <Sparkles size={22} />
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>كاش فوري للدفعة الواحدة</h3>
                <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6" }}>
                  إذا قام زميلك برفع نفس المحاضرة مسبقاً، ستفتح معك فورياً في أجزاء من الثانية دون استهلاك رصيدك!
                </p>
              </div>

              <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ background: "#f0fdf4", width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", marginBottom: "14px" }}>
                  <Crown size={22} />
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>دفع محلي مرن وسريع</h3>
                <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6" }}>
                  اشترك بسهولة عبر محفظة زين كاش أو آسيا حوالة أو مصرف FIB العراقي دون الحاجة لبطاقات ائتمان دولية.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* User Library Section */
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
                  محاضراتي الدراسية
                </h1>
                <p style={{ fontSize: "14px", color: "#64748b" }}>
                  اختر محاضرة للمتابعة أو ارفع ملف PDF جديد
                </p>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setIsUploadOpen(true)}
                style={{ borderRadius: "10px" }}
              >
                <Upload size={18} />
                رفع محاضرة جديدة
              </button>
            </div>

            {loadingDocs ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
                جاري جلب قائمة المحاضرات...
              </div>
            ) : documents.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#ffffff",
                borderRadius: "16px",
                border: "2px dashed #e2e8f0"
              }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px"
                }}>
                  <FileText size={28} />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                  لم ترفع أي محاضرة بعد
                </h3>
                <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
                  ارفع أول محاضرة لك الآن واستمتع بالقراءة التفاعلية المتزامنة.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsUploadOpen(true)}
                >
                  <Upload size={18} />
                  رفع أول ملف PDF
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                {documents.map((doc) => {
                  const isReady = doc.status === "ready";
                  const isProcessing = doc.status === "processing" || doc.status === "queued";

                  return (
                    <div
                      key={doc.id}
                      onClick={() => isReady && setActiveDocId(doc.id)}
                      style={{
                        background: "#ffffff",
                        borderRadius: "14px",
                        border: "1px solid #e2e8f0",
                        padding: "20px",
                        cursor: isReady ? "pointer" : "default",
                        transition: "all 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                      onMouseEnter={(e) => {
                        if (isReady) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 8px 16px -4px rgba(0,0,0,0.08)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isReady) {
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                        }
                      }}
                    >
                      <div>
                        {/* Header: Status & Delete */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          {isReady ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#ecfdf5",
                              color: "#059669",
                              fontSize: "12px",
                              fontWeight: 700,
                              padding: "4px 10px",
                              borderRadius: "12px"
                            }}>
                              <CheckCircle size={14} /> جاهزة للقراءة
                            </span>
                          ) : isProcessing ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#eff6ff",
                              color: "#2563eb",
                              fontSize: "12px",
                              fontWeight: 700,
                              padding: "4px 10px",
                              borderRadius: "12px"
                            }}>
                              <Clock size={14} /> جاري المعالجة...
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#fef2f2",
                              color: "#dc2626",
                              fontSize: "12px",
                              fontWeight: 700,
                              padding: "4px 10px",
                              borderRadius: "12px"
                            }}>
                              <AlertTriangle size={14} /> تعذر المعالجة
                            </span>
                          )}

                          <button
                            onClick={(e) => handleDelete(e, doc.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#94a3b8",
                              cursor: "pointer",
                              padding: "4px"
                            }}
                            title="حذف من مكتبتي"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                          {doc.custom_title}
                        </h3>

                        {/* Meta */}
                        <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "10px" }}>
                          <span>{doc.page_count} صفحة</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString("ar-EG")}</span>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div style={{ marginTop: "18px", borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                        {isReady ? (
                          <span style={{ color: "#2563eb", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                            فتح العرض الثنائي
                            <ChevronLeft size={16} />
                          </span>
                        ) : isProcessing ? (
                          <span style={{ color: "#64748b", fontSize: "12px" }}>
                            انتظر ثوانٍ وتتحدث تلقائياً...
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(docId) => {
          fetchDocuments();
          setActiveDocId(docId);
        }}
      />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
