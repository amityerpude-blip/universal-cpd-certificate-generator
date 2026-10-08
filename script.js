const $ = (id) => document.getElementById(id);

const fields = {
  schoolName: $('schoolName'), hschoolName: $('hschoolName'),
  regionalOffice: $('regionalOffice'), hregionalOffice: $('hregionalOffice'),
  name: $('name'), hname: $('hname'), post: $('post'), hpost: $('hpost'), participantSchool: $('participantSchool'), hparticipantSchool: $('hparticipantSchool'),
  training: $('training'), htraining: $('htraining'), fromdate: $('fromdate'), venue: $('venue'), hvenue: $('hvenue'),
  hours: $('hours'), year: $('year')
};

function formatDate(value) {
  if (!value) return '[Date]';
  const text = String(value).trim();
  if (!text) return '[Date]';
  // Display the certificate date consistently as DD/MM/YYYY in both languages.
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return match[3].padStart(2, '0') + '/' + match[2].padStart(2, '0') + '/' + match[1];
  const date = new Date(text + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return text;
  return [String(date.getDate()).padStart(2, '0'), String(date.getMonth() + 1).padStart(2, '0'), date.getFullYear()].join('/');
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
  const participantSchoolEn = fields.participantSchool?.value?.trim() || '[Participant School Name]';
  const participantSchoolHi = fields.hparticipantSchool?.value?.trim() || '[प्रतिभागी का विद्यालय]';
  const officeEn = fields.regionalOffice.value.trim() || '[Regional Office]';
  const officeHi = fields.hregionalOffice.value.trim() || '[क्षेत्रीय कार्यालय]';
  const hours = fields.hours.value || '[Hours]';

  setText('outSchoolName', schoolEn, '[School / Institution Name]');
  setText('outRegionalOffice', fields.regionalOffice.value.trim() ? `Regional Office: ${fields.regionalOffice.value.trim()}` : 'Regional Office: [Regional Office]', 'Regional Office: [Regional Office]');
  setText('outHParticipantSchool', participantSchoolHi, '[प्रतिभागी का विद्यालय]');
  // Participant school is intentionally separate from the institution/header school.
  setText('outParticipantSchoolEn', participantSchoolEn, '[Participant School Name]');
  setText('outHRegionalOffice', officeHi, '[क्षेत्रीय कार्यालय]');
  setText('outRegionalOfficeEn', officeEn, '[Regional Office]');
  setText('outName', fields.name.value, '[Name]');
  setText('outHName', fields.hname.value, '[नाम]');
  setText('outPost', fields.post.value, '[Designation]');
  setText('outHPost', fields.hpost.value, '[पदनाम]');
  setText('outTraining', fields.training.value, '[Training / Workshop]');
  setText('outHTraining', fields.htraining.value, '[कार्यशाला का विषय]');
  setText('outFrom', formatDate(fields.fromdate.value), '[Date]');
  setText('outHFrom', formatDate(fields.fromdate.value), '[Date]');
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
    'schoolName', 'hschoolName', 'name', 'hname', 'post', 'hpost', 'participantSchool', 'hparticipantSchool',
    'training', 'htraining', 'fromdate', 'venue', 'hvenue', 'hours'
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
  if (signatureMode() === 'with' && !signatureDataUrl) {
    $('validationMessage').textContent = 'Please upload the Principal signature or select "Without Principal signature".';
    return false;
  }
  $('validationMessage').textContent = '';
  return true;
}

async function normalizeSignatureImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = image.naturalWidth || image.width;
  sourceCanvas.height = image.naturalHeight || image.height;
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0);
  const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const pixels = imageData.data;

  let minX = sourceCanvas.width;
  let minY = sourceCanvas.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < sourceCanvas.height; y += 1) {
    for (let x = 0; x < sourceCanvas.width; x += 1) {
      const index = (y * sourceCanvas.width + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      const brightness = (red + green + blue) / 3;
      const isWhiteBackground = alpha === 0 || (red >= 245 && green >= 245 && blue >= 245);

      if (isWhiteBackground) {
        pixels[index + 3] = 0;
      } else {
        // Keep the original alpha fully intact so the uploaded signature does
        // not become faint. Only remove the white paper/background.
        pixels[index + 3] = alpha;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  sourceContext.putImageData(imageData, 0, 0);

  if (maxX < minX || maxY < minY) return dataUrl;

  const padding = Math.max(4, Math.round(Math.min(sourceCanvas.width, sourceCanvas.height) * 0.02));
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(sourceCanvas.width - 1, maxX + padding);
  maxY = Math.min(sourceCanvas.height - 1, maxY + padding);

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const maxOutputWidth = 600;
  const maxOutputHeight = 200;
  const scale = Math.min(1, maxOutputWidth / cropWidth, maxOutputHeight / cropHeight);
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = Math.max(1, Math.round(cropWidth * scale));
  outputCanvas.height = Math.max(1, Math.round(cropHeight * scale));
  const outputContext = outputCanvas.getContext('2d');
  outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  outputContext.drawImage(
    sourceCanvas,
    minX, minY, cropWidth, cropHeight,
    0, 0, outputCanvas.width, outputCanvas.height
  );

  return outputCanvas.toDataURL('image/png');
}

function setSignature(src, label) {
  signatureDataUrl = src || '';
  const image = $('principalSignature');
  image.src = signatureDataUrl;
  image.style.display = signatureDataUrl ? 'block' : 'none';
  $('signatureStatus').textContent = label || 'No signature uploaded.';
  applySignatureVisibility();
}

$('signatureUpload').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    event.target.value = '';
    $('signatureStatus').textContent = 'Please choose a PNG, JPG or WEBP image.';
    return;
  }
  try {
    const normalized = await normalizeSignatureImage(file);
    setSignature(normalized, `Uploaded and cleaned: ${file.name}`);
  } catch (error) {
    console.error(error);
    $('signatureStatus').textContent = 'Could not process the signature image. Please try another file.';
  }
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
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 12, 9, undefined, 'FAST');
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
  // Keep the Excel calendar date in local time. Using toISOString() can
  // shift midnight to the previous day in time zones such as India (UTC+5:30).
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0')
    ].join('-');
  }
  if (typeof value === 'number' && window.XLSX?.SSF) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return parsed.y + '-' + String(parsed.m).padStart(2, '0') + '-' + String(parsed.d).padStart(2, '0');
  }
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) {
    const [y, m, d] = text.split('-');
    return y + '-' + m.padStart(2, '0') + '-' + d.padStart(2, '0');
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0')
  ].join('-');
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
    participantSchool: cell(row, 'participantSchool', ['Participant School Name (English)', 'Participant School', 'Teacher School Name', 'School Name for Participant']),
    hparticipantSchool: cell(row, 'hparticipantSchool', ['प्रतिभागी के विद्यालय का नाम (हिंदी)', 'Participant School Name Hindi', 'Participant School Hindi', 'Teacher School Name Hindi']),
    training: cell(row, 'training', ['Topic of training in English', 'Training', 'Training Topic']),
    htraining: cell(row, 'htraining', ['कार्यशाला का विषय', 'Training Hindi', 'Training Topic Hindi']),
    // Pass the original Excel date value directly. Converting it to String first
    // can apply timezone parsing and shift the displayed date by one day.
    fromdate: excelDateToISO(row[Object.keys(row).find((header) => ['fromdate', 'from date'].includes(normaliseHeader(header))) ?? 'fromdate']),
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
  const required = ['schoolName', 'hschoolName', 'name', 'hname', 'post', 'hpost', 'training', 'htraining', 'fromdate', 'venue', 'hvenue', 'hours'];
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
  const headers = ['schoolName','hschoolName','regionalOffice','hregionalOffice','name','hname','post','hpost','participantSchool','hparticipantSchool','training','htraining','fromdate','venue','hvenue','role','hrole','hours','year'];
  const sample = {
    schoolName: 'PM SHRI Kendriya Vidyalaya Dongargarh', hschoolName: 'पीएम श्री केंद्रीय विद्यालय डोंगरगढ़',
    regionalOffice: 'Raipur', hregionalOffice: 'रायपुर', name: 'Amit Yerpude', hname: 'अमित येरपुडे',
    post: 'PGT Computer Science', hpost: 'पीजीटी कंप्यूटर साइंस', participantSchool: 'PM SHRI Kendriya Vidyalaya Dongargarh', hparticipantSchool: 'पीएम श्री केंद्रीय विद्यालय डोंगरगढ़', training: 'Competency Based Assessment', htraining: 'क्षमता आधारित मूल्यांकन',
    fromdate: '2026-09-01', venue: 'PM SHRI KV Dongargarh', hvenue: 'पीएम श्री केन्द्रीय विद्यालय डोंगरगढ़',
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
