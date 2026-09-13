import "./style.scss";

document.querySelectorAll(".project-preview").forEach((preview) => {
  preview.addEventListener("click", () => {
    const isActive = preview.getAttribute("aria-pressed") === "true";
    preview.setAttribute("aria-pressed", String(!isActive));
  });
});
