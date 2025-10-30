export const initFaceDetection = () => {
  const video = document.getElementById("stream");
  const canvas = document.getElementById("overlay-canvas");
  const canvasCtx = canvas.getContext("2d");

  // Load pumpkin image
  const pumpkinImg = new Image();
  pumpkinImg.src = "./assets/jack-o-lantern.png";

  let faceDetection = null;
  let isDetectionActive = false;

  // Initialize MediaPipe Face Detection
  const initMediaPipe = () => {
    faceDetection = new FaceDetection({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`;
      },
    });

    faceDetection.setOptions({
      model: "short",
      minDetectionConfidence: 0.5,
    });

    faceDetection.onResults(onResults);
    isDetectionActive = true;
  };

  // Process detection results
  function onResults(results) {
    // Match canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.detections && results.detections.length > 0) {
      results.detections.forEach((detection) => {
        const bbox = detection.boundingBox;

        // Calculate face dimensions in pixels
        const faceWidth = bbox.width * canvas.width;
        const faceHeight = bbox.height * canvas.height;
        
        // Use the larger dimension to maintain square aspect ratio
        const faceSize = Math.max(faceWidth, faceHeight);
        
        // Make pumpkin 2.6x larger than face size
        const pumpkinSize = faceSize * 2.6;

        // Calculate center position
        const centerX = bbox.xCenter * canvas.width;
        const centerY = bbox.yCenter * canvas.height;
        
        // Position pumpkin centered on face, moved up slightly
        const x = centerX - pumpkinSize / 2;
        const y = centerY - pumpkinSize / 2 - 50; // Move up by 50 pixels

        // Draw pumpkin as a square over face
        if (pumpkinImg.complete) {
          canvasCtx.drawImage(pumpkinImg, x, y, pumpkinSize, pumpkinSize);
        }
      });
    }
  }

  // Continuously detect faces
  const detectFaces = async () => {
    if (!isDetectionActive || !faceDetection) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      await faceDetection.send({ image: video });
    }

    requestAnimationFrame(detectFaces);
  };

  // Wait for video to be ready
  const startDetection = () => {
    if (video.readyState >= 2) {
      initMediaPipe();
      detectFaces();
    } else {
      video.addEventListener("loadeddata", () => {
        initMediaPipe();
        detectFaces();
      });
    }
  };

  // Start detection after a short delay to ensure MediaPipe is loaded
  setTimeout(startDetection, 1000);

  return {
    stop: () => {
      isDetectionActive = false;
      if (faceDetection) {
        faceDetection.close();
      }
    },
  };
};

