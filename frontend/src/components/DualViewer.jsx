import React, { useState, useEffect, useRef } from "react";
import { api, getFullImageUrl } from "../api";
import { 
  ChevronRight, 
  ChevronLeft, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ArrowLeft,
  Columns,
  Sparkles,
  Clock,
  AlertCircle,
  Download,
  ChevronUp,
  ChevronDown,
  BookOpen,
  FileText
} from "lucide-react";

export const DualViewer = ({ documentId, onBack }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [activeSentenceId, setActiveSentenceId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  
  // Rule: Two strictly mutually exclusive modes
  // 1. 'split'     -> طريقة 1: العرض المتزامن (الشريحة + قائمة الترجمة المنفصلة)
  // 2. 'bilingual' -> طريقة 2: السلايد المدمج ثنائي اللغة (النص الإنجليزي والترجمة معاً)
  const [studyMode, setStudyMode] = useState(() => {
    const saved = localStorage.getItem("lith_study_mode");
    return saved === "split" ? "split" : "bilingual";
  });

  // PDF Export
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadType, setDownloadType] = useState(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const downloadDropdownRef = useRef(null);

  // Mobile state (for Method 1: split view bottom sheet)
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 900);
  const [sheetState, setSheetState] = useState("peek"); // 'collapsed', 'peek', 'expanded'
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const translationRefs = useRef({});
  const slideContainerRef = useRef(null);

  const handleModeChange = (mode) => {
    setStudyMode(mode);
    localStorage.setItem("lith_study_mode", mode);
  };

  // Handle window resize for mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close download dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(e.target)) {
        setDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownloadPdf = async (mode = "bilingual") => {
    setDownloadingPdf(true);
    setDownloadType(mode);
    try {
      const filename = mode === "bilingual" 
        ? "Lecture_Bilingual_Slide.pdf" 
        : "Lecture_Translation_ONLY.pdf";
      await api.downloadTranslatedPdf(documentId, mode, filename);
      setDownloadMenuOpen(false);
    } catch (err) {
      alert(err.message || "حدث خطأ أثناء تحميل ملف الـ PDF");
    } finally {
      setDownloadingPdf(false);
      setDownloadType(null);
    }
  };

  // Load document page with status polling fallback
  useEffect(() => {
    let isMounted = true;
    let pollTimer = null;

    const fetchPage = async () => {
      setLoading(true);
      setError(null);

      try {
        const statusRes = await api.getDocumentStatus(documentId);
        const docFileStatus = statusRes.file ? statusRes.file.status : "unknown";

        if (docFileStatus === "queued" || docFileStatus === "processing") {
          if (isMounted) {
            setIsProcessing(true);
            pollTimer = setTimeout(fetchPage, 2500);
          }
          return;
        }

        if (docFileStatus === "failed") {
          if (isMounted) {
            setError(statusRes.file?.error_message || "فشلت معالجة هذا الملف");
            setIsProcessing(false);
            setLoading(false);
          }
          return;
        }

        setIsProcessing(false);
        const res = await api.getDocumentPage(documentId, currentPage);
        if (!isMounted) return;

        setPageData(res.page);
        setTotalPages(res.total_pages || 1);
        
        // Auto-select first sentence on page load if none active
        if (res.page?.sentences?.length > 0) {
          setActiveSentenceId(res.page.sentences[0].id);
        }
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        if (err.message && err.message.includes("still processing")) {
          setIsProcessing(true);
          pollTimer = setTimeout(fetchPage, 2500);
        } else {
          setError(err.message || "فشل تحميل بيانات الصفحة");
          setLoading(false);
        }
      }
    };

    fetchPage();

    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [documentId, currentPage]);

  // Handle active sentence change & scroll to it
  const handleSelectSentence = (id) => {
    setActiveSentenceId(id);
    if (isMobile && studyMode === "split" && sheetState === "collapsed") {
      setSheetState("peek");
    }
    const targetCard = translationRefs.current[id];
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Keyboard navigation for pages
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
      } else if (e.key === "ArrowRight") {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages]);

  // Swipe detection for mobile page flipping
  const onTouchStartSlide = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveSlide = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndSlide = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
    if (distance < -50 && currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };



  const activeSentence = pageData?.sentences?.find((s) => s.id === activeSentenceId) || pageData?.sentences?.[0];
  const activeSentenceIndex = pageData?.sentences?.findIndex((s) => s.id === activeSentence?.id) ?? 0;

  const handlePrevSentence = () => {
    if (!pageData?.sentences || pageData.sentences.length === 0) return;
    const currentIdx = pageData.sentences.findIndex((s) => s.id === (activeSentence?.id));
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : pageData.sentences.length - 1;
    setActiveSentenceId(pageData.sentences[prevIdx].id);
  };

  const handleNextSentence = () => {
    if (!pageData?.sentences || pageData.sentences.length === 0) return;
    const currentIdx = pageData.sentences.findIndex((s) => s.id === (activeSentence?.id));
    const nextIdx = currentIdx < pageData.sentences.length - 1 ? currentIdx + 1 : 0;
    setActiveSentenceId(pageData.sentences[nextIdx].id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 70px)", backgroundColor: "#0f172a" }}>
      {/* Top Toolbar */}
      <div style={{
        height: isMobile ? "50px" : "56px",
        backgroundColor: "#1e293b",
        borderBottom: "1px solid #334155",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 10px" : "0 20px",
        color: "#f8fafc",
        flexShrink: 0
      }}>
        {/* Left: Back Button & Desktop Mutually Exclusive Mode Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button 
            className="btn btn-secondary" 
            onClick={onBack}
            style={{ padding: "6px 10px", fontSize: "12px", background: "#334155", color: "#f8fafc", borderColor: "#475569" }}
            title="الرجوع إلى مكتبة المحاضرات"
          >
            <ArrowLeft size={15} />
            <span style={{ display: isMobile ? "none" : "inline" }}>المكتبة</span>
          </button>

          {/* Desktop Mode Toggle: [ ⚡ العرض المتزامن ] | [ 📖 السلايد المدمج ] */}
          {!isMobile && (
            <div className="study-mode-toggle">
              <button 
                className={`mode-btn ${studyMode === "split" ? "active" : ""}`}
                onClick={() => handleModeChange("split")}
                title="طريقة 1: العرض المتزامن (الشريحة وقائمة الترجمة جنباً إلى جنب)"
              >
                <Columns size={14} />
                <span>العرض المتزامن</span>
              </button>
              <button 
                className={`mode-btn ${studyMode === "bilingual" ? "active" : ""}`}
                onClick={() => handleModeChange("bilingual")}
                title="طريقة 2: السلايد المدمج (النص الإنجليزي والترجمة العربية معاً)"
              >
                <BookOpen size={14} />
                <span>السلايد المدمج</span>
              </button>
            </div>
          )}
        </div>

        {/* Center: Pagination Controls (Desktop) or Title (Mobile) */}
        {!isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading || isProcessing}
              style={{ padding: "6px 10px", background: "#334155", color: "#f8fafc", borderColor: "#475569" }}
              title="الشريحة السابقة"
            >
              <ChevronRight size={18} />
            </button>

            <span style={{ fontSize: "13px", fontWeight: 700, minWidth: "120px", textAlign: "center" }}>
              {isProcessing ? "جاري المعالجة..." : `شريحة ${currentPage} من ${totalPages}`}
            </span>

            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading || isProcessing}
              style={{ padding: "6px 10px", background: "#334155", color: "#f8fafc", borderColor: "#475569" }}
              title="الشريحة التالية"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        ) : (
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#93c5fd" }}>
            {isProcessing ? "جاري المعالجة..." : `شريحة ${currentPage} من ${totalPages}`}
          </span>
        )}

        {/* Right: Controls & Download PDF Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!isMobile && (
            <>
              <button 
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))} 
                className="btn btn-secondary" 
                disabled={isProcessing}
                style={{ padding: "6px", background: "#334155", color: "#f8fafc", borderColor: "#475569" }}
                title="تصغير"
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: "12px", width: "36px", textAlign: "center" }}>
                {Math.round(zoomLevel * 100)}%
              </span>
              <button 
                onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.1))} 
                className="btn btn-secondary" 
                disabled={isProcessing}
                style={{ padding: "6px", background: "#334155", color: "#f8fafc", borderColor: "#475569" }}
                title="تكبير"
              >
                <ZoomIn size={16} />
              </button>
              <button 
                onClick={() => setZoomLevel(1.0)} 
                className="btn btn-secondary" 
                disabled={isProcessing}
                style={{ padding: "6px", background: "#334155", color: "#f8fafc", borderColor: "#475569" }}
                title="إعادة ضبط الحجم"
              >
                <RotateCcw size={16} />
              </button>
            </>
          )}

          {/* Download PDF Dropdown */}
          <div className="download-dropdown-wrapper" ref={downloadDropdownRef}>
            <button
              className="btn btn-primary"
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              disabled={downloadingPdf || isProcessing}
              style={{
                padding: isMobile ? "5px 10px" : "6px 14px",
                fontSize: isMobile ? "11px" : "13px",
                borderRadius: "8px",
                background: "#059669",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              title="خيارات تحميل ملفات المحاضرة بصيغة PDF"
            >
              <Download size={14} />
              <span>
                {downloadingPdf ? "تحميل..." : isMobile ? "تحميل PDF" : "تحميل PDF ▾"}
              </span>
            </button>

            {downloadMenuOpen && (
              <div className="download-dropdown-menu">
                <button 
                  className="dropdown-item"
                  onClick={() => handleDownloadPdf("bilingual")}
                  disabled={downloadingPdf}
                >
                  <div style={{ color: "#38bdf8", marginTop: "2px" }}><BookOpen size={16} /></div>
                  <div>
                    <div className="dropdown-item-title">
                      السلايد المدمج ثنائي اللغة (PDF)
                    </div>
                    <div className="dropdown-item-desc">
                      النص الإنجليزي والترجمة العربية معاً أسفل كل نقطة
                    </div>
                  </div>
                </button>

                <div style={{ height: "1px", background: "#334155", margin: "4px 0" }} />

                <button 
                  className="dropdown-item"
                  onClick={() => handleDownloadPdf("translation_only")}
                  disabled={downloadingPdf}
                >
                  <div style={{ color: "#34d399", marginTop: "2px" }}><FileText size={16} /></div>
                  <div>
                    <div className="dropdown-item-title">
                      ملف الترجمة فقط (PDF)
                    </div>
                    <div className="dropdown-item-desc">
                      ملخص ملاحظات دراسية A4 بالعربية للطباعة السريعة
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Sub-bar for Mutually Exclusive Mode Toggle & Page Navigation */}
      {isMobile && (
        <div style={{
          height: "44px",
          backgroundColor: "#1e293b",
          borderBottom: "1px solid #334155",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px",
          flexShrink: 0
        }}>
          {/* Mobile Mutually Exclusive Mode Switcher: Exactly 2 options */}
          <div className="study-mode-toggle">
            <button 
              className={`mode-btn ${studyMode === "split" ? "active" : ""}`}
              onClick={() => handleModeChange("split")}
              style={{ padding: "4px 12px", fontSize: "11.5px" }}
              title="طريقة 1: العرض المتزامن (الشريحة بالأعلى + لوحة الملاحظات بالأسفل)"
            >
              <Columns size={12} />
              <span>المتزامن</span>
            </button>
            <button 
              className={`mode-btn ${studyMode === "bilingual" ? "active" : ""}`}
              onClick={() => handleModeChange("bilingual")}
              style={{ padding: "4px 12px", fontSize: "11.5px" }}
              title="طريقة 2: السلايد المدمج (قراءة ثنائية: إنجليزي وعربي متسلسل دون شيت)"
            >
              <BookOpen size={12} />
              <span>المدمج</span>
            </button>
          </div>

          {/* Quick Page Nav Buttons with correct LTR pagination display */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button 
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              style={{ background: "#334155", border: "1px solid #475569", color: "#f8fafc", borderRadius: "6px", padding: "4px 8px" }}
              title="السابق"
            >
              <ChevronRight size={14} />
            </button>
            <span dir="ltr" style={{ fontSize: "12px", fontWeight: 700, color: "#93c5fd", minWidth: "36px", textAlign: "center" }}>
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              style={{ background: "#334155", border: "1px solid #475569", color: "#f8fafc", borderRadius: "6px", padding: "4px 8px" }}
              title="التالي"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Study Area */}
      {isProcessing ? (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#f8fafc",
          padding: "40px 20px",
          textAlign: "center"
        }}>
          <div style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            background: "rgba(37, 99, 235, 0.15)",
            border: "2px solid #3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#60a5fa",
            marginBottom: "20px"
          }}>
            <Clock size={32} style={{ animation: "pulse 2s infinite" }} />
          </div>

          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>
            جاري معالجة صفحات المحاضرة وترجمتها...
          </h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", maxWidth: "450px", lineHeight: "1.6", marginBottom: "20px" }}>
            ستفتح المحاضرة أمامك تلقائياً خلال لحظات.
          </p>
        </div>
      ) : isMobile ? (
        /* ================= MOBILE VIEW (EXACTLY ONE METHOD AT A TIME) ================= */
        studyMode === "bilingual" ? (
          /* METHOD 2 (السلايد المدمج - الخيار 2: شريط ترجمة سينمائي أسفل الشريحة) */
          <div className="cinematic-bilingual-viewer">
            <div className="cinematic-slide-viewport">
              {loading ? (
                <div style={{ color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", border: "3px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span>جاري تحميل الشريحة الأصلية...</span>
                </div>
              ) : pageData ? (
                <div 
                  className="cinematic-slide-frame"
                  onTouchStart={onTouchStartSlide}
                  onTouchMove={onTouchMoveSlide}
                  onTouchEnd={onTouchEndSlide}
                >
                  <img 
                    src={getFullImageUrl(pageData.image_url)} 
                    alt={`Slide ${currentPage}`} 
                    className="cinematic-slide-img"
                  />
                  <svg 
                    className="svg-overlay"
                    viewBox={`0 0 ${pageData.width || 720} ${pageData.height || 540}`}
                    preserveAspectRatio="none"
                  >
                    {pageData.sentences?.map((sent) => {
                      const isActive = (activeSentence?.id === sent.id);
                      return (
                        <g key={sent.id} onClick={() => setActiveSentenceId(sent.id)}>
                          {sent.bboxes?.map((box, bIdx) => (
                            <rect
                              key={`${sent.id}-box-${bIdx}`}
                              x={box.x}
                              y={box.y}
                              width={box.w}
                              height={box.h}
                              className={`cinematic-bbox ${isActive ? "active" : ""}`}
                            >
                              <title>{sent.original_text}</title>
                            </rect>
                          ))}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : null}
            </div>

            {pageData && activeSentence && (
              <div className="cinematic-ribbon-bar">
                <div className="cinematic-ribbon-meta">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                      color: "#ffffff",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      <BookOpen size={13} />
                      <span>السلايد المدمج</span>
                    </span>
                    <span style={{ fontSize: "11.5px", color: "#cbd5e1", fontWeight: 600 }}>
                      سطر {activeSentenceIndex + 1} من {pageData.sentences?.length || 0}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button 
                      className="cinematic-nav-btn"
                      onClick={handlePrevSentence}
                      disabled={!pageData.sentences || pageData.sentences.length <= 1}
                      title="السطر السابق"
                    >
                      <ChevronRight size={13} />
                      <span>السابق</span>
                    </button>
                    <button 
                      className="cinematic-nav-btn"
                      onClick={handleNextSentence}
                      disabled={!pageData.sentences || pageData.sentences.length <= 1}
                      title="السطر التالي"
                    >
                      <span>التالي</span>
                      <ChevronLeft size={13} />
                    </button>
                  </div>
                </div>

                <div className="cinematic-ribbon-content">
                  <div className="cinematic-ribbon-en">
                    {activeSentence.original_text}
                  </div>
                  <div className="cinematic-ribbon-ar">
                    <span style={{ color: "#38bdf8", flexShrink: 0 }}>↳</span>
                    <span>{activeSentence.translation || "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* METHOD 1 ONLY (العرض المتزامن): Clean Slide on Top + Draggable Bottom Sheet for Arabic Notes */
          <div className="viewer-container" style={{ position: "relative" }}>
            <div 
              className="mobile-slide-area"
              onTouchStart={onTouchStartSlide}
              onTouchMove={onTouchMoveSlide}
              onTouchEnd={onTouchEndSlide}
            >
              {loading ? (
                <div style={{ color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "80px" }}>
                  <div style={{ width: "32px", height: "32px", border: "3px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "13px" }}>جاري تحميل الشريحة...</span>
                </div>
              ) : pageData ? (
                <div 
                  className="slide-canvas-wrapper"
                  style={{ width: "100%", maxWidth: "600px", borderRadius: "8px", position: "relative" }}
                >
                  <img 
                    src={getFullImageUrl(pageData.image_url)} 
                    alt={`Slide ${currentPage}`} 
                    className="slide-image"
                  />
                  <svg 
                    className="svg-overlay"
                    viewBox={`0 0 ${pageData.width || 720} ${pageData.height || 540}`}
                    preserveAspectRatio="none"
                  >
                    {pageData.sentences?.map((sent) => {
                      const isActive = activeSentenceId === sent.id;
                      return (
                        <g key={sent.id} onClick={() => handleSelectSentence(sent.id)}>
                          {sent.bboxes?.map((box, bIdx) => (
                            <rect
                              key={`${sent.id}-box-${bIdx}`}
                              x={box.x}
                              y={box.y}
                              width={box.w}
                              height={box.h}
                              className={`bbox-rect ${isActive ? "active" : ""}`}
                              rx="2"
                            />
                          ))}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : null}
            </div>

            {/* Interactive Draggable Bottom Sheet for Method 1 */}
            <div 
              className="mobile-bottom-sheet"
              style={{
                height: sheetState === "expanded" ? "75vh" : sheetState === "peek" ? "210px" : "48px"
              }}
            >
              <div 
                className="sheet-handle-bar"
                onClick={() => setSheetState(sheetState === "expanded" ? "peek" : "expanded")}
              >
                <div className="sheet-handle-pill" />
                <div className="sheet-header-title">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Sparkles size={16} color="#2563eb" />
                    <span>الترجمة والملاحظات العربية</span>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                      ({pageData?.sentences?.length || 0} أجزاء)
                    </span>
                  </div>
                  <div style={{ color: "#64748b", display: "flex", alignItems: "center" }}>
                    {sheetState === "expanded" ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </div>
                </div>
              </div>

              <div className="sheet-content">
                {sheetState === "peek" && activeSentence ? (
                  <div 
                    onClick={() => setSheetState("expanded")}
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      border: "1px solid #facc15",
                      boxShadow: "0 4px 12px rgba(250, 204, 21, 0.15)",
                      cursor: "pointer"
                    }}
                  >
                    <p style={{ fontSize: "15px", lineHeight: "1.6", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      {activeSentence.translation || "—"}
                    </p>
                    <p className="ltr" style={{ fontSize: "12px", color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: "6px" }}>
                      {activeSentence.original_text}
                    </p>
                    <div style={{ marginTop: "8px", fontSize: "11px", color: "#2563eb", fontWeight: 600, textAlign: "left" }}>
                      اسحب للأعلى لعرض بقية أجزاء الشريحة ↑
                    </div>
                  </div>
                ) : (
                  <div>
                    {pageData?.sentences?.map((sent) => {
                      const isActive = activeSentenceId === sent.id;
                      return (
                        <div
                          key={sent.id}
                          ref={(el) => (translationRefs.current[sent.id] = el)}
                          onClick={() => handleSelectSentence(sent.id)}
                          className={`sentence-card ${isActive ? "active" : ""}`}
                          style={{ marginBottom: "10px" }}
                        >
                          <p style={{
                            fontSize: "15px",
                            lineHeight: "1.6",
                            fontWeight: 600,
                            color: isActive ? "#854d0e" : "#0f172a",
                            marginBottom: "4px"
                          }}>
                            {sent.translation || "—"}
                          </p>
                          <p 
                            className="ltr" 
                            style={{
                              fontSize: "12px",
                              lineHeight: "1.4",
                              color: isActive ? "#a16207" : "#64748b",
                              borderTop: "1px dashed #e2e8f0",
                              paddingTop: "4px"
                            }}
                          >
                            {sent.original_text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      ) : studyMode === "bilingual" ? (
        /* ================= METHOD 2 (السلايد المدمج - الخيار 2: شريط ترجمة سينمائي أسفل الشريحة) ================= */
        <div className="cinematic-bilingual-viewer">
          {/* Centered Large Pristine Slide Viewport (No sidebars, 100% visible diagrams) */}
          <div className="cinematic-slide-viewport">
            {loading ? (
              <div style={{ color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", border: "3px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <span>جاري تحميل الشريحة الأصلية...</span>
              </div>
            ) : error ? (
              <div style={{ color: "#f87171", padding: "40px", textAlign: "center" }}>
                <AlertCircle size={36} style={{ margin: "0 auto 12px" }} />
                <p style={{ fontWeight: 700 }}>{error}</p>
                <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: "16px", color: "#f8fafc" }}>
                  العودة للمكتبة
                </button>
              </div>
            ) : pageData ? (
              <div className="cinematic-slide-frame">
                <img 
                  src={getFullImageUrl(pageData.image_url)} 
                  alt={`Slide ${currentPage}`} 
                  className="cinematic-slide-img"
                />

                {/* SVG Bounding Boxes: Hover / Click updates the Cinematic Subtitle immediately */}
                <svg 
                  className="svg-overlay"
                  viewBox={`0 0 ${pageData.width || 720} ${pageData.height || 540}`}
                  preserveAspectRatio="none"
                >
                  {pageData.sentences?.map((sent) => {
                    const isActive = (activeSentence?.id === sent.id);
                    return (
                      <g key={sent.id} onClick={() => setActiveSentenceId(sent.id)}>
                        {sent.bboxes?.map((box, bIdx) => (
                          <rect
                            key={`${sent.id}-box-${bIdx}`}
                            x={box.x}
                            y={box.y}
                            width={box.w}
                            height={box.h}
                            className={`cinematic-bbox ${isActive ? "active" : ""}`}
                          >
                            <title>{sent.original_text}</title>
                          </rect>
                        ))}
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : null}
          </div>

          {/* Cinematic Subtitle Ribbon Bar (شريط الترجمة السينمائي أسفل الشريحة) */}
          {pageData && activeSentence && (
            <div className="cinematic-ribbon-bar">
              {/* Ribbon Meta Header */}
              <div className="cinematic-ribbon-meta">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#ffffff",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    boxShadow: "0 2px 6px rgba(37,99,235,0.4)"
                  }}>
                    <BookOpen size={13} />
                    <span>السلايد المدمج (ترجمة سينمائية)</span>
                  </span>
                  <span style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 600 }}>
                    سطر {activeSentenceIndex + 1} من {pageData.sentences?.length || 0}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button 
                    className="cinematic-nav-btn"
                    onClick={handlePrevSentence}
                    disabled={!pageData.sentences || pageData.sentences.length <= 1}
                    title="السطر السابق"
                  >
                    <ChevronRight size={14} />
                    <span>السطر السابق</span>
                  </button>
                  <button 
                    className="cinematic-nav-btn"
                    onClick={handleNextSentence}
                    disabled={!pageData.sentences || pageData.sentences.length <= 1}
                    title="السطر التالي"
                  >
                    <span>السطر التالي</span>
                    <ChevronLeft size={14} />
                  </button>
                </div>
              </div>

              {/* Ribbon Subtitle Text: Original English + Translated Arabic */}
              <div className="cinematic-ribbon-content">
                <div className="cinematic-ribbon-en">
                  {activeSentence.original_text}
                </div>
                <div className="cinematic-ribbon-ar">
                  <span style={{ color: "#38bdf8", flexShrink: 0 }}>↳</span>
                  <span>{activeSentence.translation || "—"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= METHOD 1 DESKTOP (العرض المتزامن): Dual Split Panes ================= */
        <div className="viewer-container">
          {/* Left Pane: Pristine Original Slide with interactive bounding boxes */}
          <div 
            className="viewer-pane pane-slide" 
            ref={slideContainerRef}
            style={{ height: "100%" }}
          >
            {loading ? (
              <div style={{ color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "100px" }}>
                <div style={{ width: "36px", height: "36px", border: "3px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <span>جاري تحميل الشريحة...</span>
              </div>
            ) : error ? (
              <div style={{ color: "#f87171", padding: "40px", textAlign: "center" }}>
                <AlertCircle size={36} style={{ margin: "0 auto 12px" }} />
                <p style={{ fontWeight: 700 }}>{error}</p>
                <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: "16px", color: "#f8fafc" }}>
                  العودة للمكتبة
                </button>
              </div>
            ) : pageData ? (
              <div 
                className="slide-canvas-wrapper"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "top center",
                  maxWidth: "920px",
                  width: "100%",
                  position: "relative"
                }}
              >
                <img 
                  src={getFullImageUrl(pageData.image_url)} 
                  alt={`Page ${currentPage}`} 
                  className="slide-image"
                />

                {/* SVG Bounding Boxes */}
                <svg 
                  className="svg-overlay"
                  viewBox={`0 0 ${pageData.width || 720} ${pageData.height || 540}`}
                  preserveAspectRatio="none"
                >
                  {pageData.sentences?.map((sent) => {
                    const isActive = activeSentenceId === sent.id;
                    return (
                      <g key={sent.id} onClick={() => handleSelectSentence(sent.id)}>
                        {sent.bboxes?.map((box, bIdx) => (
                          <rect
                            key={`${sent.id}-box-${bIdx}`}
                            x={box.x}
                            y={box.y}
                            width={box.w}
                            height={box.h}
                            className={`bbox-rect ${isActive ? "active" : ""}`}
                            rx="2"
                          >
                            <title>{sent.original_text}</title>
                          </rect>
                        ))}
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : null}
          </div>

          {/* Right Pane: Pure Translation Deck */}
          <div 
            className="viewer-pane pane-translation"
            style={{ height: "100%" }}
          >
            <div>
              <div style={{ marginBottom: "18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Columns size={20} color="#2563eb" />
                    العرض المتزامن (قائمة الترجمة)
                  </h2>
                  <p style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                    انقر على أي جملة لتحديد موقعها في الشريحة بدقة
                  </p>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 8px", background: "#f8fafc", color: "#64748b", borderRadius: "6px" }}>
                  {pageData?.sentences?.length || 0} أجزاء
                </span>
              </div>

              {loading ? (
                <div style={{ color: "#64748b", textAlign: "center", marginTop: "80px" }}>
                  جاري إعداد وتزامن الترجمة...
                </div>
              ) : (
                <div>
                  {pageData?.sentences?.map((sent) => {
                    const isActive = activeSentenceId === sent.id;
                    return (
                      <div
                        key={sent.id}
                        ref={(el) => (translationRefs.current[sent.id] = el)}
                        onClick={() => handleSelectSentence(sent.id)}
                        className={`sentence-card ${isActive ? "active" : ""}`}
                      >
                        <p style={{
                          fontSize: "16px",
                          lineHeight: "1.7",
                          fontWeight: 600,
                          color: isActive ? "#854d0e" : "#0f172a",
                          marginBottom: "6px"
                        }}>
                          {sent.translation || "—"}
                        </p>

                        <p 
                          className="ltr" 
                          style={{
                            fontSize: "13px",
                            lineHeight: "1.5",
                            color: isActive ? "#a16207" : "#64748b",
                            borderTop: "1px dashed #e2e8f0",
                            paddingTop: "6px"
                          }}
                        >
                          {sent.original_text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
