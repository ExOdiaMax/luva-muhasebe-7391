// Biçimli .xlsx raporu ve Aylık Özet (ekran + PDF).
// script.js'ten getFilteredRecords, getAllRecords, sumAmounts, roundMoney, formatCurrency, escapeHtml,
// downloadBlob, getPdfFontBase64, getTodayISO vb. kullanır.

const monthlyMonthInput = document.getElementById('monthlyMonthInput');
const monthlyScopeInput = document.getElementById('monthlyScopeInput');
const monthlyPdfBtn = document.getElementById('monthlyPdfBtn');
const monthlyContent = document.getElementById('monthlyContent');

const REPORT_GREEN = 'FF245B47';
const REPORT_LIGHT = 'FFE8F1ED';
const REPORT_GRID = 'FFD9DEE3';
const MONEY_FORMAT = '#,##0.00 "₺"';
const NET_FORMAT = '#,##0.00 "₺";[Red]-#,##0.00 "₺"';

// ---------------------------------------------------------------- .XLSX RAPORU

function reportFill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function styleReportHeader(row, count) {
  for (let column = 1; column <= count; column += 1) {
    const cell = row.getCell(column);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = reportFill(REPORT_GREEN);
    cell.alignment = { vertical: 'middle', horizontal: column === 1 ? 'left' : 'center', indent: column === 1 ? 1 : 0 };
  }
  row.height = 22;
}

function styleReportBody(row, count, { bold = false, fill = null } = {}) {
  for (let column = 1; column <= count; column += 1) {
    const cell = row.getCell(column);
    cell.font = { name: 'Calibri', size: 11, bold };
    cell.border = { bottom: { style: 'thin', color: { argb: REPORT_GRID } } };
    if (fill) cell.fill = reportFill(fill);
    if (column === 1) cell.alignment = { vertical: 'middle', indent: 1 };
  }
}

function addReportSection(ws, rowNumber, title, width) {
  ws.mergeCells(rowNumber, 1, rowNumber, width);
  const cell = ws.getCell(rowNumber, 1);
  cell.value = title;
  cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: REPORT_GREEN } };
  cell.fill = reportFill(REPORT_LIGHT);
  cell.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(rowNumber).height = 22;
}

function centsOf(records, predicate) {
  return records.filter(predicate).reduce((total, item) => total + Math.round(Number(item.amount) * 100), 0) / 100;
}

async function exportXlsxReport() {
  if (!window.ExcelJS) {
    window.alert('Excel kütüphanesi yüklenemedi. "vendor" klasöründe exceljs.min.js dosyasının bulunduğundan emin olun.');
    return;
  }

  const records = getFilteredRecords().slice().sort((first, second) => first.date.localeCompare(second.date));
  const lastDataRow = Math.max(records.length + 1, 2);
  const range = (column) => `'Kayıtlar'!$${column}$2:$${column}$${lastDataRow}`;

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "L'UVA CAVE Muhasebe";
    workbook.created = new Date();
    const summary = workbook.addWorksheet('Özet', { views: [{ showGridLines: false }] });
    const data = workbook.addWorksheet('Kayıtlar', { views: [{ state: 'frozen', ySplit: 1 }] });
    summary.properties.tabColor = { argb: REPORT_GREEN };
    data.properties.tabColor = { argb: 'FF1E5B91' };

    // ----- Kayıtlar sayfası
    const headers = ['Tarih', 'Tür', 'Kategori', 'İsim / Firma', 'Açıklama', 'Tutar', 'Kaynak'];
    data.columns = [{ width: 13 }, { width: 10 }, { width: 24 }, { width: 28 }, { width: 46 }, { width: 16 }, { width: 11 }];
    headers.forEach((header, index) => {
      const cell = data.getCell(1, index + 1);
      cell.value = header;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = reportFill(REPORT_GREEN);
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    data.getRow(1).height = 24;
    data.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

    records.forEach((record, index) => {
      const row = data.getRow(index + 2);
      const [year, month, day] = record.date.split('-').map(Number);
      row.values = [
        new Date(Date.UTC(year, month - 1, day)),
        record.type === 'gelir' ? 'Gelir' : 'Gider',
        record.category,
        record.name_company || '',
        record.description || '',
        roundMoney(record.amount),
        record.source === 'personal' ? 'Kişisel' : 'Şirket',
      ];
      row.getCell(1).numFmt = 'dd.mm.yyyy';
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(6).numFmt = MONEY_FORMAT;
      row.eachCell((cell) => {
        cell.border = { bottom: { style: 'thin', color: { argb: REPORT_GRID } } };
        cell.font = { name: 'Calibri', size: 11 };
      });
    });

    if (records.length) {
      const makeRule = (word, fill, color) => ({
        type: 'expression',
        formulae: [`$B2="${word}"`],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: fill } }, font: { bold: true, color: { argb: color } } },
      });
      data.addConditionalFormatting({
        ref: `B2:B${records.length + 1}`,
        rules: [makeRule('Gelir', 'FFDCFCE7', 'FF166534'), makeRule('Gider', 'FFFEE2E2', 'FF991B1B')],
      });
    }
    data.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

    // ----- Özet sayfası
    summary.columns = [{ width: 34 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 3 }];
    summary.mergeCells(1, 1, 1, 4);
    const title = summary.getCell(1, 1);
    title.value = "L'UVA CAVE  ·  Gelir-Gider Raporu";
    title.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    title.fill = reportFill(REPORT_GREEN);
    title.alignment = { vertical: 'middle', indent: 1 };
    summary.getRow(1).height = 38;

    const start = filterStartDate.value;
    const end = filterEndDate.value;
    const period = start || end ? `${start || 'Başlangıç yok'}  →  ${end || 'Bitiş yok'}` : 'Tüm tarihler';
    summary.mergeCells(2, 1, 2, 4);
    const subtitle = summary.getCell(2, 1);
    subtitle.value = `Dönem: ${period}   ·   Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}   ·   ${records.length} kayıt`;
    subtitle.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF6B7280' } };
    subtitle.alignment = { vertical: 'middle', indent: 1 };

    const incomeTotal = centsOf(records, (item) => item.type === 'gelir');
    const expenseTotal = centsOf(records, (item) => item.type === 'gider');

    addReportSection(summary, 4, 'GENEL TOPLAM', 4);
    const totals = [
      ['Toplam Gelir', { formula: `SUMIFS(${range('F')},${range('B')},"Gelir")`, result: incomeTotal }, MONEY_FORMAT],
      ['Toplam Gider', { formula: `SUMIFS(${range('F')},${range('B')},"Gider")`, result: expenseTotal }, MONEY_FORMAT],
      ['Net Bakiye', { formula: 'B5-B6', result: roundMoney(incomeTotal - expenseTotal) }, NET_FORMAT],
      ['İşlem Sayısı', { formula: `COUNTA(${range('B')})`, result: records.length }, '0'],
    ];
    totals.forEach(([label, value, format], index) => {
      const row = summary.getRow(5 + index);
      row.getCell(1).value = label;
      row.getCell(2).value = value;
      row.getCell(2).numFmt = format;
      styleReportBody(row, 2, { bold: index === 2 });
      row.getCell(2).alignment = { horizontal: 'right' };
    });

    // Kategori bazında
    let rowNumber = 10;
    addReportSection(summary, rowNumber, 'KATEGORİ BAZINDA', 4);
    rowNumber += 1;
    ['Kategori', 'Gelir', 'Gider', 'Net'].forEach((text, index) => { summary.getCell(rowNumber, index + 1).value = text; });
    styleReportHeader(summary.getRow(rowNumber), 4);
    rowNumber += 1;

    const categories = [...new Set(records.map((item) => item.category))]
      .map((category) => ({
        category,
        income: centsOf(records, (item) => item.category === category && item.type === 'gelir'),
        expense: centsOf(records, (item) => item.category === category && item.type === 'gider'),
      }))
      .sort((first, second) => (second.income + second.expense) - (first.income + first.expense));

    const categoryStart = rowNumber;
    categories.forEach(({ category, income, expense }) => {
      const row = summary.getRow(rowNumber);
      row.getCell(1).value = category;
      row.getCell(2).value = { formula: `SUMIFS(${range('F')},${range('C')},$A${rowNumber},${range('B')},"Gelir")`, result: income };
      row.getCell(3).value = { formula: `SUMIFS(${range('F')},${range('C')},$A${rowNumber},${range('B')},"Gider")`, result: expense };
      row.getCell(4).value = { formula: `B${rowNumber}-C${rowNumber}`, result: roundMoney(income - expense) };
      [2, 3].forEach((column) => { row.getCell(column).numFmt = MONEY_FORMAT; });
      row.getCell(4).numFmt = NET_FORMAT;
      styleReportBody(row, 4);
      rowNumber += 1;
    });
    if (categories.length) {
      const row = summary.getRow(rowNumber);
      row.getCell(1).value = 'TOPLAM';
      row.getCell(2).value = { formula: `SUM(B${categoryStart}:B${rowNumber - 1})`, result: incomeTotal };
      row.getCell(3).value = { formula: `SUM(C${categoryStart}:C${rowNumber - 1})`, result: expenseTotal };
      row.getCell(4).value = { formula: `SUM(D${categoryStart}:D${rowNumber - 1})`, result: roundMoney(incomeTotal - expenseTotal) };
      [2, 3].forEach((column) => { row.getCell(column).numFmt = MONEY_FORMAT; });
      row.getCell(4).numFmt = NET_FORMAT;
      styleReportBody(row, 4, { bold: true, fill: REPORT_LIGHT });
      rowNumber += 1;
    }
    rowNumber += 1;

    // Aylık dağılım
    addReportSection(summary, rowNumber, 'AYLIK DAĞILIM', 4);
    rowNumber += 1;
    ['Ay', 'Gelir', 'Gider', 'Net'].forEach((text, index) => { summary.getCell(rowNumber, index + 1).value = text; });
    styleReportHeader(summary.getRow(rowNumber), 4);
    rowNumber += 1;

    const monthKeys = [...new Set(records.map((item) => item.date.slice(0, 7)))].sort();
    const monthStart = rowNumber;
    monthKeys.forEach((key) => {
      const [year, month] = key.split('-').map(Number);
      const income = centsOf(records, (item) => item.date.startsWith(key) && item.type === 'gelir');
      const expense = centsOf(records, (item) => item.date.startsWith(key) && item.type === 'gider');
      const row = summary.getRow(rowNumber);
      row.getCell(1).value = new Date(Date.UTC(year, month - 1, 1));
      row.getCell(1).numFmt = 'mmmm yyyy';
      row.getCell(1).alignment = { horizontal: 'left', indent: 1 };
      const monthCriteria = `${range('A')},">="&$A${rowNumber},${range('A')},"<"&EDATE($A${rowNumber},1)`;
      row.getCell(2).value = { formula: `SUMIFS(${range('F')},${range('B')},"Gelir",${monthCriteria})`, result: income };
      row.getCell(3).value = { formula: `SUMIFS(${range('F')},${range('B')},"Gider",${monthCriteria})`, result: expense };
      row.getCell(4).value = { formula: `B${rowNumber}-C${rowNumber}`, result: roundMoney(income - expense) };
      [2, 3].forEach((column) => { row.getCell(column).numFmt = MONEY_FORMAT; });
      row.getCell(4).numFmt = NET_FORMAT;
      styleReportBody(row, 4);
      row.getCell(1).alignment = { horizontal: 'left', indent: 1 };
      rowNumber += 1;
    });
    if (monthKeys.length) {
      const row = summary.getRow(rowNumber);
      row.getCell(1).value = 'TOPLAM';
      row.getCell(2).value = { formula: `SUM(B${monthStart}:B${rowNumber - 1})`, result: incomeTotal };
      row.getCell(3).value = { formula: `SUM(C${monthStart}:C${rowNumber - 1})`, result: expenseTotal };
      row.getCell(4).value = { formula: `SUM(D${monthStart}:D${rowNumber - 1})`, result: roundMoney(incomeTotal - expenseTotal) };
      [2, 3].forEach((column) => { row.getCell(column).numFmt = MONEY_FORMAT; });
      row.getCell(4).numFmt = NET_FORMAT;
      styleReportBody(row, 4, { bold: true, fill: REPORT_LIGHT });
    }
    summary.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'l-uva-cave-muhasebe-raporu.xlsx'
    );
  } catch (error) {
    console.error(error);
    window.alert(`Excel raporu oluşturulamadı: ${error.message}`);
  }
}

// ---------------------------------------------------------------- AYLIK ÖZET

function monthLabelTr(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

function previousMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getSummaryRecords(scope) {
  return getAllRecords().filter((record) => scope === 'all' || record.source !== 'personal');
}

function groupCents(records, type, keyOf) {
  const groups = new Map();
  records.filter((record) => record.type === type).forEach((record) => {
    const key = keyOf(record);
    groups.set(key, (groups.get(key) || 0) + Math.round(Number(record.amount) * 100));
  });
  return groups;
}

function changeRatio(current, previous) {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

function buildMonthlySummary(monthKey, scope) {
  const records = getSummaryRecords(scope);
  const previousKey = previousMonthKey(monthKey);
  const current = records.filter((record) => record.date.startsWith(monthKey));
  const previous = records.filter((record) => record.date.startsWith(previousKey));

  const totalsOf = (list) => {
    const income = sumAmounts(list.filter((record) => record.type === 'gelir'));
    const expense = sumAmounts(list.filter((record) => record.type === 'gider'));
    return { income, expense, net: roundMoney(income - expense), count: list.length };
  };

  const categoryRows = (type) => {
    const now = groupCents(current, type, (record) => record.category);
    const before = groupCents(previous, type, (record) => record.category);
    return [...new Set([...now.keys(), ...before.keys()])]
      .map((category) => {
        const currentValue = (now.get(category) || 0) / 100;
        const previousValue = (before.get(category) || 0) / 100;
        return {
          category,
          current: currentValue,
          previous: previousValue,
          diff: roundMoney(currentValue - previousValue),
          pct: changeRatio(currentValue, previousValue),
        };
      })
      .sort((first, second) => second.current - first.current || second.previous - first.previous);
  };

  const parties = [...groupCents(current, 'gider', (record) => (record.name_company || '').trim()).entries()]
    .filter(([name]) => name)
    .map(([name, cents]) => ({ name, amount: cents / 100 }))
    .sort((first, second) => second.amount - first.amount)
    .slice(0, 5);

  return {
    monthKey,
    previousKey,
    current: totalsOf(current),
    previous: totalsOf(previous),
    incomeRows: categoryRows('gelir'),
    expenseRows: categoryRows('gider'),
    parties,
  };
}

function formatPct(pct) {
  if (pct === null) return '—';
  return `${pct >= 0 ? '+' : '−'}%${Math.abs(pct).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;
}

function formatSignedMoney(value) {
  return `${value >= 0 ? '+' : '−'}${formatCurrency(Math.abs(value))}`;
}

// kind: 'gelir' artışı iyi, 'gider' artışı kötü; 'net' artışı iyi.
function changeColor(kind, diff) {
  if (diff === 0) return 'inherit';
  const good = kind === 'gider' ? diff < 0 : diff > 0;
  return good ? '#4ade80' : '#f87171';
}

function monthlyChangeCells(kind, row) {
  const color = changeColor(kind, row.diff);
  return `<td class="amount-col" style="color:${color}">${formatSignedMoney(row.diff)}</td><td class="amount-col" style="color:${color}">${formatPct(row.pct)}</td>`;
}

function renderMonthlyTable(title, kind, rows, currentLabel, previousLabel) {
  if (!rows.length) return `<h4>${escapeHtml(title)}</h4><p class="empty-state">Bu iki ayda kayıt yok.</p>`;

  const total = {
    current: roundMoney(rows.reduce((sum, row) => sum + row.current, 0)),
    previous: roundMoney(rows.reduce((sum, row) => sum + row.previous, 0)),
  };
  total.diff = roundMoney(total.current - total.previous);
  total.pct = changeRatio(total.current, total.previous);

  return `
    <h4>${escapeHtml(title)}</h4>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Kategori</th><th class="amount-col">${escapeHtml(currentLabel)}</th><th class="amount-col">${escapeHtml(previousLabel)}</th><th class="amount-col">Fark</th><th class="amount-col">Değişim</th></tr></thead>
        <tbody>
          ${rows.map((row) => `<tr><td>${escapeHtml(row.category)}</td><td class="amount-col">${formatCurrency(row.current)}</td><td class="amount-col">${formatCurrency(row.previous)}</td>${monthlyChangeCells(kind, row)}</tr>`).join('')}
          <tr><td><strong>Toplam</strong></td><td class="amount-col"><strong>${formatCurrency(total.current)}</strong></td><td class="amount-col"><strong>${formatCurrency(total.previous)}</strong></td>${monthlyChangeCells(kind, total)}</tr>
        </tbody>
      </table>
    </div>`;
}

function renderMonthlySummary() {
  if (!state.db) return;
  if (!monthlyMonthInput.value) monthlyMonthInput.value = getTodayISO().slice(0, 7);

  const summary = buildMonthlySummary(monthlyMonthInput.value, monthlyScopeInput.value);
  const currentLabel = monthLabelTr(summary.monthKey);
  const previousLabel = monthLabelTr(summary.previousKey);

  const card = (cls, label, icon, now, before, kind) => {
    const diff = roundMoney(now - before);
    return `
      <article class="stat-card ${cls}">
        <div class="stat-header"><span>${label}</span><span class="emoji">${icon}</span></div>
        <h3>${formatCurrency(now)}</h3>
        <small>${escapeHtml(previousLabel)}: ${formatCurrency(before)} ·
          <span style="color:${changeColor(kind, diff)}">${formatSignedMoney(diff)} (${formatPct(changeRatio(now, before))})</span></small>
      </article>`;
  };

  const { current, previous } = summary;
  monthlyContent.innerHTML = `
    <div class="stats-grid">
      ${card('income', 'Gelir', '↗', current.income, previous.income, 'gelir')}
      ${card('expense', 'Gider', '↘', current.expense, previous.expense, 'gider')}
      ${card('balance', 'Net', '◎', current.net, previous.net, 'net')}
      <article class="stat-card count">
        <div class="stat-header"><span>İşlem Sayısı</span><span class="emoji">#</span></div>
        <h3>${current.count}</h3>
        <small>${escapeHtml(previousLabel)}: ${previous.count}</small>
      </article>
    </div>
    ${renderMonthlyTable('Gelir Kategorileri', 'gelir', summary.incomeRows, currentLabel, previousLabel)}
    ${renderMonthlyTable('Gider Kategorileri', 'gider', summary.expenseRows, currentLabel, previousLabel)}
    <h4>${escapeHtml(currentLabel)} en yüksek 5 gider (isim / firma)</h4>
    ${summary.parties.length
    ? `<div class="table-wrap"><table><tbody>${summary.parties.map((party) => `<tr><td>${escapeHtml(party.name)}</td><td class="amount-col">${formatCurrency(party.amount)}</td></tr>`).join('')}</tbody></table></div>`
    : '<p class="empty-state">İsim / firma girilmiş gider yok.</p>'}`;
}

async function exportMonthlyPdf() {
  if (!state.db) return;
  const summary = buildMonthlySummary(monthlyMonthInput.value, monthlyScopeInput.value);
  const currentLabel = monthLabelTr(summary.monthKey);
  const previousLabel = monthLabelTr(summary.previousKey);
  const scopeLabel = monthlyScopeInput.value === 'all' ? 'Şirket + Kişisel kayıtlar' : 'Yalnızca şirket kayıtları';

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  try {
    doc.addFileToVFS('NotoSans-Regular.ttf', await getPdfFontBase64('normal'));
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    doc.addFileToVFS('NotoSans-Bold.ttf', await getPdfFontBase64('bold'));
    doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
  } catch (error) {
    window.alert(`PDF yazı tipi yüklenemedi: ${error.message}`);
    return;
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = { left: 36, right: 36 };
  const baseStyles = { font: 'NotoSans', fontSize: 9, cellPadding: 4 };
  const headStyles = { font: 'NotoSans', fontStyle: 'bold', fillColor: [36, 91, 71] };
  const moneyPdf = (value) => formatCurrency(value);
  const changeText = (row) => `${formatSignedMoney(row.diff)}  ${formatPct(row.pct)}`;

  doc.setFont('NotoSans', 'bold');
  doc.setFontSize(16);
  doc.text("L'UVA CAVE Aylık Özet", 36, 36);
  doc.setFont('NotoSans', 'normal');
  doc.setFontSize(10);
  doc.text(`${currentLabel} (karşılaştırma: ${previousLabel})   ·   ${scopeLabel}   ·   Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`, 36, 54);

  const kpi = (label, now, before) => {
    const diff = roundMoney(now - before);
    return [label, moneyPdf(now), moneyPdf(before), changeText({ diff, pct: changeRatio(now, before) })];
  };
  doc.autoTable({
    head: [['Gösterge', currentLabel, previousLabel, 'Değişim']],
    body: [
      kpi('Gelir', summary.current.income, summary.previous.income),
      kpi('Gider', summary.current.expense, summary.previous.expense),
      kpi('Net', summary.current.net, summary.previous.net),
      ['İşlem sayısı', String(summary.current.count), String(summary.previous.count), ''],
    ],
    startY: 68,
    margin,
    styles: baseStyles,
    headStyles,
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  });

  const addCategoryTable = (title, rows) => {
    let y = doc.lastAutoTable.finalY + 26;
    if (y > pageHeight - 120) {
      doc.addPage();
      y = 48;
    }
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(12);
    doc.text(title, 36, y);
    const totalCurrent = roundMoney(rows.reduce((sum, row) => sum + row.current, 0));
    const totalPrevious = roundMoney(rows.reduce((sum, row) => sum + row.previous, 0));
    doc.autoTable({
      head: [['Kategori', currentLabel, previousLabel, 'Değişim']],
      body: [
        ...rows.map((row) => [row.category, moneyPdf(row.current), moneyPdf(row.previous), changeText(row)]),
        ['Toplam', moneyPdf(totalCurrent), moneyPdf(totalPrevious), changeText({ diff: roundMoney(totalCurrent - totalPrevious), pct: changeRatio(totalCurrent, totalPrevious) })],
      ],
      startY: y + 8,
      margin,
      styles: baseStyles,
      headStyles,
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      didParseCell: (hook) => {
        if (hook.section === 'body' && hook.row.index === rows.length) hook.cell.styles.fontStyle = 'bold';
      },
    });
  };

  if (summary.incomeRows.length) addCategoryTable('Gelir Kategorileri', summary.incomeRows);
  if (summary.expenseRows.length) addCategoryTable('Gider Kategorileri', summary.expenseRows);

  if (summary.parties.length) {
    let y = doc.lastAutoTable.finalY + 26;
    if (y > pageHeight - 120) {
      doc.addPage();
      y = 48;
    }
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(12);
    doc.text(`${currentLabel} en yüksek 5 gider (isim / firma)`, 36, y);
    doc.autoTable({
      body: summary.parties.map((party) => [party.name, moneyPdf(party.amount)]),
      startY: y + 8,
      margin,
      styles: baseStyles,
      columnStyles: { 1: { halign: 'right' } },
    });
  }

  doc.save(`l-uva-cave-aylik-ozet-${summary.monthKey}.pdf`);
}

monthlyMonthInput.value = getTodayISO().slice(0, 7);
monthlyMonthInput.addEventListener('change', renderMonthlySummary);
monthlyScopeInput.addEventListener('change', renderMonthlySummary);
monthlyPdfBtn.addEventListener('click', exportMonthlyPdf);
