function setText(id, value) {
  const el = document.getElementById(id);
  el.textContent = value || "Unknown";
}

try {
  const raw = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : "{}";
  const data = JSON.parse(raw);
  setText("saved-title", data.title);
  setText("saved-url", data.url);
  setText("reason", data.reason);
} catch (error) {
  setText("saved-title", "Unknown");
  setText("saved-url", "Unknown");
  setText("reason", `Could not parse fallback tab details: ${error.message}`);
}
