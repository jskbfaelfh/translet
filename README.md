# منصة لِـثْ (LITH) — ترجمة المحاضرات الجامعية المتزامنة

منصة ويب متقدمة موجهة لطلبة الجامعات في العراق والعالم العربي، تتيح قراءة ودراسة محاضرات الـ PDF باللغة الإنجليزية مع ترجمة عربية دقيقة وتحديد متزامن للأسطر والفقرات بالنقر المباشر على الشريحة.

---

## 🚀 المميزات الرئيسية

1. **العرض الثنائي المتزامن (Synchronized Dual Viewer)**:
   - عرض الشريحة الأصلية بجودة عالية إلى جانب الترجمة العربية المتزامنة.
   - تحديد وتظليل متزامن: النقر على أي جملة في الشريحة الأصلية يحدد النص المقابل في الترجمة العربية ويحركه للوسط تلقائياً (`scrollIntoView`).
   - دعم كامل للأسطر الممتدة (Multi-line Bounding Boxes) باستخدام طبقة SVG تفاعلية دقيقة.

2. **نظام الكاش الذكي عبر التجزئة (Deduplication SHA-256 Cache)**:
   - فحص بصمة الملف قبل معالجته؛ إذا كان نفس الملف قد تم رفعه مسبقاً من قِبل زميل آخر في نفس الدفعة، تفتح المحاضرة **فوراً بدون أي انتظار أو استهلاك للرصيد**.

3. **المعالجة الخلفية الآمنة (Async Background Pipeline)**:
   - معالجة الـ PDF في الخلفية لمنع تجمد السيرفر والـ Timeouts.
   - استخراج النصوص وحساب أبعاد المستطيلات بدقة متناهية عبر مكتبة `PyMuPDF`.

4. **بنية تحتية اقتصادية فائقة**:
   - دعم التخزين السحابي على **Cloudflare R2** بـ 10GB مجاناً وبدون أي رسوم على نقل البيانات (Zero Egress Fees)، مع نظام تخزين محلي بديل (Fallback) جاهز للاختبار فوراً.
   - دعم الترجمة عبر Google Cloud Translation مع بديل تلقائي في بيئة التطوير.

5. **دعم وسائل الدفع المحلية**:
   - زين كاش (ZainCash)
   - آسيا حوالة (AsiaHawala)
   - مصرف FIB العراقي
   - لوحة تحكم إدارية خاصة للمشرف (Admin Panel) للتحقق اليدوي من الإيصالات وتفعيل الاشتراكات.

---

## 🛠️ هيكلية المشروع

```
lith/
├── backend/
│   ├── app/
│   │   ├── models/        # User, File, UserDocument, Page, Sentence, Translation, Payment
│   │   ├── routes/        # auth, documents, payments, storage
│   │   ├── services/      # pdf_service, storage_service, translation_service
│   │   ├── tasks/         # worker.py (Background processing pipeline)
│   │   └── utils/         # JWT auth middleware
│   ├── requirements.txt
│   ├── run.py             # تشغيل سيرفر Flask API على المنفذ 5000
│   └── test_api.py        # سكريبت اختبار تكاملي شامل
│
└── frontend/
    ├── src/
    │   ├── components/    # DualViewer, Navbar, UploadModal, PricingModal, AdminPanel, AuthModal
    │   ├── context/       # AuthContext
    │   ├── api.js         # API Client & Proxy integration
    │   ├── App.jsx
    │   └── index.css      # تصميم متجاوب بدعم كامل للغة العربية (RTL)
    ├── package.json
    └── vite.config.js     # خادم Vite مجهز بـ Proxy للمنفذ 5000
```

---

## 💻 طريقة التشغيل محلياً

### 1. تشغيل الباك إند (Backend):
```bash
cd backend
# تفعيل البيئة الافتراضية
.\venv\Scripts\activate
# تشغيل السيرفر
python run.py
```
> يعمل السيرفر افتراضياً على `http://localhost:5000`

### 2. تشغيل الفرونت إند (Frontend):
```bash
cd frontend
npm run dev
```
> تفتح الواجهة على `http://localhost:5173`

---

## 🧪 الاختبار التكاملي السريع
تم توفير سكريبت يقوم بإنشاء محاضرة نموذجية واختبار التسجيل والرفع وتوليد الصور واستخراج الـ BBoxes والترجمة ومطابقة الكاش:
```bash
cd backend
.\venv\Scripts\python test_api.py
```
