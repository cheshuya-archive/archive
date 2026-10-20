import { mountArchivePath } from "./archive-path.js?v=graphics-1";
mountArchivePath(document.querySelector("[data-path-typewriter]"), window.CheshuyaLocale?.get() || "ru");
