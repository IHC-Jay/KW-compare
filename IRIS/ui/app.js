const state = { mode: 'directories', rows: [], expandedRuns: new Set(), details: {} };
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
  const credentials = `${username.value}:${password.value}`;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(credentials)}`,
  };
}

async function loadPreviousRuns() {
  const base = apiBase.value.trim().replace(/\/$/, '');
  const url = `${base}/runs`;
  console.info('[KW Compare] Loading previous runs:', url);
  refreshRuns.disabled = true;
  connectionState.innerHTML = '<span class="status-dot"></span>Loading';
  try {
    const response = await fetch(url, { headers: getAuthHeaders() });
    console.info('[KW Compare] Previous runs response:', response.status, response.statusText);
    if (response.status === 401) throw new Error('Authentication failed. Check the username and password.');
    const data = await response.json();
    console.info('[KW Compare] Previous runs payload:', data);
    if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
    state.rows = (data.runs || []).map((row) => ({
      fileName: `${row.fileAName} vs ${row.fileBName}`,
      runID: row.runID,
      status: row.status,
    }));
    console.info('[KW Compare] Previous runs for table:', state.rows);
    renderRows();
    showMessage(`${state.rows.length} previous ${state.rows.length === 1 ? 'run was' : 'runs were'} loaded.`, 'success');
  } catch (error) {
    showMessage(error.message || 'Previous runs could not be loaded.');
  } finally {
    refreshRuns.disabled = false;
    connectionState.innerHTML = '<span class="status-dot"></span>Ready';
  }
}

function renderRows() {
  resultCount.textContent = `${state.rows.length} ${state.rows.length === 1 ? 'run' : 'runs'}`;
  if (!state.rows.length) {
    resultsBody.innerHTML = '<tr class="empty-row"><td colspan="4"><span class="empty-icon">&#8722;</span><strong>No comparisons yet</strong><span>Run a comparison to see its matched files here.</span></td></tr>';
    return;
  }
  resultsBody.innerHTML = state.rows.map((row) => `
    <tr class="run-row ${state.expandedRuns.has(String(row.runID)) ? 'is-expanded' : ''}">
      <td>${escapeHtml(row.fileName)}</td>
      <td>${escapeHtml(String(row.runID))}</td>
      <td><span class="status">${escapeHtml(row.status || 'Completed')}</span></td>
      <td class="align-right"><button class="open-run" data-run-id="${escapeHtml(String(row.runID))}">${state.expandedRuns.has(String(row.runID)) ? 'Hide' : 'View'} &#8594;</button></td>
    </tr>${state.expandedRuns.has(String(row.runID)) ? renderRunDetails(row.runID) : ''}`).join('');
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
    const fieldMarkup = fields.length
      ? `<div class="field-differences">${fields.map((field) => `<div class="field-difference"><strong>${escapeHtml(field.fieldName || '')}</strong><span>${escapeHtml(String(field.fileAValue ?? '<missing>'))}</span><span>${escapeHtml(String(field.fileBValue ?? '<missing>'))}</span></div>`).join('')}</div>`
      : `<div class="line-values"><div><span>File A</span><code>${escapeHtml(difference.fileAValue || '')}</code></div><div><span>File B</span><code>${escapeHtml(difference.fileBValue || '')}</code></div></div>`;
    return `<article class="difference-item"><div class="difference-meta"><strong>Line ${escapeHtml(String(difference.fileALineNumber || difference.fileBLineNumber || ''))}</strong><span>${escapeHtml(difference.differenceType || 'CHANGED')}</span></div>${fieldMarkup}</article>`;
  }).join('')}</div></td></tr>`;
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
  setBusy(true);
  const base = apiBase.value.trim().replace(/\/$/, '');
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
    const data = await response.json();
    if (response.status === 401) throw new Error('Authentication failed. Check the username and password.');
    if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
    if (state.mode === 'directories') {
      state.rows = (data.results || []).map((row) => ({ fileName: row.fileName, runID: row.runID }));
    } else {
      state.rows = [{ fileName: sourceA.value.split(/[\\/]/).pop(), runID: data.runID }];
    }
    renderRows();
    showMessage(`Comparison complete. ${state.rows.length} ${state.rows.length === 1 ? 'run was' : 'runs were'} recorded.`, 'success');
  } catch (error) {
    showMessage(error.message || 'The comparison request could not be completed.');
  } finally {
    setBusy(false);
  }
});

resultsBody.addEventListener('click', async (event) => {
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
  try {
    const base = apiBase.value.trim().replace(/\/$/, '');
    const response = await fetch(`${base}/runs/${encodeURIComponent(runID)}/differences`, { headers: getAuthHeaders() });
    if (response.status === 401) throw new Error('Authentication failed. Check the username and password.');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
    state.details[runID] = data.differences || [];
    renderRows();
  } catch (error) {
    state.expandedRuns.delete(runID);
    renderRows();
    showMessage(error.message || 'Differences could not be loaded.');
  }
});

renderRows();
