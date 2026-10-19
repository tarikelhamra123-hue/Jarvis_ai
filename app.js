const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const statusBox = document.getElementById('statusBox');
const uploadInput = document.getElementById('imageUpload');
const headlineInput = document.getElementById('headlineInput');
const ctaInput = document.getElementById('ctaInput');
const accentInput = document.getElementById('accentInput');
const renderBtn = document.getElementById('renderBtn');
const downloadBtn = document.getElementById('downloadBtn');
const thumbnailGrid = document.getElementById('thumbnailGrid');

const state = {
  images: [],
  renderBlob: null,
  isRecording: false,
};

const FALLBACK_TEXT = 'Check availability on Airbnb';

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.style.color = isError ? '#ffb7b7' : '#a9bac8';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function handleImageUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const approvedFiles = files.slice(0, 10);
  state.images = [];
  thumbnailGrid.innerHTML = '';

  for (const file of approvedFiles) {
    if (!file.type.startsWith('image/')) {
      setStatus('Only image files are accepted for property assets.', true);
      continue;
    }

    const src = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      const image = await loadImageElement(src);
      state.images.push({ src, image });

      const thumb = document.createElement('div');
      thumb.className = 'thumb-item';
      thumb.innerHTML = `<img src="${src}" alt="Property asset preview" />`;
      thumbnailGrid.appendChild(thumb);
    } catch (error) {
      setStatus(`Could not load image: ${file.name}.`, true);
    }
  }

  if (!state.images.length) {
    setStatus('No valid images were loaded. Upload real property images only.', true);
    return;
  }

  setStatus(`${state.images.length} approved property images loaded and ready for preview.`);
  drawPreviewFrame(0);
}

function drawBackgroundGlow() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#101b1f');
  gradient.addColorStop(0.35, '#1d2730');
  gradient.addColorStop(0.7, '#0f1d25');
  gradient.addColorStop(1, '#080d12');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.25,
    10,
    canvas.width * 0.5,
    canvas.height * 0.25,
    canvas.width * 0.6
  );
  glow.addColorStop(0, 'rgba(232, 191, 119, 0.45)');
  glow.addColorStop(1, 'rgba(232, 191, 119, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawImageWithZoom(img, zoom, x, y, width, height, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;

  const imgAspect = img.width / img.height;
  const canvasAspect = width / height;
  let drawWidth = width;
  let drawHeight = height;

  if (imgAspect > canvasAspect) {
    drawHeight = height * 1.15;
    drawWidth = drawHeight * imgAspect;
  } else {
    drawWidth = width * 1.15;
    drawHeight = drawWidth / imgAspect;
  }

  const targetWidth = drawWidth * (1 + zoom * 0.1);
  const targetHeight = drawHeight * (1 + zoom * 0.1);

  const dx = x + (width - targetWidth) / 2;
  const dy = y + (height - targetHeight) / 2;

  ctx.drawImage(img, dx, dy, targetWidth, targetHeight);
  ctx.restore();
}

function drawTextBlock(headline, accent, cta) {
  const overlayGradient = ctx.createLinearGradient(0, canvas.height * 0.66, 0, canvas.height);
  overlayGradient.addColorStop(0, 'rgba(5,8,12,0)');
  overlayGradient.addColorStop(1, 'rgba(5,8,12,0.88)');
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, canvas.height * 0.56, canvas.width, canvas.height * 0.44);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f7efe2';
  ctx.font = '700 72px "Segoe UI", sans-serif';
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(11, 14, 18, 0.28)';

  const lines = [headline];
  const maxWidth = canvas.width - 120;
  let line = '';
  const words = headline.split(' ');
  const wrapped = [];

  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      wrapped.push(line);
      line = words[i];
    } else {
      line = testLine;
    }
  }
  if (line) wrapped.push(line);

  const startY = canvas.height - 250;
  wrapped.slice(0, 2).forEach((wordLine, index) => {
    const y = startY + index * 82;
    ctx.strokeText(wordLine, 70, y);
    ctx.fillText(wordLine, 70, y);
  });

  ctx.font = '600 26px "Segoe UI", sans-serif';
  ctx.fillStyle = '#e7c17e';
  ctx.fillText(accent, 70, canvas.height - 124);

  ctx.font = '700 30px "Segoe UI", sans-serif';
  ctx.fillStyle = '#f8f7f3';
  ctx.fillText(cta, 70, canvas.height - 68);
}

function drawPreviewFrame(timeSeconds) {
  drawBackgroundGlow();

  if (!state.images.length) {
    ctx.fillStyle = '#d9b77a';
    ctx.font = '700 52px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Upload approved property photos', canvas.width / 2, canvas.height / 2);
    return;
  }

  const totalDuration = 20;
  const framesPerSlide = totalDuration / state.images.length;
  const slideIndex = Math.min(
    state.images.length - 1,
    Math.floor((timeSeconds % totalDuration) / framesPerSlide)
  );

  const slideTime = (timeSeconds % totalDuration) % framesPerSlide;
  const progress = clamp(slideTime / framesPerSlide, 0, 1);
  const eased = easeInOutCubic(progress);

  const current = state.images[slideIndex];
  const next = state.images[(slideIndex + 1) % state.images.length];

  drawImageWithZoom(current.image, 0, 0, 0, canvas.width, canvas.height, 1 - eased * 0.98);
  drawImageWithZoom(next.image, 0.12, 0, 0, canvas.width, canvas.height, eased * 0.98);

  const headline = headlineInput.value || 'Wake up somewhere extraordinary';
  const accent = accentInput.value || 'A refined escape made to feel like home';
  const cta = ctaInput.value || FALLBACK_TEXT;

  drawTextBlock(headline, accent, cta);
}

function renderPreviewLoop() {
  const now = performance.now();
  const elapsed = now / 1000;
  drawPreviewFrame(elapsed % 20);
  requestAnimationFrame(renderPreviewLoop);
}

function renderVideoSequence() {
  if (!state.images.length) {
    setStatus('Upload at least one approved property photo before rendering.', true);
    return;
  }

  if (state.isRecording) {
    return;
  }

  state.isRecording = true;
  renderBtn.disabled = true;
  downloadBtn.disabled = true;
  setStatus('Recording 20-second branded ad. This runs locally in your browser.');

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const stream = canvas.captureStream(30);
  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType });

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mimeType });
    state.renderBlob = blob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'airbnb-luxury-ad.webm';
    a.click();
    URL.revokeObjectURL(url);

    renderBtn.disabled = false;
    downloadBtn.disabled = false;
    state.isRecording = false;
    setStatus('Video render complete. Browser download started. Convert to MP4 locally with FFmpeg if needed.');
  };

  recorder.start();

  const start = performance.now();
  const stopAt = 20000;

  function tick(timestamp) {
    const elapsed = timestamp - start;
    drawPreviewFrame((elapsed / 1000) % 20);

    if (elapsed < stopAt) {
      requestAnimationFrame(tick);
    } else {
      recorder.stop();
    }
  }

  requestAnimationFrame(tick);
}

function downloadCurrentVideo() {
  if (!state.renderBlob) {
    setStatus('No rendered video is available yet. Press “Render cinematic ad” first.', true);
    return;
  }

  const url = URL.createObjectURL(state.renderBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'airbnb-luxury-ad.webm';
  a.click();
  URL.revokeObjectURL(url);
}

uploadInput.addEventListener('change', handleImageUpload);
renderBtn.addEventListener('click', renderVideoSequence);
downloadBtn.addEventListener('click', downloadCurrentVideo);

requestAnimationFrame(renderPreviewLoop);
setStatus('Upload 5–10 approved property photos to generate a client-ready cinematic ad.');
