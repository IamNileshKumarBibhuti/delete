"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const state = {
    health: null,
    healthError: false,
    healthPending: false,
    loading: false,
    extracting: false,
    image: null,
    imageGeneration: 0,
    controller: null,
    loadingTimer: null,
    toastTimer: null,
    lastResult: null,
    analyzedText: "",
    activeTab: "text",
  };
  const fallbackSamples = [
    {
      id: "parcel",
      title: "Delivery fee",
      category: "suspicious",
      text: "DELIVERY NOTICE: Your parcel is on hold. Pay a $2.99 redelivery fee within 30 minutes or your package will be returned. Visit https://parcel-update.example/confirm and enter your card details to release it. Do not contact the courier because this is an automated service.",
    },
    {
      id: "account",
      title: "Account warning",
      category: "suspicious",
      text: "URGENT: Your bank account will be suspended today. To cancel this action, reply with your password and the one-time verification code sent to your phone. Our security team needs this information immediately. Keep this verification confidential.",
    },
    {
      id: "meeting",
      title: "Everyday message",
      category: "legitimate",
      text: "Hi Alex, the community gardening meeting is on Saturday at 10 a.m. in the library meeting room. Please bring your ideas for the spring planting schedule. You can check the time on the library's notice board. No payment or personal information is needed.",
    },
  ];

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = String(content);
    return node;
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    $("toast").textContent = message;
    $("toast").hidden = false;
    state.toastTimer = window.setTimeout(() => {
      $("toast").hidden = true;
    }, 4500);
  }

  function setError(message) {
    $("input-error").textContent = message || "";
    $("input-error").hidden = !message;
  }

  function updateCount() {
    const length = $("message-input").value.length;
    $("character-count").textContent =
      `${length.toLocaleString("en-US")} / 12,000`;
    const changed = $("result-stale");
    if (changed)
      changed.hidden = $("message-input").value.trim() === state.analyzedText;
    if (length) setError("");
  }

  async function api(path, options = {}, timeout = 15000) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        signal: options.signal || controller.signal,
        cache: "no-store",
      });
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error(
          "The local app returned an unreadable response. Check the terminal and restart ScamLens.",
        );
      }
      if (!response.ok) {
        let detail = payload.detail || payload.error || payload.message;
        if (Array.isArray(detail))
          detail = "Please check the message or image format and try again.";
        if (typeof detail !== "string")
          detail = `The local app could not complete this request (HTTP ${response.status}).`;
        throw new Error(detail);
      }
      return payload;
    } catch (error) {
      if (error.name === "AbortError") throw error;
      if (error instanceof TypeError)
        throw new Error(
          "Cannot reach the local ScamLens app. Keep its terminal open, then refresh this page.",
        );
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  }

  const DEFAULT_MODEL = "qwen2.5:1.5b";

  function currentModelName() {
    return state.health?.model?.name || DEFAULT_MODEL;
  }

  function modelLabel(name = currentModelName()) {
    return name.toLowerCase().startsWith("qwen2.5")
      ? "Qwen2.5"
      : name.split(":")[0];
  }

  function modelReady() {
    return Boolean(
      state.health &&
        state.health.model &&
        state.health.model.available &&
        state.health.model.running,
    );
  }

  function healthBanner(message, setup = false, disconnected = false) {
    const banner = $("connection-banner");
    banner.replaceChildren();
    banner.hidden = !message;
    banner.classList.toggle("server-offline", disconnected);
    if (!message) return;
    banner.append(element("p", "", message));
    const button = element(
      "button",
      "text-button",
      setup ? "Setup help" : "Retry connection",
    );
    button.type = "button";
    button.addEventListener(
      "click",
      setup ? openModelHelp : () => refreshHealth(true),
    );
    banner.append(button);
  }

  async function refreshHealth(feedback = false) {
    if (state.healthPending) return;
    state.healthPending = true;
    try {
      const health = await api("/api/health", {}, 18000);
      state.health = health;
      state.healthError = false;
      const ready = modelReady();
      $("model-dot").className = `status-dot ${ready ? "online" : "offline"}`;
      $("model-status-label").textContent = ready
        ? `${modelLabel()} · Ready`
        : "AI unavailable · checks only";
      document.querySelector(".footer-model").textContent =
        `${modelLabel()} · Local AI`;
      healthBanner(
        ready
          ? ""
          : "Local AI is unavailable. You can still run evidence checks, or set up Qwen2.5 for deeper message analysis.",
        true,
      );
      const ocr = health.ocr || {};
      $("ocr-status").textContent = ocr.available
        ? "Local text extraction is ready. You can review the words before analysis."
        : "Screenshot text extraction needs local OCR dependencies. Run Setup-Windows.cmd, or paste the message instead.";
      $("ocr-status").classList.toggle("unavailable", !ocr.available);
      $("extract-text").disabled = state.extracting || !ocr.available;
      if (feedback)
        showToast(
          ready
            ? "Local AI is ready on this computer."
            : "Connection checked. Local AI still needs setup.",
        );
    } catch (error) {
      state.healthError = true;
      $("model-dot").className = "status-dot offline";
      $("model-status-label").textContent = "App connection lost";
      healthBanner(
        "The local app is not responding. Keep its terminal running and reconnect before checking a message.",
        false,
        true,
      );
      $("ocr-status").textContent =
        "Screenshot support could not be checked. Reconnect to the local app.";
      if (feedback)
        showToast(
          error.name === "AbortError"
            ? "The connection check timed out. Check the app terminal."
            : error.message,
        );
    } finally {
      state.healthPending = false;
    }
  }

  function setTab(tab, focus = false) {
    state.activeTab = tab;
    ["text", "image"].forEach((name) => {
      const selected = name === tab;
      $(`${name}-tab`).classList.toggle("active", selected);
      $(`${name}-tab`).setAttribute("aria-selected", String(selected));
      $(`${name}-tab`).tabIndex = selected ? 0 : -1;
      $(`${name}-panel`).hidden = !selected;
    });
    if (focus) $(`${tab}-tab`).focus();
    setError("");
  }

  function renderSamples(samples) {
    const container = $("sample-list");
    container.replaceChildren();
    samples.slice(0, 6).forEach((sample) => {
      if (typeof sample.text !== "string") return;
      const button = element("button", "sample-button");
      button.type = "button";
      button.append(
        element("span", "", "+"),
        element("span", "", sample.title || "Example message"),
      );
      button.title = "Load an example message. This does not run analysis.";
      button.disabled = state.loading;
      button.addEventListener("click", () => {
        if (state.loading) return;
        $("message-input").value = sample.text.slice(0, 12000);
        $("ocr-message").hidden = true;
        setTab("text");
        updateCount();
        $("message-input").focus();
        showToast("Example loaded. Take a closer look when you are ready.");
      });
      container.append(button);
    });
  }

  async function loadSamples() {
    renderSamples(fallbackSamples);
    try {
      const data = await api("/api/samples", {}, 10000);
      if (Array.isArray(data.samples) && data.samples.length)
        renderSamples(data.samples);
    } catch {
      // Static examples remain useful if the app is still starting.
    }
  }

  function setBusy(busy) {
    state.loading = busy;
    $("analyze-button").disabled = busy || state.extracting;
    $("message-input").readOnly = busy;
    $("clear-button").disabled = busy;
    $("image-input").disabled = busy;
    $("remove-image").disabled = busy;
    $("extract-text").disabled =
      busy ||
      state.extracting ||
      (state.health && !state.health.ocr?.available);
    document.querySelectorAll(".sample-button").forEach((button) => {
      button.disabled = busy;
    });
    document
      .querySelector(".results-panel")
      .setAttribute("aria-busy", String(busy));
    $("analyze-button").querySelector("span").textContent = busy
      ? "Taking a closer look…"
      : "Take a closer look";
  }

  function startLoading() {
    $("result-empty").hidden = true;
    $("result-content").hidden = true;
    $("result-loading").hidden = false;
    $("loading-title").textContent = "Reading between the lines.";
    $("loading-description").textContent =
      "Checking the message and gathering evidence.";
    $("loading-elapsed").textContent = modelReady()
      ? "A small local model may take a little time."
      : "Running the available checks on this computer.";
    const began = Date.now();
    state.loadingTimer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - began) / 1000);
      $("loading-elapsed").textContent =
        `${seconds}s elapsed · Your message stays on this computer.`;
      if (seconds >= 75) {
        $("loading-title").textContent = "Still giving this a closer look.";
        $("loading-description").textContent =
          "Local AI can be slow on a CPU. You can cancel and try a shorter message.";
      } else if (seconds >= 20) {
        $("loading-title").textContent = "Looking for evidence, not guesses.";
        $("loading-description").textContent =
          "The local model is reviewing the message. Its first response can take longer.";
      }
    }, 1000);
  }

  function stopLoading() {
    window.clearInterval(state.loadingTimer);
    state.loadingTimer = null;
    $("result-loading").hidden = true;
    setBusy(false);
  }

  async function analyze() {
    if (state.loading || state.extracting) return;
    if (state.activeTab === "image") {
      setError(
        "Extract the screenshot text first, then review it in the message tab before analysis.",
      );
      return;
    }
    const text = $("message-input").value.trim();
    if (!text) {
      setError("Paste a message, or choose an example to get started.");
      $("message-input").focus();
      return;
    }
    if (text.length > 12000) {
      setError("Please keep your message under 12,000 characters.");
      return;
    }
    setError("");
    $("ocr-message").hidden = true;
    setBusy(true);
    startLoading();
    const controller = new AbortController();
    state.controller = controller;
    let timedOut = false;
    const deadline = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 220000);
    if (window.matchMedia("(max-width: 830px)").matches)
      document
        .querySelector(".results-panel")
        .scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const result = await api(
        "/api/analyze",
        {
          method: "POST",
          body: JSON.stringify({ text }),
          signal: controller.signal,
        },
        220000,
      );
      if (
        !result ||
        typeof result.summary !== "string" ||
        !Array.isArray(result.signals)
      )
        throw new Error(
          "The local app returned an incomplete analysis. Check the terminal and try again.",
        );
      state.lastResult = result;
      state.analyzedText = text;
      renderResult(result, text);
    } catch (error) {
      if (error.name === "AbortError" && !timedOut) {
        $("result-empty").hidden = false;
        showToast(
          "Stopped waiting. The local model may finish its current request.",
        );
      } else {
        renderFailure(
          timedOut
            ? "Analysis took too long. Try a shorter message, or check that Ollama is responding in its terminal."
            : error.message,
        );
      }
    } finally {
      window.clearTimeout(deadline);
      state.controller = null;
      stopLoading();
    }
  }

  function renderFailure(message) {
    const target = $("result-content");
    target.replaceChildren();
    target.hidden = false;
    $("result-empty").hidden = true;
    const card = element("div", "api-failure");
    card.append(
      element("h3", "", "Let’s reconnect."),
      element("p", "", message),
    );
    const retry = element("button", "button button-secondary", "Try again");
    retry.type = "button";
    retry.addEventListener("click", analyze);
    card.append(retry);
    target.append(card);
  }

  function evidenceHighlight(text, signals) {
    const fragment = document.createDocumentFragment();
    const ranges = [];
    signals.forEach((signal) => {
      (Array.isArray(signal.evidence) ? signal.evidence : []).forEach(
        (quote) => {
          if (typeof quote !== "string" || !quote.length) return;
          let offset = 0;
          let position = text.indexOf(quote, offset);
          while (position !== -1) {
            ranges.push([position, position + quote.length]);
            offset = position + quote.length;
            position = text.indexOf(quote, offset);
          }
        },
      );
    });
    ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const merged = [];
    ranges.forEach((range) => {
      const last = merged[merged.length - 1];
      if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
      else merged.push([...range]);
    });
    let cursor = 0;
    merged.forEach(([start, end]) => {
      fragment.append(
        document.createTextNode(text.slice(cursor, start)),
        element("mark", "", text.slice(start, end)),
      );
      cursor = end;
    });
    fragment.append(document.createTextNode(text.slice(cursor)));
    return fragment;
  }

  function sectionHeading(title, count) {
    const heading = element("h3", "result-section-title", title);
    if (count !== undefined)
      heading.append(element("span", "count-badge", count));
    return heading;
  }

  function renderResult(result, text) {
    const target = $("result-content");
    target.replaceChildren();
    target.hidden = false;
    $("result-empty").hidden = true;
    const stale = element(
      "p",
      "checks-only-note",
      "The message has changed. Check it again to update this result. The analyzed text is shown below.",
    );
    stale.id = "result-stale";
    stale.hidden = true;
    target.append(stale);
    const assessments = {
      high_concern: { label: "Strong warning signs.", className: "high" },
      some_concern: { label: "Worth a closer look.", className: "" },
      insufficient_evidence: {
        label: "More context needed.",
        className: "neutral",
      },
    };
    const assessment =
      assessments[result.assessment] || assessments.insufficient_evidence;
    const card = element("div", `assessment ${assessment.className}`);
    const aiUsed = result.mode === "ai" && result.model?.used;
    const mode = element("div", "result-mode");
    mode.append(
      element("span", "mode-dot"),
      document.createTextNode(
        aiUsed ? "LOCAL AI + EVIDENCE CHECKS" : "AI UNAVAILABLE · CHECKS ONLY",
      ),
    );
    card.append(
      mode,
      element("h3", "", assessment.label),
      element("p", "assessment-summary", result.summary),
      element(
        "span",
        "assessment-footnote",
        "This is a second opinion, not a verdict. Sender identity and the truth of a claim cannot be confirmed from a message alone.",
      ),
    );
    target.append(card);
    if (!aiUsed) {
      const note = element(
        "div",
        "checks-only-note",
        "Local AI was not used for this result. These are evidence checks only; subtle scams and message context may be missed.",
      );
      if (result.model?.error)
        note.append(element("p", "", result.model.error));
      const help = element("button", "text-button", "Get local AI setup help");
      help.type = "button";
      help.addEventListener("click", openModelHelp);
      note.append(document.createElement("br"), help);
      target.append(note);
    }
    const signals = result.signals;
    target.append(
      sectionHeading("What deserves your attention", signals.length),
    );
    if (!signals.length) {
      target.append(
        element(
          "p",
          "empty-signals",
          "No specific warning signs were identified. That does not establish that the message is legitimate. Check the sender and any important request independently.",
        ),
      );
    }
    signals.forEach((signal, index) => {
      const signalCard = element(
        "article",
        `signal-card severity-${["high", "medium", "low"].includes(signal.severity) ? signal.severity : "low"}`,
      );
      const header = element("div", "signal-card-header");
      const titleWrapper = element("div");
      titleWrapper.append(
        element("h4", "", signal.title || "Warning sign"),
        element(
          "span",
          "source-label",
          signal.source === "model" ? "Local AI observation" : "Evidence check",
        ),
      );
      header.append(
        element("span", "signal-icon", String(index + 1)),
        titleWrapper,
      );
      signalCard.append(header);
      if (signal.explanation)
        signalCard.append(
          element("p", "signal-explanation", signal.explanation),
        );
      (Array.isArray(signal.evidence) ? signal.evidence : []).forEach(
        (quote) => {
          if (typeof quote === "string" && text.includes(quote))
            signalCard.append(element("blockquote", "evidence-quote", quote));
        },
      );
      target.append(signalCard);
    });
    const steps = Array.isArray(result.next_steps) ? result.next_steps : [];
    if (steps.length) {
      target.append(sectionHeading("A calmer next step"));
      const list = element("ol", "next-steps");
      steps.forEach((step) => list.append(element("li", "", step)));
      target.append(list);
    }
    const urls = Array.isArray(result.urls) ? result.urls : [];
    if (urls.length) {
      target.append(sectionHeading("Links in this message", urls.length));
      urls.forEach((url) => {
        const urlCard = element("div", "url-card");
        // Suspicious destinations intentionally remain plain text, never clickable.
        urlCard.append(
          element(
            "span",
            "url-hostname",
            url.hostname || "Unrecognized destination",
          ),
          element("span", "url-display", url.display || ""),
        );
        (Array.isArray(url.warnings) ? url.warnings : []).forEach((warning) =>
          urlCard.append(element("p", "url-warning", warning)),
        );
        target.append(urlCard);
      });
    }
    const toggle = element("button", "text-evidence-toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "source-message");
    const toggleIcon = element("span", "", "+");
    toggle.append(
      element("span", "", "View analyzed message & evidence"),
      toggleIcon,
    );
    const source = element("div", "source-message");
    source.id = "source-message";
    source.hidden = true;
    source.append(evidenceHighlight(text, signals));
    toggle.addEventListener("click", () => {
      source.hidden = !source.hidden;
      toggle.setAttribute("aria-expanded", String(!source.hidden));
      toggleIcon.textContent = source.hidden ? "+" : "-";
    });
    target.append(toggle, source);
    const limitations = element("div", "limitations");
    const warnings = Array.isArray(result.limitations)
      ? result.limitations
      : [];
    warnings
      .slice(0, 5)
      .forEach((warning) => limitations.append(element("p", "", warning)));
    if (warnings.length) target.append(limitations);
    const footer = element("div", "result-footer");
    const seconds =
      typeof result.analysis_ms === "number"
        ? `${(result.analysis_ms / 1000).toFixed(1)}s`
        : "Complete";
    footer.append(
      element(
        "span",
        "",
        `${aiUsed ? `${modelLabel(result.model?.name || currentModelName())} · Local` : "Local evidence checks"} · ${seconds}`,
      ),
    );
    const copy = element("button", "copy-report-button", "Copy report");
    copy.type = "button";
    copy.addEventListener("click", () => copyReport(result, text));
    footer.append(copy);
    target.append(footer);
    if (result.mode === "checks_only" && state.health) {
      $("model-dot").className = "status-dot offline";
      $("model-status-label").textContent = "AI unavailable · checks only";
    }
  }

  async function copyReport(result, text) {
    const aiUsed = result.mode === "ai" && result.model?.used;
    const lines = [
      "ScamLens — Message review",
      aiUsed ? "Local AI + evidence checks" : "AI unavailable — checks only",
      "",
      result.summary,
      "",
      "EVIDENCE",
    ];
    result.signals.forEach((signal) => {
      lines.push(`• ${signal.title}`, signal.explanation || "");
      (Array.isArray(signal.evidence) ? signal.evidence : []).forEach(
        (quote) => {
          if (typeof quote === "string" && text.includes(quote))
            lines.push(`  “${quote}”`);
        },
      );
    });
    lines.push(
      "",
      "NEXT STEPS",
      ...(result.next_steps || []).map(
        (step, index) => `${index + 1}. ${step}`,
      ),
      "",
      "ANALYZED MESSAGE",
      text,
      "",
      "LIMITATIONS",
      ...(result.limitations || []),
      "AI can miss scams and flag legitimate messages. Verify important requests independently.",
    );
    const report = lines.join("\n");
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(report);
      showToast("Report copied. It includes your analyzed message.");
    } catch {
      const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = element("a");
      anchor.href = url;
      anchor.download = "ScamLens-report.txt";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(
        "Clipboard unavailable. Your report was downloaded as a text file.",
      );
    }
  }

  function removeImage() {
    state.imageGeneration += 1;
    state.image = null;
    $("image-input").value = "";
    $("image-preview").removeAttribute("src");
    $("image-filename").textContent = "";
    $("image-preview-area").hidden = true;
    $("drop-zone").hidden = false;
    setError("");
  }

  function chooseImage(file) {
    if (!file || state.loading || state.extracting) return;
    setError("");
    $("ocr-message").hidden = true;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Please choose a PNG, JPG or WebP screenshot.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(
        "That image is larger than 8 MB. Crop the message or use a smaller screenshot.",
      );
      return;
    }
    const generation = ++state.imageGeneration;
    const reader = new FileReader();
    reader.onload = () => {
      if (generation !== state.imageGeneration) return;
      state.image = String(reader.result);
      $("image-preview").src = state.image;
      $("image-filename").textContent = file.name;
      $("image-preview-area").hidden = false;
      $("drop-zone").hidden = true;
      $("extract-text").disabled = Boolean(
        state.health && !state.health.ocr?.available,
      );
    };
    reader.onerror = () =>
      setError("This image could not be read. Try a different screenshot.");
    reader.readAsDataURL(file);
  }

  async function extractText() {
    if (!state.image || state.extracting || state.loading) return;
    setError("");
    state.extracting = true;
    $("extract-text").disabled = true;
    $("extract-text").textContent = "Extracting text locally…";
    $("analyze-button").disabled = true;
    $("remove-image").disabled = true;
    $("image-input").disabled = true;
    try {
      const data = await api(
        "/api/ocr",
        { method: "POST", body: JSON.stringify({ image: state.image }) },
        65000,
      );
      if (typeof data.text !== "string" || !data.text.trim())
        throw new Error(
          "No readable text was found. Try a clearer screenshot, or paste the message instead.",
        );
      if ($("message-input").value.trim()) {
        // Protect a draft rather than silently replacing text the user is writing.
        const shouldReplace = window.confirm(
          "Replace the current message draft with the screenshot text?",
        );
        if (!shouldReplace) {
          showToast(
            "Your existing message was kept. Clear it before extracting again.",
          );
          return;
        }
      }
      $("message-input").value = data.text.slice(0, 12000);
      setTab("text");
      updateCount();
      const warnings = Array.isArray(data.warnings)
        ? data.warnings.filter(
            (value) =>
              typeof value === "string" &&
              !/^Review the extracted text/i.test(value),
          )
        : [];
      if (data.text.length > 12000)
        warnings.push("Only the first 12,000 characters were kept.");
      $("ocr-message").textContent = [
        "Text extracted. Please review names, numbers and links before analysis; OCR can misread them.",
        ...warnings,
      ].join(" ");
      $("ocr-message").hidden = false;
      $("message-input").focus();
    } catch (error) {
      setError(
        error.name === "AbortError"
          ? "Text extraction timed out. Try a smaller screenshot or paste the message."
          : error.message,
      );
    } finally {
      state.extracting = false;
      $("extract-text").disabled = Boolean(
        state.health && !state.health.ocr?.available,
      );
      $("extract-text").textContent = "Extract text to review";
      $("analyze-button").disabled = false;
      $("remove-image").disabled = false;
      $("image-input").disabled = false;
    }
  }

  function openDialog(title, kicker, children) {
    $("dialog-title").textContent = title;
    $("dialog-kicker").textContent = kicker;
    $("dialog-content").replaceChildren(...children);
    if (!$("help-dialog").open) $("help-dialog").showModal();
  }

  function paragraph(text, className = "") {
    return element("p", className, text);
  }

  function openGuide() {
    const steps = element("ol");
    [
      "Paste a message, or upload a screenshot and review the extracted words. Include any links exactly as they appeared.",
      "Take a closer look. Local AI identifies warning patterns, and ScamLens explains them using exact quotes from your message. If AI is unavailable, checks-only mode is clearly labeled.",
      "Verify the request through a contact method you already trust. Open the organization’s official app independently, or call a known number. Never rely on contact details in the suspicious message.",
    ].forEach((step) => steps.append(element("li", "", step)));
    openDialog("A clearer second look.", "HOW IT WORKS", [
      paragraph(
        "ScamLens helps you understand a message before you act on it. It does not confirm someone’s identity or guarantee that a message is legitimate.",
      ),
      steps,
      paragraph(
        "AI runs on your computer through Ollama. There are no API keys. After installing the software and downloading the model, the app can work without internet.",
        "small-help",
      ),
    ]);
  }

  function openPrivacy() {
    openDialog("Your message stays here.", "PRIVACY BY DESIGN", [
      paragraph(
        "ScamLens sends your message only to the local app and your local Ollama model. It does not call cloud AI, visit links from messages, or load external scripts or fonts.",
      ),
      element("h3", "", "No saved message history"),
      paragraph(
        "ScamLens does not save messages or screenshots to a database or browser storage. Your current draft and results stay in the page until you clear or close it. A report is saved only when you explicitly copy or download it.",
      ),
      element("h3", "", "Your computer is still your responsibility"),
      paragraph(
        "Use the app on your own trusted computer. Browser extensions, screenshots, copied reports, your operating system, and local model software are outside ScamLens’s privacy controls.",
      ),
      paragraph(
        "Initial installation and the one-time model download require internet. Analysis itself uses local components only.",
        "small-help",
      ),
    ]);
  }

  function openModelHelp() {
    const nodes = [];
    const status = element("div", "status-line");
    status.append(
      element("span", `status-dot ${modelReady() ? "online" : "offline"}`),
      document.createTextNode(
        modelReady()
          ? `${modelLabel()} is ready on this computer.`
          : state.healthError
            ? "Cannot reach the local app."
            : `${modelLabel()} is not currently ready.`,
      ),
    );
    nodes.push(
      status,
      paragraph(
        `ScamLens uses ${currentModelName()} through Ollama. No API key is needed. The model is downloaded separately and is not included in the project ZIP.`,
      ),
    );
    const steps = element("ol");
    [
      "Run Setup-Windows.cmd once and follow the README to install the local prerequisites. The initial installation and model download need internet.",
      "Open the Ollama application. If the model is missing, run this in a terminal:",
    ].forEach((text) => steps.append(element("li", "", text)));
    const second = steps.lastElementChild;
    second.append(
      document.createElement("br"),
      element("code", "", `ollama pull ${currentModelName()}`),
    );
    steps.append(
      element(
        "li",
        "",
        "Start ScamLens with Start-ScamLens.cmd. Leave its terminal open. Then recheck the connection below.",
      ),
    );
    nodes.push(steps);
    if (state.health?.model?.error)
      nodes.push(
        paragraph(`Local AI status: ${state.health.model.error}`, "small-help"),
      );
    nodes.push(element("h3", "", "Screenshot text extraction"));
    nodes.push(
      paragraph(
        state.health?.ocr?.available
          ? "Local screenshot text extraction is available on this computer."
          : "Run Setup-Windows.cmd to install the local OCR dependencies, then restart ScamLens. Text messages work without OCR.",
      ),
    );
    if (state.health?.ocr?.error)
      nodes.push(
        paragraph(`OCR status: ${state.health.ocr.error}`, "small-help"),
      );
    const refresh = element(
      "button",
      "button button-secondary",
      "Recheck local connection",
    );
    refresh.type = "button";
    refresh.addEventListener("click", async () => {
      refresh.disabled = true;
      refresh.textContent = "Checking…";
      await refreshHealth(true);
      openModelHelp();
    });
    nodes.push(
      refresh,
      paragraph(
        "The first AI response may take longer while the model loads. Speed depends on your computer. If a model request fails, ScamLens still shows evidence checks and explicitly explains that AI was not used.",
        "small-help",
      ),
    );
    openDialog("Local AI, on your terms.", "MODEL & SCREENSHOT SETUP", nodes);
  }

  function clearWorkspace() {
    if (state.loading || state.extracting) return;
    $("message-input").value = "";
    $("ocr-message").hidden = true;
    removeImage();
    state.lastResult = null;
    state.analyzedText = "";
    $("result-content").replaceChildren();
    $("result-content").hidden = true;
    $("result-loading").hidden = true;
    $("result-empty").hidden = false;
    setTab("text");
    updateCount();
    $("message-input").focus();
    showToast("Workspace cleared.");
  }

  $("message-input").addEventListener("input", updateCount);
  $("message-input").addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      analyze();
    }
  });
  ["text", "image"].forEach((name) => {
    $(`${name}-tab`).addEventListener("click", () => setTab(name));
    $(`${name}-tab`).addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        setTab(
          event.key === "Home"
            ? "text"
            : event.key === "End"
              ? "image"
              : name === "text"
                ? "image"
                : "text",
          true,
        );
      }
    });
  });
  $("analyze-button").addEventListener("click", analyze);
  $("clear-button").addEventListener("click", clearWorkspace);
  $("cancel-analysis").addEventListener("click", () =>
    state.controller?.abort(),
  );
  $("image-input").addEventListener("change", (event) =>
    chooseImage(event.target.files[0]),
  );
  $("remove-image").addEventListener("click", removeImage);
  $("extract-text").addEventListener("click", extractText);
  const dropZone = $("drop-zone");
  ["dragenter", "dragover"].forEach((eventName) =>
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("dragover");
    }),
  );
  ["dragleave", "drop"].forEach((eventName) =>
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("dragover");
    }),
  );
  dropZone.addEventListener("drop", (event) => {
    if (event.dataTransfer.files.length > 1) {
      setError("Please choose one screenshot at a time.");
      return;
    }
    chooseImage(event.dataTransfer.files[0]);
  });
  // Prevent an accidentally dropped file from navigating away from an unsaved draft.
  document.addEventListener("dragover", (event) => {
    if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
  });
  document.addEventListener("drop", (event) => {
    if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
  });
  document
    .querySelectorAll("[data-open-guide]")
    .forEach((button) => button.addEventListener("click", openGuide));
  document
    .querySelectorAll("[data-open-privacy]")
    .forEach((button) => button.addEventListener("click", openPrivacy));
  $("model-status-button").addEventListener("click", openModelHelp);
  $("close-dialog").addEventListener("click", () => $("help-dialog").close());
  $("dialog-done").addEventListener("click", () => $("help-dialog").close());
  $("help-dialog").addEventListener("click", (event) => {
    if (event.target === $("help-dialog")) $("help-dialog").close();
  });
  updateCount();
  loadSamples();
  refreshHealth();
  window.setInterval(() => {
    if (!state.loading && !state.extracting && !document.hidden)
      refreshHealth();
  }, 45000);
})();
