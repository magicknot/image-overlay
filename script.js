const imageInput = document.getElementById('imageUpload');
const zoomSlider = document.getElementById('zoomSlider');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

let userImage = null;
let defaultImage = null;
let isDefaultImage = true;
let overlayImage = new Image();

let scale = 1;
let pos = { x: 0, y: 0 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let lastTouchDistance = null;

// Load the overlay image
overlayImage.onload = () => {
    canvas.width = Math.min(overlayImage.width/2, 500);
    canvas.height = Math.min(overlayImage.height/2, 500);
    // Once overlay is loaded, load the default preview image
    loadDefaultImage();
};
overlayImage.src = 'overlay.png';

function loadDefaultImage() {
    defaultImage = new Image();
    defaultImage.crossOrigin = "anonymous";
    defaultImage.onload = () => {
    userImage = defaultImage;
    isDefaultImage = true;
    scale = 0.3; // Zoom out to 70%
    zoomSlider.value = scale;
    pos = {
        x: (canvas.width - defaultImage.width * scale) / 2,
        y: (canvas.height - defaultImage.height * scale) / 2 + 100
    };
    draw();
    zoomSlider.disabled = true;
    resetBtn.disabled = true;
    downloadBtn.disabled = true;
    };
    defaultImage.src = 'default-preview.png';
}

function resetPosition() {
    if (!userImage || isDefaultImage) {
        return
    };

    scale = isDefaultImage ? 0.7 : 1;
    zoomSlider.value = scale;
    pos = {
        x: (canvas.width - userImage.width * scale) / 2,
        y: (canvas.height - userImage.height * scale) / 2
    };
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (userImage) {
    const w = userImage.width * scale;
    const h = userImage.height * scale;

    // Snap boundaries (no white gaps)
    const minX = Math.min(0, canvas.width - w);
    const minY = Math.min(0, canvas.height - h);
    const maxX = Math.max(0, canvas.width - w);
    const maxY = Math.max(0, canvas.height - h);

    pos.x = Math.min(maxX, Math.max(minX, pos.x));
    pos.y = Math.min(maxY, Math.max(minY, pos.y));

    ctx.drawImage(userImage, pos.x, pos.y, w, h);
    }

    // Draw the overlay on top
    ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
}

function downloadImage() {
    // Only allow download if user uploaded their own image
    if (isDefaultImage) return;
    
    const link = document.createElement('a');
    link.download = 'perfil-noronha-lopes.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

imageInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
    userImage = new Image();
    userImage.onload = () => {
        isDefaultImage = false; // User uploaded their own image
        resetPosition();
        zoomSlider.disabled = false;
        resetBtn.disabled = false;
        downloadBtn.disabled = false; // NOW enable download
    };
    userImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

zoomSlider.addEventListener('input', () => {
    scale = parseFloat(zoomSlider.value);
    draw();
});

// Drag (Mouse)
canvas.addEventListener('mousedown', e => {
    if (isDefaultImage) {
        return
    }

    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    dragStart.x = (e.clientX - rect.left) * (canvas.width / rect.width) - pos.x;
    dragStart.y = (e.clientY - rect.top) * (canvas.height / rect.height) - pos.y;
});

canvas.addEventListener('mousemove', e => {
    if (isDefaultImage) {
        return
    }

    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    pos.x = (e.clientX - rect.left) * (canvas.width / rect.width) - dragStart.x;
    pos.y = (e.clientY - rect.top) * (canvas.height / rect.height) - dragStart.y;
    draw();
});

window.addEventListener('mouseup', () => {
    if (isDefaultImage) {
        return
    }

    isDragging = false;
});

// Touch drag/zoom
canvas.addEventListener('touchstart', e => {
    if (isDefaultImage) {
        return
    }

    if (e.touches.length === 1) {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    dragStart.x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width) - pos.x;
    dragStart.y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height) - pos.y;
    } else if (e.touches.length === 2) {
    lastTouchDistance = getTouchDistance(e.touches);
    }
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();

    if (isDefaultImage) {
        return
    }
    
    if (e.touches.length === 1 && isDragging) {
    const rect = canvas.getBoundingClientRect();
    pos.x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width) - dragStart.x;
    pos.y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height) - dragStart.y;
    draw();
    } else if (e.touches.length === 2) {
    const currentDistance = getTouchDistance(e.touches);
    if (lastTouchDistance) {
        const delta = currentDistance / lastTouchDistance;
        scale *= delta;
        scale = Math.max(0.5, Math.min(3, scale));
        zoomSlider.value = scale;
        draw();
    }
    lastTouchDistance = currentDistance;
    }
}, { passive: false });

window.addEventListener('touchend', () => {
    if (isDefaultImage) {
        return
    }
    
    isDragging = false;
    lastTouchDistance = null;
});

function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Double-click to reset
canvas.addEventListener('dblclick', () => {
    resetPosition();
});

// Reset button
resetBtn.addEventListener('click', resetPosition);