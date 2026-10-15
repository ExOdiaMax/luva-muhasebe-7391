const categories = {
  gelir: ['Oda Geliri', 'Kahvaltı', 'Restoran', 'Bar', 'Spa', 'Toplantı', 'Diğer'],
  gider: ['Personel', 'Temizlik', 'Elektrik', 'Su', 'Kira', 'Bakım', 'Pazarlama', 'İnternet', 'Diğer'],
};

const legacyDemoRecords = [
  { date: '2026-10-03', type: 'gelir', category: 'Oda Geliri', amount: 28000, description: 'Standart ve deluxe oda gelirleri' },
  { date: '2026-10-05', type: 'gider', category: 'Personel', amount: 12000, description: 'Aylık personel maaşı' },
  { date: '2026-10-07', type: 'gelir', category: 'Kahvaltı', amount: 4200, description: 'Kahvaltı hizmeti' },
  { date: '2026-10-09', type: 'gider', category: 'Elektrik', amount: 2300, description: 'Elektrik faturası' },
  { date: '2026-09-22', type: 'gelir', category: 'Restoran', amount: 7600, description: 'Akşam yemeği satışları' },
  { date: '2026-09-28', type: 'gider', category: 'Temizlik', amount: 3100, description: 'Temizlik malzemesi ve ekip' },
  { date: '2026-08-17', type: 'gelir', category: 'Spa', amount: 5400, description: 'Spa ve bakım hizmetleri' },
  { date: '2026-08-20', type: 'gider', category: 'Kira', amount: 9000, description: 'Dükkan ve ofis kirası' },
];

const LEGACY_DEMO_CLEANUP_ID = 'remove-legacy-demo-records-v1';

const state = {
  db: null,
  SQL: null,
  records: [],
  categoryOptions: { gelir: categories.gelir, gider: categories.gider },
  extraPeople: [],
  extraExpenses: [],
  deferredPayments: [],
  taxPayments: [],
};

let currentExtraSign = '-';
let taxReminderSoundTimer = null;
let taxAudioContext = null;
const pdfFontBase64Promises = { normal: null, bold: null };
const TAX_SOUND_STORAGE_KEY = 'l-uva-tax-reminder-sound';

const form = document.getElementById('recordForm');
const dateInput = document.getElementById('dateInput');
const typeInput = document.getElementById('typeInput');
const categoryInput = document.getElementById('categoryInput');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const removeCategoryBtn = document.getElementById('removeCategoryBtn');
const amountInput = document.getElementById('amountInput');
const descriptionInput = document.getElementById('descriptionInput');
const nameCompanyInput = document.getElementById('nameCompanyInput');
const tableBody = document.getElementById('recordTableBody');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const netBalanceEl = document.getElementById('netBalance');
const transactionCountEl = document.getElementById('transactionCount');
const incomeCountEl = document.getElementById('incomeCount');
const expenseCountEl = document.getElementById('expenseCount');
const lastEntryEl = document.getElementById('lastEntry');
const monthSnapshotEl = document.getElementById('monthSnapshot');
const monthLabelEl = document.getElementById('monthLabel');
const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');
const filterStartDate = document.getElementById('filterStartDate');
const filterEndDate = document.getElementById('filterEndDate');
const searchInput = document.getElementById('searchInput');
const resetBtn = document.getElementById('resetBtn');
const csvExportBtn = document.getElementById('csvExportBtn');
const excelExportBtn = document.getElementById('excelExportBtn');
const pdfExportBtn = document.getElementById('pdfExportBtn');
const dbExportBtn = document.getElementById('dbExportBtn');
const dbImportBtn = document.getElementById('dbImportBtn');
const dbImportInput = document.getElementById('dbImportInput');
const monthlyChart = document.getElementById('monthlyChart');
const navItems = document.querySelectorAll('.nav-item[data-view]');
const statsSection = document.getElementById('statsSection');
const overviewSection = document.getElementById('overviewSection');
const extraSection = document.getElementById('extraSection');
const deferredSection = document.getElementById('deferredSection');
const taxSection = document.getElementById('taxSection');
const tableSection = document.querySelector('.table-panel');
const deferredPaymentForm = document.getElementById('deferredPaymentForm');
const deferredNameInput = document.getElementById('deferredNameInput');
const companySuggestions = document.getElementById('companySuggestions');
const deferredAmountInput = document.getElementById('deferredAmountInput');
const deferredDateInput = document.getElementById('deferredDateInput');
const deferredPaymentMethodInput = document.getElementById('deferredPaymentMethodInput');
const deferredDescriptionInput = document.getElementById('deferredDescriptionInput');
const deferredTableBody = document.getElementById('deferredTableBody');
const dueSummarySection = document.getElementById('dueSummarySection');
const dashboardDueAmountEl = document.getElementById('dashboardDueAmount');
const dashboardDueCountEl = document.getElementById('dashboardDueCount');
const dashboardDueSoonCountEl = document.getElementById('dashboardDueSoonCount');
const dashboardDueList = document.getElementById('dashboardDueList');
const openDeferredFromDashboardBtn = document.getElementById('openDeferredFromDashboard');
const dueWarningModal = document.getElementById('dueWarningModal');
const dueWarningList = document.getElementById('dueWarningList');
const closeDueWarningBtn = document.getElementById('closeDueWarningBtn');
const taxPaymentForm = document.getElementById('taxPaymentForm');
const taxTypeInput = document.getElementById('taxTypeInput');
const taxPeriodInput = document.getElementById('taxPeriodInput');
const taxAmountInput = document.getElementById('taxAmountInput');
const taxDueDateInput = document.getElementById('taxDueDateInput');
const taxDescriptionInput = document.getElementById('taxDescriptionInput');
const taxTableBody = document.getElementById('taxTableBody');
const taxWarningModal = document.getElementById('taxWarningModal');
const taxWarningList = document.getElementById('taxWarningList');
const taxSoundToggleBtn = document.getElementById('taxSoundToggleBtn');
const closeTaxWarningBtn = document.getElementById('closeTaxWarningBtn');
const extraNameInput = document.getElementById('extraNameInput');
const addPersonBtn = document.getElementById('addPersonBtn');
const extraPeopleList = document.getElementById('extraPeopleList');
const extraExpenseForm = document.getElementById('extraExpenseForm');
const extraPersonSelect = document.getElementById('extraPersonSelect');
const extraPaymentMethodInput = document.getElementById('extraPaymentMethodInput');
const extraAmountInput = document.getElementById('extraAmountInput');
const extraDateInput = document.getElementById('extraDateInput');
const extraDescriptionInput = document.getElementById('extraDescriptionInput');
const extraExpenseList = document.getElementById('extraExpenseList');
const extraSignButtons = document.querySelectorAll('.sign-btn');
const filterScope = document.getElementById('filterScope');
const settingsSection = document.getElementById('settingsSection');
const importSection = document.getElementById('importSection');
const monthlySection = document.getElementById('monthlySection');
const settingsForm = document.getElementById('settingsForm');
const settingsEmailInput = document.getElementById('settingsEmailInput');
const smtpHostInput = document.getElementById('smtpHostInput');
const smtpPortInput = document.getElementById('smtpPortInput');
const smtpUserInput = document.getElementById('smtpUserInput');
const smtpPassInput = document.getElementById('smtpPassInput');
const smtpSslInput = document.getElementById('smtpSslInput');
const settingsStatusEl = document.getElementById('settingsStatus');
const backupNowBtn = document.getElementById('backupNowBtn');
const shutdownBtn = document.getElementById('shutdownBtn');
const shareBackupBtn = document.getElementById('shareBackupBtn');
const settingsIntro = document.getElementById('settingsIntro');
const LAST_BACKUP_STORAGE_KEY = 'l-uva-last-local-backup';
const RESET_PIN = '0000';
const pinModal = document.getElementById('pinModal');
const pinMessageEl = document.getElementById('pinMessage');
const pinInput = document.getElementById('pinInput');
const pinErrorEl = document.getElementById('pinError');
const pinOkBtn = document.getElementById('pinOkBtn');
const pinCancelBtn = document.getElementById('pinCancelBtn');

// PIN penceresini açar; doğru PIN girilirse true, vazgeçilirse false döner.
function askPin(message) {
  return new Promise((resolve) => {
    pinMessageEl.textContent = message;
    pinInput.value = '';
    pinErrorEl.hidden = true;
    pinModal.hidden = false;
    pinInput.focus();

    const close = (result) => {
      pinModal.hidden = true;
      pinInput.value = '';
      pinOkBtn.onclick = null;
      pinCancelBtn.onclick = null;
      pinInput.onkeydown = null;
      resolve(result);
    };
    const submit = () => {
      if (pinInput.value === RESET_PIN) {
        close(true);
        return;
      }
      pinErrorEl.hidden = false;
      pinInput.value = '';
      pinInput.focus();
    };

    pinOkBtn.onclick = submit;
    pinCancelBtn.onclick = () => close(false);
    pinInput.onkeydown = (event) => {
      if (event.key === 'Enter') submit();
      if (event.key === 'Escape') close(false);
    };
  });
}

// true: PC'deki yerel sunucu (PowerShell) ile çalışıyor; false: tablet/PWA (sunucusuz).
let serverMode = false;

const AUTO_BACKUP_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;
const AUTO_BACKUP_CHECK_MS = 60 * 60 * 1000;
const busyPayments = new Set();
let autoBackupRunning = false;
let mailErrorShown = false;

// Veriler adrese bağlıdır: 127.0.0.1 ile açıldıysa verilerin görünmesi için localhost'a yönlendir.
if (location.hostname === '127.0.0.1') {
  location.replace(`http://localhost:${location.port}${location.pathname}${location.search}`);
}

window.addEventListener('unhandledrejection', (event) => {
  console.error(event.reason);
  window.alert(`İşlem tamamlanamadı veya kaydedilemedi: ${event.reason?.message || event.reason}\n\nLütfen sayfayı yenileyip kaydın durumunu kontrol edin.`);
});

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function sumAmounts(items) {
  return items.reduce((total, item) => total + Math.round(Number(item.amount) * 100), 0) / 100;
}

function formatDateTr(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('tr-TR');
}

function neutralizeFormula(value) {
  const text = String(value ?? '');
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function promptPaymentDate() {
  const today = getTodayISO();
  const answer = window.prompt('Ödeme tarihi (YYYY-AA-GG):', today);
  if (answer === null) return null;

  const value = answer.trim() || today;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    window.alert('Geçersiz tarih. Örnek: 2026-10-15');
    return null;
  }
  return value;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(value);
}

function getTodayISO() {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function getDaysUntil(date) {
  const [year, month, day] = date.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = getTodayISO().split('-').map(Number);
  const dueUtc = Date.UTC(year, month - 1, day);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
  return Math.round((dueUtc - todayUtc) / 86400000);
}

function getTypeOptions(type) {
  return state.categoryOptions[type] || categories[type] || categories.gelir;
}

function ensureCategoryOptionsTable(db) {
  const tableExists = Boolean(db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'category_options'")[0]?.values.length);

  db.run(`
    CREATE TABLE IF NOT EXISTS category_options (
      type TEXT NOT NULL CHECK(type IN ('gelir', 'gider')),
      name TEXT NOT NULL,
      PRIMARY KEY(type, name)
    );
  `);

  if (!tableExists) {
    Object.entries(categories).forEach(([type, names]) => {
      names.forEach((name) => {
        db.run('INSERT INTO category_options (type, name) VALUES (?, ?)', [type, name]);
      });
    });
  }
}

function cleanupLegacyDemoRecords(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = db.exec(`SELECT id FROM app_migrations WHERE id = '${LEGACY_DEMO_CLEANUP_ID}'`)[0]?.values.length;
  if (applied) return;

  legacyDemoRecords.forEach((record) => {
    db.run(
      `DELETE FROM transactions
       WHERE date = ? AND type = ? AND category = ? AND amount = ? AND description = ?
         AND COALESCE(name_company, '') = ''`,
      [record.date, record.type, record.category, record.amount, record.description]
    );
  });

  db.run('INSERT INTO app_migrations (id) VALUES (?)', [LEGACY_DEMO_CLEANUP_ID]);
}

function getCategoryOptionsFromDatabase(db = state.db) {
  if (!db) return { gelir: categories.gelir, gider: categories.gider };

  const options = { gelir: [], gider: [] };
  const result = db.exec('SELECT type, name FROM category_options ORDER BY rowid ASC');
  result[0]?.values.forEach(([type, name]) => {
    if (options[type]) options[type].push(name);
  });
  return options;
}

function getRecordsFromDatabase() {
  if (!state.db) return [];

  const result = state.db.exec(`
    SELECT id, date, type, category, amount, description, name_company
    FROM transactions
    ORDER BY date DESC, created_at DESC
  `);

  if (!result[0]) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    date: row[1],
    type: row[2],
    category: row[3],
    amount: Number(row[4]),
    description: row[5],
    name_company: row[6] || '',
  }));
}

function getDeferredPaymentsFromDatabase() {
  if (!state.db) return [];

  const result = state.db.exec(`
    SELECT id, name_company, amount, due_date, payment_method, description, status, transaction_id
    FROM deferred_payments
    ORDER BY due_date ASC, created_at ASC
  `);

  if (!result[0]) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    name_company: row[1],
    amount: Number(row[2]),
    due_date: row[3],
    payment_method: row[4],
    description: row[5] || '',
    status: row[6],
    transaction_id: row[7] || '',
  }));
}

function getTaxPaymentsFromDatabase() {
  if (!state.db) return [];

  const result = state.db.exec(`
    SELECT id, tax_type, period, amount, due_date, description, status, transaction_id
    FROM tax_payments
    ORDER BY due_date ASC, created_at ASC
  `);

  if (!result[0]) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    tax_type: row[1],
    period: row[2] || '',
    amount: Number(row[3]),
    due_date: row[4],
    description: row[5] || '',
    status: row[6],
    transaction_id: row[7] || '',
  }));
}

function getUpcomingTaxPayments() {
  return state.taxPayments
    .filter((payment) => payment.status === 'pending' && getDaysUntil(payment.due_date) <= 3)
    .sort((first, second) => first.due_date.localeCompare(second.due_date));
}

function renderTaxPayments() {
  state.taxPayments = getTaxPaymentsFromDatabase();

  if (!state.taxPayments.length) {
    taxTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Henüz vergi ödemesi eklenmedi.</td></tr>';
    renderTaxWarning();
    return;
  }

  taxTableBody.innerHTML = state.taxPayments.map((payment) => {
    const daysUntil = getDaysUntil(payment.due_date);
    const statusLabel = payment.status === 'paid'
      ? 'Ödendi'
      : daysUntil < 0
        ? `${Math.abs(daysUntil)} gün gecikti`
        : daysUntil === 0
          ? 'Bugün son gün'
          : `${daysUntil} gün kaldı`;

    return `
      <tr>
        <td>${escapeHtml(payment.tax_type)}</td>
        <td>${escapeHtml(payment.period || '—')}</td>
        <td>${escapeHtml(payment.description || '—')}</td>
        <td>${formatDateTr(payment.due_date)}</td>
        <td class="amount-col"><span class="amount expense">-${formatCurrency(payment.amount)}</span></td>
        <td><span class="status-badge ${payment.status === 'paid' ? '' : 'pending'}">${statusLabel}</span></td>
        <td class="due-actions">
          ${payment.status === 'pending'
    ? `<button class="paid-btn" data-tax-paid-id="${escapeHtml(payment.id)}" type="button">Ödendi</button>`
    : `<button class="delete-due-btn" data-tax-undo-id="${escapeHtml(payment.id)}" type="button">Geri Al</button>`}
          <button class="delete-due-btn" data-tax-id="${payment.id}" type="button">Sil</button>
        </td>
      </tr>
    `;
  }).join('');

  renderTaxWarning();
}

function renderTaxWarning() {
  const upcoming = getUpcomingTaxPayments();
  taxWarningList.innerHTML = upcoming.length
    ? upcoming.map((payment) => {
      const daysUntil = getDaysUntil(payment.due_date);
      const reminder = daysUntil < 0
        ? `${Math.abs(daysUntil)} gündür gecikmiş`
        : daysUntil === 0
          ? 'Son ödeme günü bugün'
          : `Son ödeme gününe ${daysUntil} gün kaldı`;
      const details = [payment.period, payment.description].filter(Boolean).map(escapeHtml).join(' · ');
      return `
        <div class="due-warning-item">
          <strong>${escapeHtml(payment.tax_type)}${details ? ` · ${details}` : ''}</strong>
          <span class="due-amount">${formatCurrency(payment.amount)}</span>
          <small>${reminder} · ${new Date(payment.due_date + 'T00:00:00').toLocaleDateString('tr-TR')}</small>
        </div>
      `;
    }).join('')
    : '<p class="empty-state">Yaklaşan vergi ödemesi yok.</p>';
}

function isTaxReminderSoundEnabled() {
  return localStorage.getItem(TAX_SOUND_STORAGE_KEY) === 'true';
}

function updateTaxSoundButton() {
  const enabled = isTaxReminderSoundEnabled();
  taxSoundToggleBtn.textContent = enabled ? 'Sesli Uyarıyı Kapat' : 'Sesli Uyarıyı Etkinleştir';
  taxSoundToggleBtn.setAttribute('aria-pressed', String(enabled));
}

function playTaxReminderTone() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;

  try {
    taxAudioContext ||= new AudioContextClass();
    if (taxAudioContext.state === 'suspended') taxAudioContext.resume().catch(() => {});

    const oscillator = taxAudioContext.createOscillator();
    const gain = taxAudioContext.createGain();
    const now = taxAudioContext.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(740, now);
    oscillator.frequency.setValueAtTime(988, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.21);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    oscillator.connect(gain);
    gain.connect(taxAudioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.5);
    return true;
  } catch (error) {
    console.warn('Vergi hatırlatma sesi başlatılamadı.', error);
    return false;
  }
}

function stopTaxReminderSound() {
  if (taxReminderSoundTimer !== null) {
    window.clearInterval(taxReminderSoundTimer);
    taxReminderSoundTimer = null;
  }
}

function startTaxReminderSound() {
  if (!isTaxReminderSoundEnabled() || taxReminderSoundTimer !== null) return;

  playTaxReminderTone();
  taxReminderSoundTimer = window.setInterval(() => {
    if (!taxWarningModal.hidden) playTaxReminderTone();
  }, 20000);
}

function showTaxReminderIfNeeded() {
  const hasUpcoming = getUpcomingTaxPayments().length > 0;
  renderTaxWarning();
  taxWarningModal.hidden = !hasUpcoming;
  updateTaxSoundButton();

  if (hasUpcoming) {
    startTaxReminderSound();
  } else {
    stopTaxReminderSound();
  }
}

async function handleTaxPaymentSubmit(event) {
  event.preventDefault();
  ensureDbReady();

  const amount = roundMoney(taxAmountInput.value);
  const dueDate = taxDueDateInput.value;
  if (!dueDate || !amount || amount <= 0) {
    window.alert('Lütfen son ödeme gününü ve geçerli bir tutar girin.');
    return;
  }

  state.db.run(
    'INSERT INTO tax_payments (id, tax_type, period, amount, due_date, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [crypto.randomUUID(), taxTypeInput.value, taxPeriodInput.value.trim(), amount, dueDate, taxDescriptionInput.value.trim(), 'pending']
  );

  await saveDbToIndexedDb();
  taxPaymentForm.reset();
  taxDueDateInput.value = getTodayISO();
  renderAll();
  showTaxReminderIfNeeded();
}

async function markTaxPaymentPaid(paymentId) {
  const payment = state.taxPayments.find((item) => item.id === paymentId && item.status === 'pending');
  if (!payment || busyPayments.has(paymentId)) return;

  ensureDbReady();
  busyPayments.add(paymentId);
  try {
    const paidDate = promptPaymentDate();
    if (!paidDate) return;

    // Durum güncellemesi ve işlem kaydı aynı eşzamanlı blokta yapılır; ikinci tıklama kayıt oluşturamaz.
    state.db.run("UPDATE tax_payments SET status = 'paid' WHERE id = ? AND status = 'pending'", [paymentId]);
    if (state.db.getRowsModified() === 0) return;

    const transactionId = crypto.randomUUID();
    const details = [payment.period, payment.description].filter(Boolean).join(' · ');
    state.db.run(
      'INSERT INTO transactions (id, date, type, category, amount, description, name_company) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [transactionId, paidDate, 'gider', 'Vergi Ödemesi', payment.amount, `${payment.tax_type}${details ? ` · ${details}` : ''} · Son ödeme: ${formatDateTr(payment.due_date)}`, 'Vergi Dairesi']
    );
    state.db.run('UPDATE tax_payments SET transaction_id = ? WHERE id = ?', [transactionId, paymentId]);
    await saveDbToIndexedDb();
    state.records = getRecordsFromDatabase();
    renderAll();
    showTaxReminderIfNeeded();
  } finally {
    busyPayments.delete(paymentId);
  }
}

async function undoTaxPayment(paymentId) {
  const payment = state.taxPayments.find((item) => item.id === paymentId && item.status === 'paid');
  if (!payment) return;

  const note = payment.transaction_id
    ? 'Ödeme geri alınsın mı? Bu ödemeden oluşan gider kaydı da silinecek.'
    : 'Ödeme geri alınsın mı? (Bu eski ödemeye bağlı bir gider kaydı bulunamadı; varsa işlem listesinden elle silmeniz gerekir.)';
  if (!window.confirm(note)) return;

  ensureDbReady();
  if (payment.transaction_id) state.db.run('DELETE FROM transactions WHERE id = ?', [payment.transaction_id]);
  state.db.run("UPDATE tax_payments SET status = 'pending', transaction_id = NULL WHERE id = ?", [paymentId]);
  await saveDbToIndexedDb();
  state.records = getRecordsFromDatabase();
  renderAll();
  showTaxReminderIfNeeded();
}

async function deleteTaxPayment(paymentId) {
  if (!window.confirm('Bu vergi kaydı silinsin mi?')) return;
  ensureDbReady();
  state.db.run('DELETE FROM tax_payments WHERE id = ?', [paymentId]);
  await saveDbToIndexedDb();
  renderAll();
  showTaxReminderIfNeeded();
}

function toggleTaxReminderSound() {
  const willEnable = !isTaxReminderSoundEnabled();
  localStorage.setItem(TAX_SOUND_STORAGE_KEY, String(willEnable));
  updateTaxSoundButton();

  if (willEnable) {
    startTaxReminderSound();
  } else {
    stopTaxReminderSound();
  }
}

function closeTaxReminder() {
  taxWarningModal.hidden = true;
  stopTaxReminderSound();
}

function renderCompanySuggestions() {
  if (!state.db) return;

  const result = state.db.exec(`
    SELECT name_company FROM transactions
    WHERE TRIM(COALESCE(name_company, '')) <> ''
    UNION ALL
    SELECT name_company FROM deferred_payments
    WHERE TRIM(COALESCE(name_company, '')) <> ''
    ORDER BY name_company COLLATE NOCASE
  `);
  const uniqueNames = new Map();

  result[0]?.values.forEach(([value]) => {
    const name = String(value).trim();
    const normalizedName = name.toLocaleLowerCase('tr-TR');
    if (name && !uniqueNames.has(normalizedName)) {
      uniqueNames.set(normalizedName, name);
    }
  });

  companySuggestions.replaceChildren();
  uniqueNames.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    companySuggestions.appendChild(option);
  });
}

function renderDuePayments() {
  state.deferredPayments = getDeferredPaymentsFromDatabase();

  if (!state.deferredPayments.length) {
    deferredTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Henüz vadeli ödeme yok.</td></tr>';
    renderDueWarning();
    return;
  }

  deferredTableBody.innerHTML = state.deferredPayments.map((payment) => {
    const daysUntil = getDaysUntil(payment.due_date);
    const statusLabel = payment.status === 'paid'
      ? 'Ödendi'
      : daysUntil < 0
        ? `${Math.abs(daysUntil)} gün gecikti`
        : daysUntil === 0
          ? 'Bugün vade'
          : `${daysUntil} gün kaldı`;

    return `
      <tr>
        <td>${escapeHtml(payment.name_company)}</td>
        <td>${formatDateTr(payment.due_date)}</td>
        <td>${escapeHtml(payment.description || 'Açıklama yok')}</td>
        <td>${escapeHtml(payment.payment_method)}</td>
        <td class="amount-col"><span class="amount expense">-${formatCurrency(payment.amount)}</span></td>
        <td><span class="status-badge ${payment.status === 'paid' ? '' : 'pending'}">${statusLabel}</span></td>
        <td class="due-actions">
          ${payment.status === 'pending'
    ? `<button class="paid-btn" data-paid-id="${escapeHtml(payment.id)}" type="button">Ödendi</button>`
    : `<button class="delete-due-btn" data-undo-id="${escapeHtml(payment.id)}" type="button">Geri Al</button>`}
          <button class="delete-due-btn" data-due-id="${escapeHtml(payment.id)}" type="button">Sil</button>
        </td>
      </tr>
    `;
  }).join('');

  renderDueWarning();
}

function getApproachingPayments() {
  return state.deferredPayments
    .filter((payment) => payment.status === 'pending' && getDaysUntil(payment.due_date) <= 3)
    .sort((first, second) => first.due_date.localeCompare(second.due_date));
}

function renderDashboardDueSummary() {
  const pending = state.deferredPayments
    .filter((payment) => payment.status === 'pending')
    .sort((first, second) => first.due_date.localeCompare(second.due_date));
  const total = pending.reduce((sum, payment) => sum + payment.amount, 0);
  const approaching = pending.filter((payment) => getDaysUntil(payment.due_date) <= 3);

  dashboardDueAmountEl.textContent = formatCurrency(total);
  dashboardDueCountEl.textContent = String(pending.length);
  dashboardDueSoonCountEl.textContent = String(approaching.length);
  dashboardDueList.innerHTML = pending.length
    ? pending.slice(0, 4).map((payment) => {
      const daysUntil = getDaysUntil(payment.due_date);
      const dueLabel = daysUntil < 0
        ? `${Math.abs(daysUntil)} gün gecikti`
        : daysUntil === 0
          ? 'Bugün vade'
          : `${daysUntil} gün kaldı`;
      return `
        <div class="dashboard-due-row">
          <span>${escapeHtml(payment.name_company)}</span>
          <small>${new Date(payment.due_date + 'T00:00:00').toLocaleDateString('tr-TR')} · ${dueLabel}</small>
          <strong>${formatCurrency(payment.amount)}</strong>
        </div>
      `;
    }).join('')
    : '<p class="empty-state">Bekleyen vadeli ödeme bulunmuyor.</p>';
}

function renderDueWarning() {
  const approaching = getApproachingPayments();
  dueWarningList.innerHTML = approaching.length
    ? approaching.map((payment) => {
      const daysUntil = getDaysUntil(payment.due_date);
      const reminder = daysUntil < 0
        ? `${Math.abs(daysUntil)} gündür gecikmiş`
        : daysUntil === 0
          ? 'Bugün vadesi doluyor'
          : `${daysUntil} gün sonra vadesi doluyor`;
      return `
        <div class="due-warning-item">
          <strong>${escapeHtml(payment.name_company)}</strong>
          <span class="due-amount">${formatCurrency(payment.amount)}</span>
          <small>${reminder} · ${new Date(payment.due_date + 'T00:00:00').toLocaleDateString('tr-TR')} · ${escapeHtml(payment.description || payment.payment_method)}</small>
        </div>
      `;
    }).join('')
    : '<p class="empty-state">Yaklaşan ödeme yok.</p>';
}

function showDueWarningIfNeeded() {
  renderDueWarning();
  dueWarningModal.hidden = getApproachingPayments().length === 0;
}

async function handleDeferredPaymentSubmit(event) {
  event.preventDefault();
  ensureDbReady();

  const nameCompany = deferredNameInput.value.trim();
  const amount = roundMoney(deferredAmountInput.value);
  const dueDate = deferredDateInput.value;
  if (!nameCompany || !dueDate || !amount || amount <= 0) {
    window.alert('Lütfen isim/firma, vade tarihi ve geçerli bir tutar girin.');
    return;
  }

  state.db.run(
    'INSERT INTO deferred_payments (id, name_company, amount, due_date, payment_method, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [crypto.randomUUID(), nameCompany, amount, dueDate, deferredPaymentMethodInput.value, deferredDescriptionInput.value.trim(), 'pending']
  );

  await saveDbToIndexedDb();
  deferredPaymentForm.reset();
  deferredDateInput.value = getTodayISO();
  renderAll();
  if (getApproachingPayments().length) showDueWarningIfNeeded();
}

async function markDeferredPaymentPaid(paymentId) {
  const payment = state.deferredPayments.find((item) => item.id === paymentId && item.status === 'pending');
  if (!payment || busyPayments.has(paymentId)) return;

  ensureDbReady();
  busyPayments.add(paymentId);
  try {
    const paidDate = promptPaymentDate();
    if (!paidDate) return;

    // Durum güncellemesi ve işlem kaydı aynı eşzamanlı blokta yapılır; ikinci tıklama kayıt oluşturamaz.
    state.db.run("UPDATE deferred_payments SET status = 'paid' WHERE id = ? AND status = 'pending'", [paymentId]);
    if (state.db.getRowsModified() === 0) return;

    const transactionId = crypto.randomUUID();
    const description = [payment.description || 'Vadeli ödeme', payment.payment_method, `Vade: ${formatDateTr(payment.due_date)}`].join(' · ');
    state.db.run(
      'INSERT INTO transactions (id, date, type, category, amount, description, name_company) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [transactionId, paidDate, 'gider', 'Vadeli Ödeme', payment.amount, description, payment.name_company]
    );
    state.db.run('UPDATE deferred_payments SET transaction_id = ? WHERE id = ?', [transactionId, paymentId]);
    await saveDbToIndexedDb();
    state.records = getRecordsFromDatabase();
    renderAll();
  } finally {
    busyPayments.delete(paymentId);
  }
}

async function undoDeferredPayment(paymentId) {
  const payment = state.deferredPayments.find((item) => item.id === paymentId && item.status === 'paid');
  if (!payment) return;

  const note = payment.transaction_id
    ? 'Ödeme geri alınsın mı? Bu ödemeden oluşan gider kaydı da silinecek.'
    : 'Ödeme geri alınsın mı? (Bu eski ödemeye bağlı bir gider kaydı bulunamadı; varsa işlem listesinden elle silmeniz gerekir.)';
  if (!window.confirm(note)) return;

  ensureDbReady();
  if (payment.transaction_id) state.db.run('DELETE FROM transactions WHERE id = ?', [payment.transaction_id]);
  state.db.run("UPDATE deferred_payments SET status = 'pending', transaction_id = NULL WHERE id = ?", [paymentId]);
  await saveDbToIndexedDb();
  state.records = getRecordsFromDatabase();
  renderAll();
  showDueWarningIfNeeded();
}

async function deleteDeferredPayment(paymentId) {
  if (!window.confirm('Bu vadeli ödeme kaydı silinsin mi?')) return;
  ensureDbReady();
  state.db.run('DELETE FROM deferred_payments WHERE id = ?', [paymentId]);
  await saveDbToIndexedDb();
  renderAll();
}

function getExtraPeopleFromDatabase() {
  if (!state.db) return [];

  const result = state.db.exec(`
    SELECT id, name
    FROM personal_people
    ORDER BY name ASC
  `);

  if (!result[0]) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    name: row[1],
  }));
}

function getExtraExpensesFromDatabase() {
  if (!state.db) return [];

  const result = state.db.exec(`
    SELECT e.id, e.person_id, e.date, e.amount, e.sign, e.payment_method, e.description, p.name AS person_name
    FROM personal_expenses e
    LEFT JOIN personal_people p ON p.id = e.person_id
    ORDER BY e.date DESC, e.created_at DESC
  `);

  if (!result[0]) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    person_id: row[1],
    date: row[2],
    amount: Number(row[3]),
    sign: row[4],
    payment_method: row[5],
    description: row[6],
    person_name: row[7] || 'Bilinmeyen',
  }));
}

function renderExtraPeople() {
  state.extraPeople = getExtraPeopleFromDatabase();

  if (!state.extraPeople.length) {
    extraPeopleList.innerHTML = '<span class="empty-state">Henüz kişi eklenmedi.</span>';
    extraPersonSelect.innerHTML = '<option value="">Kişi seçin</option>';
    return;
  }

  extraPeopleList.innerHTML = state.extraPeople
    .map((person) => `
      <span class="person-chip">
        ${escapeHtml(person.name)}
        <button class="delete-extra-btn" data-person-id="${escapeHtml(person.id)}" type="button" aria-label="${escapeHtml(person.name)} sil">×</button>
      </span>
    `)
    .join('');

  extraPersonSelect.innerHTML = state.extraPeople
    .map((person) => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.name)}</option>`)
    .join('');

  if (!extraPersonSelect.value) {
    extraPersonSelect.value = state.extraPeople[0].id;
  }
}

function renderExtraExpenses() {
  state.extraExpenses = getExtraExpensesFromDatabase();

  if (!state.extraExpenses.length) {
    extraExpenseList.innerHTML = '<span class="empty-state">Kayıt bulunamadı.</span>';
    return;
  }

  extraExpenseList.innerHTML = state.extraExpenses
    .map((entry) => `
      <div class="extra-item">
        <span class="sign ${entry.sign === '+' ? 'plus' : 'minus'}">${entry.sign === '+' ? '+' : '-'}</span>
        <strong>${escapeHtml(entry.person_name)}</strong>
        <span>${formatCurrency(Number(entry.amount))}</span>
        <span class="payment">${escapeHtml(entry.payment_method)}</span>
        <span>${formatDateTr(entry.date)}</span>
        <span>${escapeHtml(entry.description || 'Açıklama yok')}</span>
        <button class="delete-extra-btn" data-extra-id="${escapeHtml(entry.id)}" type="button" aria-label="Kaydı sil">×</button>
      </div>
    `)
    .join('');
}

function getAllRecords() {
  const personalRecords = state.extraExpenses.map((entry) => ({
    // Kişisel kayıtlar şirket kayıtlarından ayırt edilebilsin diye kaynak etiketi taşır.
    id: entry.id,
    date: entry.date,
    type: entry.sign === '+' ? 'gelir' : 'gider',
    category: 'Ekstra Kişisel Giderler',
    amount: entry.amount,
    description: `${entry.person_name} • ${entry.payment_method} • ${entry.description || 'Açıklama yok'}`,
    name_company: entry.person_name,
    source: 'personal',
  }));

  return [...state.records, ...personalRecords];
}

function showView(view) {
  navItems.forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  overviewSection.hidden = view !== 'overview';
  dueSummarySection.hidden = view !== 'overview';
  extraSection.hidden = view !== 'extra';
  deferredSection.hidden = view !== 'deferred';
  taxSection.hidden = view !== 'tax';
  settingsSection.hidden = view !== 'settings';
  importSection.hidden = view !== 'import';
  monthlySection.hidden = view !== 'monthly';
  tableSection.hidden = ['deferred', 'tax', 'settings', 'import', 'monthly'].includes(view);
  statsSection.hidden = ['extra', 'deferred', 'tax', 'settings', 'import', 'monthly'].includes(view);
  if (view === 'monthly') renderMonthlySummary();
  if (view === 'settings') loadSettingsView();

  filterType.value = view === 'income' ? 'gelir' : view === 'expense' ? 'gider' : 'all';
  renderCategoryOptions();
  if (view !== 'overview' && view !== 'extra' && view !== 'deferred') {
    renderSummary();
  }
  renderTable();
}

function setExtraSign(nextSign) {
  currentExtraSign = nextSign;
  extraSignButtons.forEach((button) => {
    const isActive = button.dataset.sign === nextSign;
    button.classList.toggle('active', isActive);
  });
}

function addPerson() {
  const name = extraNameInput.value.trim();

  if (!name) {
    window.alert('Lütfen bir isim girin.');
    return;
  }

  ensureDbReady();

  const existing = state.extraPeople.some((person) => person.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    window.alert('Bu isim zaten ekli.');
    return;
  }

  const personId = crypto.randomUUID();
  state.db.run('INSERT INTO personal_people (id, name) VALUES (?, ?)', [personId, name]);
  saveDbToIndexedDb().then(() => {
    extraNameInput.value = '';
    renderAll();
  }).catch((error) => {
    console.error(error);
    window.alert('Kişi eklenirken bir hata oluştu.');
  });
}

function deletePerson(personId) {
  const person = state.extraPeople.find((item) => item.id === personId);
  if (!person) return;

  const entryCount = state.extraExpenses.filter((entry) => entry.person_id === personId).length;
  const confirmed = window.confirm(
    `${person.name} isimli kişiyi silmek istediğinize emin misiniz?${entryCount ? `\n\nBu kişiye ait ${entryCount} kişisel gider/gelir kaydı da SİLİNECEK.` : ''}`
  );
  if (!confirmed) return;

  ensureDbReady();
  state.db.run('DELETE FROM personal_people WHERE id = ?', [personId]);
  state.db.run('DELETE FROM personal_expenses WHERE person_id = ?', [personId]);
  saveDbToIndexedDb().then(() => {
    renderAll();
  }).catch((error) => {
    console.error(error);
    window.alert('Kişi silinirken bir hata oluştu.');
  });
}

function deleteExtraExpense(expenseId) {
  if (!window.confirm('Bu kayıt silinsin mi?')) return;
  ensureDbReady();
  state.db.run('DELETE FROM personal_expenses WHERE id = ?', [expenseId]);
  saveDbToIndexedDb().then(() => {
    renderAll();
  }).catch((error) => {
    console.error(error);
    window.alert('Kayıt silinirken bir hata oluştu.');
  });
}

function handleExtraExpenseSubmit(event) {
  event.preventDefault();
  ensureDbReady();

  const amount = roundMoney(extraAmountInput.value);
  const personId = extraPersonSelect.value;
  const date = extraDateInput.value;

  if (!personId || !date || !amount || amount <= 0) {
    window.alert('Lütfen kişi, tarih ve geçerli tutar seçin.');
    return;
  }

  const person = state.extraPeople.find((item) => item.id === personId);
  if (!person) {
    window.alert('Seçili kişi bulunamadı.');
    return;
  }

  const newEntry = {
    id: crypto.randomUUID(),
    person_id: personId,
    date,
    amount,
    sign: currentExtraSign,
    payment_method: extraPaymentMethodInput.value,
    description: extraDescriptionInput.value.trim() || 'Açıklama yok',
  };

  state.db.run(
    'INSERT INTO personal_expenses (id, person_id, date, amount, sign, payment_method, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [newEntry.id, newEntry.person_id, newEntry.date, newEntry.amount, newEntry.sign, newEntry.payment_method, newEntry.description]
  );

  saveDbToIndexedDb().then(() => {
    extraExpenseForm.reset();
    extraDateInput.value = getTodayISO();
    extraPaymentMethodInput.value = 'Nakit';
    setExtraSign('-');
    renderAll();
  }).catch((error) => {
    console.error(error);
    window.alert('Ekstra gider kaydı eklenirken bir hata oluştu.');
  });
}

function ensureDbReady() {
  if (!state.db) {
    throw new Error('SQLite veritabanı henüz hazır değil.');
  }
}

const IDB_DB_NAME = 'otel_muhasebe_store';
const IDB_STORE_NAME = 'db';

let idbConnection = null;
let idbSaveQueue = Promise.resolve();

function openIndexedDb() {
  if (!idbConnection) {
    idbConnection = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('Tarayıcı veri depolamayı (IndexedDB) desteklemiyor.'));
        return;
      }

      const request = indexedDB.open(IDB_DB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onclose = () => { idbConnection = null; };
        db.onversionchange = () => {
          db.close();
          idbConnection = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        idbConnection = null;
        reject(request.error || new Error('Tarayıcı veritabanı açılamadı.'));
      };
    });
  }

  return idbConnection;
}

// Okuma hatası boş veritabanı gibi yorumlanmaz: hata fırlatılır ve mevcut veri ezilmez.
async function loadDbFromIndexedDb() {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const getRequest = db.transaction(IDB_STORE_NAME, 'readonly').objectStore(IDB_STORE_NAME).get('sqlite');
    getRequest.onsuccess = () => resolve(getRequest.result || null);
    getRequest.onerror = () => reject(getRequest.error || new Error('Kayıtlı veri okunamadı.'));
  });
}

function saveDbToIndexedDb() {
  const run = async () => {
    if (!state.db) return;

    const binary = state.db.export();
    const db = await openIndexedDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).put(binary, 'sqlite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Veri kaydedilemedi.'));
      tx.onabort = () => reject(tx.error || new Error('Veri kaydı iptal edildi (depolama alanı dolu olabilir).'));
    });
  };

  const next = idbSaveQueue.then(run, run);
  idbSaveQueue = next.catch(() => {});
  return next;
}

function addColumnIfMissing(db, table, column, definition) {
  const columns = db.exec(`PRAGMA table_info(${table})`)[0]?.values.map((item) => item[1]) || [];
  if (!columns.includes(column)) {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function ensureSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      name_company TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS personal_people (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS personal_expenses (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      sign TEXT NOT NULL CHECK(sign IN ('+', '-')),
      payment_method TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES personal_people(id)
    );

    CREATE TABLE IF NOT EXISTS deferred_payments (
      id TEXT PRIMARY KEY,
      name_company TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      transaction_id TEXT
    );

    CREATE TABLE IF NOT EXISTS tax_payments (
      id TEXT PRIMARY KEY,
      tax_type TEXT NOT NULL,
      period TEXT,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      transaction_id TEXT
    );
  `);

  ensureCategoryOptionsTable(db);
  addColumnIfMissing(db, 'transactions', 'name_company', 'TEXT');
  addColumnIfMissing(db, 'deferred_payments', 'transaction_id', 'TEXT');
  addColumnIfMissing(db, 'tax_payments', 'transaction_id', 'TEXT');
  cleanupLegacyDemoRecords(db);
}

async function bootstrapDatabase() {
  if (!window.initSqlJs) {
    throw new Error('SQLite kütüphanesi yüklenemedi. "vendor" klasörünün eksiksiz ve OneDrive\'da "bu cihazda tut" durumunda olduğunu kontrol edin.');
  }

  const SQL = await window.initSqlJs({ locateFile: (file) => `./vendor/${file}` });
  // Okuma/açma hatasında hata fırlatılır; kayıtlı veri asla boş veritabanıyla ezilmez.
  const savedBinary = await loadDbFromIndexedDb();
  const db = savedBinary ? new SQL.Database(new Uint8Array(savedBinary)) : new SQL.Database();

  ensureSchema(db);

  state.db = db;
  state.SQL = SQL;
  state.records = getRecordsFromDatabase();
  state.extraPeople = getExtraPeopleFromDatabase();
  state.extraExpenses = getExtraExpensesFromDatabase();
  state.deferredPayments = getDeferredPaymentsFromDatabase();
  state.taxPayments = getTaxPaymentsFromDatabase();
  await saveDbToIndexedDb();

  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
}

function renderCategoryOptions() {
  const selectedType = typeInput.value;
  categoryInput.innerHTML = '';

  getTypeOptions(selectedType).forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryInput.appendChild(option);
  });

  const currentCategory = categoryInput.dataset.selected || getTypeOptions(selectedType)[0];
  categoryInput.value = getTypeOptions(selectedType).includes(currentCategory) ? currentCategory : getTypeOptions(selectedType)[0];
  categoryInput.dataset.selected = categoryInput.value;

  const categoryOptions = ['all', ...new Set(getAllRecords().map((item) => item.category))];
  const currentFilter = filterCategory.value;
  filterCategory.innerHTML = '<option value="all">Kategori</option>';
  categoryOptions.forEach((category) => {
    if (category === 'all') return;
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    filterCategory.appendChild(option);
  });

  if (categoryOptions.includes(currentFilter)) {
    filterCategory.value = currentFilter;
  } else {
    filterCategory.value = 'all';
  }
}

function getFilteredRecords() {
  const selectedType = filterType.value;
  const selectedCategory = filterCategory.value;
  const startDate = filterStartDate.value;
  const endDate = filterEndDate.value;
  const searchValue = searchInput.value.trim().toLocaleLowerCase('tr-TR');
  const selectedScope = filterScope.value;

  return getAllRecords().filter((record) => {
    const scopeMatch = selectedScope === 'all'
      || (selectedScope === 'personal' ? record.source === 'personal' : record.source !== 'personal');
    const typeMatch = selectedType === 'all' || record.type === selectedType;
    const categoryMatch = selectedCategory === 'all' || record.category === selectedCategory;
    const startDateMatch = !startDate || record.date >= startDate;
    const endDateMatch = !endDate || record.date <= endDate;
    const text = `${record.name_company || ''} ${record.description} ${record.category}`.toLocaleLowerCase('tr-TR');
    const searchMatch = !searchValue || text.includes(searchValue.toLocaleLowerCase('tr-TR'));
    return scopeMatch && typeMatch && categoryMatch && startDateMatch && endDateMatch && searchMatch;
  });
}

function renderSummary() {
  const visibleRecords = getFilteredRecords();
  const totalIncome = sumAmounts(visibleRecords.filter((item) => item.type === 'gelir'));
  const totalExpense = sumAmounts(visibleRecords.filter((item) => item.type === 'gider'));
  const balance = roundMoney(totalIncome - totalExpense);

  totalIncomeEl.textContent = formatCurrency(totalIncome);
  totalExpenseEl.textContent = formatCurrency(totalExpense);
  netBalanceEl.textContent = formatCurrency(balance);
  netBalanceEl.style.color = balance >= 0 ? '#60a5fa' : '#f87171';
  transactionCountEl.textContent = String(visibleRecords.length);

  const incomeCount = visibleRecords.filter((item) => item.type === 'gelir').length;
  const expenseCount = visibleRecords.filter((item) => item.type === 'gider').length;
  incomeCountEl.textContent = `${incomeCount} kayıt`;
  expenseCountEl.textContent = `${expenseCount} kayıt`;

  const latest = getAllRecords().sort((a, b) => b.date.localeCompare(a.date))[0];
  if (latest) {
    const latestLabel = `${latest.type === 'gelir' ? 'Gelir' : 'Gider'} • ${latest.category}`;
    lastEntryEl.textContent = latestLabel;
  } else {
    lastEntryEl.textContent = 'Son işlem yok';
  }

  const currentMonth = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const currentMonthKey = getTodayISO().slice(0, 7);
  const monthRecords = getAllRecords().filter((item) => item.date.startsWith(currentMonthKey));
  const monthTotal = roundMoney(
    sumAmounts(monthRecords.filter((item) => item.type === 'gelir')) - sumAmounts(monthRecords.filter((item) => item.type === 'gider'))
  );

  monthSnapshotEl.textContent = formatCurrency(monthTotal);
  monthLabelEl.textContent = currentMonth;
}

function renderTable() {
  const filtered = getFilteredRecords();

  if (!filtered.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Aradığınız kritere uygun işlem bulunamadı.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((record) => `
      <tr>
        <td>${formatDateTr(record.date)}</td>
        <td><span class="type-badge ${record.type}">${record.type === 'gelir' ? 'Gelir' : 'Gider'}</span></td>
        <td>${escapeHtml(record.category)}</td>
        <td>${escapeHtml(record.name_company || '')}</td>
        <td>${escapeHtml(record.description || 'Açıklama yok')}</td>
        <td class="amount-col"><span class="amount ${record.type}">${record.type === 'gelir' ? '+' : '-'}${formatCurrency(Number(record.amount))}</span></td>
        <td><button class="delete-btn" ${record.source === 'personal' ? `data-extra-id="${escapeHtml(record.id)}"` : `data-id="${escapeHtml(record.id)}"`} type="button">Sil</button></td>
      </tr>
    `)
    .join('');
}

function renderMonthlyChart() {
  const records = getAllRecords();
  const today = new Date();
  const months = [];

  for (let i = 5; i >= 0; i -= 1) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const monthRecords = records.filter((item) => item.date.startsWith(key));
    months.push({
      label: monthDate.toLocaleDateString('tr-TR', { month: 'short' }),
      income: sumAmounts(monthRecords.filter((item) => item.type === 'gelir')),
      expense: sumAmounts(monthRecords.filter((item) => item.type === 'gider')),
    });
  }

  const maxAmount = Math.max(1, ...months.map(({ income, expense }) => Math.max(income, expense)));

  monthlyChart.innerHTML = months
    .map(({ label, income, expense }) => `
        <div class="bar-group">
          <div class="bar-stack">
            <div class="bar income" style="height:${(income / maxAmount) * 100}%" title="Gelir: ${formatCurrency(income)}"></div>
            <div class="bar expense" style="height:${(expense / maxAmount) * 100}%" title="Gider: ${formatCurrency(expense)}"></div>
          </div>
          <span class="month-label">${escapeHtml(label)}</span>
        </div>
      `)
    .join('');
}

function updateFormType(event) {
  const selectedType = event.target.value;
  const currentCategories = getTypeOptions(selectedType);
  categoryInput.dataset.selected = currentCategories[0];
  renderCategoryOptions();
}

async function addCategory() {
  ensureDbReady();
  const categoryName = window.prompt(`Yeni ${typeInput.value === 'gelir' ? 'gelir' : 'gider'} kategorisinin adını girin:`)?.trim();
  if (!categoryName) return;

  const existing = getTypeOptions(typeInput.value)
    .some((name) => name.toLocaleLowerCase('tr-TR') === categoryName.toLocaleLowerCase('tr-TR'));
  if (existing) {
    window.alert('Bu kategoride aynı isim zaten var.');
    return;
  }

  state.db.run('INSERT INTO category_options (type, name) VALUES (?, ?)', [typeInput.value, categoryName]);
  await saveDbToIndexedDb();
  state.categoryOptions = getCategoryOptionsFromDatabase();
  categoryInput.dataset.selected = categoryName;
  renderAll();
}

async function removeCategory() {
  ensureDbReady();
  const categoryName = categoryInput.value;
  const currentCategories = getTypeOptions(typeInput.value);
  if (currentCategories.length <= 1) {
    window.alert('Her işlem türünde en az bir kategori kalmalıdır.');
    return;
  }

  const confirmed = window.confirm(`“${categoryName}” yeni işlemlerdeki kategori listesinden çıkarılsın mı? Eski kayıtlar korunur.`);
  if (!confirmed) return;

  state.db.run('DELETE FROM category_options WHERE type = ? AND name = ?', [typeInput.value, categoryName]);
  await saveDbToIndexedDb();
  state.categoryOptions = getCategoryOptionsFromDatabase();
  categoryInput.dataset.selected = getTypeOptions(typeInput.value)[0];
  renderAll();
}

const EXPORT_HEADERS = ['Tarih', 'Tür', 'Kategori', 'İsim / Firma', 'Açıklama', 'Tutar'];

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
}

function getExportTextCells(record) {
  return [
    record.date,
    record.type === 'gelir' ? 'Gelir' : 'Gider',
    neutralizeFormula(record.category),
    neutralizeFormula(record.name_company || ''),
    neutralizeFormula(record.description || ''),
  ];
}

function exportCsv() {
  const records = getFilteredRecords();
  // Türkçe Excel için: UTF-8 BOM, noktalı virgül ayracı ve virgüllü ondalık.
  const rows = records.map((record) => [
    ...getExportTextCells(record),
    roundMoney(record.amount).toFixed(2).replace('.', ','),
  ]);

  const csvContent = [EXPORT_HEADERS, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');

  downloadBlob(new Blob(['﻿', csvContent], { type: 'text/csv;charset=utf-8;' }), 'otel-muhasebe-raporu.csv');
}

function exportExcel() {
  if (typeof exportXlsxReport !== 'function') {
    window.alert('Excel raporu modülü yüklenemedi.');
    return;
  }
  exportXlsxReport();
}

async function getPdfFontBase64(style) {
  const fontFile = style === 'bold' ? 'NotoSans-Bold.ttf' : 'NotoSans-Regular.ttf';
  if (!pdfFontBase64Promises[style]) {
    pdfFontBase64Promises[style] = fetch(`./vendor/${fontFile}`).then(async (response) => {
      if (!response.ok) throw new Error('PDF yazı tipi yüklenemedi.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = '';
      for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
      }
      return btoa(binary);
    }).catch((error) => {
      pdfFontBase64Promises[style] = null;
      throw error;
    });
  }

  return pdfFontBase64Promises[style];
}

async function exportPdf() {
  const records = getFilteredRecords();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  try {
    doc.addFileToVFS('NotoSans-Regular.ttf', await getPdfFontBase64('normal'));
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    doc.addFileToVFS('NotoSans-Bold.ttf', await getPdfFontBase64('bold'));
    doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
    doc.setFont('NotoSans', 'normal');
  } catch (error) {
    window.alert(`PDF yazı tipi yüklenemedi: ${error.message}`);
    return;
  }

  const incomeTotal = sumAmounts(records.filter((record) => record.type === 'gelir'));
  const expenseTotal = sumAmounts(records.filter((record) => record.type === 'gider'));
  const dateRange = filterStartDate.value || filterEndDate.value
    ? `${filterStartDate.value || 'Başlangıç yok'} - ${filterEndDate.value || 'Bitiş yok'}`
    : 'Tüm tarihler';

  doc.setFont('NotoSans', 'bold');
  doc.setFontSize(16);
  doc.text("L'UVA CAVE Gelir-Gider Raporu", 36, 34);
  doc.setFont('NotoSans', 'normal');
  doc.setFontSize(9);
  doc.text(`Tarih aralığı: ${dateRange}    Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`, 36, 52);

  doc.autoTable({
    head: [['Tarih', 'Tür', 'Kategori', 'İsim / Firma', 'Açıklama', 'Tutar']],
    body: records.map((record) => [
      formatDateTr(record.date),
      record.type === 'gelir' ? 'Gelir' : 'Gider',
      record.category,
      record.name_company || '',
      record.description || 'Açıklama yok',
      formatCurrency(Number(record.amount)),
    ]),
    startY: 66,
    margin: { left: 36, right: 36 },
    styles: { font: 'NotoSans', fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { font: 'NotoSans', fontStyle: 'bold', fillColor: [36, 91, 71] },
    columnStyles: { 5: { halign: 'right' } },
  });

  doc.autoTable({
    body: [[
      `Toplam Gelir: ${formatCurrency(incomeTotal)}`,
      `Toplam Gider: ${formatCurrency(expenseTotal)}`,
      `Net: ${formatCurrency(roundMoney(incomeTotal - expenseTotal))}`,
    ]],
    startY: (doc.lastAutoTable?.finalY || 66) + 14,
    margin: { left: 36, right: 36 },
    theme: 'grid',
    styles: { font: 'NotoSans', fontSize: 10, fontStyle: 'bold', cellPadding: 8 },
    columnStyles: {
      0: { textColor: [22, 128, 72] },
      1: { textColor: [185, 56, 56] },
      2: { textColor: [30, 91, 145] },
    },
  });

  doc.save('l-uva-cave-gelir-gider-raporu.pdf');
}

function downloadDatabase() {
  const binary = state.db.export();
  const blob = new Blob([binary], { type: 'application/vnd.sqlite3' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'l-uva-cave-yedek.sqlite';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
}

function ensureImportedDatabaseSchema(db) {
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type = 'table'")[0]?.values.map((row) => row[0]) || [];
  if (!tables.includes('transactions')) {
    throw new Error('Bu dosyada muhasebe işlemleri bulunamadı.');
  }

  const transactionColumns = db.exec('PRAGMA table_info(transactions)')[0]?.values.map((column) => column[1]) || [];
  const requiredColumns = ['id', 'date', 'type', 'category', 'amount', 'description'];
  if (!requiredColumns.every((column) => transactionColumns.includes(column))) {
    throw new Error('Yedek dosyasının işlem tablosu tanınan biçimde değil.');
  }

  ensureSchema(db);
}

// Silme/yükleme gibi geri dönüşsüz işlemlerden önce Yedekler klasörüne otomatik güvenlik yedeği alır.
async function createSafetyBackup(actionLabel) {
  try {
    await uploadBackup('oncesi', false);
    return true;
  } catch (error) {
    return window.confirm(`Güvenlik yedeği alınamadı (${error.message}).\n\n${actionLabel} yine de devam edilsin mi?`);
  }
}

async function restoreDatabase(file) {
  if (!file || !state.SQL) return;
  if (!window.confirm('Mevcut tüm uygulama verileri seçilen yedekle değiştirilecek. Devam edilsin mi?')) {
    dbImportInput.value = '';
    return;
  }
  if (!(await createSafetyBackup('Yedek yükleme işlemine'))) {
    dbImportInput.value = '';
    return;
  }

  let importedDb;
  let committed = false;
  const previousDb = state.db;
  try {
    importedDb = new state.SQL.Database(new Uint8Array(await file.arrayBuffer()));
    const integrity = importedDb.exec('PRAGMA quick_check')[0]?.values[0]?.[0];
    if (integrity !== 'ok') throw new Error('Yedek dosyası bozuk veya eksik.');
    ensureImportedDatabaseSchema(importedDb);

    state.db = importedDb;
    await saveDbToIndexedDb();
    committed = true;
    state.records = getRecordsFromDatabase();
    renderAll();
    showDueWarningIfNeeded();
    showTaxReminderIfNeeded();
    try { previousDb?.close(); } catch (closeError) { console.warn(closeError); }
    window.alert('Yedek başarıyla yüklendi. Tüm ekranlar güncellendi.');
  } catch (error) {
    state.db = previousDb;
    if (committed) await saveDbToIndexedDb().catch((saveError) => console.error(saveError));
    if (importedDb && importedDb !== previousDb) importedDb.close();
    window.alert(`Yedek yüklenemedi: ${error.message}`);
  } finally {
    dbImportInput.value = '';
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  ensureDbReady();
  const amount = roundMoney(amountInput.value);

  if (!dateInput.value || !amount || amount <= 0) {
    window.alert('Lütfen geçerli bir tarih ve tutar girin.');
    return;
  }

  const record = {
    id: crypto.randomUUID(),
    date: dateInput.value,
    type: typeInput.value,
    category: categoryInput.value,
    amount,
    description: descriptionInput.value.trim() || 'Açıklama yok',
    name_company: nameCompanyInput.value.trim(),
  };

  state.db.run(
    'INSERT INTO transactions (id, date, type, category, amount, description, name_company) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [record.id, record.date, record.type, record.category, record.amount, record.description, record.name_company]
  );

  await saveDbToIndexedDb();
  state.records = getRecordsFromDatabase();

  form.reset();
  dateInput.value = getTodayISO();
  typeInput.value = 'gelir';
  nameCompanyInput.value = '';
  renderCategoryOptions();
  renderAll();
}

async function deleteRecord(id) {
  if (!window.confirm('Bu işlem kaydı silinsin mi?')) return;

  ensureDbReady();
  state.db.run('DELETE FROM transactions WHERE id = ?', [id]);
  // Bu işlem bir vadeli/vergi ödemesinden oluştuysa ödeme tekrar "bekliyor" durumuna döner.
  state.db.run("UPDATE deferred_payments SET status = 'pending', transaction_id = NULL WHERE transaction_id = ?", [id]);
  state.db.run("UPDATE tax_payments SET status = 'pending', transaction_id = NULL WHERE transaction_id = ?", [id]);
  await saveDbToIndexedDb();
  state.records = getRecordsFromDatabase();
  renderAll();
  showDueWarningIfNeeded();
  showTaxReminderIfNeeded();
}

async function resetData() {
  if (!window.confirm('Tüm otel gelir gider verilerini silmek istediğinize emin misiniz?')) return;

  if (!(await askPin('Tüm kayıtlar silinecek. Bu işlem geri alınamaz. Devam etmek için 4 haneli PIN girin.'))) {
    window.alert('PIN girilmedi; veriler silinmedi.');
    return;
  }
  if (!(await createSafetyBackup('Silme işlemine'))) return;

  ensureDbReady();
  state.db.run('DELETE FROM transactions');
  state.db.run('DELETE FROM personal_expenses');
  state.db.run('DELETE FROM personal_people');
  state.db.run('DELETE FROM deferred_payments');
  state.db.run('DELETE FROM tax_payments');
  await saveDbToIndexedDb();
  state.records = getRecordsFromDatabase();
  state.extraPeople = getExtraPeopleFromDatabase();
  state.extraExpenses = getExtraExpensesFromDatabase();
  state.deferredPayments = getDeferredPaymentsFromDatabase();
  state.taxPayments = getTaxPaymentsFromDatabase();
  renderAll();
  showTaxReminderIfNeeded();
}

function renderAll() {
  if (!state.db) return;
  state.categoryOptions = getCategoryOptionsFromDatabase();
  state.extraPeople = getExtraPeopleFromDatabase();
  state.extraExpenses = getExtraExpensesFromDatabase();
  state.taxPayments = getTaxPaymentsFromDatabase();
  renderCategoryOptions();
  renderSummary();
  renderTable();
  renderMonthlyChart();
  renderExtraPeople();
  renderExtraExpenses();
  renderDuePayments();
  renderTaxPayments();
  renderDashboardDueSummary();
  renderCompanySuggestions();
  if (!monthlySection.hidden && typeof renderMonthlySummary === 'function') renderMonthlySummary();
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'X-Luva-Api': '1', ...(options.headers || {}) },
  });

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `Sunucuya ulaşılamadı (${response.status}). Uygulama Baslat.bat ile açılmış olmalı.`);
  }
  return data;
}

async function detectServerMode() {
  try {
    const response = await fetch('/api/settings', { headers: { 'X-Luva-Api': '1' }, cache: 'no-store' });
    const data = await response.json();
    serverMode = response.ok && data?.ok === true;
  } catch (error) {
    serverMode = false;
  }
}

function readLastLocalBackup() {
  try {
    return localStorage.getItem(LAST_BACKUP_STORAGE_KEY) || '';
  } catch (error) {
    return '';
  }
}

function rememberLocalBackup() {
  try {
    localStorage.setItem(LAST_BACKUP_STORAGE_KEY, new Date().toISOString());
  } catch (error) {
    console.warn(error);
  }
}

function buildLocalBackupFile(kind) {
  const labels = { auto: 'otomatik', manual: 'elle', oncesi: 'oncesi' };
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return { name: `l-uva-cave-yedek-${labels[kind] || 'elle'}-${stamp}.sqlite`, data: state.db.export() };
}

// Sunucusuz (tablet) modda yedek, tarayıcı indirmesiyle İndirilenler klasörüne kaydedilir.
function downloadLocalBackup(kind) {
  const file = buildLocalBackupFile(kind);
  downloadBlob(new Blob([file.data], { type: 'application/vnd.sqlite3' }), file.name);
  if (kind !== 'oncesi') rememberLocalBackup();
  return { ok: true, file: file.name, mailRequested: false, mailSent: false, mailError: '' };
}

async function uploadBackup(kind, sendMail) {
  ensureDbReady();
  if (!serverMode) return downloadLocalBackup(kind);
  return apiRequest(`/api/backup?kind=${kind}&mail=${sendMail ? '1' : '0'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: state.db.export(),
  });
}

function formatDateTime(isoValue) {
  if (!isoValue) return 'Henüz yok';
  const date = new Date(isoValue);
  return Number.isNaN(date.getTime()) ? 'Henüz yok' : date.toLocaleString('tr-TR');
}

function renderSettingsStatus(settings, extraMessage = '') {
  const lines = [
    `Son yedek: ${formatDateTime(settings.lastBackupAt)}`,
    `Son mail: ${formatDateTime(settings.lastMailAt)}`,
  ];
  if (settings.lastMailError) lines.push(`Son mail hatası: ${settings.lastMailError}`);
  if (settings.lastBackupAt) {
    lines.push(`Sonraki otomatik yedek: ${formatDateTime(new Date(new Date(settings.lastBackupAt).getTime() + AUTO_BACKUP_INTERVAL_MS).toISOString())} sonrası`);
  }
  lines.push(`Yedek klasörü: ${settings.backupDir || '-'}`);
  if (extraMessage) lines.unshift(extraMessage);
  settingsStatusEl.textContent = lines.join('\n');
}

function applyBackupMode() {
  settingsForm.hidden = !serverMode;
  shutdownBtn.hidden = !serverMode;
  shareBackupBtn.hidden = serverMode || typeof navigator.canShare !== 'function';
  backupNowBtn.textContent = serverMode ? 'Şimdi Yedekle ve Mail Gönder' : 'Şimdi Yedekle (İndirilenler klasörüne)';
  if (!serverMode) {
    settingsIntro.textContent = 'Program açıldığında son yedekten bu yana 3 gün geçmişse veritabanı otomatik olarak '
      + 'tabletin İndirilenler klasörüne kaydedilir. FolderSync gibi bir uygulamayla bu klasörü Google Drive\'a eşitleyebilir '
      + 'veya "Yedeği Paylaş" düğmesiyle Drive\'a gönderebilirsiniz.';
  }
}

function renderLocalSettingsStatus(extraMessage = '') {
  const last = readLastLocalBackup();
  const lines = [`Son yedek: ${formatDateTime(last)}`];
  if (last) lines.push(`Sonraki otomatik yedek: ${formatDateTime(new Date(new Date(last).getTime() + AUTO_BACKUP_INTERVAL_MS).toISOString())} sonrası`);
  lines.push('Yedek dosyaları: İndirilenler klasörü (l-uva-cave-yedek-...sqlite)');
  if (extraMessage) lines.unshift(extraMessage);
  settingsStatusEl.textContent = lines.join('\n');
}

async function handleShareBackup() {
  try {
    const file = buildLocalBackupFile('manual');
    const shareFile = new File([file.data], file.name, { type: 'application/octet-stream' });
    if (!navigator.canShare?.({ files: [shareFile] })) {
      window.alert('Bu tarayıcı dosya paylaşımını desteklemiyor. "Şimdi Yedekle" düğmesini kullanın.');
      return;
    }
    await navigator.share({ files: [shareFile], title: "L'UVA CAVE Muhasebe yedeği" });
    rememberLocalBackup();
    renderLocalSettingsStatus('Yedek paylaşıldı.');
  } catch (error) {
    if (error?.name !== 'AbortError') window.alert(`Yedek paylaşılamadı: ${error.message}`);
  }
}

async function loadSettingsView() {
  applyBackupMode();
  if (!serverMode) {
    renderLocalSettingsStatus();
    return;
  }

  try {
    const settings = await apiRequest('/api/settings');
    settingsEmailInput.value = settings.email || '';
    smtpHostInput.value = settings.smtpHost || '';
    smtpPortInput.value = settings.smtpPort || 587;
    smtpUserInput.value = settings.smtpUser || '';
    smtpSslInput.checked = Boolean(settings.smtpSsl);
    smtpPassInput.value = '';
    smtpPassInput.placeholder = settings.hasPassword ? 'Kayıtlı (değiştirmek için yazın)' : 'Şifre girin';
    renderSettingsStatus(settings);
  } catch (error) {
    settingsStatusEl.textContent = `Ayarlar yüklenemedi: ${error.message}`;
  }
}

async function handleSettingsSubmit(event) {
  event.preventDefault();

  try {
    const settings = await apiRequest('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: settingsEmailInput.value.trim(),
        smtpHost: smtpHostInput.value.trim(),
        smtpPort: Number(smtpPortInput.value) || 587,
        smtpSsl: smtpSslInput.checked,
        smtpUser: smtpUserInput.value.trim(),
        smtpPass: smtpPassInput.value,
      }),
    });
    smtpPassInput.value = '';
    smtpPassInput.placeholder = settings.hasPassword ? 'Kayıtlı (değiştirmek için yazın)' : 'Şifre girin';
    renderSettingsStatus(settings, 'Ayarlar kaydedildi.');
  } catch (error) {
    window.alert(`Ayarlar kaydedilemedi: ${error.message}`);
  }
}

async function handleBackupNow() {
  backupNowBtn.disabled = true;
  try {
    const result = await uploadBackup('manual', true);
    if (!serverMode) {
      renderLocalSettingsStatus(`Yedek İndirilenler klasörüne kaydedildi: ${result.file}`);
      return;
    }
    const settings = await apiRequest('/api/settings');
    let message = `Yedek alındı: ${result.file}`;
    if (result.mailSent) message += '\nMail gönderildi.';
    else if (result.mailError) message += `\nMail gönderilemedi: ${result.mailError}`;
    renderSettingsStatus(settings, message);
  } catch (error) {
    window.alert(`Yedek alınamadı: ${error.message}`);
  } finally {
    backupNowBtn.disabled = false;
  }
}

async function handleShutdown() {
  if (!window.confirm('Uygulama sunucusu kapatılsın mı? Yeniden açmak için Baslat.bat çalıştırılmalıdır.')) return;

  try {
    await apiRequest('/api/shutdown', { method: 'POST' });
    document.body.innerHTML = '<p style="padding:40px;font:18px sans-serif">Uygulama kapatıldı. Bu sekmeyi kapatabilirsiniz.</p>';
  } catch (error) {
    window.alert(`Uygulama kapatılamadı: ${error.message}`);
  }
}

// Her 3 günde bir yedek alır (Yedekler klasörü + ayarlıysa mail). Program açık olduğu sürece saatlik kontrol eder.
async function checkAutoBackup() {
  if (autoBackupRunning || !state.db) return;
  autoBackupRunning = true;

  try {
    if (!serverMode) {
      const last = readLastLocalBackup();
      const lastTime = new Date(last).getTime();
      const hasData = state.records.length + state.extraExpenses.length + state.deferredPayments.length + state.taxPayments.length > 0;
      if (hasData && (!last || Number.isNaN(lastTime) || Date.now() - lastTime >= AUTO_BACKUP_INTERVAL_MS)) {
        downloadLocalBackup('auto');
        if (!settingsSection.hidden) renderLocalSettingsStatus('Otomatik yedek İndirilenler klasörüne kaydedildi.');
      }
      return;
    }

    const settings = await apiRequest('/api/settings');
    const now = Date.now();
    const isDue = (isoValue) => !isoValue || Number.isNaN(new Date(isoValue).getTime()) || now - new Date(isoValue).getTime() >= AUTO_BACKUP_INTERVAL_MS;
    const mailConfigured = Boolean(settings.email && settings.smtpHost);
    const backupDue = isDue(settings.lastBackupAt);
    const mailDue = mailConfigured && isDue(settings.lastMailAt);
    if (!backupDue && !mailDue) return;

    const result = await uploadBackup('auto', mailDue);
    if (result.mailRequested && !result.mailSent && !mailErrorShown) {
      mailErrorShown = true;
      window.alert(`Otomatik yedek alındı ancak mail gönderilemedi:\n${result.mailError}\n\nAyarlar sekmesinden mail bilgilerini kontrol edin.`);
    }
    if (!settingsSection.hidden) loadSettingsView();
  } catch (error) {
    console.warn('Otomatik yedekleme yapılamadı.', error);
  } finally {
    autoBackupRunning = false;
  }
}

async function acquireSingleInstanceLock() {
  if (!navigator.locks) return true;

  return new Promise((resolve) => {
    navigator.locks.request('luva-cave-muhasebe', { ifAvailable: true }, (lock) => {
      if (!lock) {
        resolve(false);
        return undefined;
      }
      resolve(true);
      return new Promise(() => {});
    });
  });
}

function showBlockingMessage(title, text) {
  const overlay = document.createElement('div');
  overlay.setAttribute('role', 'alertdialog');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#f8fafc;font:16px sans-serif;padding:24px;text-align:center';
  const box = document.createElement('div');
  box.style.maxWidth = '520px';
  const heading = document.createElement('h2');
  heading.textContent = title;
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  paragraph.style.cssText = 'line-height:1.5;white-space:pre-line';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Yeniden Dene';
  retry.style.cssText = 'margin-top:16px;padding:10px 22px;font-size:16px;cursor:pointer';
  retry.addEventListener('click', () => location.reload());
  box.append(heading, paragraph, retry);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

async function initializeApp() {
  if (location.hostname === '127.0.0.1') return;

  try {
    // Aynı anda iki sekme açık olursa birbirlerinin verisini ezer; bu yüzden tek sekmeye izin verilir.
    if (!(await acquireSingleInstanceLock())) {
      showBlockingMessage(
        'Uygulama zaten açık',
        "L'UVA CAVE Muhasebe başka bir sekmede veya pencerede açık. Verilerin birbirini ezmemesi için lütfen o pencereyi kullanın ve bu sekmeyi kapatın."
      );
      return;
    }

    await bootstrapDatabase();
    await detectServerMode();
    applyBackupMode();
    dateInput.value = getTodayISO();
    typeInput.value = 'gelir';
    extraDateInput.value = getTodayISO();
    deferredDateInput.value = getTodayISO();
    taxDueDateInput.value = getTodayISO();
    setExtraSign('-');
    renderAll();
    showDueWarningIfNeeded();
    showTaxReminderIfNeeded();
    checkAutoBackup();
    window.setInterval(checkAutoBackup, AUTO_BACKUP_CHECK_MS);
  } catch (error) {
    console.error(error);
    state.db = null;
    showBlockingMessage(
      'Uygulama başlatılamadı',
      `${error.message}\n\nKayıtlı verileriniz değiştirilmedi. Sayfayı yenileyin; sorun sürerse Yedekler klasöründeki en son .sqlite dosyasını "Yedek Yükle" ile geri yükleyebilirsiniz.`
    );
  }
}

form.addEventListener('submit', handleSubmit);
typeInput.addEventListener('change', updateFormType);
addCategoryBtn.addEventListener('click', addCategory);
removeCategoryBtn.addEventListener('click', removeCategory);
filterType.addEventListener('change', renderAll);
filterScope.addEventListener('change', renderAll);
settingsForm.addEventListener('submit', handleSettingsSubmit);
backupNowBtn.addEventListener('click', handleBackupNow);
shutdownBtn.addEventListener('click', handleShutdown);
shareBackupBtn.addEventListener('click', handleShareBackup);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Çevrimdışı mod kurulamadı.', error));
}
filterCategory.addEventListener('change', renderAll);
filterStartDate.addEventListener('change', renderAll);
filterEndDate.addEventListener('change', renderAll);
searchInput.addEventListener('input', renderAll);
csvExportBtn.addEventListener('click', exportCsv);
excelExportBtn.addEventListener('click', exportExcel);
pdfExportBtn.addEventListener('click', exportPdf);
dbExportBtn.addEventListener('click', downloadDatabase);
dbImportBtn.addEventListener('click', () => dbImportInput.click());
dbImportInput.addEventListener('change', () => restoreDatabase(dbImportInput.files[0]));
resetBtn.addEventListener('click', resetData);
addPersonBtn.addEventListener('click', addPerson);
extraSignButtons.forEach((button) => {
  button.addEventListener('click', () => setExtraSign(button.dataset.sign));
});
extraExpenseForm.addEventListener('submit', handleExtraExpenseSubmit);
deferredPaymentForm.addEventListener('submit', handleDeferredPaymentSubmit);
taxPaymentForm.addEventListener('submit', handleTaxPaymentSubmit);
deferredTableBody.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.paidId) {
    markDeferredPaymentPaid(target.dataset.paidId);
  } else if (target.dataset.undoId) {
    undoDeferredPayment(target.dataset.undoId);
  } else if (target.dataset.dueId) {
    deleteDeferredPayment(target.dataset.dueId);
  }
});
taxTableBody.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.taxPaidId) {
    markTaxPaymentPaid(target.dataset.taxPaidId);
  } else if (target.dataset.taxUndoId) {
    undoTaxPayment(target.dataset.taxUndoId);
  } else if (target.dataset.taxId) {
    deleteTaxPayment(target.dataset.taxId);
  }
});
closeDueWarningBtn.addEventListener('click', () => {
  dueWarningModal.hidden = true;
});
dueWarningModal.addEventListener('click', (event) => {
  if (event.target === dueWarningModal) dueWarningModal.hidden = true;
});
taxSoundToggleBtn.addEventListener('click', toggleTaxReminderSound);
closeTaxWarningBtn.addEventListener('click', closeTaxReminder);
taxWarningModal.addEventListener('click', (event) => {
  if (event.target === taxWarningModal) closeTaxReminder();
});
extraPeopleList.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.personId) {
    deletePerson(target.dataset.personId);
  }
});
extraExpenseList.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.extraId) {
    deleteExtraExpense(target.dataset.extraId);
  }
});
tableBody.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.id) {
    deleteRecord(target.dataset.id);
  } else if (target instanceof HTMLElement && target.dataset.extraId) {
    deleteExtraExpense(target.dataset.extraId);
  }
});

navItems.forEach((item) => {
  item.addEventListener('click', () => showView(item.dataset.view));
});

openDeferredFromDashboardBtn.addEventListener('click', () => showView('deferred'));

initializeApp();
