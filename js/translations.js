
/* Arabic and English interface copy, kept separate from application logic. */

const translations = {
  ar: {
    documentTitle: "عيادة الأسنان | رعاية تليق بابتسامتك",
    description:
      "رعاية أسنان مخصصة في أجواء هادئة. استكشف الخدمات وأرسل طلب موعد.",

    home: "الرئيسية",
    services: "خدماتنا",
    doctor: "عن الطبيب",
    gallery: "معرض الصور",
    whyUs: "لماذا نحن",
    contact: "تواصل معنا",

    language: "English",
    languageLabel: "Switch to English",
    menuOpen: "فتح القائمة",
    menuClose: "إغلاق القائمة",
    book: "اطلب موعداً",

    heroEyebrow: "عناية هادئة، واهتمام بكل التفاصيل",
    heroTitle: "ابتسامة أكثر صحة،\nوثقة تبدأ من هنا",
    heroText:
      "تجربة رعاية أسنان شخصية تضع راحتك واحتياجاتك في مقدمة الاهتمام.",
    explore: "اكتشف خدماتنا",
    heroNote:
      "إرسال طلب الموعد لا يعني تأكيد الموعد.",

    servicesEyebrow: "رعاية متكاملة لابتسامتك",
    servicesTitle: "خدمات مصممة حول احتياجاتك",
    servicesText:
      "استكشف أمثلة على الخدمات. يُرجى التحقق من توفر كل خدمة لدى العيادة قبل النشر.",

    serviceGeneralTitle: "طب الأسنان العام",
    serviceGeneralText:
      "فحوصات ورعاية أساسية لصحة الفم، وفق تقييم الطبيب واحتياجات كل شخص.",

    serviceCosmeticTitle: "طب الأسنان التجميلي",
    serviceCosmeticText:
      "خيارات تجميلية تُناقش بعد تقييم الحالة وتوضيح البدائل المناسبة.",

    serviceWhiteningTitle: "تبييض الأسنان",
    serviceWhiteningText:
      "استشارة حول خيارات التبييض ومدى ملاءمتها بعد فحص الأسنان.",

    serviceImplantsTitle: "زراعة الأسنان",
    serviceImplantsText:
      "تقييم وخيارات تعويض الأسنان تُحدد بالتشاور مع طبيب الأسنان.",

    serviceOrthodonticsTitle: "تقويم الأسنان",
    serviceOrthodonticsText:
      "مناقشة خيارات التقويم المناسبة بعد فحص وشرح خطة الرعاية.",

    servicePreventionTitle: "الوقاية والعناية",
    servicePreventionText:
      "إرشادات للعناية اليومية وخيارات الوقاية بحسب احتياجاتك.",

    doctorEyebrow: "تعرّف على طبيب الأسنان",
    doctorTitle: "رعاية شخصية تبدأ بالإنصات",
    doctorCta: "تواصل مع العيادة",
    credentialsLabel: "المؤهلات والتخصص",

    galleryEyebrow: "مساحة ملهمة",
    galleryTitle: "تفاصيل من عالم العناية بالأسنان",
    galleryText:
      "صور توضيحية من مكتبات الصور، وليست حالات مرضى أو نتائج علاجية للعيادة.",
    illustrative: "صورة توضيحية",
    galleryOne: "مساحة عيادة مشرقة",
    galleryTwo: "تفاصيل العناية اليومية",
    galleryThree: "تجربة زيارة مريحة",
    galleryFour: "معدات عناية حديثة",
    galleryFive: "ابتسامة طبيعية",
    gallerySix: "تفاصيل من العيادة",
    imageClose: "إغلاق عرض الصورة",

    whyEyebrow: "تجربة تضعك أولاً",
    whyTitle: "تفاصيل صغيرة تصنع فرقاً",
    whyText:
      "مبادئ عامة لتجربة رعاية أفضل، تُحدّث بما يتوافق مع خدمات العيادة الفعلية.",

    principleOneTitle: "تواصل واضح",
    principleOneText:
      "شرح الخيارات والخطوات بلغة مفهومة، مع إتاحة المجال لأسئلتك.",

    principleTwoTitle: "اهتمام شخصي",
    principleTwoText:
      "الاستماع لاحتياجاتك وتفضيلاتك عند مناقشة الرعاية المناسبة.",

    principleThreeTitle: "تنسيق مريح",
    principleThreeText:
      "طريقة سهلة لإرسال طلب موعد مفضل.",

    // Appointment booking
    bookingEyebrow: "خطوتك التالية",
    bookingTitle: "أرسل طلب موعد",
    bookingText:
      "يمكنك إرسال طلب بموعد مفضل. إرسال الطلب لا يعني تأكيد الموعد.",

    demoBadge: "إرسال طلب موعد",

    nameLabel: "الاسم الكامل",
    phoneLabel: "رقم الهاتف",
    emailLabel: "البريد الإلكتروني (اختياري)",
    serviceLabel: "الخدمة المطلوبة",
    chooseService: "اختر خدمة",
    dateLabel: "التاريخ المفضل",
    timeLabel: "الوقت المفضل",
    chooseTime: "اختر وقتاً مفضلاً",
    messageLabel: "رسالة إضافية (اختياري)",

    privacyText:
      "سيتم إرسال بياناتك إلى الخادم لحفظ طلب الموعد ومراجعته. لا تُدخل معلومات طبية أو حساسة.",

    submitBooking: "إرسال طلب الموعد",
    submitting: "جارٍ إرسال طلب الموعد...",
    bookingSuccess:
      "تم استلام طلب الموعد. هذا الطلب لا يُعد تأكيداً للموعد.",
    slotUnavailable:
      "هذا الوقت لم يعد متاحاً. اختر تاريخاً أو وقتاً آخر.",
    bookingInvalid:
      "تعذّر قبول الطلب. راجع البيانات المدخلة والتاريخ والوقت المختارين.",
    bookingFailed:
      "تعذّر إرسال طلب الموعد حالياً. حاول مرة أخرى لاحقاً.",

    // Contact details
    contactEyebrow: "نحن هنا للمساعدة",
    contactTitle: "تواصل مع العيادة",
    contactText:
      "بيانات التواصل أدناه حقول تجريبية. استبدلها بمعلومات تم التحقق منها.",

    phone: "الهاتف",
    whatsapp: "واتساب",
    email: "البريد الإلكتروني",
    address: "العنوان",
    hours: "ساعات العمل",

    mapTitle:
      "موقع توضيحي في عمّان، الأردن — ليس عنوان العيادة الفعلي",
    mapNotice:
      "موقع تجريبي في عمّان — استبدل الرابط بعنوان العيادة الحقيقي.",

    reviewsEyebrow: "تجارب من Google",
    reviewsTitle: "آراء مرضانا",
    reviewsIntro:
      "تعرف على ما يشاركه المرضى على Google. لا نعرض إلا نصوص التقييمات الموثقة التي أضافتها العيادة.",
    reviewsEmptyTitle: "لا توجد تقييمات مضافة للعرض حالياً",
    reviewsEmptyText:
      "ستظهر هنا مقتطفات التقييمات التي تتحقق منها العيادة. يمكنك قراءة جميع التقييمات على Google Maps عند إضافة رابط الملف الصحيح.",
    reviewsSetupTitle: "التقييمات الموثقة قيد الإعداد",
    reviewsSetupText:
      "لم تتم إضافة تقييمات أو رابط Google Maps موثّق بعد. لن نعرض أسماء أو تقييمات أو أرقاماً غير مؤكدة.",
    reviewsLink: "اقرأ جميع التقييمات على Google Maps",
    reviewRating: "التقييم: {rating} من 5 نجوم",
    reviewDate: "تاريخ التقييم",
    googleAttribution: "تقييم منشور على Google",

    // Validation messages
    required: "هذا الحقل مطلوب.",
    invalidName: "يجب ألا يتجاوز الاسم ١٠٠ حرف.",
    invalidEmail: "أدخل بريداً إلكترونياً صالحاً.",
    invalidPhone: "أدخل رقم هاتف صالحاً.",
    invalidService: "اختر خدمة من الخيارات المتاحة.",
    invalidDate: "اختر تاريخاً صحيحاً اليوم أو في المستقبل.",
    closedDay: "يرجى اختيار يوم استقبال متاح.",
    invalidTime: "اختر وقتاً من الخيارات المتاحة.",
    messageTooLong: "يجب ألا تتجاوز الرسالة ٥٠٠ حرف.",
    invalidMessage: "أدخل رسالة نصية صالحة.",
    errorSummary: "يرجى مراجعة الحقول الموضحة.",

    footerLine: "نموذج موقع قابل للتخصيص لعيادة الأسنان.",
    privacy: "سياسة الخصوصية (رابط تجريبي)",
    privacyNotice:
      "أضف سياسة خصوصية معتمدة قبل جمع أي بيانات من الزوار.",
    footerContact: "بيانات التواصل تحتاج إلى تحديث",
    backTop: "العودة إلى الأعلى",
    social: "تابعنا",

    serviceNames: {
      general: "طب الأسنان العام",
      cosmetic: "طب الأسنان التجميلي",
      whitening: "تبييض الأسنان",
      implants: "زراعة الأسنان",
      orthodontics: "تقويم الأسنان",
      prevention: "الوقاية والعناية",
    },

    timeLabels: {
      "09:00": "٩:٠٠ صباحاً",
      "10:00": "١٠:٠٠ صباحاً",
      "11:00": "١١:٠٠ صباحاً",
      "12:00": "١٢:٠٠ ظهراً",
      "14:00": "٢:٠٠ ظهراً",
      "15:00": "٣:٠٠ مساءً",
      "16:00": "٤:٠٠ مساءً",
    },
  },

  en: {
    documentTitle: "Dental Care | Thoughtful Care for Your Smile",
    description:
      "Personalized dental care in a calm setting. Explore services and submit an appointment request.",

    home: "Home",
    services: "Services",
    doctor: "The Dentist",
    gallery: "Gallery",
    whyUs: "Why Us",
    contact: "Contact",

    language: "العربية",
    languageLabel: "التبديل إلى العربية",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    book: "Request an Appointment",

    heroEyebrow: "Thoughtful care, down to every detail",
    heroTitle: "A healthier smile.\nConfidence starts here.",
    heroText:
      "A personal dental care experience that puts your comfort and needs first.",
    explore: "Explore Services",
    heroNote:
      "Submitting an appointment request does not confirm an appointment.",

    servicesEyebrow: "Care for your smile",
    servicesTitle: "Services shaped around your needs",
    servicesText:
      "Explore illustrative service examples. Verify each service is actually offered before publication.",

    serviceGeneralTitle: "General Dentistry",
    serviceGeneralText:
      "Examinations and essential oral care guided by a dentist's assessment and individual needs.",

    serviceCosmeticTitle: "Cosmetic Dentistry",
    serviceCosmeticText:
      "Cosmetic options discussed after an assessment and explanation of appropriate alternatives.",

    serviceWhiteningTitle: "Teeth Whitening",
    serviceWhiteningText:
      "A consultation about whitening options and suitability after a dental examination.",

    serviceImplantsTitle: "Dental Implants",
    serviceImplantsText:
      "Assessment and tooth replacement options determined in consultation with a dentist.",

    serviceOrthodonticsTitle: "Orthodontics",
    serviceOrthodonticsText:
      "Discuss suitable orthodontic options after an examination and care-plan review.",

    servicePreventionTitle: "Preventive Care",
    servicePreventionText:
      "Guidance for daily care and preventive options based on your needs.",

    doctorEyebrow: "Meet the dentist",
    doctorTitle: "Personal care begins with listening",
    doctorCta: "Contact the Clinic",
    credentialsLabel: "Qualifications & specialty",

    galleryEyebrow: "A little inspiration",
    galleryTitle: "A closer look at dental care",
    galleryText:
      "Illustrative stock photography—not clinic patients, cases, or treatment outcomes.",
    illustrative: "Illustrative photo",
    galleryOne: "A bright clinic space",
    galleryTwo: "Everyday care details",
    galleryThree: "A comfortable visit",
    galleryFour: "Modern care equipment",
    galleryFive: "A natural smile",
    gallerySix: "Clinic details",
    imageClose: "Close image viewer",

    whyEyebrow: "An experience centered on you",
    whyTitle: "Small details make a difference",
    whyText:
      "General principles for a thoughtful care experience; adapt these to the clinic's actual practices.",

    principleOneTitle: "Clear communication",
    principleOneText:
      "Discuss options and next steps in plain language, with room for your questions.",

    principleTwoTitle: "Personal attention",
    principleTwoText:
      "Listen to your needs and preferences when discussing suitable care.",

    principleThreeTitle: "Convenient coordination",
    principleThreeText:
      "An easy way to submit a preferred appointment request.",

    // Appointment booking
    bookingEyebrow: "Your next step",
    bookingTitle: "Request an appointment",
    bookingText:
      "You can submit a preferred appointment request. Submission does not confirm an appointment.",

    demoBadge: "Appointment request",

    nameLabel: "Full name",
    phoneLabel: "Phone number",
    emailLabel: "Email address (optional)",
    serviceLabel: "Requested service",
    chooseService: "Choose a service",
    dateLabel: "Preferred date",
    timeLabel: "Preferred time",
    chooseTime: "Choose a preferred time",
    messageLabel: "Additional message (optional)",

    privacyText:
      "Your information will be sent to the server to store and review your appointment request. Do not enter medical or sensitive information.",

    submitBooking: "Submit appointment request",
    submitting: "Submitting your appointment request...",
    bookingSuccess:
      "Your appointment request was received. This is not an appointment confirmation.",
    slotUnavailable:
      "This time is no longer available. Please choose another date or time.",
    bookingInvalid:
      "The request was rejected. Check the entered details, date, and time.",
    bookingFailed:
      "Unable to submit your appointment request right now. Please try again later.",

    // Contact details
    contactEyebrow: "We're here to help",
    contactTitle: "Contact the clinic",
    contactText:
      "The contact details below are placeholders. Replace them with verified information.",

    phone: "Phone",
    whatsapp: "WhatsApp",
    email: "Email",
    address: "Address",
    hours: "Opening hours",

    mapTitle:
      "Demonstration location in Amman, Jordan — not the clinic's actual address",
    mapNotice:
      "Demo location in Amman — replace with the real clinic map URL.",

    reviewsEyebrow: "Patient experiences on Google",
    reviewsTitle: "What Our Patients Say",
    reviewsIntro:
      "See what patients share on Google. Only review text verified and added by the clinic is shown here.",
    reviewsEmptyTitle: "No reviews have been added here yet",
    reviewsEmptyText:
      "Clinic-verified review excerpts will appear here. Read all reviews on Google Maps once the correct listing link is added.",
    reviewsSetupTitle: "Verified reviews are being prepared",
    reviewsSetupText:
      "No verified reviews or Google Maps link have been provided yet. We will not display unconfirmed names, ratings, or counts.",
    reviewsLink: "Read all reviews on Google Maps",
    reviewRating: "Rated {rating} out of 5 stars",
    reviewDate: "Review date",
    googleAttribution: "Review posted on Google",

    // Validation messages
    required: "This field is required.",
    invalidName: "Name must be 100 characters or fewer.",
    invalidEmail: "Enter a valid email address.",
    invalidPhone: "Enter a valid phone number.",
    invalidService: "Choose a service from the available options.",
    invalidDate: "Choose a valid date today or in the future.",
    closedDay: "Please select an available clinic day.",
    invalidTime: "Choose a time from the available options.",
    messageTooLong: "Message must be 500 characters or fewer.",
    invalidMessage: "Enter a valid text message.",
    errorSummary: "Please review the highlighted fields.",

    footerLine: "A customizable dental clinic website template.",
    privacy: "Privacy policy (placeholder link)",
    privacyNotice:
      "Add an approved privacy policy before collecting any visitor information.",
    footerContact: "Contact details need updating",
    backTop: "Back to top",
    social: "Follow us",

    serviceNames: {
      general: "General Dentistry",
      cosmetic: "Cosmetic Dentistry",
      whitening: "Teeth Whitening",
      implants: "Dental Implants",
      orthodontics: "Orthodontics",
      prevention: "Preventive Care",
    },

    timeLabels: {
      "09:00": "9:00 AM",
      "10:00": "10:00 AM",
      "11:00": "11:00 AM",
      "12:00": "12:00 PM",
      "14:00": "2:00 PM",
      "15:00": "3:00 PM",
      "16:00": "4:00 PM",
    },
  },
};

export default translations;
