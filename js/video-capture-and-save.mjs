export let mediaRecorder = null;
let chunks = [];
let startTime = null;
let timerInterval;
const recordingIndicator = document.createElement("div");

export const captureVideo = () => {
  const videoButton = document.querySelector(".capture-button");
  videoButton.addEventListener("click", () => {
    const isVideoMode =
      document.querySelector(
        ".switch-camera-video-photo-mode input[type='radio'][name='modes']:checked"
      ).value === "video-mode";
    if (!isVideoMode) return;
    const facingModeButton = document.querySelector(
      ".switch-camera-facing-mode"
    );
    recordVideo(facingModeButton);
  });
};
const modes = document.querySelectorAll(
  ".switch-camera-video-photo-mode input[type='radio']"
);
modes.forEach((mode) =>
  mode.addEventListener("change", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      clearInterval(timerInterval);
    }
  })
);

let compositeCanvas = null;
let compositeStream = null;
let animationFrameId = null;

const recordVideo = async (facingModeButton) => {
  const video = document.getElementById("stream");
  const overlayCanvas = document.getElementById("overlay-canvas");
  const captureButton = document.querySelector(".capture-button");

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    clearInterval(timerInterval);
    captureButton.classList.remove("recording");
    return;
  }

  // Clear previous chunks
  chunks = [];

  try {
    // Create a composite canvas that combines video and overlay
    compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = video.videoWidth;
    compositeCanvas.height = video.videoHeight;

    const ctx = compositeCanvas.getContext("2d");
    const isFrontCamera = facingModeButton.dataset.facingMode === "front";

    // Apply horizontal flip for front camera
    if (isFrontCamera) {
      ctx.translate(compositeCanvas.width, 0);
      ctx.scale(-1, 1);
    }

    let isDrawing = true;

    // Function to draw video + overlay continuously
    const drawComposite = () => {
      // Draw video frame
      ctx.drawImage(video, 0, 0, compositeCanvas.width, compositeCanvas.height);
      // Draw overlay (pumpkin) on top
      if (overlayCanvas) {
        ctx.drawImage(
          overlayCanvas,
          0,
          0,
          compositeCanvas.width,
          compositeCanvas.height
        );
      }
      if (isDrawing) {
        animationFrameId = requestAnimationFrame(drawComposite);
      }
    };

    // Capture the composite canvas as a stream
    compositeStream = compositeCanvas.captureStream(30); // 30 fps

    // Get audio from the original video stream if available
    const audioTracks = video.srcObject.getAudioTracks();
    if (audioTracks.length > 0) {
      audioTracks.forEach((track) => compositeStream.addTrack(track));
    }

    // Use supported MIME type for MediaRecorder
    const options = { mimeType: "video/webm;codecs=vp9" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = "video/webm;codecs=vp8";
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm";
      }
    }

    mediaRecorder = new MediaRecorder(compositeStream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    startTime = Date.now();

    // Start drawing before starting recording
    drawComposite();

    mediaRecorder.start(1000); // Collect data every 1 second
    captureButton.classList.add("recording");

    recordingIndicator.textContent = "00:00:00";
    recordingIndicator.classList.add("record");
    document.body.appendChild(recordingIndicator);

    timerInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      recordingIndicator.textContent = formatTime(elapsedTime);
    }, 1000);

    mediaRecorder.onstop = () => {
      isDrawing = false; // Stop drawing loop
      saveRecordedVideo();
      clearInterval(timerInterval);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      captureButton.classList.remove("recording");
    };

    facingModeButton.addEventListener("click", () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        isDrawing = false; // Stop drawing loop
        mediaRecorder.stop();
        clearInterval(timerInterval);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        captureButton.classList.remove("recording");
      }
    });
  } catch (e) {}
};

const saveRecordedVideo = () => {
  recordingIndicator.remove();
  if (!chunks.length) {
    return;
  }
  const blob = new Blob(chunks, { type: "video/webm" });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "");
  const filename = `video_${timestamp}.webm`;
  const videoUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = videoUrl;
  link.download = filename;
  link.click();

  // Replace image preview with video element
  const previewContainer = document.querySelector(".lenses .image");
  const oldPreview = document.querySelector(".preview");

  // Create video element
  const videoPreview = document.createElement("video");
  videoPreview.className = "preview video";
  videoPreview.src = videoUrl;
  videoPreview.muted = true;
  videoPreview.loop = true;
  videoPreview.autoplay = true;
  videoPreview.style.inlineSize = "48px";
  videoPreview.style.blockSize = "48px";
  videoPreview.style.objectFit = "cover";
  videoPreview.style.borderRadius = "4px";

  // Replace old preview
  oldPreview.replaceWith(videoPreview);

  chunks = [];
};

const formatTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const pad = (num) => {
  return num.toString().padStart(2, "0");
};
