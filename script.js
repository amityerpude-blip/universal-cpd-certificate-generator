const $ = (id) => document.getElementById(id);

const fields = {
  schoolName: $('schoolName'), regionalOffice: $('regionalOffice'),
  name: $('name'), hname: $('hname'), post: $('post'), hpost: $('hpost'),
  training: $('training'), htraining: $('htraining'), fromdate: $('fromdate'),
  todate: $('todate'), hours: $('hours'), year: $('year')
};

function formatDate(value) {
  if (!value) return '[Date]';
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

let signatureDataUrl = null;

function updatePreview() {
  $('outSchoolName').textContent = fields.schoolName.value.trim() || '[School / Institution Name]';
  $('outSchoolNameEn').textContent = fields.schoolName.value.trim() || '[School / Institution Name]';
  $('outSchoolNameEn2').textContent = fields.schoolName.value.trim() || '[School / Institution Name]';
  $('outHSchoolName').textContent = fields.schoolName.value.trim() || '[विद्यालय का नाम]';
  $('outRegionalOffice').textContent = fields.regionalOffice.value.trim() ? `Regional Office: ${fields.regionalOffice.value.trim()}` : 'Regional Office';
  $('outRegionalOfficeEn').textContent = fields.regionalOffice.value.trim() || '[Regional Office]';
  $('outHRegionalOffice').textContent = fields.regionalOffice.value.trim() || '[क्षेत्रीय कार्यालय]';
  $('outName').textContent = fields.name.value.trim() || '[Name]';
  $('outHName').textContent = fields.hname.value.trim() || '[नाम]';
  $('outPost').textContent = fields.post.value.trim() || '[Designation]';
  $('outHPost').textContent = fields.hpost.value.trim() || '[पदनाम]';
  $('outTraining').textContent = fields.training.value.trim() || '[Training / Workshop]';
  $('outHTraining').textContent = fields.htraining.value.trim() || '[कार्यशाला का विषय]';
  $('outFrom').textContent = formatDate(fields.fromdate.value);
  $('outTo').textContent = formatDate(fields.todate.value);
  $('outHFrom').textContent = formatDate(fields.fromdate.value);
  $('outHTo').textContent = formatDate(fields.todate.value);
  $('outHours').textContent = fields.hours.value || '[Hours]';
  $('outHHours').textContent = fields.hours.value || '[घंटे]';
  $('outYear').textContent = fields.year.value || new Date().getFullYear();
  const role = document.querySelector('input[name="role"]:checked')?.value || 'Participant';
  const hrole = document.querySelector('input[name="hrole"]:checked')?.value || 'प्रतिभागी';
  $('outRole').textContent = role;
  $('outHRole').textContent = hrole;
}

function validate() {
  const required = ['schoolName','name','hname','post','hpost','training','htraining','fromdate','todate','hours'];
  for (const key of required) {
    if (!fields[key].value.trim()) {
      fields[key].focus();
      $('validationMessage').textContent = 'Please complete all required fields.';
      return false;
    }
  }
  if (fields.hours.value <= 0) {
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

function setSignatureSource(src, label) {
  signatureDataUrl = src || null;
  $('principalSignature').src = src || 'assets/principal-signature.png';
  $('signatureStatus').textContent = label || 'Using the default Principal signature.';
}

$('signatureUpload').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    $('signatureStatus').textContent = 'Please choose an image file (PNG, JPG or WEBP).';
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => setSignatureSource(reader.result, `Uploaded: ${file.name}`);
  reader.readAsDataURL(file);
});

$('removeSignatureBtn').addEventListener('click', () => {
  $('signatureUpload').value = '';
  setSignatureSource(null, 'Using the default Principal signature.');
});

async function downloadPDF() {
  if (!validate()) return;
  updatePreview();
  const button = $('downloadBtn');
  const topButton = $('downloadTopBtn');
  button.disabled = true; topButton.disabled = true;
  const oldText = button.textContent;
  button.textContent = 'Generating PDF…';
  try {
    await document.fonts.ready;
    const canvas = await html2canvas($('certificate'), {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#d9e8f5',
      logging: false
    });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: [12, 9] });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.97), 'JPEG', 0, 0, 12, 9, undefined, 'FAST');
    const safeName = (fields.name.value.trim() || 'CPD-Certificate').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    pdf.save(`${safeName}_CPD_Certificate.pdf`);
  } catch (error) {
    console.error(error);
    $('validationMessage').textContent = 'PDF generation failed. Please try the Print certificate option.';
  } finally {
    button.disabled = false; topButton.disabled = false;
    button.textContent = oldText;
  }
}

Object.values(fields).forEach((field) => {
  field.addEventListener('input', updatePreview);
  field.addEventListener('change', updatePreview);
});
document.querySelectorAll('input[name="role"], input[name="hrole"]').forEach((radio) => radio.addEventListener('change', updatePreview));
$('previewBtn').addEventListener('click', () => { if (validate()) updatePreview(); });
$('downloadBtn').addEventListener('click', downloadPDF);
$('downloadTopBtn').addEventListener('click', downloadPDF);
$('printBtn').addEventListener('click', () => { updatePreview(); window.print(); });
$('resetBtn').addEventListener('click', () => {
  $('certificateForm').reset();
  $('year').value = new Date().getFullYear();
  document.querySelector('input[name="role"][value="Participant"]').checked = true;
  document.querySelector('input[name="hrole"][value="प्रतिभागी"]').checked = true;
  $('validationMessage').textContent = '';
  $('signatureUpload').value = '';
  setSignatureSource(null, 'Using the default Principal signature.');
  updatePreview();
});
updatePreview();
