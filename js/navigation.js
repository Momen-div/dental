/** Adds mobile-menu behavior and its keyboard interactions. */
export function initializeNavigation(text) {
  const toggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".primary-navigation");
  if (!toggle || !navigation) return;

  function setMenuOpen(isOpen) {
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", text(isOpen ? "menuClose" : "menuOpen"));
    navigation.classList.toggle("is-open", isOpen);
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") !== "true";
    setMenuOpen(isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    const menuIsOpen = toggle.getAttribute("aria-expanded") === "true";
    if (event.key !== "Escape" || !menuIsOpen) return;

    setMenuOpen(false);
    toggle.focus();
  });
}
