const bookingRules = (() => {
  const timeZone = "Asia/Amman";
  const services = Object.freeze([
    "general",
    "cosmetic",
    "whitening",
    "implants",
    "orthodontics",
    "prevention",
  ]);
  const openingDays = Object.freeze([0, 1, 2, 3, 4, 6]);
  const availableTimes = Object.freeze([
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "14:00",
    "15:00",
    "16:00",
  ]);

  function normalizePhone(value) {
    return value
      .replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
        const code = digit.charCodeAt(0);
        return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
      })
      .replace(/\D/g, "");
  }

  function isValidPhone(value) {
    const digitCount = normalizePhone(value).length;
    return digitCount >= 7 && digitCount <= 15;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function getClinicDate(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const values = Object.fromEntries(
      parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value])
    );

    return `${values.year}-${values.month}-${values.day}`;
  }

  function getDateError(value, today, openingDays) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return "invalidDate";
    }

    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== value) {
      return "invalidDate";
    }

    if (value < today) return "pastDate";
    if (!openingDays.includes(parsedDate.getUTCDay())) return "closedWeekday";
    return null;
  }

  return Object.freeze({
    timeZone,
    services,
    openingDays,
    availableTimes,
    getClinicDate,
    getDateError,
    normalizePhone,
    isValidPhone,
    isValidEmail,
  });
})();

if (typeof module === "object" && module.exports) {
  module.exports = bookingRules;
} else {
  globalThis.DentalBookingRules = bookingRules;
}