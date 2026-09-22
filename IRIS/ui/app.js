const state = { mode: 'directories', rows: [], expandedRuns: new Set(), details: {}, showDifferencesOnly: false };
const $ = (selector) => document.querySelector(selector);

const form = $('#compareForm');
const sourceA = $('#sourceA');
const sourceB = $('#sourceB');
const sourceALabel = $('#sourceALabel');
const sourceBLabel = $('#sourceBLabel');
const apiBase = $('#apiBase');
const apiBaseProcess = $('#apiBaseProcess');
const username = $('#username');
const password = $('#password');
const message = $('#message');
const resultsBody = $('#resultsBody');
const resultCount = $('#resultCount');
const connectionState = $('#connectionState');
const refreshRuns = $('#refreshRuns');
const differencesOnly = $('#differencesOnly');
const processForm = $('#processForm');
const processSourceDirectory = $('#processSourceDirectory');
const processIrisInboundDirectory = $('#processIrisInboundDirectory');
const processEdifecsInboundDirectory = $('#processEdifecsInboundDirectory');
const processFilePattern = $('#processFilePattern');
const processResultsWrap = $('#processResultsWrap');
const processResultCount = $('#processResultCount');
const processResultPattern = $('#processResultPattern');
const processResultsBody = $('#processResultsBody');
const resultsSection = $('#resultsSection');
const toolHelp = $('#toolHelp');
const recordModal = $('#recordModal');
const recordModalBody = $('#recordModalBody');
const recordModalClose = $('#recordModalClose');

function normalizeBaseUrl() {
  return apiBase.value.trim().replace(/\/$/, '');
}

function syncApiBases(sourceValue) {
  apiBase.value = sourceValue;
  if (apiBaseProcess) apiBaseProcess.value = sourceValue;
}

function setConnectionState(statusText) {
  const base = normalizeBaseUrl() || '/api';
  connectionState.innerHTML = `<span class="status-dot"></span>${escapeHtml(statusText)} <span class="connection-meta">(${escapeHtml(base)})</span>`;
}

function hasCredentials() {
  return username.value.trim() !== '' && password.value !== '';
}

function updateActionAvailability() {
  const enabled = hasCredentials();
  const compareButton = form.querySelector('button[type="submit"]');
  const processButton = processForm.querySelector('button[type="submit"]');

  compareButton.disabled = !enabled;
  processButton.disabled = !enabled;
  refreshRuns.disabled = !enabled;

  const hint = enabled ? '' : 'Enter username and password first';
  compareButton.title = hint;
  processButton.title = hint;
  refreshRuns.title = hint;
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
    setConnectionState('Credentials required');
    return;
  }
  const base = normalizeBaseUrl();
  const url = `${base}/runs`;
  setConnectionState('Checking');
  try {
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (response.ok) {
      setConnectionState('Connected');
      return;
    }
    if (response.status === 401) {
      setConnectionState('Auth required');
      return;
    }
    if (response.status === 404) {
      setConnectionState('Bad API URL');
      return;
    }
    setConnectionState(`Error ${response.status}`);
  } catch (error) {
    setConnectionState('CORS/Network');
  }
}

function showMessage(text, type = 'error') {
  message.textContent = text;
  message.hidden = false;
  message.className = `message ${type === 'success' ? 'success' : ''}`;
}

function setBusy(busy) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = busy || !hasCredentials();
  button.querySelector('span:first-child').textContent = busy ? 'Comparing...' : 'Run comparison';
  setConnectionState(busy ? 'Working' : 'Ready');
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
    setConnectionState('Credentials required');
    return;
  }
  const base = normalizeBaseUrl();
  const url = `${base}/runs`;
  console.info('[KW Compare] Loading previous runs:', url);
  refreshRuns.disabled = true;
  setConnectionState('Loading');
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
      fileName: `IRIS: ${row.fileAName} vs Edifecs: ${row.fileBName}`,
      runID: row.runID,
      ranAt: row.completedAt || row.startedAt || '',
      totalDifferences: Number(row.totalDifferences || 0),
    }));
    console.info('[KW Compare] Previous runs for table:', state.rows);
    renderRows();
    showMessage(`${state.rows.length} previous ${state.rows.length === 1 ? 'run was' : 'runs were'} loaded.`, 'success');
    setConnectionState('Connected');
  } catch (error) {
    showMessage(classifyFetchError(error));
    setConnectionState('CORS/Network');
  } finally {
    refreshRuns.disabled = !hasCredentials();
    if (connectionState.textContent.includes('Loading')) {
      setConnectionState('Ready');
    }
  }
}

function renderRows() {
  const visibleRows = state.showDifferencesOnly
    ? state.rows.filter((row) => Number(row.totalDifferences || 0) > 0)
    : state.rows;

  resultCount.textContent = state.showDifferencesOnly
    ? `${visibleRows.length} of ${state.rows.length} runs`
    : `${state.rows.length} ${state.rows.length === 1 ? 'run' : 'runs'}`;

  if (!visibleRows.length) {
    const emptyMessage = state.rows.length && state.showDifferencesOnly
      ? 'No runs with differences match this filter.'
      : 'Run a comparison to see its matched files here.';
    resultsBody.innerHTML = '<tr class="empty-row"><td colspan="4"><span class="empty-icon">&#8722;</span><strong>No comparisons yet</strong><span>Run a comparison to see its matched files here.</span></td></tr>';
    if (state.rows.length && state.showDifferencesOnly) {
      resultsBody.innerHTML = `<tr class="empty-row"><td colspan="4"><span class="empty-icon">&#8722;</span><strong>No runs with differences</strong><span>${escapeHtml(emptyMessage)}</span></td></tr>`;
    }
    return;
  }
  resultsBody.innerHTML = visibleRows.map((row) => `
    <tr class="run-row ${state.expandedRuns.has(String(row.runID)) ? 'is-expanded' : ''}">
      <td>${escapeHtml(row.fileName)}</td>
      <td>${escapeHtml(formatRunDateTime(row.ranAt))}</td>
      <td><span class="difference-status ${row.totalDifferences > 0 ? 'has-differences' : ''}">${escapeHtml(formatDifferenceStatus(row))}</span></td>
      <td class="align-right">${row.totalDifferences > 0 ? `<button class="open-run" data-run-id="${escapeHtml(String(row.runID))}">${state.expandedRuns.has(String(row.runID)) ? 'Hide' : 'View'} &#8594;</button>` : ''}</td>
    </tr>${state.expandedRuns.has(String(row.runID)) ? renderRunDetails(row.runID) : ''}`).join('');
}

function formatRunDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
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
    return '<tr class="detail-row"><td colspan="4"><div class="detail-loading">Loading differences...</div></td></tr>';
  }
  if (!details.length) {
    return '<tr class="detail-row"><td colspan="4"><div class="detail-empty">No differences found.</div></td></tr>';
  }
  return `<tr class="detail-row"><td colspan="4"><div class="difference-list">${details.map((difference) => {
    const fields = difference.fields || [];
    const previewText = buildDifferencePreview(difference);
    const fieldMarkup = fields.length
      ? `<div class="field-differences"><div class="field-header"><span>Field</span><span>IRIS</span><span>Edifecs</span></div>${fields.map((field) => `<div class="field-difference"><strong>${escapeHtml(field.fieldName || '')}</strong><span class="${field.differenceType === 'MISSING_IN_A' ? 'missing-value' : ''}">${escapeHtml(formatFieldValue(field.fileAValue, field.differenceType === 'MISSING_IN_A'))}</span><span class="${field.differenceType === 'MISSING_IN_B' ? 'missing-value' : ''}">${escapeHtml(formatFieldValue(field.fileBValue, field.differenceType === 'MISSING_IN_B'))}</span></div>`).join('')}</div>`
      : `<div class="line-values"><div><span>IRIS</span><code>${escapeHtml(formatFieldValue(difference.fileAValue, difference.differenceType === 'MISSING_IN_A'))}</code></div><div><span>Edifecs</span><code>${escapeHtml(formatFieldValue(difference.fileBValue, difference.differenceType === 'MISSING_IN_B'))}</code></div></div>`;
    return `<article class="difference-item"><div class="difference-meta"><button class="line-record-link" data-run-id="${escapeHtml(String(runID))}" data-difference-id="${escapeHtml(String(difference.id))}">Line # ${escapeHtml(String(difference.fileALineNumber || difference.fileBLineNumber || ''))}</button><span class="line-snippet">${escapeHtml(getRecordSnippet(difference))}</span></div>${previewText ? `<div class="difference-preview">${escapeHtml(previewText)}</div>` : ''}${fieldMarkup}</article>`;
  }).join('')}</div></td></tr>`;
}

function getRecordSnippet(difference) {
  const record = difference.fileAValue ?? difference.fileBValue ?? '';
  const normalized = String(record).replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length > 80 ? `${normalized.slice(0, 80)}...` : normalized;
}

function buildDifferencePreview(difference) {
  const lineNumber = String(difference.fileALineNumber || difference.fileBLineNumber || '').trim();
  const normalizedType = String(difference.recordType || '').trim().toUpperCase();
  const normalizedField = String(difference.fieldName || '').trim().toUpperCase();
  const normalizedDetails = String(difference.details || '').trim().toLowerCase();
  const genericLineDetail = normalizedDetails === 'line values differ';
  const normalizedRecordKey = String(difference.recordKey || '').trim();

  const pieces = [];
  if (difference.recordType && normalizedType !== 'LINE') pieces.push(String(difference.recordType).trim());
  if (difference.fieldName && normalizedField !== normalizedType) pieces.push(String(difference.fieldName).trim());
  if (difference.recordKey && normalizedRecordKey !== lineNumber) pieces.push(String(difference.recordKey).trim());
  if (difference.details && !genericLineDetail) pieces.push(String(difference.details).trim());

  if (!pieces.length) return '';
  const preview = pieces.join(' • ');
  return preview.length > 140 ? `${preview.slice(0, 137)}...` : preview;
}

function formatFieldValue(value, missing) {
  if (missing || value === null || value === undefined) return '<missing>';
  return String(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function buildHighlightedRecord(recordValue, fields, valueKey) {
  const raw = String(recordValue ?? '');
  if (!raw) return '';

  let html = escapeHtml(raw);
  const values = [...new Set((fields || [])
    .map((field) => field?.[valueKey])
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== '' && String(value) !== '<missing>')
    .map((value) => String(value)))].sort((left, right) => right.length - left.length);

  values.forEach((value) => {
    const escapedValue = escapeHtml(value);
    if (!escapedValue) return;
    html = html.split(escapedValue).join(`<span class="diff-mark">${escapedValue}</span>`);
  });

  return html;
}

function openRecordModal(runID, differenceID) {
  const runDetails = state.details[String(runID)] || [];
  const difference = runDetails.find((item) => String(item.id) === String(differenceID));
  if (!difference) return;

  const fields = difference.fields || [];
  const lineNumber = difference.fileALineNumber || difference.fileBLineNumber || '';
  const fileARecord = String(difference.fileAValue ?? '');
  const fileBRecord = String(difference.fileBValue ?? '');

  const fieldsRows = fields.length
    ? fields.map((field) => `<tr><td>${escapeHtml(field.fieldName || '')}</td><td class="field-diff-emphasis">${escapeHtml(formatFieldValue(field.fileAValue, field.differenceType === 'MISSING_IN_A'))}</td><td class="field-diff-emphasis">${escapeHtml(formatFieldValue(field.fileBValue, field.differenceType === 'MISSING_IN_B'))}</td></tr>`).join('')
    : '<tr><td colspan="3">No field-level records were captured for this line.</td></tr>';

  recordModalBody.innerHTML = `
    <p class="field-diff-title">Line # ${escapeHtml(String(lineNumber))}</p>
    <div class="record-panels">
      <section class="record-panel">
        <h4>IRIS Full Record</h4>
        <pre>${buildHighlightedRecord(fileARecord, fields, 'fileAValue')}</pre>
      </section>
      <section class="record-panel">
        <h4>Edifecs Full Record</h4>
        <pre>${buildHighlightedRecord(fileBRecord, fields, 'fileBValue')}</pre>
      </section>
    </div>
    <p class="field-diff-title">Differing Fields (RED/BOLD)</p>
    <table class="field-diff-table">
      <thead><tr><th>Field</th><th>IRIS</th><th>Edifecs</th></tr></thead>
      <tbody>${fieldsRows}</tbody>
    </table>`;

  recordModal.hidden = false;
}

function closeRecordModal() {
  recordModal.hidden = true;
  recordModalBody.innerHTML = '';
}

function renderProcessResults(data) {
  const files = data?.files || [];
  processResultCount.textContent = `${files.length} file${files.length === 1 ? '' : 's'}`;
  processResultPattern.textContent = `Pattern: ${data?.filePattern || '*.x12'}`;

  if (!files.length) {
    processResultsBody.innerHTML = '<tr class="empty-row"><td colspan="4"><span class="empty-icon">&#8722;</span><strong>No files were routed</strong><span>The service ran successfully but no files matched the selected pattern.</span></td></tr>';
    return;
  }

  processResultsBody.innerHTML = files.map((file) => `
    <tr>
      <td>${escapeHtml(file.fileName || '')}</td>
      <td>${escapeHtml(file.sourcePath || '')}</td>
      <td>${escapeHtml(file.irisTarget || '')}</td>
      <td>${escapeHtml(file.edifecsTarget || '')}</td>
    </tr>`).join('');
}

function renderToolHelp(tool) {
  if (!toolHelp) return;

  if (tool === 'processX12') {
    toolHelp.innerHTML = '<strong>Process X12</strong><ul><li>Will copy the X12 files from the source X12 directory to IRIS and Edifecs inbound directories</li><li>Both engines will generate Keyword files</li></ul>';
    return;
  }

  if (tool === 'runCompare') {
    toolHelp.innerHTML = '<strong>Run comparison</strong><ul><li>Select the two output directories with Keyword files</li><li>Will run comparison and store the results in tables</li></ul>';
    return;
  }

  toolHelp.innerHTML = '<strong>Display results</strong><ul><li>Click Load previous runs</li><li>Results Summary is displayed</li><li>Click View to view all differences</li><li>Click a line to show field-level differences</li></ul>';
}

function setCompareMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-button').forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });

  if (mode === 'directories') {
    sourceALabel.textContent = 'IRIS directory';
    sourceBLabel.textContent = 'Edifecs directory';
    sourceA.value = '/itf-share/itf-tmp/KWCompare/IRIS';
    sourceB.value = '/itf-share/itf-tmp/KWCompare/Edifecs';
  } else {
    sourceALabel.textContent = 'IRIS file';
    sourceBLabel.textContent = 'Edifecs file';
    sourceA.value = '/itf-share/itf-tmp/KWCompare/IRIS/file.txt';
    sourceB.value = '/itf-share/itf-tmp/KWCompare/Edifecs/file.txt';
  }
}

function setTool(tool) {
  document.querySelectorAll('.tool-tab').forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });

  const processMode = tool === 'processX12';
  const runCompareMode = tool === 'runCompare';
  const resultsMode = tool === 'results';

  form.classList.toggle('hidden-pane', !runCompareMode);
  processForm.classList.toggle('hidden-pane', !processMode);
  processResultsWrap.classList.toggle('hidden-pane', !processMode);
  resultsSection.classList.toggle('hidden-pane', !resultsMode);
  renderToolHelp(tool);
  updateActionAvailability();
}

document.querySelectorAll('.tool-tab').forEach((button) => button.addEventListener('click', () => setTool(button.dataset.tool)));
document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => setCompareMode(button.dataset.mode)));
refreshRuns.addEventListener('click', loadPreviousRuns);
differencesOnly.addEventListener('change', (event) => {
  state.showDifferencesOnly = event.target.checked;
  renderRows();
});
username.addEventListener('input', updateActionAvailability);
password.addEventListener('input', updateActionAvailability);
apiBase.addEventListener('input', () => syncApiBases(apiBase.value));
if (apiBaseProcess) {
  apiBaseProcess.addEventListener('input', () => syncApiBases(apiBaseProcess.value));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;
  if (!hasCredentials()) {
    showMessage('Enter username and password before running a comparison.');
    setConnectionState('Credentials required');
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
      ranAt: summaries[index].completedAt || summaries[index].startedAt || '',
      totalDifferences: Number(summaries[index].totalDifferences || 0),
    }));
    renderRows();
    showMessage(`Comparison complete. ${state.rows.length} ${state.rows.length === 1 ? 'run was' : 'runs were'} recorded.`, 'success');
    setConnectionState('Connected');
  } catch (error) {
    showMessage(classifyFetchError(error));
    setConnectionState('CORS/Network');
  } finally {
    setBusy(false);
  }
});

processForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;
  if (!hasCredentials()) {
    showMessage('Enter username and password before processing X12 files.');
    setConnectionState('Credentials required');
    return;
  }

  const button = processForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.querySelector('span:first-child').textContent = 'Processing...';
  setConnectionState('Working');

  try {
    const base = normalizeBaseUrl();
    const payload = {
      sourceDirectory: processSourceDirectory.value.trim(),
      irisInboundDirectory: processIrisInboundDirectory.value.trim(),
      edifecsInboundDirectory: processEdifecsInboundDirectory.value.trim(),
      filePattern: processFilePattern.value.trim() || '*.x12',
    };

    const response = await fetch(`${base}/processX12`, {
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
    if (!response.ok) throw new Error(getApiErrorMessage(response.status, data, 'Process X12 request failed'));

    renderProcessResults(data);
    showMessage(`Process complete. ${Number(data.count || 0)} file${Number(data.count || 0) === 1 ? '' : 's'} routed.`, 'success');
    setConnectionState('Connected');
  } catch (error) {
    showMessage(classifyFetchError(error));
    setConnectionState('CORS/Network');
  } finally {
    button.disabled = !hasCredentials();
    button.querySelector('span:first-child').textContent = 'Process X12 files';
  }
});

resultsBody.addEventListener('click', async (event) => {
  const lineLink = event.target.closest('.line-record-link');
  if (lineLink) {
    openRecordModal(lineLink.dataset.runId, lineLink.dataset.differenceId);
    return;
  }

  const button = event.target.closest('.open-run');
  if (!button) return;
  const runID = String(button.dataset.runId);
  if (state.expandedRuns.has(runID)) {
    state.expandedRuns.delete(runID);
    renderRows();
    return;
  }
  state.expandedRuns.add(runID);
  renderRows();
  if (!hasCredentials()) {
    state.expandedRuns.delete(runID);
    renderRows();
    showMessage('Enter username and password before loading differences.');
    setConnectionState('Credentials required');
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

recordModalClose.addEventListener('click', closeRecordModal);
recordModal.addEventListener('click', (event) => {
  if (event.target.dataset.closeModal === 'true') closeRecordModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !recordModal.hidden) closeRecordModal();
});

renderRows();
setCompareMode('directories');
setTool('runCompare');
setConnectionState('Credentials required');
updateActionAvailability();
window.addEventListener('pageshow', updateActionAvailability);
setTimeout(updateActionAvailability, 0);
setTimeout(updateActionAvailability, 300);
