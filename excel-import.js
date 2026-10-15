// Excel ile toplu giriş: profesyonel şablon indirme ve doldurulmuş Excel'i içe aktarma.
// script.js'ten state, escapeHtml, roundMoney, sumAmounts, formatCurrency, formatDateTr,
// getTypeOptions, createSafetyBackup, saveDbToIndexedDb, renderAll vb. kullanır.

const templateDownloadBtn = document.getElementById('templateDownloadBtn');
const importPickBtn = document.getElementById('importPickBtn');
const importFileInput = document.getElementById('importFileInput');
const importPreviewEl = document.getElementById('importPreview');
const exportFromInput = document.getElementById('exportFromInput');
const exportToInput = document.getElementById('exportToInput');
const exportTemplateBtn = document.getElementById('exportTemplateBtn');

const TEMPLATE_ROWS = 1000;
const MAX_IMPORT_ROWS = 20000;
const XL_GREEN = 'FF245B47';
const XL_LIGHT = 'FFE8F1ED';
const XL_GRID = 'FFD9DEE3';

let pendingImport = null;
let importBusy = false;

const IMPORT_SHEETS = [
  {
    id: 'transactions',
    name: 'Gelir-Gider',
    label: 'Gelir-Gider',
    tab: 'FF245B47',
    aliases: ['gelirgider', 'gelirvegider', 'islemler'],
    columns: [
      { key: 'date', header: 'Tarih', required: true, width: 14, aliases: ['tarih'], note: 'GG.AA.YYYY biçiminde (örn. 15.10.2026).' },
      { key: 'type', header: 'Tür', required: true, width: 12, aliases: ['tur', 'islemturu'], note: 'Gelir veya Gider (listeden seçin).' },
      { key: 'category', header: 'Kategori', width: 24, aliases: ['kategori'], note: 'Listeden seçin ya da yeni bir kategori yazın (yeni kategori otomatik eklenir). Boşsa "Diğer" olur.' },
      { key: 'name', header: 'İsim / Firma', width: 30, aliases: ['isimfirma', 'isim', 'firma', 'unvan'], note: 'İsteğe bağlı.' },
      { key: 'description', header: 'Açıklama', width: 46, aliases: ['aciklama', 'not'], note: 'İsteğe bağlı.' },
      { key: 'amount', header: 'Tutar', required: true, width: 16, aliases: ['tutar', 'miktar'], note: 'Sıfırdan büyük sayı. Örn. 1250,50' },
    ],
  },
  {
    id: 'deferred',
    name: 'Vadeli Ödemeler',
    label: 'Vadeli Ödemeler',
    tab: 'FFB7791F',
    aliases: ['vadeliodemeler', 'vadeliodeme'],
    columns: [
      { key: 'name', header: 'İsim / Firma', required: true, width: 30, aliases: ['isimfirma', 'isim', 'firma', 'unvan'], note: 'Ödeme yapılacak kişi veya firma.' },
      { key: 'due', header: 'Vade Tarihi', required: true, width: 15, aliases: ['vadetarihi', 'vade'], note: 'GG.AA.YYYY biçiminde.' },
      { key: 'amount', header: 'Tutar', required: true, width: 16, aliases: ['tutar', 'miktar'], note: 'Sıfırdan büyük sayı.' },
      { key: 'method', header: 'Ödeme Yöntemi', width: 18, aliases: ['odemeyontemi', 'yontem', 'odeme'], note: 'Havale, Nakit, Kart veya Çek. Boşsa Havale olur.' },
      { key: 'description', header: 'Açıklama', width: 46, aliases: ['aciklama', 'not'], note: 'İsteğe bağlı.' },
    ],
  },
  {
    id: 'tax',
    name: 'Vergi Ödemeleri',
    label: 'Vergi Ödemeleri',
    tab: 'FF9B2C2C',
    aliases: ['vergiodemeleri', 'vergiler', 'vergi'],
    columns: [
      { key: 'taxType', header: 'Vergi Türü', width: 22, aliases: ['vergituru', 'vergi'], note: 'Listeden seçin. Boşsa "Diğer" olur.' },
      { key: 'period', header: 'Dönem', width: 18, aliases: ['donem'], note: 'Örn. Ekim 2026 (isteğe bağlı).' },
      { key: 'due', header: 'Son Ödeme Günü', required: true, width: 18, aliases: ['sonodemegunu', 'sonodemetarihi', 'vade'], note: 'GG.AA.YYYY biçiminde.' },
      { key: 'amount', header: 'Tutar', required: true, width: 16, aliases: ['tutar', 'miktar'], note: 'Sıfırdan büyük sayı.' },
      { key: 'description', header: 'Açıklama', width: 46, aliases: ['aciklama', 'not'], note: 'İsteğe bağlı.' },
    ],
  },
  {
    id: 'personal',
    name: 'Kişisel Kayıtlar',
    label: 'Kişisel (Ekstra) Kayıtlar',
    tab: 'FF1E5B91',
    aliases: ['kisiselkayitlar', 'kisisel', 'ekstragiderler', 'ekstra'],
    columns: [
      { key: 'person', header: 'Kişi', required: true, width: 24, aliases: ['kisi', 'isim'], note: 'Kişi adı. Kayıtlı değilse otomatik eklenir.' },
      { key: 'date', header: 'Tarih', required: true, width: 14, aliases: ['tarih'], note: 'GG.AA.YYYY biçiminde.' },
      { key: 'sign', header: 'İşlem', required: true, width: 14, aliases: ['islem', 'tur'], note: 'Gelir (+) veya Gider (-) (listeden seçin).' },
      { key: 'method', header: 'Ödeme', width: 14, aliases: ['odeme', 'odemeyontemi'], note: 'Nakit, Havale veya Kart. Boşsa Nakit olur.' },
      { key: 'amount', header: 'Tutar', required: true, width: 16, aliases: ['tutar', 'miktar'], note: 'Sıfırdan büyük sayı.' },
      { key: 'description', header: 'Açıklama', width: 46, aliases: ['aciklama', 'not'], note: 'İsteğe bağlı.' },
    ],
  },
];

const TAX_TYPE_LIST = ['KDV', 'Muhtasar', 'SGK', 'Gelir Vergisi', 'Kurumlar Vergisi', 'Konaklama Vergisi', 'Damga Vergisi', 'Diğer'];

function normalizeKey(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]/g, '');
}

// ---------------------------------------------------------------- ŞABLON

function setXlCell(cell, value, style = {}) {
  cell.value = value;
  Object.assign(cell, style);
}

function buildInfoSheet(ws, listsInfo) {
  ws.views = [{ showGridLines: false }];
  ws.properties.tabColor = { argb: 'FF111827' };
  ws.columns = [{ width: 3 }, { width: 24 }, { width: 28 }, { width: 12 }, { width: 78 }];
  const wrap = { vertical: 'middle', wrapText: true };
  let row = 1;

  ws.mergeCells(row, 2, row, 5);
  setXlCell(ws.getCell(row, 2), "L'UVA CAVE MUHASEBE  ·  Toplu Giriş Şablonu", {
    font: { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: XL_GREEN } },
    alignment: { vertical: 'middle', indent: 1 },
  });
  ws.getRow(row).height = 40;
  row += 1;

  ws.mergeCells(row, 2, row, 5);
  setXlCell(ws.getCell(row, 2), `Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}   ·   Kayıtlı kategori sayısı: ${listsInfo.categoryCount}`, {
    font: { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF6B7280' } },
    alignment: { vertical: 'middle', indent: 1 },
  });
  row += 2;

  const section = (title) => {
    ws.mergeCells(row, 2, row, 5);
    setXlCell(ws.getCell(row, 2), title, {
      font: { name: 'Calibri', size: 12, bold: true, color: { argb: XL_GREEN } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: XL_LIGHT } },
      alignment: { vertical: 'middle', indent: 1 },
    });
    ws.getRow(row).height = 22;
    row += 1;
  };

  const textLine = (text, height = 20) => {
    ws.mergeCells(row, 2, row, 5);
    setXlCell(ws.getCell(row, 2), text, { font: { name: 'Calibri', size: 11 }, alignment: { ...wrap, indent: 1 } });
    ws.getRow(row).height = height;
    row += 1;
  };

  section('NASIL KULLANILIR?');
  textLine('1.  Veri girmek istediğiniz sayfayı açın (Gelir-Gider, Vadeli Ödemeler, Vergi Ödemeleri, Kişisel Kayıtlar). Kullanmadığınız sayfaları boş bırakın.');
  textLine('2.  Başlık satırının altındaki satırlara kayıtlarınızı yazın. Yeşil/kırmızı renkler ve açılır listeler size yardımcı olur.');
  textLine("3.  Dosyayı kaydedin (.xlsx olarak kalmalı) ve programda  'Excel ile Giriş'  sekmesinden yükleyin.");
  textLine('4.  Program satırları denetler, önizleme gösterir; hatalı satırları sebebiyle birlikte listeler. Onayladığınızda kayıtlar eklenir.');
  textLine('5.  Aynı dosyayı yanlışlıkla ikinci kez yüklerseniz zaten kayıtlı satırlar otomatik atlanır.');
  row += 1;

  section('SAYFALAR VE SÜTUNLAR');
  const headers = ['Sayfa', 'Sütun', 'Zorunlu', 'Biçim / açıklama'];
  headers.forEach((text, index) => {
    setXlCell(ws.getCell(row, 2 + index), text, {
      font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: XL_GREEN } },
      alignment: { vertical: 'middle', indent: 1 },
    });
  });
  ws.getRow(row).height = 22;
  row += 1;

  IMPORT_SHEETS.forEach((spec) => {
    spec.columns.forEach((column, index) => {
      const cells = [index === 0 ? spec.name : '', column.header, column.required ? 'Evet' : 'Hayır', column.note];
      cells.forEach((text, cellIndex) => {
        setXlCell(ws.getCell(row, 2 + cellIndex), text, {
          font: { name: 'Calibri', size: 11, bold: cellIndex === 0 || (cellIndex === 2 && column.required), color: { argb: cellIndex === 2 && column.required ? 'FF9B2C2C' : 'FF111827' } },
          alignment: { ...wrap, indent: 1 },
          border: { bottom: { style: 'thin', color: { argb: XL_GRID } } },
        });
      });
      ws.getRow(row).height = 20;
      row += 1;
    });
  });
  row += 1;

  section('ÖRNEK SATIRLAR (yalnızca bilgi için; bu sayfa içe aktarılmaz)');
  textLine('Gelir-Gider:   15.10.2026  |  Gelir  |  Oda Geliri  |  Ahmet Yılmaz  |  3 gece konaklama  |  4.500,00');
  textLine('Gelir-Gider:   16.10.2026  |  Gider  |  Elektrik  |  Enerji A.Ş.  |  Eylül faturası  |  2.340,75');
  textLine('Vadeli Ödemeler:   Temizlik Ltd.  |  30.10.2026  |  12.000,00  |  Havale  |  Ekim temizlik hizmeti');
  textLine('Vergi Ödemeleri:   KDV  |  Eylül 2026  |  26.10.2026  |  18.750,00  |  Eylül dönemi KDV');
  textLine('Kişisel Kayıtlar:   Mehmet  |  15.10.2026  |  Gider (-)  |  Nakit  |  450,00  |  Market');
  row += 1;

  section('ÖNEMLİ KURALLAR');
  textLine('•  Sayfa adlarını ve başlık satırını değiştirmeyin. Sütunların sırası değişebilir, ama başlık adları aynı kalmalıdır.', 20);
  textLine('•  Tarih: GG.AA.YYYY (15.10.2026) ya da YYYY-AA-GG yazabilirsiniz; Excel tarih hücreleri de kabul edilir.', 20);
  textLine('•  Tutar: pozitif sayı. 1250,50 ya da 1.250,50 yazılabilir. Gelir/gider yönünü "Tür" sütunu belirler, tutara eksi işareti koymayın.', 34);
  textLine('•  Kategori listesi programdaki mevcut kategorilerden gelir. Listede olmayan bir kategori yazarsanız program onu otomatik ekler.', 34);
  textLine('•  Tamamen boş satırlar yok sayılır. Bir satırda zorunlu bilgi eksik veya hatalıysa o satır atlanır ve önizlemede sebebi gösterilir.', 34);
  textLine('•  Her sayfada en fazla 1.000 hazır satır vardır; daha fazlası için satırları aşağı doğru kopyalayabilirsiniz.', 20);

  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}

function buildListsSheet(ws) {
  ws.properties.tabColor = { argb: 'FF6B7280' };
  const categories = [];
  [...getTypeOptions('gelir'), ...getTypeOptions('gider')].forEach((name) => {
    if (!categories.some((item) => item.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'))) categories.push(name);
  });
  const people = state.extraPeople.map((person) => person.name);

  const lists = [
    { id: 'types', title: 'Tür', items: ['Gelir', 'Gider'] },
    { id: 'categories', title: 'Kategori', items: categories },
    { id: 'methods', title: 'Ödeme Yöntemi (Vadeli)', items: ['Havale', 'Nakit', 'Kart', 'Çek'] },
    { id: 'taxTypes', title: 'Vergi Türü', items: TAX_TYPE_LIST },
    { id: 'personalMethods', title: 'Ödeme (Kişisel)', items: ['Nakit', 'Havale', 'Kart'] },
    { id: 'signs', title: 'İşlem (Kişisel)', items: ['Gelir (+)', 'Gider (-)'] },
    { id: 'people', title: 'Kişiler', items: people },
  ];

  const ranges = {};
  lists.forEach((list, index) => {
    const column = index + 1;
    ws.getColumn(column).width = 26;
    setXlCell(ws.getCell(1, column), list.title, {
      font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } },
      alignment: { vertical: 'middle', indent: 1 },
    });
    list.items.forEach((item, itemIndex) => {
      ws.getCell(itemIndex + 2, column).value = item;
    });
    const letter = ws.getColumn(column).letter;
    ranges[list.id] = list.items.length ? `Listeler!$${letter}$2:$${letter}$${list.items.length + 1}` : null;
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  return { ranges, categoryCount: categories.length };
}

function buildDataSheet(ws, spec, ranges, rows = []) {
  const lastRow = Math.max(TEMPLATE_ROWS, rows.length + 200) + 1;
  ws.properties.tabColor = { argb: spec.tab };
  ws.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }];
  ws.columns = spec.columns.map((column) => ({ width: column.width }));

  const border = { top: { style: 'thin', color: { argb: XL_GRID } }, bottom: { style: 'thin', color: { argb: XL_GRID } }, left: { style: 'thin', color: { argb: XL_GRID } }, right: { style: 'thin', color: { argb: XL_GRID } } };

  spec.columns.forEach((column, index) => {
    const headerCell = ws.getCell(1, index + 1);
    setXlCell(headerCell, column.required ? `${column.header} *` : column.header, {
      font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: XL_GREEN } },
      alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
      border,
    });
    headerCell.note = column.note;
  });
  ws.getRow(1).height = 26;
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: spec.columns.length } };

  const listFor = (key) => {
    if (key === 'type') return { range: ranges.types, strict: true };
    if (key === 'category') return { range: ranges.categories, strict: false };
    if (key === 'taxType') return { range: ranges.taxTypes, strict: false };
    if (key === 'sign') return { range: ranges.signs, strict: true };
    if (key === 'person') return { range: ranges.people, strict: false };
    if (key === 'method') return { range: spec.id === 'personal' ? ranges.personalMethods : ranges.methods, strict: false };
    return null;
  };

  const dateValidation = {
    type: 'date',
    operator: 'between',
    allowBlank: true,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Geçersiz tarih',
    error: 'Tarihi GG.AA.YYYY biçiminde girin (2000-2100 arası).',
    formulae: [new Date(Date.UTC(2000, 0, 1)), new Date(Date.UTC(2100, 11, 31))],
  };
  const amountValidation = {
    type: 'decimal',
    operator: 'greaterThan',
    allowBlank: true,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Geçersiz tutar',
    error: 'Tutar sıfırdan büyük bir sayı olmalıdır. Gelir/gider yönü için eksi işareti kullanmayın.',
    formulae: [0],
  };

  for (let rowIndex = 2; rowIndex <= lastRow; rowIndex += 1) {
    spec.columns.forEach((column, index) => {
      const cell = ws.getCell(rowIndex, index + 1);
      cell.border = border;
      cell.font = { name: 'Calibri', size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: column.key === 'amount' ? 'right' : undefined };

      if (column.key === 'date' || column.key === 'due') {
        cell.numFmt = 'dd.mm.yyyy';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.dataValidation = dateValidation;
      } else if (column.key === 'amount') {
        cell.numFmt = '#,##0.00 "₺"';
        cell.dataValidation = amountValidation;
      } else {
        const list = listFor(column.key);
        if (list?.range) {
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [list.range],
            showErrorMessage: true,
            errorStyle: list.strict ? 'stop' : 'warning',
            errorTitle: list.strict ? 'Geçersiz değer' : 'Listede yok',
            error: list.strict ? 'Lütfen listeden bir değer seçin.' : 'Bu değer listede yok. Yine de kullanılsın mı?',
          };
        }
      }
    });
  }

  rows.forEach((values, rowOffset) => {
    values.forEach((value, columnOffset) => {
      if (value !== null && value !== undefined && value !== '') ws.getCell(rowOffset + 2, columnOffset + 1).value = value;
    });
  });

  const typeIndex = spec.columns.findIndex((column) => column.key === 'type' || column.key === 'sign');
  if (typeIndex >= 0) {
    const letter = ws.getColumn(typeIndex + 1).letter;
    const makeRule = (formula, fill, color) => ({
      type: 'expression',
      formulae: [formula],
      style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: fill } }, font: { bold: true, color: { argb: color } } },
    });
    ws.addConditionalFormatting({
      ref: `${letter}2:${letter}${lastRow}`,
      rules: [
        makeRule(`LEFT($${letter}2,5)="Gelir"`, 'FFDCFCE7', 'FF166534'),
        makeRule(`LEFT($${letter}2,5)="Gider"`, 'FFFEE2E2', 'FF991B1B'),
      ],
    });
  }

  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}

async function buildWorkbookFile(dataRows, fileName, button) {
  if (!window.ExcelJS) {
    window.alert('Excel kütüphanesi yüklenemedi. "vendor" klasöründe exceljs.min.js dosyasının bulunduğundan emin olun.');
    return;
  }

  button.disabled = true;
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "L'UVA CAVE Muhasebe";
    workbook.created = new Date();
    workbook.title = 'Toplu Giriş Şablonu';

    const infoSheet = workbook.addWorksheet('Açıklama');
    const dataSheets = IMPORT_SHEETS.map((spec) => ({ spec, ws: workbook.addWorksheet(spec.name) }));
    const listsSheet = workbook.addWorksheet('Listeler');

    const listsInfo = buildListsSheet(listsSheet);
    dataSheets.forEach(({ spec, ws }) => buildDataSheet(ws, spec, listsInfo.ranges, dataRows[spec.id] || []));
    buildInfoSheet(infoSheet, listsInfo);
    workbook.views = [{ activeTab: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      fileName
    );
  } catch (error) {
    console.error(error);
    window.alert(`Excel dosyası oluşturulamadı: ${error.message}`);
  } finally {
    button.disabled = false;
  }
}

function toUtcDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// Mevcut kayıtları şablonla aynı biçimde dışa aktarır (geri yüklenebilir, muhasebeciye verilebilir).
function exportTemplateData() {
  const from = exportFromInput.value;
  const to = exportToInput.value;
  const inRange = (date) => (!from || date >= from) && (!to || date <= to);
  const byDate = (first, second) => first.date.localeCompare(second.date);

  const dataRows = {
    transactions: state.records.filter((item) => inRange(item.date)).sort(byDate).map((item) => [
      toUtcDate(item.date),
      item.type === 'gelir' ? 'Gelir' : 'Gider',
      item.category,
      item.name_company,
      item.description,
      item.amount,
    ]),
    deferred: state.deferredPayments.filter((item) => item.status === 'pending').map((item) => [
      item.name_company,
      toUtcDate(item.due_date),
      item.amount,
      item.payment_method,
      item.description,
    ]),
    tax: state.taxPayments.filter((item) => item.status === 'pending').map((item) => [
      item.tax_type,
      item.period,
      toUtcDate(item.due_date),
      item.amount,
      item.description,
    ]),
    personal: state.extraExpenses.filter((item) => inRange(item.date)).sort(byDate).map((item) => [
      item.person_name,
      toUtcDate(item.date),
      item.sign === '+' ? 'Gelir (+)' : 'Gider (-)',
      item.payment_method,
      item.amount,
      item.description,
    ]),
  };

  return buildWorkbookFile(dataRows, `LUVA-CAVE-kayitlar-${getTodayISO()}.xlsx`, exportTemplateBtn);
}

function downloadTemplate() {
  return buildWorkbookFile({}, 'LUVA-CAVE-toplu-giris-sablonu.xlsx', templateDownloadBtn);
}

// ---------------------------------------------------------------- OKUMA

function plainCellValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    if (value.error) return '';
    if ('result' in value) return plainCellValue(value.result);
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
    if ('text' in value) return plainCellValue(value.text);
    if ('hyperlink' in value) return String(value.hyperlink);
  }
  return value;
}

function isoFromUtcDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function parseImportDate(raw) {
  let year;
  let month;
  let day;

  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    [year, month, day] = [raw.getUTCFullYear(), raw.getUTCMonth() + 1, raw.getUTCDate()];
  } else if (typeof raw === 'number') {
    if (raw < 20000 || raw > 80000) return null;
    const date = new Date(Math.round((raw - 25569) * 86400000));
    [year, month, day] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
  } else {
    const text = String(raw).trim();
    let match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (match) {
      [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
    } else {
      match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (!match) return null;
      [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    }
  }

  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  if (year < 2000 || year > 2100) return null;
  return isoFromUtcDate(check);
}

function parseImportAmount(raw) {
  let value;
  if (typeof raw === 'number') {
    value = raw;
  } else {
    let text = String(raw).trim().replace(/[₺\s]|TL|TRY/gi, '');
    if (!text || !/^[-+]?[\d.,]+$/.test(text)) return null;
    const lastComma = text.lastIndexOf(',');
    const lastDot = text.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) {
      text = lastComma > lastDot ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
    } else if (lastComma >= 0) {
      text = text.replace(/\./g, '').replace(',', '.');
    } else if (lastDot >= 0 && /^[-+]?\d{1,3}(\.\d{3})+$/.test(text)) {
      text = text.replace(/\./g, '');
    }
    value = Number(text);
  }

  if (!Number.isFinite(value)) return null;
  return roundMoney(value);
}

function parseDirection(raw) {
  const text = String(raw).trim().toLocaleLowerCase('tr-TR');
  if (text.startsWith('gelir') || text === '+' || text === 'g' || text === 'artı') return 'gelir';
  if (text.startsWith('gider') || text === '-' || text === '−' || text === 'eksi') return 'gider';
  return null;
}

function parseImportRow(spec, get) {
  const errors = [];
  const text = (key, max) => {
    const raw = get(key);
    const value = raw instanceof Date
      ? raw.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      : String(raw ?? '').trim();
    return max ? value.slice(0, max) : value;
  };
  const date = (key, label) => {
    const raw = get(key);
    if (raw === '' || raw === null) {
      errors.push(`${label} boş`);
      return null;
    }
    const parsed = parseImportDate(raw);
    if (!parsed) errors.push(`${label} geçersiz ("${text(key)}")`);
    return parsed;
  };
  const amount = () => {
    const raw = get('amount');
    if (raw === '' || raw === null) {
      errors.push('Tutar boş');
      return null;
    }
    const parsed = parseImportAmount(raw);
    if (parsed === null || parsed <= 0) {
      errors.push(`Tutar geçersiz ("${text('amount')}")`);
      return null;
    }
    return parsed;
  };

  let record;
  if (spec.id === 'transactions') {
    const rowDate = date('date', 'Tarih');
    const direction = parseDirection(get('type'));
    if (!direction) errors.push(`Tür "Gelir" veya "Gider" olmalı ("${text('type')}")`);
    record = {
      date: rowDate,
      type: direction,
      category: text('category', 60) || 'Diğer',
      name_company: text('name', 100),
      description: text('description', 150) || 'Açıklama yok',
      amount: amount(),
    };
  } else if (spec.id === 'deferred') {
    const name = text('name', 100);
    if (!name) errors.push('İsim / Firma boş');
    record = {
      name_company: name,
      due_date: date('due', 'Vade tarihi'),
      amount: amount(),
      payment_method: text('method', 30) || 'Havale',
      description: text('description', 150),
    };
  } else if (spec.id === 'tax') {
    record = {
      tax_type: text('taxType', 40) || 'Diğer',
      period: text('period', 40),
      due_date: date('due', 'Son ödeme günü'),
      amount: amount(),
      description: text('description', 150),
    };
  } else {
    const person = text('person', 50);
    if (!person) errors.push('Kişi boş');
    const direction = parseDirection(get('sign'));
    if (!direction) errors.push(`İşlem "Gelir (+)" veya "Gider (-)" olmalı ("${text('sign')}")`);
    record = {
      person,
      date: date('date', 'Tarih'),
      sign: direction === 'gelir' ? '+' : '-',
      payment_method: text('method', 30) || 'Nakit',
      amount: amount(),
      description: text('description', 100) || 'Açıklama yok',
    };
  }

  return errors.length ? { errors } : { record };
}

function findSheetSpec(sheetName) {
  const key = normalizeKey(sheetName);
  return IMPORT_SHEETS.find((spec) => spec.aliases.includes(key));
}

function detectHeaderRow(ws, spec) {
  const limit = Math.min(10, ws.rowCount);
  for (let rowIndex = 1; rowIndex <= limit; rowIndex += 1) {
    const map = {};
    const row = ws.getRow(rowIndex);
    for (let columnIndex = 1; columnIndex <= Math.max(ws.columnCount, row.cellCount); columnIndex += 1) {
      const key = normalizeKey(plainCellValue(row.getCell(columnIndex).value));
      if (!key) continue;
      const column = spec.columns.find((item) => item.aliases.includes(key) && !(item.key in map));
      if (column) map[column.key] = columnIndex;
    }
    if (spec.columns.filter((column) => column.required).every((column) => column.key in map)) {
      return { rowIndex, map };
    }
  }
  return null;
}

function recordKey(spec, record) {
  const lower = (value) => String(value ?? '').trim().toLocaleLowerCase('tr-TR');
  const cents = Math.round(Number(record.amount) * 100);
  if (spec.id === 'transactions') return [record.date, record.type, lower(record.category), cents, lower(record.name_company), lower(record.description)].join('|');
  if (spec.id === 'deferred') return [lower(record.name_company), record.due_date, cents, lower(record.description)].join('|');
  if (spec.id === 'tax') return [lower(record.tax_type), lower(record.period), record.due_date, cents].join('|');
  return [lower(record.person), record.date, record.sign, cents, lower(record.description)].join('|');
}

function getExistingKeyCounts(spec) {
  const counts = new Map();
  let existing = [];
  if (spec.id === 'transactions') {
    existing = state.records.map((item) => ({ ...item, description: item.description || 'Açıklama yok' }));
  } else if (spec.id === 'deferred') {
    existing = state.deferredPayments;
  } else if (spec.id === 'tax') {
    existing = state.taxPayments;
  } else {
    existing = state.extraExpenses.map((item) => ({ person: item.person_name, date: item.date, sign: item.sign, amount: item.amount, description: item.description }));
  }

  existing.forEach((item) => {
    const key = recordKey(spec, item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

async function parseImportFile(file) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const sheets = [];
  const notes = [];

  workbook.worksheets.forEach((ws) => {
    const spec = findSheetSpec(ws.name);
    if (!spec) {
      if (!['aciklama', 'listeler'].includes(normalizeKey(ws.name))) notes.push(`"${ws.name}" sayfası tanınmadı ve atlandı.`);
      return;
    }

    const header = detectHeaderRow(ws, spec);
    const result = { spec, total: 0, items: [], errors: [] };
    sheets.push(result);

    if (!header) {
      const required = spec.columns.filter((column) => column.required).map((column) => column.header).join(', ');
      result.errors.push({ row: 1, message: `Başlık satırı bulunamadı. Zorunlu sütunlar: ${required}` });
      return;
    }

    const lastRow = Math.min(ws.rowCount, header.rowIndex + MAX_IMPORT_ROWS);
    for (let rowIndex = header.rowIndex + 1; rowIndex <= lastRow; rowIndex += 1) {
      const row = ws.getRow(rowIndex);
      const get = (key) => (key in header.map ? plainCellValue(row.getCell(header.map[key]).value) : '');
      const hasData = spec.columns.some((column) => String(get(column.key) instanceof Date ? 'x' : get(column.key)).trim() !== '');
      if (!hasData) continue;

      result.total += 1;
      const parsed = parseImportRow(spec, get);
      if (parsed.errors) {
        result.errors.push({ row: rowIndex, message: parsed.errors.join('; ') });
      } else {
        result.items.push({ row: rowIndex, record: parsed.record, duplicate: false });
      }
    }

    const counts = getExistingKeyCounts(spec);
    result.items.forEach((item) => {
      const key = recordKey(spec, item.record);
      const remaining = counts.get(key) || 0;
      if (remaining > 0) {
        item.duplicate = true;
        counts.set(key, remaining - 1);
      }
    });
  });

  return { sheets, notes, fileName: file.name, includeDuplicates: false };
}

// ---------------------------------------------------------------- ÖNİZLEME

function getImportableItems(plan) {
  return plan.sheets.flatMap((sheet) => sheet.items
    .filter((item) => plan.includeDuplicates || !item.duplicate)
    .map((item) => ({ spec: sheet.spec, ...item })));
}

function renderImportPreview() {
  const plan = pendingImport;
  if (!plan) {
    importPreviewEl.innerHTML = '';
    return;
  }

  if (!plan.sheets.length) {
    importPreviewEl.innerHTML = `<div class="import-errors">Bu dosyada tanınan bir sayfa bulunamadı. Lütfen programdan indirdiğiniz şablonu kullanın (sayfa adları: ${IMPORT_SHEETS.map((spec) => escapeHtml(spec.name)).join(', ')}).</div>`;
    return;
  }

  const importable = getImportableItems(plan);
  const errorLines = plan.sheets.flatMap((sheet) => sheet.errors.map((error) => `${escapeHtml(sheet.spec.name)} · satır ${error.row}: ${escapeHtml(error.message)}`));

  const rows = plan.sheets.map((sheet) => {
    const duplicates = sheet.items.filter((item) => item.duplicate).length;
    const toAdd = sheet.items.length - (plan.includeDuplicates ? 0 : duplicates);
    let extra = '';
    if (sheet.spec.id === 'transactions') {
      const used = sheet.items.filter((item) => plan.includeDuplicates || !item.duplicate).map((item) => item.record);
      extra = `<br><small>Gelir: ${formatCurrency(sumAmounts(used.filter((record) => record.type === 'gelir')))} · Gider: ${formatCurrency(sumAmounts(used.filter((record) => record.type === 'gider')))}</small>`;
    }
    return `<tr>
      <td>${escapeHtml(sheet.spec.label)}${extra}</td>
      <td>${sheet.total}</td>
      <td><strong>${toAdd}</strong></td>
      <td>${plan.includeDuplicates ? 0 : duplicates}</td>
      <td>${sheet.errors.length}</td>
    </tr>`;
  }).join('');

  importPreviewEl.innerHTML = `
    <p><strong>${escapeHtml(plan.fileName)}</strong> dosyası okundu. Aşağıdaki özeti kontrol edip onaylayın.</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Sayfa</th><th>Okunan satır</th><th>Eklenecek</th><th>Zaten kayıtlı (atlanacak)</th><th>Hatalı (atlanacak)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${plan.notes.length ? `<div class="import-errors warn">${plan.notes.map(escapeHtml).join('<br>')}</div>` : ''}
    ${errorLines.length ? `<div class="import-errors"><strong>Hatalı satırlar (${errorLines.length}) içe aktarılmayacak:</strong><br>${errorLines.slice(0, 100).join('<br>')}${errorLines.length > 100 ? `<br>… ve ${errorLines.length - 100} satır daha` : ''}</div>` : ''}
    <label class="inline-check">
      <input type="checkbox" id="importDuplicatesInput" ${plan.includeDuplicates ? 'checked' : ''} />
      <span>Zaten kayıtlı görünen satırları da tekrar ekle</span>
    </label>
    <div class="reminder-controls import-controls">
      <button class="primary-btn" type="button" data-import-confirm ${importable.length ? '' : 'disabled'}>${importable.length} kaydı içe aktar</button>
      <button class="secondary-btn" type="button" data-import-cancel>Vazgeç</button>
    </div>`;
}

// ---------------------------------------------------------------- AKTARMA

function resolveCategory(type, name, addedCategories) {
  const wanted = name.toLocaleLowerCase('tr-TR');
  const known = [...getTypeOptions(type), ...(addedCategories[type] || [])]
    .find((item) => item.toLocaleLowerCase('tr-TR') === wanted);
  if (known) return known;

  state.db.run('INSERT OR IGNORE INTO category_options (type, name) VALUES (?, ?)', [type, name]);
  addedCategories[type] = [...(addedCategories[type] || []), name];
  return name;
}

async function runImport() {
  if (!pendingImport || importBusy) return;
  const items = getImportableItems(pendingImport);
  if (!items.length) return;

  if (!window.confirm(`${items.length} kayıt programa eklenecek. Devam edilsin mi?`)) return;

  importBusy = true;
  try {
    ensureDbReady();
    if (!(await createSafetyBackup('İçe aktarma işlemine'))) return;

    const counts = { transactions: 0, deferred: 0, tax: 0, personal: 0 };
    const addedCategories = {};
    const people = new Map(getExtraPeopleFromDatabase().map((person) => [person.name.toLocaleLowerCase('tr-TR'), person]));

    state.db.run('BEGIN');
    try {
      items.forEach(({ spec, record }) => {
        if (spec.id === 'transactions') {
          const category = resolveCategory(record.type, record.category, addedCategories);
          state.db.run(
            'INSERT INTO transactions (id, date, type, category, amount, description, name_company) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), record.date, record.type, category, record.amount, record.description, record.name_company]
          );
        } else if (spec.id === 'deferred') {
          state.db.run(
            "INSERT INTO deferred_payments (id, name_company, amount, due_date, payment_method, description, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
            [crypto.randomUUID(), record.name_company, record.amount, record.due_date, record.payment_method, record.description]
          );
        } else if (spec.id === 'tax') {
          state.db.run(
            "INSERT INTO tax_payments (id, tax_type, period, amount, due_date, description, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
            [crypto.randomUUID(), record.tax_type, record.period, record.amount, record.due_date, record.description]
          );
        } else {
          const personKey = record.person.toLocaleLowerCase('tr-TR');
          let person = people.get(personKey);
          if (!person) {
            person = { id: crypto.randomUUID(), name: record.person };
            state.db.run('INSERT INTO personal_people (id, name) VALUES (?, ?)', [person.id, person.name]);
            people.set(personKey, person);
          }
          state.db.run(
            'INSERT INTO personal_expenses (id, person_id, date, amount, sign, payment_method, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), person.id, record.date, record.amount, record.sign, record.payment_method, record.description]
          );
        }
        counts[spec.id] += 1;
      });
      state.db.run('COMMIT');
    } catch (error) {
      state.db.run('ROLLBACK');
      throw error;
    }

    await saveDbToIndexedDb();
    state.records = getRecordsFromDatabase();
    state.deferredPayments = getDeferredPaymentsFromDatabase();
    state.taxPayments = getTaxPaymentsFromDatabase();
    renderAll();
    showDueWarningIfNeeded();
    showTaxReminderIfNeeded();

    const summary = IMPORT_SHEETS.filter((spec) => counts[spec.id]).map((spec) => `${spec.label}: ${counts[spec.id]}`).join(' · ');
    pendingImport = null;
    importPreviewEl.innerHTML = `<div class="import-errors warn"><strong>İçe aktarma tamamlandı.</strong> ${escapeHtml(summary)}</div>`;
  } catch (error) {
    console.error(error);
    window.alert(`İçe aktarma yapılamadı, hiçbir kayıt eklenmedi: ${error.message}`);
  } finally {
    importBusy = false;
  }
}

async function handleImportFile(file) {
  if (!file) return;
  if (!window.ExcelJS) {
    window.alert('Excel kütüphanesi yüklenemedi. "vendor" klasöründe exceljs.min.js dosyasının bulunduğundan emin olun.');
    return;
  }

  importPreviewEl.innerHTML = '<p>Dosya okunuyor…</p>';
  try {
    ensureDbReady();
    pendingImport = await parseImportFile(file);
    renderImportPreview();
  } catch (error) {
    console.error(error);
    pendingImport = null;
    importPreviewEl.innerHTML = `<div class="import-errors">Dosya okunamadı: ${escapeHtml(error.message)}<br>Dosyanın .xlsx biçiminde olduğundan emin olun.</div>`;
  }
}

templateDownloadBtn.addEventListener('click', downloadTemplate);
exportTemplateBtn.addEventListener('click', exportTemplateData);
importPickBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', async () => {
  const file = importFileInput.files[0];
  importFileInput.value = '';
  await handleImportFile(file);
});
importPreviewEl.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.hasAttribute('data-import-confirm')) {
    runImport();
  } else if (target.hasAttribute('data-import-cancel')) {
    pendingImport = null;
    renderImportPreview();
  }
});
importPreviewEl.addEventListener('change', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.id === 'importDuplicatesInput' && pendingImport) {
    pendingImport.includeDuplicates = target.checked;
    renderImportPreview();
  }
});
