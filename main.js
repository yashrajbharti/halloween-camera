import { streamWebCamVideo } from "./js/stream.mjs";
import { changeFacingMode } from "./js/camera-facing-mode.mjs";
import { capturePhoto } from "./js/photo-capture-and-save.mjs";
import { captureVideo } from "./js/video-capture-and-save.mjs";
import { initFaceDetection } from "./js/face-detection.mjs";


streamWebCamVideo();
changeFacingMode();
capturePhoto();
captureVideo();
initFaceDetection();

