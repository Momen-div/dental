/* Clinic customization lives here. Replace placeholders and verify every service before publication. */
window.CLINIC_CONFIG = {
  clinicName: { ar: "عيادة الأسنان", en: "Dental Care" },
  contact: {
    phone: "", // Add a verified clinic phone, e.g. +962…
    whatsapp: "", // Add an international-format number without spaces
    email: "",
    address: { ar: "أضف عنوان العيادة المعتمد", en: "Add the verified clinic address" },
    hours: {
      ar: "يرجى التواصل للاستفسار عن ساعات العمل",
      en: "Please contact the clinic to confirm opening hours"
    }
  },
  mapEmbedUrl: "https://www.google.com/maps?q=Amman%2C%20Jordan&output=embed", // Demonstration only; replace with the real clinic map embed URL.
  images: {
    hero: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=90",
    gallery: [
      "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1593022356769-11f762e25ed9?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=85"
    ]
  },
  dentist: {
    name: { ar: "اسم طبيب/ة الأسنان", en: "Dentist name" },
    title: { ar: "التخصص والمؤهلات المعتمدة", en: "Verified specialty and qualifications" },
    bio: {
      ar: "أضف نبذة تعريفية معتمدة عن الطبيب/ة ونهجه/ا في رعاية المرضى.",
      en: "Add an approved biography describing the dentist and their approach to patient care."
    },
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1000&q=85"
  },
  services: [
    {
      id: "general",
      icon: "✧",
      image: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "cosmetic",
      icon: "◈",
      image: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "whitening",
      icon: "✦",
      image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "implants",
      icon: "◇",
      image: "https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "orthodontics",
      icon: "⌁",
      image: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "prevention",
      icon: "＋",
      image: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=800&q=80"
    }
  ],
  booking: {
    phoneCountryCode: "+962",
    openingDays: [0, 1, 2, 3, 4, 6], // JavaScript day numbers: 0 Sunday … 6 Saturday. Verify with the clinic.
    availableTimes: ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"]
  },
  social: {
    instagram: "",
    facebook: "",
    linkedin: ""
  }
};
