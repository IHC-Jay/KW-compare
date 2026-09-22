const state = { mode: 'directories', rows: [], expandedRuns: new Set(), expandedLines: new Set(), details: {} };
const $ = (selector) => document.querySelector(selector);

const form = $('#compareForm');
const sourceA = $('#sourceA');
const sourceB = $('#sourceB');
const sourceALabel = $('#sourceALabel');
const sourceBLabel = $('#sourceBLabel');
const apiBase = $('#apiBase');
const username = $('#username');
const password = $('#password');
const message = $('#message');
const resultsBody = $('#resultsBody');
const resultCount = $('#resultCount');
const connectionState = $('#connectionState');
const refreshRuns = $('#refreshRuns');

function normalizeBaseUrl() {
  return apiBase.value.trim().replace(/\/$/, '');
}

function hasCredentials() {
  return username.value.trim() !== '' && password.value !== '';
}

function classifyFetchError(error) {
  if (error && error.name === 'TypeError') {
    return 'Connection blocked or unavailable. This is usually CORS or network access to the API host.';
  }
  return error?.message || 'Request failed.';
}

function getApiErrorMessage(status, data, fallbackMessage = 'Request failed') {
  const payloadMessage = data?.error || data?.message;
  if (payloadMessage) return payloadMessage;

  if (status === 401) return 'Authentication failed (401). Check username and password.';
  if (status === 403) return 'Access denied (403).';
  if (status === 404) return 'API endpoint not found (404). Check the API base URL path.';
  if (status >= 500) return `Server error (${status}).`;
  return `${fallbackMessage} (${status})`;
}

async function checkApiHealth() {
  if (!hasCredentials()) {
    connectionState.innerHTML = '<span class="status-dot"></span>Credentials required';
    return;
  }
  const base = normalizeBaseUrl();
  const url = `${base}/runs`;
  connectionState.innerHTML = '<span class="status-dot"></span>Checking';
  try {
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (response.ok) {
      connectionState.innerHTML = '<span class="status-dot"></span>Connected';
      return;
    }
    if (response.status === 401) {
      connectionState.innerHTML = '<span class="status-dot"></span>Auth required';
      return;
    }
    if (response.status === 404) {
      connectionState.innerHTML = '<span class="status-dot"></span>Bad API URL';
      return;
    }
    connectionState.innerHTML = `<span class="status-dot"></span>Error ${response.status}`;
  } catch (error) {
    connectionState.innerHTML = '<span class="status-dot"></span>CORS/Network';
  }
}

function showMessage(text, type = 'error') {
  message.textContent = text;
  message.hidden = false;
  message.className = `message ${type === 'success' ? 'success' : ''}`;
}

function setBusy(busy) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = busy;
  button.querySelector('span:first-child').textContent = busy ? 'Comparing...' : 'Run comparison';
  connectionState.innerHTML = `<span class="status-dot"></span>${busy ? 'Working' : 'Ready'}`;
}

function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (hasCredentials()) {
    const credentials = `${username.value}:${password.value}`;
    headers.Authorization = `Basic ${btoa(credentials)}`;
  }
  return headers;
}

async function loadPreviousRuns() {
  if (!hasCredentials()) {
    showMessage('Enter username and password, then load previous runs.');
    connectionState.innerHTML = '<span class="status-dot"></span>Credentials required';
    return;
  }
  const base = normalizeBaseUrl();
  const url = `${base}/runs`;
  console.info('[KW Compare] Loading previous runs:', url);
  refreshRuns.disabled = true;
  connectionState.innerHTML = '<span class="status-dot"></span>Loading';
  try {
    const response = await fetch(url, { headers: getAuthHeaders() });
    console.info('[KW Compare] Previous runs response:', response.status, response.statusText);
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    console.info('[KW Compare] Previous runs payload:', data);
    if (!response.ok) throw new Error(getApiErrorMessage(response.status, data, 'Previous runs request failed'));
    state.rows = (data.runs || []).map((row) => ({
      fileName: `${row.fileAName} vs ${row.fileBName}`,
      runID: row.runID,
      status: row.status,
      totalDifferences: Number(row.totalDifferences || 0),
    }));
    console.info('[KW Compare] Previous runs for table:', state.rows);
    renderRows();
    showMessage(`${state.rows.length} previous ${state.rows.length === 1 ? 'run was' : 'runs were'} loaded.`, 'success');
    connectionState.innerHTML = '<span class="status-dot"></span>Connected';
  } catch (error) {
    showMessage(classifyFetchError(error));
    connectionState.innerHTML = '<span class="status-dot"></span>CORS/Network';
  } finally {
    refreshRuns.disabled = false;
    if (connectionState.textContent.includes('Loading')) {
      connectionState.innerHTML = '<span class="status-dot"></span>Ready';
    }
  }
}

function renderRows() {
  resultCount.textContent = `${state.rows.length} ${state.rows.length === 1 ? 'run' : 'runs'}`;
  if (!state.rows.length) {
    resultsBody.innerHTML = '<tr class="empty-row"><td colspan="5"><span class="empty-icon">&#8722;</span><strong>No comparisons yet</strong><span>Run a comparison to see its matched files here.</span></td></tr>';
    return;
  }
  resultsBody.innerHTML = state.rows.map((row) => `
    <tr class="run-row ${state.expandedRuns.has(String(row.runID)) ? 'is-expanded' : ''}">
      <td>${escapeHtml(row.fileName)}</td>
      <td>${escapeHtml(String(row.runID))}</td>
      <td><span class="status">${escapeHtml(row.status || 'Completed')}</span></td>
      <td><span class="difference-status ${row.totalDifferences > 0 ? 'has-differences' : ''}">${escapeHtml(formatDifferenceStatus(row))}</span></td>
      <td class="align-right"><button class="open-run" data-run-id="${escapeHtml(String(row.runID))}">${state.expandedRuns.has(String(row.runID)) ? 'Hide' : 'View'} &#8594;</button></td>
    </tr>${state.expandedRuns.has(String(row.runID)) ? renderRunDetails(row.runID) : ''}`).join('');
}

function formatDifferenceStatus(row) {
  if (String(row.status).toUpperCase() === 'FAILED') return 'Unavailable';
  if (row.totalDifferences === undefined || row.totalDifferences === null) return 'Loading';
  return row.totalDifferences > 0 ? `${row.totalDifferences} found` : 'None found';
}

async function loadRunSummary(runID) {
  const base = normalizeBaseUrl();
  const response = await fetch(`${base}/runs/${encodeURIComponent(runID)}`, { headers: getAuthHeaders() });
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) throw new Error(getApiErrorMessage(response.status, data, 'Run summary request failed'));
  return data;
}

function renderRunDetails(runID) {
  const details = state.details[String(runID)];
  if (!details) {
    return '<tr class="detail-row"><td colspan="5"><div class="detail-loading">Loading differences...</div></td></tr>';
  }
  if (!details.length) {
    return '<tr class="detail-row"><td colspan="5"><div class="detail-empty">No differences found.</div></td></tr>';
  }
  return `<tr class="detail-row"><td colspan="5"><div class="difference-list">${details.map((difference) => {
    const lineKey = `${runID}:${difference.id}`;
    const fields = difference.fields || [];
    const lineExpanded = state.expandedLines.has(lineKey);
    const fieldMarkup = lineExpanded ? (fields.length
      ? `<div class="field-differences"><div class="field-header"><span>Field</span><span>File A</span><span>File B</span></div>${fields.map((field) => `<div class="field-difference"><strong>${escapeHtml(field.fieldName || '')}</strong><span class="${field.differenceType === 'MISSING_IN_A' ? 'missing-value' : ''}">${escapeHtml(formatFieldValue(field.fileAValue, field.differenceType === 'MISSING_IN_A'))}</span><span class="${field.differenceType === 'MISSING_IN_B' ? 'missing-value' : ''}">${escapeHtml(formatFieldValue(field.fileBValue, field.differenceType === 'MISSING_IN_B'))}</span></div>`).join('')}</div>`
      : '<div class="detail-empty">No field-level records were captured for this line. Re-run the comparison after compiling the field-capture changes.</div>') : '';
    return `<article class="difference-item"><button class="line-toggle ${lineExpanded ? 'is-expanded' : ''}" data-line-key="${escapeHtml(lineKey)}"><span>Line ${escapeHtml(String(difference.fileALineNumber || difference.fileBLineNumber || ''))}</span><span>${fields.length} field${fields.length === 1 ? '' : 's'} different</span><span>${lineExpanded ? 'Hide' : 'Show'} &#8594;</span></button>${fieldMarkup}</article>`;
  }).join('')}</div></td></tr>`;
}

function formatFieldValue(value, missing) {
  if (missing || value === null || value === undefined) return '<missing>';
  return String(value);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-button').forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const directoryMode = mode === 'directories';
  sourceALabel.textContent = directoryMode ? 'Source directory A' : 'Source file A';
  sourceBLabel.textContent = directoryMode ? 'Source directory B' : 'Source file B';
  sourceA.value = directoryMode ? '/itf-share/itf-tmp/KWCompare/Edifecs/A' : '/itf-share/itf-tmp/KWCompare/Edifecs/A/file.txt';
  sourceB.value = directoryMode ? '/itf-share/itf-tmp/KWCompare/Edifecs/B' : '/itf-share/itf-tmp/KWCompare/Edifecs/B/file.txt';
}

document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
refreshRuns.addEventListener('click', loadPreviousRuns);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;
  if (!hasCredentials()) {
    showMessage('Enter username and password before running a comparison.');
    connectionState.innerHTML = '<span class="status-dot"></span>Credentials required';
    return;
  }
  setBusy(true);
  const base = normalizeBaseUrl();
  const payload = {
    configID: Number($('#configId').value || 0),
    comparisonMode: $('#comparisonMode').value,
  };
  payload[state.mode === 'directories' ? 'directoryA' : 'fileAPath'] = sourceA.value.trim();
  payload[state.mode === 'directories' ? 'directoryB' : 'fileBPath'] = sourceB.value.trim();

  try {
    const response = await fetch(`${base}/${state.mode}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) throw new Error(getApiErrorMessage(response.status, data, 'Comparison request failed'));
    if (state.mode === 'directories') {
      state.rows = (data.results || []).map((row) => ({ fileName: row.fileName, runID: row.runID, totalDifferences: undefined }));
    } else {
      state.rows = [{ fileName: sourceA.value.split(/[\\/]/).pop(), runID: data.runID, totalDifferences: undefined }];
    }
    const summaries = await Promise.all(state.rows.map((row) => loadRunSummary(row.runID)));
    state.rows = state.rows.map((row, index) => ({
      ...row,
      status: summaries[index].status,
      totalDifferences: Number(summaries[index].totalDifferences || 0),
    }));
    renderRows();
    showMessage(`Comparison complete. ${state.rows.length} ${state.rows.length === 1 ? 'run was' : 'runs were'} recorded.`, 'success');
    connectionState.innerHTML = '<span class="status-dot"></span>Connected';
  } catch (error) {
    showMessage(classifyFetchError(error));
    connectionState.innerHTML = '<span class="status-dot"></span>CORS/Network';
  } finally {
    setBusy(false);
  }
});

resultsBody.addEventListener('click', async (event) => {
  const lineToggle = event.target.closest('.line-toggle');
  if (lineToggle) {
    const lineKey = lineToggle.dataset.lineKey;
    if (state.expandedLines.has(lineKey)) state.expandedLines.delete(lineKey);
    else state.expandedLines.add(lineKey);
    renderRows();
    return;
  }
  const button = event.target.closest('.open-run');
  if (!button) return;
  const runID = String(button.dataset.runId);
  if (state.expandedRuns.has(runID)) {
    state.expandedRuns.delete(runID);
    [...state.expandedLines].filter((key) => key.startsWith(`${runID}:`)).forEach((key) => state.expandedLines.delete(key));
    renderRows();
    return;
  }
  state.expandedRuns.add(runID);
  renderRows();
  if (!hasCredentials()) {
    state.expandedRuns.delete(runID);
    renderRows();
    showMessage('Enter username and password before loading differences.');
    connectionState.innerHTML = '<span class="status-dot"></span>Credentials required';
    return;
  }
  try {
    const base = normalizeBaseUrl();
    const response = await fetch(`${base}/runs/${encodeURIComponent(runID)}/differences`, { headers: getAuthHeaders() });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) throw new Error(getApiErrorMessage(response.status, data, 'Differences request failed'));
    state.details[runID] = data.differences || [];
    renderRows();
  } catch (error) {
    state.expandedRuns.delete(runID);
    renderRows();
    showMessage(classifyFetchError(error));
  }
});

renderRows();
connectionState.innerHTML = '<span class="status-dot"></span>Credentials required';
