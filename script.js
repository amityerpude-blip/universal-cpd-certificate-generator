const $ = (id) => document.getElementById(id);

const fields = {
  schoolName: $('schoolName'), hschoolName: $('hschoolName'),
  regionalOffice: $('regionalOffice'), hregionalOffice: $('hregionalOffice'),
  name: $('name'), hname: $('hname'), post: $('post'), hpost: $('hpost'),
  training: $('training'), htraining: $('htraining'), fromdate: $('fromdate'),
  todate: $('todate'), venue: $('venue'), hvenue: $('hvenue'),
  hours: $('hours'), year: $('year')
};

function formatDate(value) {
  if (!value) return '[Date]';
  const text = String(value).trim();
  if (!text) return '[Date]';
  const date = new Date(`${text}T00:00:00`);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

let signatureDataUrl = '';

function setText(id, value, fallback) {
  const element = $(id);
  if (element) element.textContent = value?.trim() || fallback;
}

function signatureMode() {
  return document.querySelector('input[name="signatureMode"]:checked')?.value || 'with';
}

function applySignatureVisibility() {
  const show = signatureMode() === 'with' && Boolean(signatureDataUrl);
  $('principalBlock').style.display = show ? 'block' : 'none';
}

function updatePreview() {
  const schoolEn = fields.schoolName.value.trim() || '[School / Institution Name]';
  const schoolHi = fields.hschoolName.value.trim() || '[विद्यालय / संस्था का नाम]';
  const officeEn = fields.regionalOffice.value.trim() || '[Regional Office]';
  const officeHi = fields.hregionalOffice.value.trim() || '[क्षेत्रीय कार्यालय]';
  const hours = fields.hours.value || '[Hours]';

  setText('outSchoolName', schoolEn, '[School / Institution Name]');
  setText('outRegionalOffice', fields.regionalOffice.value.trim() ? `Regional Office: ${fields.regionalOffice.value.trim()}` : 'Regional Office: [Regional Office]', 'Regional Office: [Regional Office]');
  setText('outHSchoolName', schoolHi, '[विद्यालय / संस्था का नाम]');
  setText('outHRegionalOffice', officeHi, '[क्षेत्रीय कार्यालय]');
  setText('outSchoolNameEn', schoolEn, '[School / Institution Name]');
  setText('outRegionalOfficeEn', officeEn, '[Regional Office]');
  setText('outName', fields.name.value, '[Name]');
  setText('outHName', fields.hname.value, '[नाम]');
  setText('outPost', fields.post.value, '[Designation]');
  setText('outHPost', fields.hpost.value, '[पदनाम]');
  setText('outTraining', fields.training.value, '[Training / Workshop]');
  setText('outHTraining', fields.htraining.value, '[कार्यशाला का विषय]');
  setText('outFrom', formatDate(fields.fromdate.value), '[Date]');
  setText('outTo', formatDate(fields.todate.value), '[Date]');
  setText('outHFrom', formatDate(fields.fromdate.value), '[Date]');
  setText('outHTo', formatDate(fields.todate.value), '[Date]');
  setText('outVenue', fields.venue.value, '[Venue / Event Location]');
  setText('outHVenue', fields.hvenue.value, '[आयोजन स्थल]');
  setText('outHours', hours, '[Hours]');
  setText('outHoursEn', hours, '[Hours]');
  setText('outHHours', fields.hours.value, '[घंटे]');
  setText('outYear', fields.year.value, String(new Date().getFullYear()));

  const roleOut = document.querySelectorAll('[id="outRole"]');
  roleOut.forEach((element) => { element.textContent = document.querySelector('input[name="role"]:checked')?.value || 'Participant'; });
  $('outHRole').textContent = document.querySelector('input[name="hrole"]:checked')?.value || 'प्रतिभागी';
  applySignatureVisibility();
}

function validate() {
  const required = [
    'schoolName', 'hschoolName', 'name', 'hname', 'post', 'hpost',
    'training', 'htraining', 'fromdate', 'todate', 'venue', 'hvenue', 'hours'
  ];
  for (const key of required) {
    if (!fields[key].value.trim()) {
      fields[key].focus();
      $('validationMessage').textContent = 'Please complete all required fields.';
      return false;
    }
  }
  if (Number(fields.hours.value) <= 0) {
    fields.hours.focus();
    $('validationMessage').textContent = 'Training hours must be greater than 0.';
    return false;
  }
  if (fields.fromdate.value > fields.todate.value) {
    fields.fromdate.focus();
    $('validationMessage').textContent = 'From date cannot be later than To date.';
    return false;
  }
  if (signatureMode() === 'with' && !signatureDataUrl) {
    $('validationMessage').textContent = 'Please upload the Principal signature or select "Without Principal signature".';
    return false;
  }
  $('validationMessage').textContent = '';
  return true;
}

function setSignature(src, label) {
  signatureDataUrl = src || '';
  const image = $('principalSignature');
  image.src = signatureDataUrl;
  image.style.display = signatureDataUrl ? 'block' : 'none';
  $('signatureStatus').textContent = label || 'No signature uploaded.';
  applySignatureVisibility();
}

$('signatureUpload').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    event.target.value = '';
    $('signatureStatus').textContent = 'Please choose a PNG, JPG or WEBP image.';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => setSignature(reader.result, `Uploaded: ${file.name}`);
  reader.readAsDataURL(file);
});

$('removeSignatureBtn').addEventListener('click', () => {
  $('signatureUpload').value = '';
  setSignature('', 'No signature uploaded.');
});

document.querySelectorAll('input[name="signatureMode"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    updatePreview();
    $('validationMessage').textContent = '';
  });
});

function filenameSafe(value, fallback = 'CPD_Certificate') {
  return (String(value || fallback).trim() || fallback)
    .replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 90) || fallback;
}

async function certificateCanvas() {
  await document.fonts.ready;
  return html2canvas($('certificate'), {
    scale: 2.5,
    useCORS: true,
    backgroundColor: '#d9e8f5',
    logging: false
  });
}

function createPdfFromCanvas(canvas) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: [12, 9] });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.97), 'JPEG', 0, 0, 12, 9, undefined, 'FAST');
  return pdf;
}

async function downloadPDF() {
  if (!validate()) return;
  updatePreview();
  const button = $('downloadBtn');
  const topButton = $('downloadTopBtn');
  button.disabled = true;
  topButton.disabled = true;
  const oldText = button.textContent;
  button.textContent = 'Generating PDF…';
  try {
    const canvas = await certificateCanvas();
    const pdf = createPdfFromCanvas(canvas);
    pdf.save(`${filenameSafe(fields.name.value)}_CPD_Certificate.pdf`);
  } catch (error) {
    console.error(error);
    $('validationMessage').textContent = 'PDF generation failed. Please try the Print certificate option.';
  } finally {
    button.disabled = false;
    topButton.disabled = false;
    button.textContent = oldText;
  }
}

function normaliseHeader(value) {
  return String(value || '').toLowerCase().replace(/[\s_\-\/]+/g, '').replace(/[()]/g, '');
}

function cell(row, key, aliases = []) {
  const wanted = [key, ...aliases].map(normaliseHeader);
  const found = Object.keys(row).find((header) => wanted.includes(normaliseHeader(header)));
  return found === undefined ? '' : String(row[found] ?? '').trim();
}

function excelDateToISO(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && window.XLSX?.SSF) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) {
    const [y, m, d] = text.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
}

function rowToCertificate(row) {
  return {
    schoolName: cell(row, 'schoolName', ['School / Institution Name (English)', 'School Name English']),
    hschoolName: cell(row, 'hschoolName', ['विद्यालय / संस्था का नाम (हिंदी)', 'School Name Hindi']),
    regionalOffice: cell(row, 'regionalOffice', ['Regional Office (English)', 'Regional Office']),
    hregionalOffice: cell(row, 'hregionalOffice', ['क्षेत्रीय कार्यालय (हिंदी)', 'Regional Office Hindi']),
    name: cell(row, 'name', ['Name in English', 'Name']),
    hname: cell(row, 'hname', ['नाम हिंदी में', 'Name Hindi']),
    post: cell(row, 'post', ['Post / Designation in English', 'Designation', 'Post']),
    hpost: cell(row, 'hpost', ['पदनाम (विषय) हिंदी में', 'Designation Hindi']),
    training: cell(row, 'training', ['Topic of training in English', 'Training', 'Training Topic']),
    htraining: cell(row, 'htraining', ['कार्यशाला का विषय', 'Training Hindi', 'Training Topic Hindi']),
    fromdate: excelDateToISO(cell(row, 'fromdate', ['From date', 'From Date'])),
    todate: excelDateToISO(cell(row, 'todate', ['To date', 'To Date'])),
    venue: cell(row, 'venue', ['Venue / Event Location (English)', 'Venue', 'Event Location']),
    hvenue: cell(row, 'hvenue', ['आयोजन स्थल (हिंदी)', 'Venue Hindi', 'Event Location Hindi']),
    role: cell(row, 'role', ['Attended as', 'Role']) || 'Participant',
    hrole: cell(row, 'hrole', ['के रूप में भाग लिया', 'Role Hindi']) || 'प्रतिभागी',
    hours: cell(row, 'hours', ['Total hours of training', 'Hours']),
    year: cell(row, 'year', ['Certificate year', 'Year']) || String(new Date().getFullYear())
  };
}

function applyBulkRow(data) {
  Object.keys(fields).forEach((key) => {
    if (data[key] !== undefined && fields[key]) fields[key].value = data[key];
  });
  const role = document.querySelector(`input[name="role"][value="${CSS.escape(data.role)}"]`) || document.querySelector('input[name="role"][value="Participant"]');
  const hrole = document.querySelector(`input[name="hrole"][value="${CSS.escape(data.hrole)}"]`) || document.querySelector('input[name="hrole"][value="प्रतिभागी"]');
  document.querySelectorAll('input[name="role"]').forEach((r) => { r.checked = r === role; });
  document.querySelectorAll('input[name="hrole"]').forEach((r) => { r.checked = r === hrole; });
  updatePreview();
}

function validateBulkRow(data, index) {
  const required = ['schoolName', 'hschoolName', 'name', 'hname', 'post', 'hpost', 'training', 'htraining', 'fromdate', 'todate', 'venue', 'hvenue', 'hours'];
  const missing = required.filter((key) => !String(data[key] || '').trim());
  if (missing.length) return `Row ${index + 2}: missing ${missing.join(', ')}`;
  if (Number(data.hours) <= 0) return `Row ${index + 2}: training hours must be greater than 0`;
  if (data.fromdate > data.todate) return `Row ${index + 2}: From date cannot be later than To date`;
  return '';
}

async function generateBulkCertificates(rows) {
  const zip = new JSZip();
  const errors = [];
  const total = rows.length;
  const mode = signatureMode();
  const original = {};
  Object.keys(fields).forEach((key) => { original[key] = fields[key].value; });
  const originalRole = document.querySelector('input[name="role"]:checked')?.value || 'Participant';
  const originalHRole = document.querySelector('input[name="hrole"]:checked')?.value || 'प्रतिभागी';

  for (let i = 0; i < total; i += 1) {
    const data = rowToCertificate(rows[i]);
    const validationError = validateBulkRow(data, i);
    if (validationError) { errors.push(validationError); continue; }

    applyBulkRow(data);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const canvas = await certificateCanvas();
    const pdf = createPdfFromCanvas(canvas);
    const filename = `${String(i + 1).padStart(3, '0')}_${filenameSafe(data.name)}_CPD_Certificate.pdf`;
    zip.file(filename, pdf.output('arraybuffer'));

    const percent = Math.round(((i + 1) / total) * 100);
    $('bulkProgress').textContent = `Generating ${i + 1} of ${total} certificates (${percent}%)…`;
  }

  Object.keys(fields).forEach((key) => { fields[key].value = original[key]; });
  document.querySelectorAll('input[name="role"]').forEach((r) => { r.checked = r.value === originalRole; });
  document.querySelectorAll('input[name="hrole"]').forEach((r) => { r.checked = r.value === originalHRole; });
  updatePreview();

  if (Object.keys(zip.files).length) {
    if (errors.length) zip.file('ERRORS.txt', errors.join('\n'));
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CPD_Certificates_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  $('bulkProgress').textContent = errors.length
    ? `Completed with ${errors.length} skipped row(s). Details are included in ERRORS.txt.`
    : `Completed successfully: ${total} certificate(s) generated and downloaded as a ZIP.`;
}

$('bulkExcelUpload').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  $('bulkStatus').textContent = `Selected: ${file.name}`;
  $('bulkProgress').textContent = 'Reading Excel file…';
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
    if (!rows.length) throw new Error('The Excel sheet contains no participant rows.');
    await generateBulkCertificates(rows);
  } catch (error) {
    console.error(error);
    $('bulkProgress').textContent = `Bulk generation failed: ${error.message}`;
  }
});

$('downloadTemplateBtn').addEventListener('click', () => {
  const headers = ['schoolName','hschoolName','regionalOffice','hregionalOffice','name','hname','post','hpost','training','htraining','fromdate','todate','venue','hvenue','role','hrole','hours','year'];
  const sample = {
    schoolName: 'PM SHRI Kendriya Vidyalaya Dongargarh', hschoolName: 'पीएम श्री केंद्रीय विद्यालय डोंगरगढ़',
    regionalOffice: 'Raipur', hregionalOffice: 'रायपुर', name: 'Amit Yerpude', hname: 'अमित येरपुडे',
    post: 'PGT Computer Science', hpost: 'पीजीटी कंप्यूटर साइंस', training: 'Competency Based Assessment', htraining: 'क्षमता आधारित मूल्यांकन',
    fromdate: '2026-09-01', todate: '2026-09-02', venue: 'PM SHRI KV Dongargarh', hvenue: 'पीएम श्री केन्द्रीय विद्यालय डोंगरगढ़',
    role: 'Participant', hrole: 'प्रतिभागी', hours: 6, year: 2026
  };
  const worksheet = XLSX.utils.json_to_sheet([sample], { header: headers });
  worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(16, header.length + 2) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificates');
  XLSX.writeFile(workbook, 'CPD_Certificate_Bulk_Template.xlsx');
});

Object.values(fields).forEach((field) => {
  field.addEventListener('input', updatePreview);
  field.addEventListener('change', updatePreview);
});
document.querySelectorAll('input[name="role"], input[name="hrole"]').forEach((radio) => {
  radio.addEventListener('change', updatePreview);
});

$('previewBtn').addEventListener('click', () => { if (validate()) updatePreview(); });
$('downloadBtn').addEventListener('click', downloadPDF);
$('downloadTopBtn').addEventListener('click', downloadPDF);
$('printBtn').addEventListener('click', () => { updatePreview(); window.print(); });
$('resetBtn').addEventListener('click', () => {
  $('certificateForm').reset();
  $('year').value = new Date().getFullYear();
  document.querySelector('input[name="role"][value="Participant"]').checked = true;
  document.querySelector('input[name="hrole"][value="प्रतिभागी"]').checked = true;
  document.querySelector('input[name="signatureMode"][value="with"]').checked = true;
  $('signatureUpload').value = '';
  $('bulkExcelUpload').value = '';
  $('validationMessage').textContent = '';
  $('bulkStatus').textContent = 'No Excel file selected.';
  $('bulkProgress').textContent = '';
  setSignature('', 'No signature uploaded.');
  updatePreview();
});

setSignature('', 'No signature uploaded.');
updatePreview();
