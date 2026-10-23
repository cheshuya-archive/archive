/* Consent-first analytics for the published static site. No vendor script is in HTML. */
(() => {
  "use strict";

  const config = Object.freeze({
    ga4MeasurementId: "G-4RV13D7DNW",
    // Fill these only with identifiers copied from the owner's free accounts.
    clarityProjectId: "z1s34rbr10",
    cloudflareToken: "ed4b042d40ec46debdb07d1da629b625",
  });
  const consentKey = "cheshuya-analytics-consent-v1";
  const previewKey = "cheshuya-analytics-preview-v1";
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } };
  const parameters = new URLSearchParams(location.search);
  let preview = read(previewKey) === "on";
  let pendingPreview = parameters.get("preview") === "1" && !preview;
  let consent = read(consentKey);
  if (consent !== "granted" && consent !== "denied") consent = null;
  let started = false;
  let gaReady = false;
  let clarityReady = false;
  let settingsPanel;
  let prompt;
  let consentTimer;
  const viewedSections = new Set();
  const galleries = new Map();
  const siteVersion = window.CHESHUYA_SITE_VERSION || "local-unversioned";
  const file = location.pathname.split("/").pop() || "index.html";
  const query = new URLSearchParams(location.search);
  const pageSection = file.startsWith("zine-") || file === "catalog-prints.html" ? "zines"
    : file === "cyanotype.html" ? "cyanotype"
    : file.startsWith("merch-") || file === "catalog-merch.html" ? "merch"
    : file.startsWith("catalog-exhibitions") || file === "exhibition.html" ? "exhibitions"
    : file.startsWith("catalog-objects") || file === "object.html" ? "objects"
    : file.startsWith("catalog-drawings") || file === "drawing.html" ? "drawings"
    : file === "privacy.html" ? "privacy" : "home";
  const projectId = file.startsWith("zine-") ? file.replace(/\.html$/, "")
    : file === "exhibition.html" || file === "object.html" ? query.get("id")
    : file === "drawing.html" ? `drawing-${query.get("surface") || "unknown"}`
    : file.startsWith("merch-") ? file.replace(/\.html$/, "")
    : file === "cyanotype.html" ? "cyanotype" : null;
  const locale = () => document.documentElement.lang === "en" ? "en" : "ru";
  const copy = (ru, en) => locale() === "en" ? en : ru;
  const allowed = () => consent === "granted" && !preview && !pendingPreview;

  function loadScript(src, attributes = {}) {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    for (const [key, value] of Object.entries(attributes)) script.setAttribute(key, value);
    document.head.append(script);
  }

  function startVendors() {
    if (started || !allowed()) return;
    started = true;
    if (config.ga4MeasurementId) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("consent", "default", {
        analytics_storage: "granted", ad_storage: "denied",
        ad_user_data: "denied", ad_personalization: "denied",
      });
      window.gtag("config", config.ga4MeasurementId, { send_page_view: false, site_version: siteVersion });
      gaReady = true;
      loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4MeasurementId)}`);
    }
    if (config.clarityProjectId) {
      window.clarity = window.clarity || function () {
        (window.clarity.q = window.clarity.q || []).push(arguments);
      };
      window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
      window.clarity("set", "site_version", siteVersion);
      clarityReady = true;
      loadScript(`https://www.clarity.ms/tag/${encodeURIComponent(config.clarityProjectId)}`);
    }
    if (config.cloudflareToken) {
      loadScript("https://static.cloudflareinsights.com/beacon.min.js", {
        type: "module",
        "data-cf-beacon": JSON.stringify({ token: config.cloudflareToken }),
      });
    }
    track("page_view", { page_title: document.title, page_location: location.href.split("#")[0] });
    observeContent();
  }

  function track(name, details = {}) {
    if (!started || !allowed()) return;
    const payload = { site_version: siteVersion, section_id: pageSection, ...details };
    if (projectId && !payload.project_id) payload.project_id = projectId;
    if (gaReady) window.gtag("event", name, payload);
    if (clarityReady && name !== "page_view") {
      window.clarity("event", name);
      if (payload.section_id) window.clarity("set", "section_id", String(payload.section_id));
      if (payload.project_id) window.clarity("set", "project_id", String(payload.project_id));
    }
  }

  function sectionView(id) {
    if (!started || !id || viewedSections.has(id) || !allowed()) return;
    viewedSections.add(id);
    track("section_view", { section_id: id });
  }

  function galleryId(stage) {
    const series = stage.closest("[data-series]")?.dataset.series;
    return [projectId || (file === "index.html" ? "home" : pageSection), series || "main"].join(":");
  }

  function galleryChange(detail) {
    if (!started || !allowed()) return;
    const { stage, index, total } = detail;
    const id = detail.id || (stage ? galleryId(stage) : null);
    if (!id || !Number.isInteger(index) || !Number.isInteger(total) || total < 1) return;
    let state = galleries.get(id);
    if (!state) {
      state = { viewed: new Set(), milestones: new Set() };
      galleries.set(id, state);
      track("gallery_open", { gallery_id: id, photo_count: total });
    }
    state.viewed.add(index);
    const percent = Math.floor(state.viewed.size / total * 100);
    for (const milestone of [25, 50, 75, 100]) {
      if (percent >= milestone && !state.milestones.has(milestone)) {
        state.milestones.add(milestone);
        track("gallery_progress", { gallery_id: id, progress_percent: milestone, photo_count: total });
      }
    }
  }

  function observeContent() {
    if (!allowed()) return;
    if (pageSection !== "home") {
      sectionView(pageSection);
      if (projectId) track("project_open", { project_id: projectId });
    }
    const sections = document.querySelectorAll("main section[id]");
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting && !entry.target.closest("[hidden]")) {
        sectionView(entry.target.id);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.25 });
    sections.forEach(section => observer.observe(section));
    document.querySelectorAll(".zine-slide:not(.lightbox-stage)").forEach(stage => {
      const photos = stage.querySelectorAll("img");
      if (!photos.length) return;
      const current = [...photos].findIndex(photo => photo.dataset.active === "true");
      galleryChange({ id: galleryId(stage), index: Math.max(0, current), total: photos.length });
    });
  }

  function updateConsent(value) {
    consent = value;
    write(consentKey, value);
    if (consentTimer) clearTimeout(consentTimer);
    closePanel(prompt); prompt = null;
    closePanel(settingsPanel); settingsPanel = null;
    if (value === "granted") startVendors();
    else if (started) {
      // A loaded beacon cannot be unloaded reliably. Stop events and reload with
      // the stored denial, so no vendor script is present in the new document.
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      window.clarity?.("consent", false);
      location.reload();
    }
  }

  function disablePreview() {
    preview = false;
    write(previewKey, "off");
    settingsPanel?.remove(); settingsPanel = null;
    if (consent === "granted") startVendors();
    else if (!consent) showConsent();
  }

  function makeButton(label, handler, primary = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = primary ? "analytics-action analytics-primary" : "analytics-action";
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function revealPanel(panel) {
    document.body.append(panel);
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add("is-visible")));
  }

  function closePanel(panel, onClosed) {
    if (!panel?.isConnected) { onClosed?.(); return; }
    panel.classList.remove("is-visible");
    panel.classList.add("is-leaving");
    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      panel.remove();
      onClosed?.();
    };
    panel.addEventListener("transitionend", event => {
      if (event.target === panel && event.propertyName === "transform") remove();
    }, { once: true });
    setTimeout(remove, 500);
  }

  function showConsent() {
    if (prompt || preview || pendingPreview || consent) return;
    prompt = document.createElement("aside");
    prompt.className = "analytics-banner analytics-consent";
    prompt.setAttribute("aria-label", copy("Настройки аналитики", "Analytics choices"));
    const header = document.createElement("div");
    header.className = "analytics-consent-copy";
    const logo = document.createElement("img");
    logo.src = "media/cheshuya-figma-logo-outline.svg";
    logo.alt = "";
    logo.width = 24;
    logo.height = 32;
    const text = document.createElement("div");
    text.className = "analytics-consent-text";
    const message = document.createElement("p");
    message.textContent = copy(
      "Разрешить использовать аналитику?",
      "Allow analytics?"
    );
    const detail = document.createElement("p");
    detail.className = "analytics-consent-detail";
    detail.textContent = copy(
      "Это поможет улучшать сайт.",
      "This will help improve the site."
    );
    text.append(message, detail);
    header.append(logo, text);
    const actions = document.createElement("div");
    actions.className = "analytics-actions";
    actions.append(
      makeButton(copy("Отклонить", "Decline"), () => updateConsent("denied")),
      makeButton(copy("Разрешить", "Allow"), () => updateConsent("granted"), true),
    );
    const inner = document.createElement("div");
    inner.className = "analytics-consent-inner";
    inner.append(header, actions);
    prompt.append(inner);
    revealPanel(prompt);
  }

  function showPreviewPrompt() {
    if (!pendingPreview) return;
    const panel = document.createElement("aside");
    panel.className = "analytics-banner analytics-preview-prompt";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", copy("Тестовый режим", "Preview mode"));
    const message = document.createElement("p");
    message.textContent = copy(
      "Включить тестовый режим в этом браузере? Он отключит всю аналитику на всех страницах сайта.",
      "Enable preview mode in this browser? It disables all analytics across the site."
    );
    const actions = document.createElement("div");
    actions.className = "analytics-actions";
    actions.append(
      makeButton(copy("Включить", "Enable"), () => {
        preview = true; pendingPreview = false; write(previewKey, "on");
        closePanel(panel, showSettings);
      }, true),
      makeButton(copy("Не сейчас", "Not now"), () => {
        pendingPreview = false;
        closePanel(panel, () => {
          const url = new URL(location.href); url.searchParams.delete("preview");
          history.replaceState(history.state, "", url);
          if (consent === "granted") startVendors(); else showConsent();
        });
      }),
    );
    panel.append(message, actions);
    revealPanel(panel);
    panel.querySelector("button")?.focus();
  }

  function showSettings() {
    settingsPanel?.remove();
    settingsPanel = document.createElement("aside");
    settingsPanel.className = "analytics-banner analytics-settings";
    settingsPanel.setAttribute("role", "dialog");
    settingsPanel.setAttribute("aria-label", copy("Настройки аналитики", "Analytics settings"));
    const message = document.createElement("p");
    message.textContent = preview
      ? copy("Тестовый режим включён. Аналитика полностью отключена в этом браузере.", "Preview mode is on. Analytics is fully disabled in this browser.")
      : consent === "granted"
        ? copy("Аналитика разрешена. Согласие можно отозвать.", "Analytics is allowed. You can withdraw consent.")
        : consent === "denied"
          ? copy("Аналитика отклонена.", "Analytics is declined.")
          : copy("Выберите, разрешить ли аналитику.", "Choose whether to allow analytics.");
    const actions = document.createElement("div"); actions.className = "analytics-actions";
    if (preview) actions.append(makeButton(copy("Выключить тестовый режим", "Disable preview mode"), disablePreview));
    else {
      if (consent !== "granted") actions.append(makeButton(copy("Разрешить", "Allow"), () => updateConsent("granted"), true));
      if (consent !== "denied") actions.append(makeButton(copy(consent === "granted" ? "Отозвать согласие" : "Отклонить", consent === "granted" ? "Withdraw consent" : "Decline"), () => updateConsent("denied")));
    }
    actions.append(makeButton(copy("Закрыть", "Close"), () => { closePanel(settingsPanel); settingsPanel = null; }));
    settingsPanel.append(message, actions);
    revealPanel(settingsPanel);
    settingsPanel.querySelector("button")?.focus();
  }

  function addFooterLinks() {
    if (file === "privacy.html") {
      document.querySelectorAll(".analytics-settings-link").forEach(button => button.addEventListener("click", showSettings));
      return;
    }
    if (file !== "index.html" && file !== "") return;
    let footer = document.querySelector(".archive-footer, .analytics-footer");
    if (!footer) {
      footer = document.createElement("footer"); footer.className = "analytics-footer";
      document.querySelector("main")?.after(footer);
    }
    const row = document.createElement("div");
    row.className = "analytics-footer-privacy";
    const privacy = document.createElement("a"); privacy.href = "privacy.html";
    privacy.dataset.analyticsLabel = "privacy";
    row.append(privacy);
    footer.append(row);
    const translate = () => {
      privacy.textContent = copy("Конфиденциальность", "Privacy");
    };
    translate();
    document.addEventListener("cheshuya:locale", translate);
  }

  document.addEventListener("cheshuya:gallery-change", event => galleryChange(event.detail));
  document.addEventListener("cheshuya:lightbox-open", event => {
    if (!allowed()) return;
    const { stage, index, total } = event.detail;
    const id = event.detail.id || (stage ? galleryId(stage) : null);
    galleryChange({ id, index, total });
    track("image_expand", { gallery_id: id, image_index: index + 1, photo_count: total });
  });
  document.addEventListener("cheshuya:lightbox-change", event => galleryChange(event.detail));
  document.addEventListener("cheshuya:tab-open", event => {
    if (allowed()) track("tab_open", { tab_id: event.detail.tabId, section_id: event.detail.tabId });
  });
  document.addEventListener("click", event => {
    const link = event.target.closest?.("a[href]");
    if (!link || !allowed()) return;
    const destination = /instagram\.com/.test(link.href) ? "instagram"
      : /youtube\.com|youtu\.be/.test(link.href) ? "youtube"
      : /vk\.com/.test(link.href) ? "vk"
      : link.protocol === "mailto:" ? "email" : null;
    if (destination) track("contact_click", { destination });
  });

  document.addEventListener("DOMContentLoaded", () => {
    addFooterLinks();
    if (parameters.get("preview") === "0" && preview) {
      preview = false; write(previewKey, "off");
      const url = new URL(location.href); url.searchParams.delete("preview");
      history.replaceState(history.state, "", url);
    }
    if (pendingPreview) showPreviewPrompt();
    else if (preview) { /* Deliberately load no vendor code. */ }
    else if (consent === "granted") startVendors();
    else if (!consent) consentTimer = setTimeout(showConsent, 3000);
  }, { once: true });

  window.CheshuyaAnalytics = Object.freeze({
    getState: () => ({ preview, consent, vendorsStarted: started, siteVersion }),
    openSettings: showSettings,
  });
})();
