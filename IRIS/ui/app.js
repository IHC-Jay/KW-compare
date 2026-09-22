const state = {
  mode: 'directories',
  rows: [],
  expandedRuns: new Set(),
  details: {},
  showDifferencesOnly: false,
  configs: [],
  currentConfigId: null,
  currentConfigRules: [],
};
const $ = (selector) => document.querySelector(selector);

const CONFIG_FIELD_CATALOG = {
  A: ['pA100', 'pA110', 'pA120'],
  C: ['pC010', 'pC015', 'pC050', 'pC060', 'pC080', 'pC110', 'pC112', 'pC120', 'pC121', 'pC122', 'pC125', 'pC210', 'pC230', 'pC231', 'pC232', 'pC240', 'pC250', 'pC251', 'pC252', 'pC310', 'pC311', 'pC320', 'pC321', 'pC350', 'pC516', 'pC900'],
  CDSD: ['pCDSD_IN_LOC_ZIP', 'pCDSD_MED_AMB_ZIP', 'pCDSD_NDC_CODE', 'pCDSD_NDC_MCTR_TYPE', 'pCDSD_NDC_UNITS'],
  CLMF: ['pCLMF_ICD_QUAL_IND', 'pCLMF_PRPR_FA_NPI'],
  CLRN: ['pCLRN_IDENTIFIER', 'pCLRN_MCTR_VALUE'],
  D: ['pD240', 'pD310', 'pD320', 'pD340', 'pD410', 'pD420', 'pD430'],
  E: ['pE100', 'pE101', 'pE102', 'pE110', 'pE111', 'pE120', 'pE121', 'pE130', 'pE131', 'pE140', 'pE141', 'pE150', 'pE151', 'pE152', 'pE160', 'pE161', 'pE162', 'pE170', 'pE171', 'pE172', 'pE180', 'pE181', 'pE182', 'pE190', 'pE191', 'pE192', 'pE200', 'pE201', 'pE202', 'pE210', 'pE211', 'pE212', 'pE214', 'pE220', 'pE221', 'pE222', 'pE224', 'pE230', 'pE231', 'pE232', 'pE234', 'pE260', 'pE261', 'pE262', 'pE270', 'pE271', 'pE272', 'pE280', 'pE281', 'pE282', 'pE290', 'pE291', 'pE292', 'pE300', 'pE301', 'pE302', 'pE310', 'pE311', 'pE312', 'pE320', 'pE321', 'pE322', 'pE330', 'pE331', 'pE332', 'pE340', 'pE341', 'pE342', 'pE350', 'pE351', 'pE352', 'pE360', 'pE361', 'pE362', 'pE370', 'pE371', 'pE372', 'pE380', 'pE381', 'pE382', 'pE390', 'pE391', 'pE392', 'pE400', 'pE401', 'pE402', 'pE410', 'pE411', 'pE412', 'pE420', 'pE421', 'pE422', 'pE430', 'pE431', 'pE432', 'pE440', 'pE441', 'pE442', 'pE450', 'pE451', 'pE452', 'pE460', 'pE461', 'pE462', 'pE470', 'pE471', 'pE472', 'pE480', 'pE481', 'pE482', 'pE490', 'pE491', 'pE492', 'pE500', 'pE501', 'pE502', 'pE510', 'pE511', 'pE512', 'pE520', 'pE521', 'pE522', 'pE530', 'pE531', 'pE532', 'pE540', 'pE541', 'pE542', 'pE550', 'pE551', 'pE552'],
  H: ['pH110', 'pH120', 'pH130', 'pH210', 'pH220', 'pH230', 'pH235', 'pH240', 'pH250', 'pH310', 'pH420', 'pH430', 'pH510', 'pH511', 'pH512', 'pH520', 'pH521', 'pH522', 'pH530', 'pH531', 'pH532', 'pH540', 'pH541', 'pH542', 'pH550', 'pH551', 'pH552', 'pH560', 'pH561', 'pH562', 'pH570', 'pH571', 'pH572', 'pH580', 'pH581', 'pH582', 'pH590', 'pH591', 'pH592', 'pH600', 'pH601', 'pH602', 'pH603', 'pH604', 'pH605', 'pH606', 'pH607', 'pH608', 'pH610', 'pH620', 'pH630', 'pH640', 'pH650', 'pH660', 'pH670', 'pH680', 'pH690', 'pH710', 'pH711', 'pH712', 'pH730', 'pH740'],
  N: ['pN120', 'pN130'],
  O: ['pCDML_SEQ_NO', 'pO110', 'pO115', 'pO130', 'pO500', 'pO501'],
  P: ['pP010', 'pP110', 'pP120', 'pP150', 'pP160', 'pP210', 'pP220', 'pP230', 'pP240', 'pP310', 'pP320', 'pP330', 'pP340', 'pP350', 'pP360'],
  S: ['pS020', 'pS110', 'pS111', 'pS112', 'pS120', 'pS121', 'pS122', 'pS125', 'pS126', 'pS127', 'pS211', 'pS212', 'pS213', 'pS221', 'pS222', 'pS223', 'pS232', 'pS310', 'pS311', 'pS315', 'pS316', 'pS317', 'pS330'],
  U: ['pU120', 'pU130', 'pU140', 'pU150'],
  V: ['pV130', 'pV140', 'pV160'],
  X: ['pX010', 'pX020', 'pX121', 'pX131', 'pX133', 'pX134', 'pX135', 'pX136', 'pX141', 'pX145', 'pX147', 'pX150', 'pX151', 'pX152', 'pX156', 'pX157', 'pX158', 'pX182', 'pX184', 'pX210', 'pX810', 'pX811', 'pX812', 'pX814', 'pX820', 'pX821', 'pX822', 'pX824', 'pX840', 'pX841', 'pX842', 'pX844'],
  Y: ['pY010', 'pY121', 'pY131', 'pY135', 'pY136', 'pY137', 'pY138', 'pY141', 'pY146', 'pY150', 'pY151', 'pY152', 'pY182', 'pY184'],
};

const form = $('#compareForm');
const sourceA = $('#sourceA');
const sourceB = $('#sourceB');
const sourceALabel = $('#sourceALabel');
const sourceBLabel = $('#sourceBLabel');
const compareConfigId = $('#compareConfigId');
const refreshCompareConfigs = $('#refreshCompareConfigs');
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
const configEditor = $('#configEditor');
const configSelect = $('#configSelect');
const newConfigButton = $('#newConfigButton');
const configName = $('#configName');
const configDescription = $('#configDescription');
const configRecordType = $('#configRecordType');
const configFieldName = $('#configFieldName');
const addConfigRuleButton = $('#addConfigRule');
const saveConfigButton = $('#saveConfigButton');
const configRulesBody = $('#configRulesBody');
const configMessage = $('#configMessage');

function normalizeBaseUrl() {
  return apiBase.value.trim().replace(/\/$/, '');
}

function syncApiBases(sourceValue) {
  apiBase.value = sourceValue;
  if (apiBaseProcess) apiBaseProcess.value = sourceValue;
}

function setConnectionState(statusText) {
  if (!connectionState) return;
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
  if (refreshCompareConfigs) refreshCompareConfigs.disabled = !enabled;

  const hint = enabled ? '' : 'Enter username and password first';
  compareButton.title = hint;
  processButton.title = hint;
  refreshRuns.title = hint;
  if (refreshCompareConfigs) refreshCompareConfigs.title = hint;

  if (configSelect) {
    configSelect.disabled = !enabled;
    configSelect.title = hint;
  }
  if (newConfigButton) {
    newConfigButton.disabled = !enabled;
    newConfigButton.title = hint;
  }
  if (configName) {
    configName.disabled = !enabled;
    configName.title = hint;
  }
  if (configDescription) {
    configDescription.disabled = !enabled;
    configDescription.title = hint;
  }
  if (configRecordType) {
    configRecordType.disabled = !enabled;
    configRecordType.title = hint;
  }
  if (configFieldName) {
    configFieldName.disabled = !enabled;
    configFieldName.title = hint;
  }
  if (addConfigRuleButton) {
    addConfigRuleButton.disabled = !enabled;
    addConfigRuleButton.title = hint;
  }
  if (saveConfigButton) {
    saveConfigButton.disabled = !enabled;
    saveConfigButton.title = hint;
  }
  renderConfigRulesTable();
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

function showConfigMessage(text, type = 'error') {
  if (!configMessage) return;
  configMessage.textContent = text;
  configMessage.hidden = false;
  configMessage.className = `message ${type === 'success' ? 'success' : ''}`;
}

function hideConfigMessage() {
  if (configMessage) configMessage.hidden = true;
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
  const detailState = state.details[String(runID)];
  if (!detailState) {
    return '<tr class="detail-row"><td colspan="4"><div class="detail-loading">Loading differences...</div></td></tr>';
  }
  const details = Array.isArray(detailState) ? detailState : (detailState.differences || []);
  const totalDifferences = Number(Array.isArray(detailState) ? details.length : (detailState.totalDifferences ?? details.length));
  const visibleDifferences = Number(Array.isArray(detailState) ? details.length : (detailState.visibleDifferences ?? details.length));
  const ignoredByConfig = Number(Array.isArray(detailState) ? 0 : (detailState.ignoredByConfig ?? Math.max(totalDifferences - visibleDifferences, 0)));
  const clarification = ignoredByConfig > 0
    ? `<div class="detail-loading">${escapeHtml(String(totalDifferences))} total • ${escapeHtml(String(ignoredByConfig))} ignored by config • ${escapeHtml(String(visibleDifferences))} shown</div>`
    : '';
  if (!details.length) {
    const emptyMessage = ignoredByConfig > 0 ? 'All differences for this run are ignored by the selected config.' : 'No differences found.';
    return `<tr class="detail-row"><td colspan="4">${clarification}<div class="detail-empty">${escapeHtml(emptyMessage)}</div></td></tr>`;
  }
  return `<tr class="detail-row"><td colspan="4">${clarification}<div class="difference-list">${details.map((difference) => {
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
  const detailState = state.details[String(runID)] || [];
  const runDetails = Array.isArray(detailState) ? detailState : (detailState.differences || []);
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
    toolHelp.innerHTML = '<strong>Process X12</strong><ul><li>REST service will copy the X12 files from the source X12 directory to IRIS and Edifecs inbound directories</li><li>Both engines will process X12 and generate Keyword files</li></ul>';
    return;
  }

  if (tool === 'runCompare') {
    toolHelp.innerHTML = '<strong>Run comparison</strong><ul><li>Select the two output directories with Keyword files</li><li>REST service will run the comparison and store the results in the tables</li></ul>';
    return;
  }

  if (tool === 'config') {
    toolHelp.innerHTML = '<strong>Add/Edit Config</strong><ul><li>Select record type and field to suppress</li><li>Add selected entries and save config through REST service</li></ul>';
    return;
  }

  toolHelp.innerHTML = '<strong>Display results</strong><ul><li>Click Load previous runs</li><li>Results Summary is displayed</li><li>Click View to view the differences</li><li>Click any line to view the field-level differences</li></ul>';
}

async function loadConfigsFromApi(showErrors = true) {
  if (!hasCredentials()) {
    if (showErrors) showConfigMessage('Enter username and password before loading configs.');
    return false;
  }

  try {
    const base = normalizeBaseUrl();
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
      description: config.description || '',
      active: config.active,
      rules: [],
    }));
    renderCompareConfigOptions();
    renderConfigSelect();
    return true;
  } catch (error) {
    if (showErrors) showConfigMessage(classifyFetchError(error));
    return false;
  }
}

function renderCompareConfigOptions() {
  if (!compareConfigId) return;
  const currentValue = compareConfigId.value || '0';
  const options = ['<option value="0">No config</option>'];

  state.configs
    .slice()
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
    .forEach((config) => {
      options.push(`<option value="${escapeHtml(String(config.id))}">${escapeHtml(config.name || '(Unnamed config)')}</option>`);
    });

  compareConfigId.innerHTML = options.join('');
  compareConfigId.value = currentValue;
  if (compareConfigId.value !== currentValue) {
    compareConfigId.value = '0';
  }
}

function renderRecordTypeOptions() {
  if (!configRecordType) return;
  const recordTypes = Object.keys(CONFIG_FIELD_CATALOG).sort();
  configRecordType.innerHTML = recordTypes.map((recordType) => `<option value="${escapeHtml(recordType)}">${escapeHtml(recordType)}</option>`).join('');
  renderFieldOptions();
}

function renderFieldOptions() {
  if (!configRecordType || !configFieldName) return;
  const recordType = configRecordType.value;
  const fields = CONFIG_FIELD_CATALOG[recordType] || [];
  if (!fields.length) {
    configFieldName.innerHTML = '<option value="">No fields available</option>';
    return;
  }
  configFieldName.innerHTML = fields.map((field) => `<option value="${escapeHtml(field)}">${escapeHtml(field)}</option>`).join('');
}

function renderConfigRulesTable() {
  if (!configRulesBody) return;
  const canEdit = hasCredentials();
  const removeButtonAttributes = canEdit ? '' : ' disabled title="Enter username and password first"';
  if (!state.currentConfigRules.length) {
    configRulesBody.innerHTML = '<tr class="empty-row"><td colspan="3"><span class="empty-icon">&#8722;</span><strong>No fields selected yet</strong><span>Select a record type and field, then click Add field to config.</span></td></tr>';
    return;
  }
  configRulesBody.innerHTML = state.currentConfigRules.map((rule, index) => `<tr><td>${escapeHtml(rule.recordType)}</td><td>${escapeHtml(rule.fieldName)}</td><td class="align-right"><button class="remove-rule" type="button" data-rule-index="${index}"${removeButtonAttributes}>Remove</button></td></tr>`).join('');
}

function renderConfigSelect() {
  if (!configSelect) return;
  const current = state.currentConfigId ? String(state.currentConfigId) : '';
  const options = ['<option value="">Create new config</option>'];
  state.configs
    .slice()
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
    .forEach((config) => {
      options.push(`<option value="${escapeHtml(String(config.id))}">${escapeHtml(config.name || '(Unnamed config)')}</option>`);
    });
  configSelect.innerHTML = options.join('');
  configSelect.value = current;
}

function resetConfigEditor() {
  state.currentConfigId = null;
  state.currentConfigRules = [];
  if (configName) configName.value = '';
  if (configDescription) configDescription.value = '';
  renderConfigSelect();
  renderConfigRulesTable();
  hideConfigMessage();
}

async function loadConfigToEditor(configID) {
  if (!hasCredentials()) {
    showConfigMessage('Enter username and password before loading config details.');
    return;
  }

  try {
    const base = normalizeBaseUrl();
    const response = await fetch(`${base}/configs/${encodeURIComponent(configID)}`, { headers: getAuthHeaders() });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) throw new Error(getApiErrorMessage(response.status, data, 'Config detail request failed'));

    state.currentConfigId = data.id;
    if (configName) configName.value = data.configName || '';
    if (configDescription) configDescription.value = data.description || '';
    state.currentConfigRules = (data.fields || []).map((field) => ({
      recordType: String(field.recordType || ''),
      fieldName: String(field.fieldName || ''),
    }));
    state.currentConfigRules.sort((left, right) => `${left.recordType}.${left.fieldName}`.localeCompare(`${right.recordType}.${right.fieldName}`));
    renderConfigSelect();
    renderConfigRulesTable();
    hideConfigMessage();
  } catch (error) {
    showConfigMessage(classifyFetchError(error));
  }
}

function addConfigRule() {
  if (!configRecordType || !configFieldName) return;
  const recordType = configRecordType.value;
  const fieldName = configFieldName.value;
  if (!recordType || !fieldName) {
    showConfigMessage('Select record type and field first.');
    return;
  }
  const duplicate = state.currentConfigRules.some((rule) => rule.recordType === recordType && rule.fieldName === fieldName);
  if (duplicate) {
    showConfigMessage('This field is already selected for the config.');
    return;
  }
  state.currentConfigRules.push({ recordType, fieldName });
  state.currentConfigRules.sort((left, right) => `${left.recordType}.${left.fieldName}`.localeCompare(`${right.recordType}.${right.fieldName}`));
  renderConfigRulesTable();
  showConfigMessage('Field added.', 'success');
}

async function saveConfigRemote() {
  if (!configName) return;
  const name = configName.value.trim();
  if (!name) {
    showConfigMessage('Config name is required.');
    return;
  }
  if (!state.currentConfigRules.length) {
    showConfigMessage('Add at least one field before saving.');
    return;
  }

  if (!hasCredentials()) {
    showConfigMessage('Enter username and password before saving config.');
    return;
  }

  const payload = {
    configName: name,
    description: configDescription ? configDescription.value.trim() : '',
    active: 1,
    fields: state.currentConfigRules.map((rule) => ({
      recordType: rule.recordType,
      fieldName: rule.fieldName,
      ignoreField: 1,
    })),
  };

  try {
    const base = normalizeBaseUrl();
    const isUpdate = !!state.currentConfigId;
    const endpoint = isUpdate
      ? `${base}/configs/${encodeURIComponent(state.currentConfigId)}`
      : `${base}/configs`;
    const response = await fetch(endpoint, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) throw new Error(getApiErrorMessage(response.status, data, 'Save config request failed'));

    state.currentConfigId = data.id || state.currentConfigId;
    await loadConfigsFromApi(false);
    if (state.currentConfigId) {
      await loadConfigToEditor(state.currentConfigId);
    }
    showConfigMessage('Config saved successfully.', 'success');
  } catch (error) {
    showConfigMessage(classifyFetchError(error));
  }
}

function initializeConfigEditor() {
  if (!configEditor) return;
  renderRecordTypeOptions();
  renderCompareConfigOptions();
  renderConfigSelect();
  renderConfigRulesTable();

  if (configRecordType) {
    configRecordType.addEventListener('change', () => {
      renderFieldOptions();
      hideConfigMessage();
    });
  }
  if (configSelect) {
    configSelect.addEventListener('change', async (event) => {
      if (!event.target.value) {
        resetConfigEditor();
        return;
      }
      await loadConfigToEditor(event.target.value);
    });
  }
  if (newConfigButton) newConfigButton.addEventListener('click', resetConfigEditor);
  if (addConfigRuleButton) addConfigRuleButton.addEventListener('click', addConfigRule);
  if (saveConfigButton) saveConfigButton.addEventListener('click', saveConfigRemote);
  if (refreshCompareConfigs) {
    refreshCompareConfigs.addEventListener('click', async () => {
      await loadConfigsFromApi(true);
      showMessage('Config list reloaded.', 'success');
    });
  }
  if (configRulesBody) {
    configRulesBody.addEventListener('click', (event) => {
      const removeButton = event.target.closest('.remove-rule');
      if (!removeButton) return;
      const index = Number(removeButton.dataset.ruleIndex);
      if (Number.isNaN(index)) return;
      state.currentConfigRules = state.currentConfigRules.filter((_, itemIndex) => itemIndex !== index);
      renderConfigRulesTable();
      showConfigMessage('Field removed.', 'success');
    });
  }
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
    sourceA.value = '/itf-share/itf-tmp/KW-testing/IRIS/KW/';
    sourceB.value = '/itf-share/itf-tmp/KW-testing/Edifecs/KW/';
  } else {
    sourceALabel.textContent = 'IRIS file';
    sourceBLabel.textContent = 'Edifecs file';
    sourceA.value = '/itf-share/itf-tmp/KW-testing/IRIS/KW/file.txt';
    sourceB.value = '/itf-share/itf-tmp/KW-testing/Edifecs/KW/file.txt';
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
  const configMode = tool === 'config';
  const resultsMode = tool === 'results';

  form.classList.toggle('hidden-pane', !runCompareMode);
  processForm.classList.toggle('hidden-pane', !processMode);
  if (configEditor) configEditor.classList.toggle('hidden-pane', !configMode);
  processResultsWrap.classList.toggle('hidden-pane', !processMode);
  resultsSection.classList.toggle('hidden-pane', !resultsMode);
  renderToolHelp(tool);
  if ((configMode || resultsMode) && !state.configs.length) {
    loadConfigsFromApi(false);
  }
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
    configID: 0,
    comparisonMode: 'LINE',
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
  console.info('[KW Compare] View clicked', { runID });
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
    console.info('[KW Compare] Loading differences', { runID, selectedConfigId, url: differencesPath });
    const response = await fetch(differencesPath, { headers: getAuthHeaders() });
    console.info('[KW Compare] Differences response', { runID, status: response.status, statusText: response.statusText });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    console.info('[KW Compare] Differences payload', {
      runID,
      selectedConfigId,
      count: data?.count,
      totalDifferences: data?.totalDifferences,
      visibleDifferences: data?.visibleDifferences,
      ignoredByConfig: data?.ignoredByConfig,
      differencesLength: Array.isArray(data?.differences) ? data.differences.length : 0,
    });
    if (!response.ok) throw new Error(getApiErrorMessage(response.status, data, 'Differences request failed'));
    state.details[runID] = {
      differences: data.differences || [],
      totalDifferences: Number(data.totalDifferences ?? data.count ?? 0),
      visibleDifferences: Number(data.visibleDifferences ?? data.count ?? 0),
      ignoredByConfig: Number(data.ignoredByConfig ?? 0),
    };
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
initializeConfigEditor();
setCompareMode('directories');
setTool('runCompare');
setConnectionState('Credentials required');
updateActionAvailability();
window.addEventListener('pageshow', updateActionAvailability);
setTimeout(updateActionAvailability, 0);
setTimeout(updateActionAvailability, 300);
