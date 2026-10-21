/** Wires gallery thumbnails to the native dialog lightbox. */
export function initializeGallery() {
  const dialog = document.querySelector("#image-dialog");
  const dialogImage = dialog?.querySelector("img");
  if (!dialog || !dialogImage) return;

  document.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      const thumbnail = item.querySelector("img");
      if (!thumbnail || !item.dataset.full || dialog.open) return;

      dialogImage.src = item.dataset.full;
      dialogImage.alt = thumbnail.alt;
      dialog.showModal();
    });
  });

  dialog.querySelector(".lightbox-close")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    event.preventDefault();
    dialog.close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => dialogImage.removeAttribute("src"));
}

/** Adds visual fallbacks when a clinic or gallery image cannot load. */
export function initializeImageFallbacks() {
  document.querySelectorAll(".gallery-item img, #dentist-image, [data-clinic-image='hero']")
    .forEach((image) => {
      image.addEventListener("error", () => image.classList.add("image-failed"), { once: true });
    });
}
