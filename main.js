import { streamWebCamVideo } from "./js/stream.mjs";
import { changeFacingMode } from "./js/camera-facing-mode.mjs";
import { capturePhoto } from "./js/photo-capture-and-save.mjs";
import { captureVideo } from "./js/video-capture-and-save.mjs";
import { initFaceDetection } from "./js/face-detection.mjs";
import "./js/filter-toggle.mjs";

streamWebCamVideo();
changeFacingMode();
capturePhoto();
captureVideo();

// Initialize face detection and get toggle control
const faceDetectionControl = initFaceDetection();

// Setup filter toggle web component
const filterToggle = document.getElementById("filter-toggle");
filterToggle.addEventListener("toggle", (e) => {
  faceDetectionControl.toggleFilter();
});
