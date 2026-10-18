// Kayıt düzenleme, belge/fotoğraf ekleme ve cari hesap özeti.
// script.js'ten state, escapeHtml, roundMoney, formatCurrency, formatDateTr, saveDbToIndexedDb, renderAll,
// getTypeOptions, getRecordsFromDatabase vb. ve excel-import.js'ten resolveCategory kullanır.

const editModal = document.getElementById('editModal');
const editTitleEl = document.getElementById('editTitle');
const editForm = document.getElementById('editForm');
const editFields = document.getElementById('editFields');
const editCancelBtn = document.getElementById('editCancelBtn');
const attachModal = document.getElementById('attachModal');
const attachTitleEl = document.getElementById('attachTitle');
const attachGrid = document.getElementById('attachGrid');
const attachInfoEl = document.getElementById('attachInfo');
const attachAddBtn = document.getElementById('attachAddBtn');
const attachFileInput = document.getElementById('attachFileInput');
const attachCloseBtn = document.getElementById('attachCloseBtn');
const accountsSearchInput = document.getElementById('accountsSearchInput');
const accountsTableBody = document.getElementById('accountsTableBody');
const accountDetailEl = document.getElementById('accountDetail');

const ATTACH_MAX_DIMENSION = 1280;
const ATTACH_JPEG_QUALITY = 0.6;
const ATTACH_WARN_BYTES = 40 * 1024 * 1024;

let editSaveHandler = null;
let currentAttachmentRecordId = null;
let attachmentUrls = [];
let selectedAccountKey = null;

// ---------------------------------------------------------------- DÜZENLEME PENCERESİ

function openEditDialog({ title, fields, onSave }) {
  editTitleEl.textContent = title;
  editFields.replaceChildren();

  fields.forEach((field) => {
    const label = document.createElement('label');
    const caption = document.createElement('span');
    caption.textContent = field.label + (field.required ? ' *' : '');
    label.appendChild(caption);

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      field.options.forEach((option) => {
        const element = document.createElement('option');
        element.value = option.value;
        element.textContent = option.label;
        input.appendChild(element);
      });
    } else {
      input = document.createElement('input');
      input.type = field.type;
      if (field.type === 'number') {
        input.step = '0.01';
        input.min = '0.01';
      }
      if (field.maxLength) input.maxLength = field.maxLength;
      if (field.list) {
        const dataList = document.createElement('datalist');
        dataList.id = `edit-list-${field.key}`;
        field.list.forEach((item) => {
          const element = document.createElement('option');
          element.value = item;
          dataList.appendChild(element);
        });
        label.appendChild(dataList);
        input.setAttribute('list', dataList.id);
      }
    }

    input.name = field.key;
    input.required = Boolean(field.required);
    label.appendChild(input);
    editFields.appendChild(label);
    input.value = field.value ?? '';
  });

  editSaveHandler = onSave;
  editModal.hidden = false;
  editFields.querySelector('input, select')?.focus();
}

function closeEditDialog() {
  editModal.hidden = true;
  editSaveHandler = null;
}

editForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const handler = editSaveHandler;
  if (!handler) return;

  const values = {};
  new FormData(editForm).forEach((value, key) => { values[key] = String(value).trim(); });
  closeEditDialog();

  try {
    await handler(values);
  } catch (error) {
    console.error(error);
    window.alert(`Kayıt güncellenemedi: ${error.message}`);
  }
});
editCancelBtn.addEventListener('click', closeEditDialog);
editModal.addEventListener('click', (event) => {
  if (event.target === editModal) closeEditDialog();
});

async function commitEdit() {
  await saveDbToIndexedDb();
  state.records = getRecordsFromDatabase();
  state.deferredPayments = getDeferredPaymentsFromDatabase();
  state.taxPayments = getTaxPaymentsFromDatabase();
  renderAll();
  showDueWarningIfNeeded();
  showTaxReminderIfNeeded();
}

function requireAmount(value) {
  const amount = roundMoney(value);
  if (!amount || amount <= 0) throw new Error('Geçerli bir tutar girin.');
  return amount;
}

function editTransaction(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;

  const categories = [...new Set([...getTypeOptions('gelir'), ...getTypeOptions('gider')])];
  openEditDialog({
    title: 'İşlemi Düzenle',
    fields: [
      { key: 'date', label: 'Tarih', type: 'date', value: record.date, required: true },
      { key: 'type', label: 'Tür', type: 'select', value: record.type, options: [{ value: 'gelir', label: 'Gelir' }, { value: 'gider', label: 'Gider' }] },
      { key: 'category', label: 'Kategori', type: 'text', value: record.category, maxLength: 60, list: categories },
      { key: 'name_company', label: 'İsim / Firma', type: 'text', value: record.name_company, maxLength: 100 },
      { key: 'description', label: 'Açıklama', type: 'text', value: record.description === 'Açıklama yok' ? '' : record.description, maxLength: 150 },
      { key: 'amount', label: 'Tutar', type: 'number', value: record.amount, required: true },
    ],
    onSave: async (values) => {
      const amount = requireAmount(values.amount);
      const category = resolveCategory(values.type, values.category || 'Diğer', {});
      state.db.run(
        'UPDATE transactions SET date = ?, type = ?, category = ?, name_company = ?, description = ?, amount = ? WHERE id = ?',
        [values.date, values.type, category, values.name_company, values.description || 'Açıklama yok', amount, id]
      );
      await commitEdit();
    },
  });
}

function editPersonalEntry(id) {
  const entry = state.extraExpenses.find((item) => item.id === id);
  if (!entry) return;

  openEditDialog({
    title: 'Kişisel Kaydı Düzenle',
    fields: [
      { key: 'person_id', label: 'Kişi', type: 'select', value: entry.person_id, options: state.extraPeople.map((person) => ({ value: person.id, label: person.name })) },
      { key: 'date', label: 'Tarih', type: 'date', value: entry.date, required: true },
      { key: 'sign', label: 'İşlem', type: 'select', value: entry.sign, options: [{ value: '+', label: 'Gelir (+)' }, { value: '-', label: 'Gider (-)' }] },
      { key: 'payment_method', label: 'Ödeme', type: 'select', value: entry.payment_method, options: ['Nakit', 'Havale', 'Kart'].map((item) => ({ value: item, label: item })) },
      { key: 'description', label: 'Açıklama', type: 'text', value: entry.description === 'Açıklama yok' ? '' : entry.description, maxLength: 100 },
      { key: 'amount', label: 'Tutar', type: 'number', value: entry.amount, required: true },
    ],
    onSave: async (values) => {
      const amount = requireAmount(values.amount);
      state.db.run(
        'UPDATE personal_expenses SET person_id = ?, date = ?, sign = ?, payment_method = ?, description = ?, amount = ? WHERE id = ?',
        [values.person_id, values.date, values.sign, values.payment_method, values.description || 'Açıklama yok', amount, id]
      );
      await commitEdit();
    },
  });
}

function editDeferredPayment(id) {
  const payment = state.deferredPayments.find((item) => item.id === id && item.status === 'pending');
  if (!payment) return;

  const methods = [...new Set(['Havale', 'Nakit', 'Kart', 'Çek', payment.payment_method])];
  openEditDialog({
    title: 'Vadeli Ödemeyi Düzenle',
    fields: [
      { key: 'name_company', label: 'İsim / Firma', type: 'text', value: payment.name_company, maxLength: 100, required: true },
      { key: 'due_date', label: 'Vade tarihi', type: 'date', value: payment.due_date, required: true },
      { key: 'amount', label: 'Tutar', type: 'number', value: payment.amount, required: true },
      { key: 'payment_method', label: 'Ödeme yöntemi', type: 'select', value: payment.payment_method, options: methods.map((item) => ({ value: item, label: item })) },
      { key: 'description', label: 'Açıklama', type: 'text', value: payment.description, maxLength: 150 },
    ],
    onSave: async (values) => {
      const amount = requireAmount(values.amount);
      state.db.run(
        "UPDATE deferred_payments SET name_company = ?, due_date = ?, amount = ?, payment_method = ?, description = ? WHERE id = ? AND status = 'pending'",
        [values.name_company, values.due_date, amount, values.payment_method, values.description, id]
      );
      await commitEdit();
    },
  });
}

function editTaxPayment(id) {
  const payment = state.taxPayments.find((item) => item.id === id && item.status === 'pending');
  if (!payment) return;

  const types = [...new Set(['KDV', 'Muhtasar', 'SGK', 'Gelir Vergisi', 'Kurumlar Vergisi', 'Konaklama Vergisi', 'Damga Vergisi', 'Diğer', payment.tax_type])];
  openEditDialog({
    title: 'Vergi Ödemesini Düzenle',
    fields: [
      { key: 'tax_type', label: 'Vergi türü', type: 'select', value: payment.tax_type, options: types.map((item) => ({ value: item, label: item })) },
      { key: 'period', label: 'Dönem', type: 'text', value: payment.period, maxLength: 40 },
      { key: 'due_date', label: 'Son ödeme günü', type: 'date', value: payment.due_date, required: true },
      { key: 'amount', label: 'Tutar', type: 'number', value: payment.amount, required: true },
      { key: 'description', label: 'Açıklama', type: 'text', value: payment.description, maxLength: 150 },
    ],
    onSave: async (values) => {
      const amount = requireAmount(values.amount);
      state.db.run(
        "UPDATE tax_payments SET tax_type = ?, period = ?, due_date = ?, amount = ?, description = ? WHERE id = ? AND status = 'pending'",
        [values.tax_type, values.period, values.due_date, amount, values.description, id]
      );
      await commitEdit();
    },
  });
}

// ---------------------------------------------------------------- BELGE / FOTOĞRAF

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getAttachmentStats() {
  const row = state.db.exec('SELECT COUNT(*), COALESCE(SUM(size), 0) FROM attachments')[0]?.values[0] || [0, 0];
  return { count: Number(row[0]), bytes: Number(row[1]) };
}

function attachmentStatusLine() {
  if (!state.db) return '';
  const { count, bytes } = getAttachmentStats();
  if (!count) return 'Belgeler: yok';
  const warning = bytes > ATTACH_WARN_BYTES ? ' (büyük: yedek dosyası şişti, mail ile gönderilemeyebilir)' : '';
  return `Belgeler: ${count} adet, ${formatBytes(bytes)}${warning}`;
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name}: fotoğraf okunamadı.`));
    };
    image.src = url;
  });
}

// Fotoğrafı küçültüp JPEG olarak sıkıştırır (veritabanı ve yedek dosyası şişmesin diye).
async function compressImage(file) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name}: yalnızca fotoğraf eklenebilir.`);

  let source;
  try {
    source = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (error) {
    source = await loadImageElement(file);
  }

  const scale = Math.min(1, ATTACH_MAX_DIMENSION / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (typeof source.close === 'function') source.close();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', ATTACH_JPEG_QUALITY));
  if (!blob) throw new Error(`${file.name}: fotoğraf sıkıştırılamadı.`);
  return blob;
}

async function addAttachments(recordId, files) {
  ensureDbReady();
  for (const file of files) {
    const blob = await compressImage(file);
    const data = new Uint8Array(await blob.arrayBuffer());
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'belge';
    state.db.run(
      'INSERT INTO attachments (id, transaction_id, name, mime, size, data) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), recordId, `${baseName}.jpg`, 'image/jpeg', data.length, data]
    );
  }
  await saveDbToIndexedDb();
  renderTable();
}

function revokeAttachmentUrls() {
  attachmentUrls.forEach((url) => URL.revokeObjectURL(url));
  attachmentUrls = [];
}

function renderAttachmentGrid() {
  revokeAttachmentUrls();
  attachGrid.replaceChildren();

  const result = state.db.exec(
    'SELECT id, name, mime, size, data FROM attachments WHERE transaction_id = ? ORDER BY created_at ASC',
    [currentAttachmentRecordId]
  );
  const rows = result[0]?.values || [];

  rows.forEach(([id, name, mime, size, data]) => {
    const url = URL.createObjectURL(new Blob([data], { type: mime || 'image/jpeg' }));
    attachmentUrls.push(url);

    const figure = document.createElement('figure');
    figure.className = 'attach-item';

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    const image = document.createElement('img');
    image.src = url;
    image.alt = name || 'Belge';
    link.appendChild(image);

    const caption = document.createElement('figcaption');
    caption.textContent = formatBytes(Number(size));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-btn';
    remove.dataset.attachDeleteId = id;
    remove.textContent = 'Sil';
    caption.appendChild(remove);

    figure.append(link, caption);
    attachGrid.appendChild(figure);
  });

  attachInfoEl.textContent = rows.length
    ? 'Büyütmek için fotoğrafa dokunun.'
    : 'Bu işleme henüz belge eklenmedi.';
}

function openAttachments(recordId) {
  const record = state.records.find((item) => item.id === recordId);
  if (!record) return;

  currentAttachmentRecordId = recordId;
  attachTitleEl.textContent = `Belgeler · ${record.category} · ${formatDateTr(record.date)}`;
  renderAttachmentGrid();
  attachModal.hidden = false;
}

function closeAttachments() {
  attachModal.hidden = true;
  revokeAttachmentUrls();
  attachGrid.replaceChildren();
  currentAttachmentRecordId = null;
}

attachAddBtn.addEventListener('click', () => attachFileInput.click());
attachFileInput.addEventListener('change', async () => {
  const files = Array.from(attachFileInput.files || []);
  attachFileInput.value = '';
  if (!files.length || !currentAttachmentRecordId) return;

  attachAddBtn.disabled = true;
  try {
    await addAttachments(currentAttachmentRecordId, files);
    renderAttachmentGrid();
  } catch (error) {
    window.alert(`Belge eklenemedi: ${error.message}`);
  } finally {
    attachAddBtn.disabled = false;
  }
});
attachGrid.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.dataset.attachDeleteId) return;
  if (!window.confirm('Bu belge silinsin mi?')) return;

  state.db.run('DELETE FROM attachments WHERE id = ?', [target.dataset.attachDeleteId]);
  await saveDbToIndexedDb();
  renderAttachmentGrid();
  renderTable();
});
attachCloseBtn.addEventListener('click', closeAttachments);
attachModal.addEventListener('click', (event) => {
  if (event.target === attachModal) closeAttachments();
});

// ---------------------------------------------------------------- CARİ HESAPLAR

function accountKeyOf(name) {
  // Büyük/küçük harf ve noktalı/noktasız i farkı gruplamayı bozmasın.
  return String(name || '').trim().toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/\s+/g, ' ');
}

function buildAccounts() {
  const accounts = new Map();
  const entryFor = (name) => {
    const key = accountKeyOf(name);
    if (!key) return null;
    if (!accounts.has(key)) {
      accounts.set(key, { key, name: String(name).trim(), income: 0, expense: 0, count: 0, lastDate: '', pending: 0, pendingCount: 0 });
    }
    return accounts.get(key);
  };

  state.records.forEach((record) => {
    const entry = entryFor(record.name_company);
    if (!entry) return;
    const cents = Math.round(Number(record.amount) * 100);
    if (record.type === 'gelir') entry.income += cents;
    else entry.expense += cents;
    entry.count += 1;
    if (record.date > entry.lastDate) entry.lastDate = record.date;
  });

  state.deferredPayments.filter((payment) => payment.status === 'pending').forEach((payment) => {
    const entry = entryFor(payment.name_company);
    if (!entry) return;
    entry.pending += Math.round(Number(payment.amount) * 100);
    entry.pendingCount += 1;
  });

  return [...accounts.values()]
    .map((entry) => ({ ...entry, income: entry.income / 100, expense: entry.expense / 100, pending: entry.pending / 100 }))
    .sort((first, second) => second.pending - first.pending || (second.income + second.expense) - (first.income + first.expense));
}

function renderAccounts() {
  if (!state.db) return;

  const search = accountsSearchInput.value.trim().toLocaleLowerCase('tr-TR');
  const accounts = buildAccounts().filter((entry) => !search || entry.key.includes(search));

  accountsTableBody.innerHTML = accounts.length
    ? accounts.map((entry) => {
      const net = roundMoney(entry.income - entry.expense);
      return `<tr class="account-row" data-account-key="${escapeHtml(entry.key)}">
        <td><strong>${escapeHtml(entry.name)}</strong></td>
        <td class="amount-col">${formatCurrency(entry.income)}</td>
        <td class="amount-col">${formatCurrency(entry.expense)}</td>
        <td class="amount-col" style="color:${net >= 0 ? '#4ade80' : '#f87171'}">${formatCurrency(net)}</td>
        <td class="amount-col" style="color:${entry.pending > 0 ? '#fbbf24' : 'inherit'}">${entry.pending > 0 ? formatCurrency(entry.pending) : '—'}</td>
        <td>${entry.count}</td>
        <td>${entry.lastDate ? formatDateTr(entry.lastDate) : '—'}</td>
      </tr>`;
    }).join('')
    : '<tr><td colspan="7" class="empty-state">İsim / firma girilmiş kayıt bulunamadı.</td></tr>';

  renderAccountDetail();
}

function renderAccountDetail() {
  const entry = selectedAccountKey ? buildAccounts().find((item) => item.key === selectedAccountKey) : null;
  if (!entry) {
    accountDetailEl.hidden = true;
    accountDetailEl.replaceChildren();
    return;
  }

  const records = state.records
    .filter((record) => accountKeyOf(record.name_company) === entry.key)
    .sort((first, second) => second.date.localeCompare(first.date));
  const pending = state.deferredPayments
    .filter((payment) => payment.status === 'pending' && accountKeyOf(payment.name_company) === entry.key)
    .sort((first, second) => first.due_date.localeCompare(second.due_date));
  const net = roundMoney(entry.income - entry.expense);

  accountDetailEl.hidden = false;
  accountDetailEl.innerHTML = `
    <div class="section-heading table-heading deferred-list-heading">
      <h3>${escapeHtml(entry.name)}</h3>
      <button class="secondary-btn" type="button" data-account-close>Kapat</button>
    </div>
    <div class="due-summary-metrics">
      <div><span>Toplam gelir</span><strong style="color:#4ade80">${formatCurrency(entry.income)}</strong></div>
      <div><span>Toplam gider</span><strong style="color:#f87171">${formatCurrency(entry.expense)}</strong></div>
      <div><span>Net</span><strong style="color:${net >= 0 ? '#4ade80' : '#f87171'}">${formatCurrency(net)}</strong></div>
    </div>
    ${pending.length ? `
      <h4>Bekleyen vadeli ödemeler (${formatCurrency(entry.pending)})</h4>
      <div class="table-wrap"><table class="deferred-table"><thead><tr><th>Vade</th><th>Açıklama</th><th>Yöntem</th><th class="amount-col">Tutar</th></tr></thead>
        <tbody id="accountDueBody">${pending.map((payment) => `<tr>
          <td>${formatDateTr(payment.due_date)}</td>
          <td>${escapeHtml(payment.description || '—')}</td>
          <td>${escapeHtml(payment.payment_method)}</td>
          <td class="amount-col">${formatCurrency(payment.amount)}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <h4>İşlem geçmişi (${records.length})</h4>
    <div class="table-wrap"><table class="deferred-table"><thead><tr><th>Tarih</th><th>Tür</th><th>Kategori</th><th>Açıklama</th><th class="amount-col">Tutar</th></tr></thead>
      <tbody id="accountDetailBody">${records.map((record) => `<tr>
        <td>${formatDateTr(record.date)}</td>
        <td><span class="type-badge ${record.type}">${record.type === 'gelir' ? 'Gelir' : 'Gider'}</span></td>
        <td>${escapeHtml(record.category)}</td>
        <td>${escapeHtml(record.description || '')}</td>
        <td class="amount-col"><span class="amount ${record.type}">${record.type === 'gelir' ? '+' : '-'}${formatCurrency(record.amount)}</span></td></tr>`).join('')}</tbody></table></div>`;
}

accountsSearchInput.addEventListener('input', renderAccounts);
accountsTableBody.addEventListener('click', (event) => {
  const row = event.target instanceof HTMLElement ? event.target.closest('tr[data-account-key]') : null;
  if (!row) return;
  selectedAccountKey = row.dataset.accountKey;
  renderAccountDetail();
  accountDetailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
accountDetailEl.addEventListener('click', (event) => {
  if (event.target instanceof HTMLElement && event.target.hasAttribute('data-account-close')) {
    selectedAccountKey = null;
    renderAccountDetail();
  }
});
