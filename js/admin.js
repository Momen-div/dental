(() => {
  const copy = {
    ar: {
      backSite: "العودة إلى الموقع", clinicAdmin: "إدارة العيادة", loginTitle: "دخول المسؤول",
      loginHint: "سجّل الدخول للوصول إلى طلبات المواعيد.", username: "اسم المستخدم أو البريد الإلكتروني",
      password: "كلمة المرور", showPassword: "إظهار", hidePassword: "إخفاء", signIn: "تسجيل الدخول", privateNotice: "هذه المساحة مخصصة لموظفي العيادة المصرح لهم.",
      appointmentsTitle: "المواعيد", logout: "تسجيل الخروج", dashboardEyebrow: "تنسيق رعاية المرضى",
      refresh: "تحديث القائمة", filterTitle: "البحث والتصفية", search: "بحث بالاسم أو الهاتف أو البريد",
      date: "التاريخ", service: "الخدمة", status: "الحالة", allServices: "كل الخدمات", allStatuses: "كل الحالات",
      pending: "قيد الانتظار", confirmed: "مؤكد", cancelled: "ملغي", applyFilters: "تطبيق", loading: "جارٍ تحميل المواعيد…",
      empty: "لا توجد مواعيد تطابق عوامل التصفية.", loadError: "تعذر تحميل المواعيد. حاول مرة أخرى.", success: "تم تحديث الموعد.",
      actionError: "تعذر تنفيذ الإجراء. حدّث الصفحة وحاول مجدداً.", confirm: "تأكيد الموعد", cancel: "إلغاء الموعد",
      delete: "حذف نهائي", deletePrompt: "سيؤدي هذا إلى حذف سجل الموعد نهائياً. هل تريد المتابعة؟", cancelPrompt: "هل تريد إلغاء هذا الموعد؟",
      total: "الإجمالي", pendingCount: "قيد الانتظار", confirmedCount: "المؤكدة", cancelledCount: "الملغاة",
      patient: "المريض", phone: "الهاتف", email: "البريد الإلكتروني", appointmentDate: "الموعد", notes: "ملاحظات",
      page: "صفحة", of: "من", previous: "السابق", next: "التالي", loginFailed: "تعذر تسجيل الدخول. تحقق من بيانات الاعتماد وحاول لاحقاً.",
      sessionExpired: "انتهت الجلسة. يرجى تسجيل الدخول مجدداً.", loginRequired: "يلزم تسجيل الدخول.",
      services: { general: "طب الأسنان العام", cosmetic: "طب الأسنان التجميلي", whitening: "تبييض الأسنان", implants: "زراعة الأسنان", orthodontics: "تقويم الأسنان", prevention: "الوقاية والعناية" },
    },
    en: {
      backSite: "Back to website", clinicAdmin: "Clinic administration", loginTitle: "Administrator sign in",
      loginHint: "Sign in to access appointment requests.", username: "Username or email address", password: "Password",
      showPassword: "Show", hidePassword: "Hide", signIn: "Sign in", privateNotice: "This area is for authorized clinic staff only.", appointmentsTitle: "Appointments",
      logout: "Log out", dashboardEyebrow: "Patient care coordination", refresh: "Refresh list", filterTitle: "Search and filter",
      search: "Search name, phone, or email", date: "Date", service: "Service", status: "Status", allServices: "All services",
      allStatuses: "All statuses", pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled", applyFilters: "Apply",
      loading: "Loading appointments…", empty: "No appointments match these filters.", loadError: "Could not load appointments. Please try again.",
      success: "Appointment updated.", actionError: "Action failed. Refresh and try again.", confirm: "Confirm appointment",
      cancel: "Cancel appointment", delete: "Delete permanently", deletePrompt: "This permanently deletes the appointment record. Continue?",
      cancelPrompt: "Cancel this appointment?", total: "Total", pendingCount: "Pending", confirmedCount: "Confirmed",
      cancelledCount: "Cancelled", patient: "Patient", phone: "Phone", email: "Email", appointmentDate: "Appointment",
      notes: "Notes", page: "Page", of: "of", previous: "Previous", next: "Next",
      loginFailed: "Unable to sign in. Check your credentials and try again later.", sessionExpired: "Your session expired. Please sign in again.",
      loginRequired: "Sign-in is required.",
      services: { general: "General dentistry", cosmetic: "Cosmetic dentistry", whitening: "Teeth whitening", implants: "Dental implants", orthodontics: "Orthodontics", prevention: "Preventive care" },
    },
  };

  const languageKey = "clinic-admin-language";
  let language = "ar";
  try { language = localStorage.getItem(languageKey) === "en" ? "en" : "ar"; } catch {}
  let csrf = "";
  let currentPage = 1;
  let currentPageCount = 1;
  const t = (key) => copy[language][key] ?? key;

  function applyLanguage() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-copy]").forEach((element) => {
      const key = element.dataset.copy;
      if (copy[language][key]) element.textContent = t(key);
    });
    document.querySelectorAll("select[name=service] option").forEach((option) => {
      if (option.value) option.textContent = copy[language].services[option.value] || option.value;
    });
    document.querySelectorAll("[data-language-toggle]").forEach((button) => {
      button.textContent = language === "ar" ? "English" : "العربية";
      button.setAttribute("aria-label", language === "ar" ? "Switch to English" : "التبديل إلى العربية");
    });
    updatePasswordToggle();
    document.title = document.body.dataset.page === "login" ? `${t("loginTitle")} | ${t("clinicAdmin")}` : `${t("appointmentsTitle")} | ${t("clinicAdmin")}`;
  }

  async function getCsrf() {
    const response = await fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store" });
    const result = await response.json();
    if (!response.ok || typeof result.csrfToken !== "string") throw new Error("CSRF unavailable");
    csrf = result.csrfToken;
    return csrf;
  }

  function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body) headers.set("Content-Type", "application/json");
    if (options.method && options.method !== "GET") headers.set("X-CSRF-Token", csrf);
    return fetch(path, { ...options, headers, credentials: "same-origin", cache: "no-store" });
  }

  function setMessage(element, message, kind = "") {
    element.textContent = message;
    element.dataset.kind = kind;
  }

  function updatePasswordToggle() {
    const password = document.querySelector("#password");
    const toggle = document.querySelector("#password-toggle");
    if (!password || !toggle) return;

    const isVisible = password.type === "text";
    const label = isVisible ? t("hidePassword") : t("showPassword");
    toggle.textContent = label;
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("aria-pressed", String(isVisible));
  }

  function onLogin() {
    const form = document.querySelector("#login-form");
    const message = document.querySelector("#login-message");
    const password = form.elements.password;
    document.querySelector("#password-toggle").addEventListener("click", () => {
      password.type = password.type === "password" ? "text" : "password";
      updatePasswordToggle();
      password.focus();
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type=submit]");
      button.disabled = true;
      setMessage(message, "");
      try {
        if (!csrf) await getCsrf();
        const response = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username: form.elements.username.value, password: form.elements.password.value }),
        });
        if (!response.ok) throw new Error("sign-in failed");
        const result = await response.json();
        csrf = result.csrfToken;
        window.location.assign("/admin");
      } catch {
        form.elements.password.value = "";
        setMessage(message, t("loginFailed"), "error");
      } finally {
        button.disabled = false;
      }
    });
    getCsrf().catch(() => setMessage(message, t("loginFailed"), "error"));
  }

  function addDetail(list, label, value, className = "") {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value || "—";
    if (className) {
      term.classList.add(className);
      description.classList.add(className);
    }
    list.append(term, description);
  }

  function statusLabel(status) {
    return t(status);
  }

  function renderSummary(summary) {
    const container = document.querySelector("#summary");
    const entries = [
      ["total", summary.total], ["pendingCount", summary.pending],
      ["confirmedCount", summary.confirmed], ["cancelledCount", summary.cancelled],
    ];
    container.replaceChildren();
    entries.forEach(([label, count]) => {
      const card = document.createElement("article");
      card.className = "admin-stat-card";
      const number = document.createElement("strong");
      number.textContent = String(Number(count) || 0);
      const caption = document.createElement("span");
      caption.textContent = t(label);
      card.append(number, caption);
      container.append(card);
    });
  }

  async function updateAppointment(id, status, permanentlyDelete = false) {
    const prompt = permanentlyDelete ? t("deletePrompt") : t("cancelPrompt");
    if ((permanentlyDelete || status === "cancelled") && !window.confirm(prompt)) return;
    const message = document.querySelector("#dashboard-message");
    try {
      const response = permanentlyDelete
        ? await api(`/api/admin/appointments/${encodeURIComponent(id)}`, { method: "DELETE" })
        : await api(`/api/admin/appointments/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error("update failed");
      await loadAppointments(currentPage);
      setMessage(message, t("success"), "success");
    } catch {
      setMessage(message, t("actionError"), "error");
    }
  }

  function renderAppointments(appointments) {
    const container = document.querySelector("#appointment-list");
    container.replaceChildren();
    if (!appointments.length) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.textContent = t("empty");
      container.append(empty);
      return;
    }
    appointments.forEach((appointment) => {
      const card = document.querySelector("#appointment-template").content.firstElementChild.cloneNode(true);
      card.querySelector(".appointment-name").textContent = appointment.name;
      card.querySelector(".appointment-meta").textContent = `${appointment.date} · ${appointment.time}`;
      const badge = card.querySelector(".appointment-status");
      badge.textContent = statusLabel(appointment.status);
      badge.classList.add(`status-${appointment.status}`);
      const details = card.querySelector(".appointment-details");
      addDetail(details, t("phone"), appointment.phone, "appointment-highlight");
      addDetail(details, t("email"), appointment.email);
      addDetail(details, t("service"), copy[language].services[appointment.service] || appointment.service, "appointment-highlight");
      addDetail(details, t("notes"), appointment.notes, "appointment-highlight");
      const actions = card.querySelector(".appointment-actions");
      if (appointment.status === "pending") {
        const confirm = document.createElement("button");
        confirm.type = "button";
        confirm.className = "admin-primary";
        confirm.textContent = t("confirm");
        confirm.addEventListener("click", () => updateAppointment(appointment.id, "confirmed"));
        actions.append(confirm);
      }
      if (appointment.status !== "cancelled") {
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "admin-secondary";
        cancel.textContent = t("cancel");
        cancel.addEventListener("click", () => updateAppointment(appointment.id, "cancelled"));
        actions.append(cancel);
      }
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "admin-danger-link";
      remove.textContent = t("delete");
      remove.addEventListener("click", () => updateAppointment(appointment.id, null, true));
      actions.append(remove);
      container.append(card);
    });
  }

  function renderPagination(pagination) {
    const nav = document.querySelector("#pagination");
    nav.replaceChildren();
    currentPageCount = Math.max(1, pagination.pages);
    const label = document.createElement("span");
    label.textContent = `${t("page")} ${pagination.page} ${t("of")} ${currentPageCount}`;
    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = t("previous");
    previous.disabled = pagination.page <= 1;
    previous.addEventListener("click", () => loadAppointments(pagination.page - 1));
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = t("next");
    next.disabled = pagination.page >= pagination.pages;
    next.addEventListener("click", () => loadAppointments(pagination.page + 1));
    nav.append(previous, label, next);
  }

  async function loadAppointments(page = 1) {
    const list = document.querySelector("#appointment-list");
    const message = document.querySelector("#dashboard-message");
    list.setAttribute("aria-busy", "true");
    list.replaceChildren();
    const loading = document.createElement("p");
    loading.className = "admin-empty";
    loading.textContent = t("loading");
    list.append(loading);
    try {
      const form = document.querySelector("#filter-form");
      const params = new URLSearchParams(new FormData(form));
      for (const [key, value] of [...params]) if (!value || (key === "status" && value === "all")) params.delete(key);
      params.set("page", String(page));
      const response = await api(`/api/admin/appointments?${params}`);
      if (response.status === 401) {
        setMessage(message, t("sessionExpired"), "error");
        window.location.assign("/admin/login");
        return;
      }
      if (!response.ok) throw new Error("load failed");
      const result = await response.json();
      currentPage = result.pagination.page;
      renderSummary(result.summary);
      renderAppointments(result.appointments);
      renderPagination(result.pagination);
      setMessage(message, "");
    } catch {
      setMessage(message, t("loadError"), "error");
      list.replaceChildren();
    } finally {
      list.setAttribute("aria-busy", "false");
    }
  }

  async function onDashboard() {
    try {
      const response = await api("/api/auth/session");
      if (!response.ok) return window.location.replace("/admin/login");
      const result = await response.json();
      csrf = result.csrfToken;
      document.querySelector("#admin-user").textContent = result.administrator.username;
      await loadAppointments(1);
    } catch {
      window.location.replace("/admin/login");
      return;
    }

    document.querySelector("#filter-form").addEventListener("submit", (event) => {
      event.preventDefault();
      loadAppointments(1);
    });
    document.querySelector("#refresh-button").addEventListener("click", () => loadAppointments(currentPage));
    document.querySelector("#logout-button").addEventListener("click", async () => {
      try {
        const response = await api("/api/auth/logout", { method: "POST" });
        if (!response.ok) throw new Error("logout failed");
      } finally {
        window.location.assign("/admin/login");
      }
    });
  }

  document.querySelectorAll("[data-language-toggle]").forEach((button) => button.addEventListener("click", () => {
    language = language === "ar" ? "en" : "ar";
    try { localStorage.setItem(languageKey, language); } catch {}
    applyLanguage();
    if (document.body.dataset.page === "dashboard") loadAppointments(currentPage);
  }));

  applyLanguage();
  if (document.body.dataset.page === "login") onLogin();
  if (document.body.dataset.page === "dashboard") onDashboard();
})();
