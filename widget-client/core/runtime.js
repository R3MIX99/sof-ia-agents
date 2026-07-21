/**
 * Sof.ia — runtime del widget embebible (Fase 6).
 *
 * Regla arquitectónica no negociable: este archivo nunca se comunica
 * directamente con OpenAI, Anthropic ni ningún endpoint de n8n. Toda
 * comunicación externa se realiza exclusivamente contra la API del backend
 * de la plataforma (/api/v1/snippet, /api/v1/sessions, /api/v1/messages).
 *
 * Sin dependencias externas: JavaScript vanilla autocontenido, servido tal
 * cual por app/widget-embed/loader/route.ts.
 */
(function () {
  "use strict";

  var ICONS = {
    "message-circle":
      '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    "message-square":
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    bot:
      '<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    sparkles:
      '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    "help-circle":
      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    headphones:
      '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-6a9 9 0 1 1 18 0v6a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    restart:
      '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  };

  var SHADOW_STYLES = {
    ninguna: "none",
    suave: "0 4px 16px rgba(0,0,0,0.16)",
    pronunciada: "0 20px 40px rgba(0,0,0,0.36)",
  };

  var SPACING_SCALES = {
    compacto: { padding: "0.5rem", gap: "0.375rem" },
    normal: { padding: "1rem", gap: "0.625rem" },
    amplio: { padding: "1.5rem", gap: "1rem" },
  };

  function hexToRgb(hex) {
    var clean = String(hex || "").trim().replace(/^#/, "");
    if (clean.length === 3) {
      clean = clean.replace(/(.)/g, "$1$1");
    }
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
    var num = parseInt(clean, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function relativeLuminance(rgb) {
    var channels = [rgb.r, rgb.g, rgb.b].map(function (c) {
      var s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  /** Color de texto legible para elementos sin selector de color propio (input, bienvenida). En "claro"/"oscuro" el resultado es fijo; en "automático" se calcula por luminancia contra el fondo real. */
  function getReadableTextColor(backgroundHex, themeMode) {
    if (themeMode === "claro") return "#111827";
    if (themeMode === "oscuro") return "#ffffff";
    var rgb = hexToRgb(backgroundHex);
    if (!rgb) return "#ffffff";
    return relativeLuminance(rgb) > 0.5 ? "#111827" : "#ffffff";
  }

  /** Color de texto del encabezado. En "claro"/"oscuro" es fijo; en "automático" usa directamente el "Color de texto" de Apariencia en vez de calcular contraste contra el color primario. */
  function getHeaderTextColor(textColor, themeMode) {
    if (themeMode === "claro") return "#111827";
    if (themeMode === "oscuro") return "#ffffff";
    return textColor;
  }

  var GOOGLE_FONT_INJECTED = {};
  /** Inyecta un <link> de Google Fonts (documento principal, fuera del Shadow DOM) para la fuente elegida más Inter como respaldo garantizado. */
  function loadGoogleFont(fontFamily) {
    var family = String(fontFamily || "").trim() || "Inter";
    var families = family === "Inter" ? [family] : [family, "Inter"];
    var key = families.join("|");
    if (GOOGLE_FONT_INJECTED[key]) return;
    GOOGLE_FONT_INJECTED[key] = true;
    var params = families
      .map(function (f) {
        return "family=" + encodeURIComponent(f).replace(/%20/g, "+") + ":wght@400;500;600;700";
      })
      .join("&");
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?" + params + "&display=swap";
    document.head.appendChild(link);
  }

  function svg(name, size) {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      size +
      '" height="' +
      size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[name] || ICONS["message-circle"]) +
      "</svg>"
    );
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** Renderizador de Markdown mínimo, sin dependencias externas (sección 12.1). */
  function renderMarkdown(raw) {
    var text = String(raw == null ? "" : raw);
    var codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, function (m, lang, code) {
      var idx = codeBlocks.length;
      codeBlocks.push(
        '<pre class="sofia-code-block"><code>' + escapeHtml(code.replace(/\n$/, "")) + "</code></pre>",
      );
      return " CODEBLOCK" + idx + " ";
    });

    var lines = text.split("\n");
    var html = [];
    var listType = null;
    var quoteOpen = false;

    function closeList() {
      if (listType) {
        html.push(listType === "ul" ? "</ul>" : "</ol>");
        listType = null;
      }
    }
    function closeQuote() {
      if (quoteOpen) {
        html.push("</blockquote>");
        quoteOpen = false;
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      if (/^ CODEBLOCK\d+ $/.test(line.trim())) {
        closeList();
        closeQuote();
        html.push(line.trim());
        continue;
      }

      var heading = /^(#{1,6})\s+(.*)$/.exec(line);
      if (heading) {
        closeList();
        closeQuote();
        var level = heading[1].length;
        html.push("<h" + level + ">" + inline(heading[2]) + "</h" + level + ">");
        continue;
      }

      if (/^>\s?/.test(line)) {
        closeList();
        if (!quoteOpen) {
          html.push("<blockquote>");
          quoteOpen = true;
        }
        html.push("<p>" + inline(line.replace(/^>\s?/, "")) + "</p>");
        continue;
      }
      closeQuote();

      var unordered = /^[-*]\s+(.*)$/.exec(line);
      var ordered = /^\d+\.\s+(.*)$/.exec(line);
      if (unordered) {
        if (listType !== "ul") {
          closeList();
          html.push("<ul>");
          listType = "ul";
        }
        html.push("<li>" + inline(unordered[1]) + "</li>");
        continue;
      }
      if (ordered) {
        if (listType !== "ol") {
          closeList();
          html.push("<ol>");
          listType = "ol";
        }
        html.push("<li>" + inline(ordered[1]) + "</li>");
        continue;
      }
      closeList();

      if (line.trim() === "") {
        html.push("");
      } else {
        html.push("<p>" + inline(line) + "</p>");
      }
    }
    closeList();
    closeQuote();

    var joined = html.join("\n");
    joined = joined.replace(/ CODEBLOCK(\d+) /g, function (m, idx) {
      return codeBlocks[Number(idx)];
    });
    return joined;

    function inline(str) {
      var out = escapeHtml(str);
      out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
      out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
      out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (m, label, url) {
        return (
          '<a href="' +
          url +
          '" target="_blank" rel="noopener noreferrer">' +
          label +
          "</a>"
        );
      });
      return out;
    }
  }

  function getCurrentScript() {
    if (document.currentScript) return document.currentScript;
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  }

  var scriptEl = getCurrentScript();
  var publicKey = scriptEl ? scriptEl.getAttribute("data-widget-id") : null;
  var apiBase = (function () {
    var explicit = scriptEl ? scriptEl.getAttribute("data-api-base") : null;
    if (explicit) return explicit.replace(/\/$/, "");
    try {
      return new URL(scriptEl.src).origin;
    } catch {
      return "";
    }
  })();

  if (!publicKey) {
    console.error("[Sof.ia] Falta el atributo data-widget-id en el snippet del widget.");
    return;
  }

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* almacenamiento no disponible; la sesión no persistirá entre recargas */
    }
  }

  function getVisitorId() {
    var key = "sofia_widget_visitor_id";
    var existing = storageGet(key);
    if (existing) return existing;
    var generated = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
    storageSet(key, generated);
    return generated;
  }

  function apiUrl(path) {
    return apiBase + path;
  }

  function fetchConfig() {
    return fetch(apiUrl("/api/v1/snippet?publicKey=" + encodeURIComponent(publicKey)), {
      method: "GET",
    }).then(function (response) {
      return response.json().then(function (body) {
        if (!response.ok) throw new Error((body.error && body.error.message) || "config_error");
        return body.data.config;
      });
    });
  }

  function initSession(visitorId) {
    var sessionStorageKey = "sofia_widget_session_" + publicKey;
    var existingSessionId = storageGet(sessionStorageKey);
    return fetch(apiUrl("/api/v1/sessions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicKey: publicKey,
        visitorIdentifier: visitorId,
        userAgent: navigator.userAgent,
      }),
    })
      .then(function (response) {
        return response.json().then(function (body) {
          if (!response.ok) throw new Error((body.error && body.error.message) || "session_error");
          return body.data;
        });
      })
      .then(function (data) {
        storageSet(sessionStorageKey, data.sessionId);
        return data;
      })
      .catch(function (err) {
        if (existingSessionId) {
          return { sessionId: existingSessionId, visitorName: null };
        }
        throw err;
      });
  }

  function sendMessage(sessionId, message, handlers) {
    fetch(apiUrl("/api/v1/messages"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId, message: message }),
    })
      .then(function (response) {
        if (!response.ok || !response.body) {
          throw new Error("No se pudo conectar con el asistente.");
        }
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = "";

        function pump() {
          return reader.read().then(function (result) {
            if (result.done) return;
            buffer += decoder.decode(result.value, { stream: true });
            var events = buffer.split("\n\n");
            buffer = events.pop();
            events.forEach(function (chunk) {
              var line = chunk.replace(/^data:\s?/, "").trim();
              if (!line) return;
              try {
                var payload = JSON.parse(line);
                if (payload.type === "delta") handlers.onDelta(payload.text);
                else if (payload.type === "done") handlers.onDone(payload);
                else if (payload.type === "error") handlers.onError(payload.message);
              } catch {
                /* fragmento incompleto; se descarta */
              }
            });
            return pump();
          });
        }
        return pump();
      })
      .catch(function (err) {
        handlers.onError(err && err.message ? err.message : "Ocurrió un error inesperado.");
      });
  }

  function buildStyles(appearance) {
    var shadow = SHADOW_STYLES[appearance.shadowStyle] || SHADOW_STYLES.suave;
    var spacing = SPACING_SCALES[appearance.spacingScale] || SPACING_SCALES.normal;
    var fontStack =
      '"' +
      appearance.fontFamily +
      '", ' +
      (appearance.fontFamily === "Inter" ? "" : '"Inter", ') +
      "system-ui, sans-serif";
    var launcherRadius = appearance.launcherShape === "circular" ? "50%" : "18px";
    var bodyTextColor = getReadableTextColor(appearance.backgroundColor, appearance.themeMode);
    var headerTextColor = getHeaderTextColor(appearance.textColor, appearance.themeMode);

    return (
      ":host{all:initial;}\n" +
      "*{box-sizing:border-box;}\n" +
      ".sofia-root{position:fixed;z-index:2147483000;font-family:" +
      fontStack +
      ";}\n" +
      ".sofia-launcher{position:fixed;" +
      positionCss(appearance.position) +
      "background:" +
      appearance.launcherColor +
      ";color:#fff;border:none;display:flex;align-items:center;justify-content:center;gap:.5rem;cursor:pointer;box-shadow:" +
      shadow +
      ";transition:transform .2s ease,filter .2s ease;z-index:2147483000;}\n" +
      ".sofia-launcher:hover{transform:scale(1.1);filter:brightness(1.1);}\n" +
      ".sofia-launcher-icon{width:48px;height:48px;border-radius:" +
      launcherRadius +
      ";}\n" +
      ".sofia-launcher-label{height:40px;padding:0 1rem;border-radius:999px;font-size:.875rem;font-weight:600;white-space:nowrap;}\n" +
      ".sofia-window{position:fixed;" +
      positionCss(appearance.position, true) +
      "width:" +
      appearance.windowWidth +
      "px;max-width:calc(100vw - 32px);height:" +
      appearance.windowHeight +
      "px;max-height:calc(100vh - 120px);border-radius:" +
      appearance.borderRadius +
      "px;background:" +
      appearance.backgroundColor +
      ";color:" +
      bodyTextColor +
      ";box-shadow:" +
      shadow +
      ";display:flex;flex-direction:column;overflow:hidden;z-index:2147483000;}\n" +
      ".sofia-hidden{display:none !important;}\n" +
      ".sofia-header{display:flex;align-items:center;gap:.5rem;padding:.75rem 1rem;background:" +
      appearance.primaryColor +
      ";color:" +
      headerTextColor +
      ";}\n" +
      ".sofia-header-logo{width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;background:rgba(255,255,255,.15);}\n" +
      ".sofia-header-title{font-size:1rem;font-weight:600;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}\n" +
      ".sofia-header-subtitle{font-size:.8125rem;opacity:.85;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}\n" +
      ".sofia-header-restart{background:transparent;border:none;color:inherit;cursor:pointer;padding:.25rem;display:flex;opacity:.85;margin-left:auto;}\n" +
      ".sofia-header-close{background:transparent;border:none;color:inherit;cursor:pointer;padding:.25rem;display:flex;opacity:.85;}\n" +
      ".sofia-header-restart:hover,.sofia-header-close:hover{opacity:1;}\n" +
      ".sofia-messages{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;padding:" +
      spacing.padding +
      ";gap:" +
      spacing.gap +
      ";scrollbar-width:thin;scrollbar-color:rgba(127,127,127,.4) transparent;}\n" +
      ".sofia-messages::-webkit-scrollbar{width:6px;}\n" +
      ".sofia-messages::-webkit-scrollbar-track{background:transparent;}\n" +
      ".sofia-messages::-webkit-scrollbar-thumb{background-color:rgba(127,127,127,.4);border-radius:9999px;}\n" +
      ".sofia-greeting{display:flex;flex-direction:column;align-items:center;text-align:center;padding:1rem .5rem .5rem;gap:.25rem;}\n" +
      ".sofia-greeting-logo{width:64px;height:64px;border-radius:50%;object-fit:cover;margin-bottom:.25rem;}\n" +
      ".sofia-greeting-name{font-size:1.0625rem;font-weight:700;margin:0;}\n" +
      ".sofia-greeting-tagline{font-size:.8125rem;opacity:.7;margin:0;}\n" +
      ".sofia-bubble{max-width:85%;padding:.5rem .75rem;border-radius:.75rem;font-size:.875rem;line-height:1.5;word-wrap:break-word;}\n" +
      ".sofia-bubble p{margin:0 0 .5rem 0;}\n" +
      ".sofia-bubble p:last-child{margin-bottom:0;}\n" +
      ".sofia-bubble ul,.sofia-bubble ol{margin:.25rem 0 .5rem 1.1rem;padding:0;}\n" +
      ".sofia-bubble .sofia-code-block{background:rgba(0,0,0,.25);border-radius:.375rem;padding:.5rem .625rem;overflow-x:auto;font-size:.8em;margin:.4rem 0;}\n" +
      ".sofia-bubble code{font-family:ui-monospace,Menlo,Consolas,monospace;}\n" +
      ".sofia-bubble a{color:inherit;text-decoration:underline;}\n" +
      ".sofia-bubble-user{align-self:flex-end;background:" +
      appearance.userBubbleColor +
      ";color:#fff;border-bottom-right-radius:.125rem;}\n" +
      ".sofia-bubble-assistant{align-self:flex-start;background:" +
      appearance.assistantBubbleColor +
      ";color:" +
      appearance.assistantTextColor +
      ";border-bottom-left-radius:.125rem;}\n" +
      ".sofia-bubble-integration{align-self:flex-start;background:transparent;border:1px dashed currentColor;opacity:.85;font-size:.8rem;}\n" +
      ".sofia-initial-messages{display:flex;flex-direction:column;gap:.25rem;}\n" +
      ".sofia-suggested{display:flex;flex-wrap:wrap;gap:.4rem;padding:0 " +
      spacing.padding +
      " .5rem;}\n" +
      ".sofia-suggested button{border:1px solid " +
      appearance.suggestedMessageColor +
      ";color:" +
      appearance.suggestedMessageColor +
      ";background:transparent;border-radius:999px;padding:.3rem .7rem;font-size:.75rem;cursor:pointer;}\n" +
      ".sofia-suggested button:hover{background:" +
      appearance.suggestedMessageColor +
      ";color:#fff;}\n" +
      ".sofia-form{padding:.5rem 1.25rem;}\n" +
      ".sofia-form-inner{display:flex;align-items:flex-end;gap:.25rem;border:1px solid rgba(127,127,127,.3);border-radius:999px;padding:.25rem .25rem .25rem .875rem;}\n" +
      ".sofia-form-inner:focus-within{outline:2px solid " +
      appearance.primaryColor +
      ";outline-offset:1px;}\n" +
      ".sofia-input{flex:1;resize:none;border:none;padding:.4375rem 0;font-family:inherit;font-size:.875rem;background:transparent;color:inherit;max-height:96px;overflow-y:hidden;}\n" +
      ".sofia-input::placeholder{color:currentColor;opacity:.5;}\n" +
      ".sofia-input:focus{outline:none;}\n" +
      ".sofia-send{background:" +
      appearance.primaryColor +
      ";color:#fff;border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}\n" +
      ".sofia-send:disabled{opacity:.5;cursor:default;}\n" +
      ".sofia-typing{display:flex;gap:.25rem;padding:.65rem .9rem;}\n" +
      ".sofia-typing span{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.4;animation:sofia-blink 1.2s infinite ease-in-out;}\n" +
      ".sofia-typing span:nth-child(2){animation-delay:.2s;}\n" +
      ".sofia-typing span:nth-child(3){animation-delay:.4s;}\n" +
      "@keyframes sofia-blink{0%,80%,100%{opacity:.3;}40%{opacity:1;}}\n" +
      ".sofia-footer{text-align:center;padding:.5rem 1rem .9rem;font-size:.7rem;}\n" +
      ".sofia-footer a{color:" +
      appearance.footerLinkColor +
      ";opacity:.85;text-decoration:none;}\n" +
      ".sofia-footer a:hover{text-decoration:underline;}\n" +
      "@media (max-width:520px){.sofia-window{width:100vw !important;height:100vh !important;height:100dvh !important;max-width:100vw;max-height:100vh;max-height:100dvh;border-radius:0;top:0 !important;left:0 !important;right:0 !important;bottom:0 !important;padding-bottom:env(safe-area-inset-bottom);}}\n" +
      (appearance.animationsEnabled
        ? ".sofia-window{animation-name:sofia-window-in;animation-duration:.2s;animation-timing-function:ease-out;animation-delay:.15s;animation-fill-mode:backwards;}@keyframes sofia-window-in{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}\n" +
          ".sofia-window.sofia-closing{animation-name:sofia-window-out;animation-duration:.2s;animation-timing-function:ease-in;animation-fill-mode:forwards;}@keyframes sofia-window-out{from{opacity:1;transform:translateY(0);}to{opacity:0;transform:translateY(8px);}}\n" +
          ".sofia-bubble{animation:sofia-bubble-in .2s ease-out;}@keyframes sofia-bubble-in{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}\n"
        : "")
    );
  }

  function positionCss(position, isWindow) {
    var offset = isWindow ? "88px" : "20px";
    var vertical = position.indexOf("inferior") === 0 ? "bottom" : "top";
    var horizontal = position.indexOf("derecha") !== -1 ? "right" : "left";
    return vertical + ":" + offset + ";" + horizontal + ":20px;";
  }

  function buildWidget(config) {
    loadGoogleFont(config.appearance.fontFamily);

    var host = document.createElement("div");
    host.style.all = "initial";
    /* Excluye el widget de librerías de scroll suave de la página anfitriona (Lenis y
       similares respetan este atributo, buscándolo en event.composedPath(), para no
       secuestrar la rueda del mouse sobre elementos con su propio scroll interno). */
    host.setAttribute("data-lenis-prevent", "");
    document.body.appendChild(host);
    var shadow = host.attachShadow({ mode: "open" });

    var styleEl = document.createElement("style");
    styleEl.textContent = buildStyles(config.appearance);
    shadow.appendChild(styleEl);

    var root = document.createElement("div");
    root.className = "sofia-root";
    shadow.appendChild(root);

    var launcher = document.createElement("button");
    var launcherType = config.appearance.launcherType || "icono";
    launcher.className =
      "sofia-launcher " +
      (launcherType === "icono" ? "sofia-launcher-icon" : "sofia-launcher-label");
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Abrir conversación");
    var launcherLabelText =
      config.appearance.launcherLabel || config.appearance.headerTitle || config.name;
    if (launcherType === "icono") {
      launcher.innerHTML = svg(config.appearance.launcherIcon, 20);
    } else if (launcherType === "texto") {
      launcher.textContent = launcherLabelText;
    } else {
      launcher.innerHTML = svg(config.appearance.launcherIcon, 16);
      launcher.appendChild(document.createTextNode(launcherLabelText));
    }
    root.appendChild(launcher);

    var windowEl = document.createElement("div");
    windowEl.className = "sofia-window sofia-hidden";
    windowEl.setAttribute("role", "dialog");
    windowEl.setAttribute("aria-modal", "false");
    windowEl.setAttribute("aria-label", config.appearance.headerTitle || config.name);

    var header = document.createElement("div");
    header.className = "sofia-header";
    if (config.logoUrl) {
      var headerLogo = document.createElement("img");
      headerLogo.className = "sofia-header-logo";
      headerLogo.src = config.logoUrl;
      headerLogo.alt = "";
      header.appendChild(headerLogo);
    }
    var headerText = document.createElement("div");
    headerText.style.minWidth = "0";
    var headerTitle = document.createElement("p");
    headerTitle.className = "sofia-header-title";
    headerTitle.textContent = config.appearance.headerTitle || config.name;
    headerText.appendChild(headerTitle);
    if (config.appearance.headerSubtitle) {
      var headerSubtitle = document.createElement("p");
      headerSubtitle.className = "sofia-header-subtitle";
      headerSubtitle.textContent = config.appearance.headerSubtitle;
      headerText.appendChild(headerSubtitle);
    }
    header.appendChild(headerText);
    var restartBtn = document.createElement("button");
    restartBtn.type = "button";
    restartBtn.className = "sofia-header-restart";
    restartBtn.setAttribute("aria-label", "Iniciar conversación nueva");
    restartBtn.innerHTML = svg("restart", 16);
    header.appendChild(restartBtn);
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "sofia-header-close";
    closeBtn.setAttribute("aria-label", "Cerrar conversación");
    closeBtn.innerHTML = svg("close", 18);
    header.appendChild(closeBtn);
    windowEl.appendChild(header);

    var messagesEl = document.createElement("div");
    messagesEl.className = "sofia-messages";
    messagesEl.setAttribute("role", "log");
    messagesEl.setAttribute("aria-live", "polite");
    windowEl.appendChild(messagesEl);

    var suggestedEl = document.createElement("div");
    suggestedEl.className = "sofia-suggested";
    windowEl.appendChild(suggestedEl);

    var form = document.createElement("form");
    form.className = "sofia-form";
    var formInner = document.createElement("div");
    formInner.className = "sofia-form-inner";
    var textarea = document.createElement("textarea");
    textarea.className = "sofia-input";
    textarea.rows = 1;
    textarea.placeholder = "Escribe un mensaje...";
    textarea.setAttribute("aria-label", "Mensaje");
    var sendBtn = document.createElement("button");
    sendBtn.type = "submit";
    sendBtn.className = "sofia-send";
    sendBtn.setAttribute("aria-label", "Enviar mensaje");
    sendBtn.innerHTML = svg("send", 14);
    formInner.appendChild(textarea);
    formInner.appendChild(sendBtn);
    form.appendChild(formInner);
    windowEl.appendChild(form);

    if (config.appearance.footerLinkLabel || config.appearance.footerLinkUrl) {
      var footer = document.createElement("div");
      footer.className = "sofia-footer";
      if (config.appearance.footerLinkUrl) {
        var link = document.createElement("a");
        link.href = config.appearance.footerLinkUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = config.appearance.footerLinkLabel || config.appearance.footerLinkUrl;
        footer.appendChild(link);
      } else {
        footer.textContent = config.appearance.footerLinkLabel;
      }
      windowEl.appendChild(footer);
    }

    root.appendChild(windowEl);

    var isMobileLayout = function () {
      return window.matchMedia("(max-width: 520px)").matches;
    };
    /** En móvil, ancla la altura de la ventana a la del viewport visual para que el input y el pie no queden ocultos detrás del teclado. */
    function syncViewportHeight() {
      if (!window.visualViewport) return;
      windowEl.style.height = isMobileLayout()
        ? window.visualViewport.height + "px"
        : "";
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", syncViewportHeight);
    }

    var closeTimeoutId = null;
    function toggle(open) {
      var isHidden = windowEl.classList.contains("sofia-hidden");
      var shouldOpen = typeof open === "boolean" ? open : isHidden;

      if (shouldOpen) {
        if (closeTimeoutId) {
          clearTimeout(closeTimeoutId);
          closeTimeoutId = null;
        }
        windowEl.classList.remove("sofia-closing");
        windowEl.classList.remove("sofia-hidden");
        syncViewportHeight();
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return;
      }

      if (isHidden || closeTimeoutId) return;
      if (config.appearance.animationsEnabled) {
        windowEl.classList.add("sofia-closing");
        closeTimeoutId = setTimeout(function () {
          windowEl.classList.add("sofia-hidden");
          windowEl.classList.remove("sofia-closing");
          closeTimeoutId = null;
        }, 200);
      } else {
        windowEl.classList.add("sofia-hidden");
      }
    }

    launcher.addEventListener("click", function () {
      toggle();
    });
    closeBtn.addEventListener("click", function () {
      toggle(false);
    });
    windowEl.addEventListener("keydown", function (event) {
      if (event.key === "Escape") toggle(false);
    });
    textarea.addEventListener("input", function () {
      textarea.style.height = "auto";
      var natural = textarea.scrollHeight;
      textarea.style.height = Math.min(natural, 96) + "px";
      textarea.style.overflowY = natural > 96 ? "auto" : "hidden";
    });
    textarea.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    return {
      root: root,
      windowEl: windowEl,
      messagesEl: messagesEl,
      suggestedEl: suggestedEl,
      form: form,
      textarea: textarea,
      sendBtn: sendBtn,
      restartBtn: restartBtn,
      toggle: toggle,
    };
  }

  function appendBubble(messagesEl, role, content, isMarkdown) {
    var bubble = document.createElement("div");
    bubble.className =
      "sofia-bubble " +
      (role === "usuario"
        ? "sofia-bubble-user"
        : role === "integración"
          ? "sofia-bubble-integration"
          : "sofia-bubble-assistant");
    if (isMarkdown) {
      bubble.innerHTML = renderMarkdown(content);
    } else {
      bubble.textContent = content;
    }
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  /** Revela un texto progresivamente en una burbuja ya insertada, simulando que se escribe en vivo; al terminar, aplica el renderizado de Markdown completo y llama a onComplete si se indica. */
  function typewriterReveal(bubble, text, messagesEl, onComplete) {
    var full = String(text == null ? "" : text);
    var i = 0;
    var step = Math.max(1, Math.round(full.length / 60));
    var interval = setInterval(function () {
      i += step;
      bubble.textContent = full.slice(0, i);
      if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
      if (i >= full.length) {
        clearInterval(interval);
        bubble.innerHTML = renderMarkdown(full);
        if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
        if (onComplete) onComplete();
      }
    }, 12);
  }

  /** Revela una lista de mensajes en orden, cada uno en su propia burbuja dentro de un mismo grupo (espaciado más angosto entre ellas que el de la conversación general), esperando a que termine el anterior antes de empezar el siguiente. */
  function typewriterRevealSequence(messages, messagesEl) {
    var group = document.createElement("div");
    group.className = "sofia-initial-messages";
    messagesEl.appendChild(group);

    var index = 0;
    function next() {
      if (index >= messages.length) return;
      var bubble = document.createElement("div");
      bubble.className = "sofia-bubble sofia-bubble-assistant";
      group.appendChild(bubble);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      var text = messages[index];
      index += 1;
      typewriterReveal(bubble, text, messagesEl, next);
    }
    next();
  }

  function appendTypingIndicator(messagesEl) {
    var wrapper = document.createElement("div");
    wrapper.className = "sofia-bubble sofia-bubble-assistant sofia-typing";
    wrapper.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrapper;
  }

  function bootstrap() {
    fetchConfig()
      .then(function (config) {
        if (!config.availableNow && config.outOfScheduleBehavior === "ocultar widget") {
          return;
        }

        var visitorId = getVisitorId();
        initSession(visitorId).then(function (initialSession) {
          var session = initialSession;
          var ui = buildWidget(config);

          function renderInitialContent() {
            ui.messagesEl.innerHTML = "";
            ui.suggestedEl.innerHTML = "";

            if (config.appearance.companyName) {
              var greeting = document.createElement("div");
              greeting.className = "sofia-greeting";
              if (config.logoUrl) {
                var greetingLogo = document.createElement("img");
                greetingLogo.className = "sofia-greeting-logo";
                greetingLogo.src = config.logoUrl;
                greetingLogo.alt = "";
                greeting.appendChild(greetingLogo);
              }
              var greetingName = document.createElement("p");
              greetingName.className = "sofia-greeting-name";
              greetingName.textContent = config.appearance.companyName;
              greeting.appendChild(greetingName);
              if (config.appearance.companyTagline) {
                var greetingTagline = document.createElement("p");
                greetingTagline.className = "sofia-greeting-tagline";
                greetingTagline.textContent = config.appearance.companyTagline;
                greeting.appendChild(greetingTagline);
              }
              ui.messagesEl.appendChild(greeting);
            }

            if (!config.availableNow && config.outOfScheduleBehavior === "mostrar mensaje de no disponibilidad") {
              appendBubble(ui.messagesEl, "sistema", "Este asistente no está disponible en este horario. Vuelve a intentarlo más tarde.", false);
              ui.textarea.disabled = true;
              ui.sendBtn.disabled = true;
            } else {
              if ((config.appearance.initialMessages || []).length > 0) {
                typewriterRevealSequence(config.appearance.initialMessages, ui.messagesEl);
              }
              (config.appearance.suggestedMessages || []).slice(0, 4).forEach(function (suggestion) {
                var btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = suggestion;
                btn.addEventListener("click", function () {
                  ui.suggestedEl.innerHTML = "";
                  submitMessage(suggestion);
                });
                ui.suggestedEl.appendChild(btn);
              });
            }
          }

          var sending = false;
          function submitMessage(text) {
            var trimmed = (text || "").trim();
            if (!trimmed || sending) return;
            sending = true;
            ui.sendBtn.disabled = true;
            appendBubble(ui.messagesEl, "usuario", trimmed, false);
            ui.textarea.value = "";
            ui.textarea.style.height = "auto";
            ui.suggestedEl.innerHTML = "";

            var typing = appendTypingIndicator(ui.messagesEl);
            var assistantBubble = null;
            var assistantText = "";

            sendMessage(session.sessionId, trimmed, {
              onDelta: function (delta) {
                if (typing) {
                  typing.remove();
                  typing = null;
                }
                if (!assistantBubble) {
                  assistantBubble = appendBubble(ui.messagesEl, "asistente", "", true);
                }
                assistantText += delta;
                assistantBubble.innerHTML = renderMarkdown(assistantText);
                ui.messagesEl.scrollTop = ui.messagesEl.scrollHeight;
              },
              onDone: function () {
                if (typing) typing.remove();
                sending = false;
                ui.sendBtn.disabled = false;
              },
              onError: function (message) {
                if (typing) typing.remove();
                if (!assistantBubble) {
                  appendBubble(ui.messagesEl, "asistente", message || "Ocurrió un error inesperado.", false);
                }
                sending = false;
                ui.sendBtn.disabled = false;
              },
            });
          }

          renderInitialContent();

          if (ui.restartBtn) {
            ui.restartBtn.addEventListener("click", function () {
              if (sending) return;
              try {
                window.localStorage.removeItem("sofia_widget_session_" + publicKey);
              } catch {
                /* almacenamiento no disponible */
              }
              renderInitialContent();
              initSession(getVisitorId()).then(function (newSession) {
                session = newSession;
              });
            });
          }

          ui.form.addEventListener("submit", function (event) {
            event.preventDefault();
            submitMessage(ui.textarea.value);
          });
        });
      })
      .catch(function (err) {
        console.error("[Sof.ia] No se pudo cargar el widget.", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
