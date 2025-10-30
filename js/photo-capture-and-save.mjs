export const capturePhoto = () => {
  const photoButton = document.querySelector(".capture-button");
  photoButton.addEventListener("click", () => {
    const isVideoMode =
      document.querySelector(
        ".switch-camera-video-photo-mode input[type='radio'][name='modes']:checked"
      ).value === "video-mode";
    if (isVideoMode) return;
    const facingModeButton = document.querySelector(
      ".switch-camera-facing-mode"
    );
    photoButton.classList.add("click");
    setTimeout(() => {
      photoButton.classList.remove("click");
    }, 500);
    drawOnCanvasAndSavePhoto(facingModeButton.dataset.facingMode === "front");
  });
};

const drawOnCanvasAndSavePhoto = async (isMirrored = false) => {
  const video = document.getElementById("stream");
  const overlayCanvas = document.getElementById("overlay-canvas");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const scaleFactor = 2;
  canvas.width = video.videoWidth * scaleFactor;
  canvas.height = video.videoHeight * scaleFactor;
  if (isMirrored) {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
  }
  // Check for filters
  if (video.dataset.lens === "monochrome") context.filter = "grayscale(1)";
  if (video.dataset.lens.startsWith("gradient"))
    context.filter = "saturate(0.1)";

  const flashElement = document.createElement("div");
  flashElement.style.position = "fixed";
  flashElement.style.insetBlockStart = "0";
  flashElement.style.insetInlineStart = "0";
  flashElement.style.inlineSize = "100%";
  flashElement.style.blockSize = "calc(100vh - 220px)";
  flashElement.style.backgroundColor = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--color-flash-overlay");
  document.body.appendChild(flashElement);
  setTimeout(() => {
    flashElement.remove();
  }, 200);

  // Draw video frame
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Draw pumpkin overlay on top
  if (overlayCanvas) {
    context.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
  }

  try {
    const imageDataUrl = canvas.toDataURL("image/png", 0.9);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "");
    link.href = imageDataUrl;
    link.download = `photo_${timestamp}.png`;
    link.click();

    // Replace with image element if it's currently a video
    const oldPreview = document.querySelector(".preview");
    if (oldPreview.tagName === "VIDEO") {
      const imgPreview = document.createElement("img");
      imgPreview.className = "preview";
      imgPreview.src = imageDataUrl;
      imgPreview.alt = "preview image";
      imgPreview.style.inlineSize = "48px";
      imgPreview.style.blockSize = "48px";
      imgPreview.style.objectFit = "cover";
      imgPreview.style.borderRadius = "4px";
      oldPreview.replaceWith(imgPreview);
    } else {
      oldPreview.classList.remove("video");
      oldPreview.src = imageDataUrl;
    }
  } catch (error) {}
};
