const state = {
  mode: 'directories',
  rows: [],
  expandedRuns: new Set(),
  details: {},
  configs: [],
  showDifferencesOnly: false,
  environment: 'DEV',
  apiBases: {
    DEV: '/api-dev',
    QA: '/api-qa',
    UAT: '/api-uat',
  },
};
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
const compareConfigId = $('#compareConfigId');
const configSelect = $('#configSelect');
const environmentRadios = document.querySelectorAll('input[name="environment"]');
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
const configEditor = $('#configEditor');
const refreshCompareConfigs = $('#refreshCompareConfigs');
const deleteExistingResults = $('#deleteExistingResults');

function normalizeBaseUrl() {
  const selectedEnvironment = getSelectedEnvironment();
  const manualValue = apiBase.value.trim();
  if (manualValue !== '') {
    state.apiBases[selectedEnvironment] = manualValue;
  }
  return (state.apiBases[selectedEnvironment] || '').trim().replace(/\/$/, '');
}

function getSelectedEnvironment() {
  const selected = document.querySelector('input[name="environment"]:checked');
  return selected ? selected.value : 'DEV';
}

function applyEnvironmentBaseUrl(environment) {
  const base = state.apiBases[environment] || '';
  apiBase.value = base;
  if (apiBaseProcess) apiBaseProcess.value = base;
}

function setConnectionState(text) {
  if (!connectionState) return;
  connectionState.innerHTML = `<span class="status-dot"></span>${text}`;
}

function hasCredentials() {
  return username.value.trim() !== '' && password.value !== '';
}

function updateActionAvailability() {
  const enabled = hasCredentials();
  const compareButton = form.querySelector('button[type="submit"]');
  if (compareButton) compareButton.disabled = !enabled;
  if (refreshRuns) refreshRuns.disabled = !enabled;
  if (refreshCompareConfigs) refreshCompareConfigs.disabled = !enabled;
  if (processForm) {
    const processButton = processForm.querySelector('button[type="submit"]');
    if (processButton) processButton.disabled = !enabled;
  }
}

function classifyFetchError(error) {
  if (error && error.name === 'TypeError') {
    return 'Connection blocked or unavailable. This is usually CORS or network access to the API host.';
  }
  return error?.message || 'Request failed.';
}

function renderCompareConfigOptions() {
  if (!compareConfigId) return;
  const previous = compareConfigId.value || '0';
  const options = ['<option value="0">No config</option>'];
  state.configs
    .slice()
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
    .forEach((config) => {
      options.push(`<option value="${escapeHtml(String(config.id))}">${escapeHtml(config.name || '(Unnamed config)')}</option>`);
    });
  compareConfigId.innerHTML = options.join('');
  compareConfigId.value = previous;
  if (compareConfigId.value !== previous) compareConfigId.value = '0';
}

function renderConfigSelect() {
  if (!configSelect) return;
  const options = ['<option value="">Create new config</option>'];
  state.configs
    .slice()
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
    .forEach((config) => {
      options.push(`<option value="${escapeHtml(String(config.id))}">${escapeHtml(config.name || '(Unnamed config)')}</option>`);
    });
  configSelect.innerHTML = options.join('');
}

async function loadConfigsFromApi(showSuccessMessage = false) {
  if (!hasCredentials()) {
    showMessage('Enter username and password before loading configs.');
    setConnectionState('Credentials required');
    return;
  }
  const base = normalizeBaseUrl();
  try {
    if (refreshCompareConfigs) refreshCompareConfigs.disabled = true;
    const response = await fetch(`${base}/configs`, { headers: getAuthHeaders() });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) throw new Error(getApiErrorMessage(response.status, data, 'Config list request failed'));
    state.configs = (data.configs || []).map((config) => ({
      id: config.id,
      name: config.configName || config.name || '',
    }));
    renderCompareConfigOptions();
    renderConfigSelect();
    if (showSuccessMessage) showMessage(`${state.configs.length} config${state.configs.length === 1 ? '' : 's'} loaded.`, 'success');
  } catch (error) {
    showMessage(classifyFetchError(error));
  } finally {
    if (refreshCompareConfigs) refreshCompareConfigs.disabled = !hasCredentials();
  }
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
  button.disabled = busy;
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
      fileName: `${row.fileAName} vs ${row.fileBName}`,
      runID: row.runID,
      status: row.status,
      totalDifferences: Number(row.totalDifferences ?? 0),
    }));
    console.info('[KW Compare] Previous runs for table:', state.rows);
    renderRows();
    showMessage(`${state.rows.length} previous ${state.rows.length === 1 ? 'run was' : 'runs were'} loaded.`, 'success');
    setConnectionState('Connected');
  } catch (error) {
    showMessage(classifyFetchError(error));
    setConnectionState('CORS/Network');
  } finally {
    refreshRuns.disabled = false;
    if (connectionState && connectionState.textContent.includes('Loading')) {
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
    if (state.rows.length && state.showDifferencesOnly) {
      resultsBody.innerHTML = '<tr class="empty-row"><td colspan="4"><span class="empty-icon">&#8722;</span><strong>No runs with differences</strong><span>Turn off the filter to view all runs.</span></td></tr>';
      return;
    }
    resultsBody.innerHTML = '<tr class="empty-row"><td colspan="4"><span class="empty-icon">&#8722;</span><strong>No comparisons yet</strong><span>Run a comparison to see its matched files here.</span></td></tr>';
    return;
  }
  resultsBody.innerHTML = visibleRows.map((row) => `
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

function setTool(tool) {
  document.querySelectorAll('.tool-tab').forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });

  const processMode = tool === 'processX12';
  const runCompareMode = tool === 'runCompare';
  const configMode = tool === 'config';
  const resultsMode = tool === 'results';

  form.classList.toggle('hidden-pane', !runCompareMode);
  if (processForm) processForm.classList.toggle('hidden-pane', !processMode);
  if (configEditor) configEditor.classList.toggle('hidden-pane', !configMode);
  if (processResultsWrap) processResultsWrap.classList.toggle('hidden-pane', !processMode);
  if (resultsSection) resultsSection.classList.toggle('hidden-pane', !resultsMode);

  if (!toolHelp) return;
  if (tool === 'processX12') {
    toolHelp.innerHTML = '<strong>Process X12</strong><ul><li>Copy source files to IRIS and Edifecs inbound directories.</li><li>Use this before running compare when you need fresh keyword files.</li></ul>';
  } else if (tool === 'runCompare') {
    toolHelp.innerHTML = '<strong>Run Compare</strong><ul><li>Select source directories/files and run comparison.</li><li>Results are stored and shown in Comparison Results.</li></ul>';
  } else if (tool === 'config') {
    toolHelp.innerHTML = '<strong>Add/Edit Config</strong><ul><li>Manage suppression config entries.</li><li>Use this to ignore selected fields during results display.</li></ul>';
  } else {
    toolHelp.innerHTML = '<strong>Comparison Results</strong><ul><li>Click Display Results to load runs.</li><li>Open a run to view differences.</li></ul>';
  }

  if ((tool === 'config' || tool === 'results') && !state.configs.length) {
    loadConfigsFromApi(false);
  }
}

function renderProcessResults(data) {
  if (!processResultCount || !processResultPattern || !processResultsBody) return;
  const files = data?.files || [];
  processResultCount.textContent = `${files.length} file${files.length === 1 ? '' : 's'}`;
  processResultPattern.textContent = `Pattern: ${data?.filePattern || '*.x12'}`;
  if (!files.length) {
    processResultsBody.innerHTML = '<tr class="empty-row"><td colspan="4"><span class="empty-icon">&#8722;</span><strong>No files were routed</strong><span>The service ran successfully but no files matched the selected pattern.</span></td></tr>';
    return;
  }
  processResultsBody.innerHTML = files.map((file) => `
    <tr>
      <td>${escapeHtml(String(file.fileName || ''))}</td>
      <td>${escapeHtml(String(file.sourcePath || ''))}</td>
      <td>${escapeHtml(String(file.irisTarget || ''))}</td>
      <td>${escapeHtml(String(file.edifecsTarget || ''))}</td>
    </tr>`).join('');
}

document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
document.querySelectorAll('.tool-tab').forEach((button) => button.addEventListener('click', () => setTool(button.dataset.tool)));
refreshRuns.addEventListener('click', loadPreviousRuns);
if (refreshCompareConfigs) refreshCompareConfigs.addEventListener('click', () => loadConfigsFromApi(true));
environmentRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    const previousEnvironment = state.environment;
    if (apiBase.value.trim() !== '') {
      state.apiBases[previousEnvironment] = apiBase.value.trim();
    }
    state.environment = getSelectedEnvironment();
    applyEnvironmentBaseUrl(state.environment);
  });
});
apiBase.addEventListener('input', () => {
  state.apiBases[getSelectedEnvironment()] = apiBase.value.trim();
  if (apiBaseProcess) apiBaseProcess.value = apiBase.value;
});
if (apiBaseProcess) {
  apiBaseProcess.addEventListener('input', () => {
    const manual = apiBaseProcess.value.trim();
    state.apiBases[getSelectedEnvironment()] = manual;
    apiBase.value = manual;
  });
}
username.addEventListener('input', updateActionAvailability);
password.addEventListener('input', updateActionAvailability);
if (differencesOnly) {
  differencesOnly.addEventListener('change', (event) => {
    state.showDifferencesOnly = event.target.checked;
    renderRows();
  });
}

state.environment = getSelectedEnvironment();
if (apiBase.value.trim() !== '') {
  state.apiBases.DEV = apiBase.value.trim();
}
applyEnvironmentBaseUrl(state.environment);

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
    configID: 0,
    comparisonMode: 'LINE',
    deleteExistingResults: deleteExistingResults?.checked ? 1 : 0,
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
      state.rows = (data.results || []).map((row) => ({
        fileName: row.fileName,
        runID: row.runID,
        totalDifferences: Number(row.totalDifferences ?? 0),
      }));
    } else {
      state.rows = [{ fileName: sourceA.value.split(/[\\/]/).pop(), runID: data.runID, totalDifferences: Number(data.totalDifferences ?? 0) }];
    }
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

if (processForm) {
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
}

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
  if (!hasCredentials()) {
    state.expandedRuns.delete(runID);
    renderRows();
    showMessage('Enter username and password before loading differences.');
    setConnectionState('Credentials required');
    return;
  }
  try {
    const base = normalizeBaseUrl();
    const selectedConfigId = Number(compareConfigId?.value || 0);
    const differencesPath = selectedConfigId > 0
      ? `${base}/runs/${encodeURIComponent(runID)}/differences?configID=${encodeURIComponent(String(selectedConfigId))}`
      : `${base}/runs/${encodeURIComponent(runID)}/differences`;
    const response = await fetch(differencesPath, { headers: getAuthHeaders() });
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
setTool('runCompare');
updateActionAvailability();
setConnectionState('Credentials required');
