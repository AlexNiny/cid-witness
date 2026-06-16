const FILECOIN_TOOLS = "https://api.filecoin.tools/api";
const GLIF_RPC = "https://api.node.glif.io/rpc/v1";
const CHAIN_LOVE_RPC = "https://api.chain.love/rpc/v1";
const SAMPLE_PIECE = "baga6ea4seaqgd4bohelctwubfgfmxsfcajhleg5ldsoat7n64q42ru4wlnrr6ka";

const state = {
  stats: null,
  network: null,
  lastReport: "",
  latestHeight: 0,
};

const el = {
  dealCount: document.querySelector("#dealCount"),
  cidCount: document.querySelector("#cidCount"),
  latestHeight: document.querySelector("#latestHeight"),
  dataStored: document.querySelector("#dataStored"),
  refreshStats: document.querySelector("#refreshStats"),
  form: document.querySelector("#lookupForm"),
  query: document.querySelector("#queryInput"),
  apiState: document.querySelector("#apiState"),
  emptyState: document.querySelector("#emptyState"),
  resultSummary: document.querySelector("#resultSummary"),
  dealResults: document.querySelector("#dealResults"),
  reportText: document.querySelector("#reportText"),
  reportMeta: document.querySelector("#reportMeta"),
  copyReport: document.querySelector("#copyReport"),
};

function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Unknown";
  return new Intl.NumberFormat("en-US").format(numeric);
}

function formatBytes(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Unknown";
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  let size = numeric;
  let unit = 0;
  while (size >= 1000 && unit < units.length - 1) {
    size /= 1000;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unit]}`;
}

function setApiState(label, tone = "muted") {
  el.apiState.textContent = label;
  el.apiState.className = `pill ${tone}`;
}

function showToast(text) {
  const old = document.querySelector(".copy-toast");
  if (old) old.remove();
  const toast = document.createElement("div");
  toast.className = "copy-toast";
  toast.textContent = text;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 2200);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function rpc(method, params = []) {
  const body = JSON.stringify({ jsonrpc: "2.0", method, params, id: Date.now() });
  const endpoints = [GLIF_RPC, CHAIN_LOVE_RPC];
  let lastError;
  for (const endpoint of endpoints) {
    try {
      const data = await fetchJson(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      if (data.error) throw new Error(data.error.message || "RPC error");
      return data.result;
    } catch (error) { lastError = error; }
  }
  throw lastError;
}

function renderSkeleton(target, width) {
  target.innerHTML = `<span class="skeleton" style="display:inline-block;width:${width}px;height:28px;vertical-align:middle"></span>`;
}

async function loadStats() {
  renderSkeleton(el.dealCount, 110);
  renderSkeleton(el.cidCount, 90);
  renderSkeleton(el.latestHeight, 100);
  renderSkeleton(el.dataStored, 80);

  const [statsResult, networkResult] = await Promise.allSettled([
    fetchJson(`${FILECOIN_TOOLS}/stats`),
    rpc("Filecoin.StateNetworkName"),
  ]);

  if (statsResult.status === "fulfilled") {
    state.stats = statsResult.value;
    state.latestHeight = Number(state.stats.lastDealHeight || 0);
    el.dealCount.textContent = formatNumber(state.stats.dealCountEstimate);
    el.cidCount.textContent = formatNumber(state.stats.uniqueCidsCount);
    el.latestHeight.textContent = formatNumber(state.stats.lastDealHeight);
    el.dataStored.textContent = formatBytes(state.stats.totalDataCapUsed);
  } else {
    el.dealCount.textContent = "Unavailable";
    el.cidCount.textContent = "Unavailable";
    el.latestHeight.textContent = "Unavailable";
    el.dataStored.textContent = "Unavailable";
  }

  if (networkResult.status === "fulfilled") {
    state.network = networkResult.value;
  }
}

function normalizeQuery(value) {
  return value.trim();
}

function looksLikeIpfsCid(query) {
  return /^bafy[a-z2-7]{20,}$/i.test(query) || /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(query);
}

function looksLikePieceCid(query) {
  return /^baga[a-z2-7]{20,}$/i.test(query);
}

function toActorId(query) {
  const actorMatch = query.match(/^f0?(\d+)$/i);
  return actorMatch ? actorMatch[1] : query;
}

async function searchDeals(query) {
  const params = new URLSearchParams({ filter: query, page: "1", limit: "6" });
  return fetchJson(`${FILECOIN_TOOLS}/search?${params.toString()}`);
}

async function getDealById(query) {
  return fetchJson(`${FILECOIN_TOOLS}/deal/${encodeURIComponent(query)}`);
}

async function getProviderDeals(query) {
  const providerId = toActorId(query);
  return fetchJson(`${FILECOIN_TOOLS}/deals/provider/${encodeURIComponent(providerId)}?page=1&limit=6&isActive=1`);
}

async function getClientDeals(query) {
  const clientId = toActorId(query);
  return fetchJson(`${FILECOIN_TOOLS}/deals/client/${encodeURIComponent(clientId)}?page=1&limit=6&isActive=1`);
}

async function checkGateway(cid) {
  const gateways = [`https://${cid}.ipfs.dweb.link/`, `https://ipfs.io/ipfs/${cid}`];
  for (const url of gateways) {
    try {
      const response = await fetch(url, { method: "HEAD", mode: "cors" });
      if (response.ok || response.status === 200) return { ok: true, url };
    } catch { /* try next */ }
  }
  return { ok: false, url: gateways[0] };
}

function extractDeals(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data) return Array.isArray(response.data) ? response.data : [response.data];
  if (response.results) return Array.isArray(response.results) ? response.results : [response.results];
  if (response.deals) return Array.isArray(response.deals) ? response.deals : [response.deals];
  if (response.id || response.dealId || response.pieceCid) return [response];
  return [];
}

function dealStatus(deal) {
  const start = Number(deal.termStart || 0);
  const maxTerm = Number(deal.maxTerm || 0);
  if (!state.latestHeight || !start) return { label: "Active", remaining: "term details unavailable" };
  const remaining = start + maxTerm - state.latestHeight;
  if (remaining <= 0) return { label: "Expired", remaining: "term ended" };
  return { label: "Active", remaining: `${formatNumber(remaining)} epochs remaining` };
}

function actorLabel(prefix, id) {
  if (!id) return "unknown";
  const n = String(id).replace(/^f0?/i, "");
  return `${prefix}${n}`;
}

function renderDeals(deals) {
  el.dealResults.innerHTML = "";
  if (!deals.length) return;

  deals.forEach((deal, idx) => {
    const status = dealStatus(deal);
    const card = document.createElement("article");
    card.className = "deal-card";
    card.style.animationDelay = `${idx * 80}ms`;
    card.innerHTML = `
      <div class="deal-title">
        <strong>${deal.pieceCid ? `Piece ${deal.pieceCid.slice(0, 24)}…` : `Record ${deal.id || deal.dealId || "unknown"}`}</strong>
        <span class="pill ${status.label === "Active" ? "good" : "warn"}">${status.label}</span>
      </div>
      <div class="kv-grid">
        ${deal.pieceCid ? `<div class="kv"><span>Piece CID</span><strong>${deal.pieceCid}</strong></div>` : ""}
        ${deal.id || deal.dealId ? `<div class="kv"><span>Record ID</span><strong>${deal.id || deal.dealId}</strong></div>` : ""}
        ${deal.providerId ? `<div class="kv"><span>Provider</span><a href="https://filecoin.tools/mainnet/provider/${actorLabel("f0", deal.providerId)}" target="_blank" rel="noreferrer">${actorLabel("f0", deal.providerId)}</a></div>` : ""}
        ${deal.clientId ? `<div class="kv"><span>Client</span><a href="https://filecoin.tools/mainnet/client/${actorLabel("f0", deal.clientId)}" target="_blank" rel="noreferrer">${actorLabel("f0", deal.clientId)}</a></div>` : ""}
        <div class="kv"><span>Term start</span><strong>${formatNumber(deal.termStart)}</strong></div>
        <div class="kv"><span>Term status</span><strong>${status.remaining}</strong></div>
      </div>
    `;
    el.dealResults.append(card);
  });
}

function buildReport(query, deals, gateway) {
  const now = new Date().toISOString();
  const lines = [
    "CID Witness evidence packet",
    `Checked: ${query}`,
    `Generated: ${now}`,
    `Filecoin network: ${state.network || "mainnet"}`,
    `Latest indexed market height: ${state.latestHeight ? formatNumber(state.latestHeight) : "unknown"}`,
    "",
  ];

  if (deals.length) {
    const first = deals[0];
    const status = dealStatus(first);
    lines.push(`Found ${deals.length} Filecoin market record(s).`);
    lines.push(`Primary piece CID: ${first.pieceCid || "unknown"}`);
    lines.push(`Provider: ${actorLabel("f0", first.providerId)}`);
    lines.push(`Client: ${actorLabel("f0", first.clientId)}`);
    lines.push(`Status: ${status.label}, ${status.remaining}`);
  } else {
    lines.push("No Filecoin storage deal record was found in the public Filecoin Tools index.");
  }

  if (gateway) {
    lines.push("");
    lines.push(`IPFS gateway check: ${gateway.ok ? "reachable" : "not confirmed"}`);
    lines.push(`Gateway URL: ${gateway.url}`);
  }

  lines.push("");
  lines.push("Why this uses Filecoin: the app queries public Filecoin storage market records and turns provider, client, CID, and term data into a readable verification note.");
  lines.push("Built with AI as a planning, coding, and debugging partner for the FilecoinTLDR Builder Challenge.");
  return lines.join("\n");
}

function summarize(query, deals, gateway) {
  el.resultSummary.className = "result-summary";
  if (deals.length) {
    el.resultSummary.classList.add("good");
    el.resultSummary.querySelector("p").textContent = `Found ${deals.length} Filecoin market record(s) for "${query}".`;
    return;
  }
  if (gateway?.ok) {
    el.resultSummary.classList.add("good");
    el.resultSummary.querySelector("p").textContent = `No market record found, but the IPFS CID is retrievable at ${gateway.url}.`;
    return;
  }
  el.resultSummary.classList.add("warn");
  el.resultSummary.querySelector("p").textContent = `No confirmed Filecoin record or gateway retrieval for "${query}".`;
}

async function handleLookup(event) {
  event.preventDefault();
  const query = normalizeQuery(el.query.value);
  if (!query) return;

  setApiState("Checking", "warn");
  el.emptyState.hidden = true;
  el.dealResults.innerHTML = "";
  el.copyReport.disabled = true;
  el.reportMeta.textContent = "Working";
  el.reportText.textContent = "Querying live Filecoin data…";

  try {
    const tasks = [];
    const numericId = /^\d+$/.test(query);
    const actorId = /^f0?\d+$/i.test(query);

    if (numericId) tasks.push(getDealById(query).catch(() => null));
    if (actorId) {
      tasks.push(getProviderDeals(query).catch(() => null));
      tasks.push(getClientDeals(query).catch(() => null));
    }
    if (looksLikePieceCid(query) || numericId || actorId) {
      tasks.push(searchDeals(query).catch(() => null));
    }

    const gatewayTask = looksLikeIpfsCid(query) ? checkGateway(query) : Promise.resolve(null);
    const [responses, gateway] = await Promise.all([Promise.all(tasks), gatewayTask]);
    const deals = responses.flatMap(extractDeals);
    const uniqueDeals = Array.from(new Map(deals.map((deal) => [String(deal.id ?? deal.dealId ?? deal.pieceCid), deal])).values());

    renderDeals(uniqueDeals);
    summarize(query, uniqueDeals, gateway);
    state.lastReport = buildReport(query, uniqueDeals, gateway);
    el.reportText.textContent = state.lastReport;
    el.reportMeta.textContent = `${uniqueDeals.length} record(s)`;
    el.copyReport.disabled = false;
    setApiState("Ready", uniqueDeals.length || gateway?.ok ? "good" : "warn");
  } catch (error) {
    el.resultSummary.className = "result-summary warn";
    el.resultSummary.querySelector("p").textContent = `Lookup failed: ${error.message}`;
    el.reportText.textContent = "The lookup failed. Try the sample piece CID or refresh the Filecoin stats.";
    el.reportMeta.textContent = "Error";
    setApiState("Error", "bad");
  }
}

async function copyReport() {
  if (!state.lastReport) return;
  await navigator.clipboard.writeText(state.lastReport);
  showToast("Report copied to clipboard");
}

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    el.query.value = button.dataset.sample || SAMPLE_PIECE;
    el.form.requestSubmit();
  });
});

el.form.addEventListener("submit", handleLookup);
el.copyReport.addEventListener("click", copyReport);
el.refreshStats.addEventListener("click", loadStats);

loadStats().then(() => {
  setApiState("Ready", "good");
  el.form.requestSubmit();
}).catch(() => {
  setApiState("Stats unavailable", "warn");
});
