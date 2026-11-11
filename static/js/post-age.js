/* Blog of Linkola: published-relative dates (not estimated reading time). */
(() => {
  "use strict";
  const DAY = 86400000;
  const calendar = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit"
  });

  function istanbulDay(now) {
    const values = {};
    for (const part of calendar.formatToParts(now)) {
      if (["year", "month", "day"].includes(part.type)) values[part.type] = Number(part.value);
    }
    return Date.UTC(values.year, values.month - 1, values.day);
  }

  function labelFor(element, now) {
    if (element.dataset.dateOnly === "true") {
      const date = element.dataset.calendarDate || "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
      const [year, month, day] = date.split("-").map(Number);
      const age = Math.floor((istanbulDay(now) - Date.UTC(year, month - 1, day)) / DAY);
      if (age < 0) return "Yakında";
      if (age === 0) return "Bugün";
      if (age === 1) return "Dün";
      if (age < 7) return `${age} gün önce`;
      if (age < 30) return `${Math.floor(age / 7)} hafta önce`;
      if (age < 365) return `${Math.floor(age / 30)} ay önce`;
      return `${Math.floor(age / 365)} yıl önce`;
    }

    const published = Date.parse(element.dateTime);
    if (!Number.isFinite(published)) return null;
    const seconds = Math.floor((now.getTime() - published) / 1000);
    if (seconds < -60) return "Yakında";
    if (seconds < 60) return "Az önce";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} dakika önce`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} gün önce`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} hafta önce`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} ay önce`;
    return `${Math.floor(seconds / 31536000)} yıl önce`;
  }

  function updatePublishedTimes() {
    const now = new Date();
    document.querySelectorAll("time.post-age").forEach((element) => {
      const label = labelFor(element, now);
      if (label) element.textContent = label;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updatePublishedTimes, { once: true });
  } else {
    updatePublishedTimes();
  }
  setInterval(updatePublishedTimes, 60000);
})();
