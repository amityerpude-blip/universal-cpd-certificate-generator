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
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

let signatureDataUrl = '';

function setText(id, value, fallback) {
  const element = $(id);
  if (element) element.textContent = value?.trim() || fallback;
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

  $('outRole').textContent = document.querySelector('input[name="role"]:checked')?.value || 'Participant';
  $('outHRole').textContent = document.querySelector('input[name="hrole"]:checked')?.value || 'प्रतिभागी';
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
  $('validationMessage').textContent = '';
  return true;
}

function setSignature(src, label) {
  signatureDataUrl = src || '';
  const image = $('principalSignature');
  image.src = signatureDataUrl;
  image.style.display = signatureDataUrl ? 'block' : 'none';
  $('signatureStatus').textContent = label || 'No signature uploaded.';
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
    await document.fonts.ready;
    const canvas = await html2canvas($('certificate'), {
      scale: 2.5, useCORS: true, backgroundColor: '#d9e8f5', logging: false
    });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: [12, 9] });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.97), 'JPEG', 0, 0, 12, 9, undefined, 'FAST');
    const safeName = (fields.name.value.trim() || 'CPD-Certificate')
      .replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    pdf.save(`${safeName}_CPD_Certificate.pdf`);
  } catch (error) {
    console.error(error);
    $('validationMessage').textContent = 'PDF generation failed. Please try the Print certificate option.';
  } finally {
    button.disabled = false;
    topButton.disabled = false;
    button.textContent = oldText;
  }
}

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
  $('signatureUpload').value = '';
  $('validationMessage').textContent = '';
  setSignature('', 'No signature uploaded.');
  updatePreview();
});

setSignature('', 'No signature uploaded.');
updatePreview();
