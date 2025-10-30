export const initFaceDetection = () => {
  const video = document.getElementById("stream");
  const canvas = document.getElementById("overlay-canvas");
  const canvasCtx = canvas.getContext("2d");

  // Load pumpkin images
  const pumpkinNormal = new Image();
  pumpkinNormal.src = "./assets/pumbkin.png";

  const pumpkinSmile = new Image();
  pumpkinSmile.src = "./assets/jack-o-lantern.png";

  let faceMesh = null;
  let isDetectionActive = false;
  let isFilterEnabled = true; // Filter enabled by default

  // Throttle variables to prevent flickering
  let lastMouthState = false;
  let mouthStateTimer = null;
  let confirmedMouthState = false;
  const STATE_CHANGE_DELAY = 200; // 200ms delay before confirming state change

  // Initialize MediaPipe Face Mesh
  const initMediaPipe = () => {
    faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);
    isDetectionActive = true;
  };

  // Helper function to detect if mouth is open/smiling
  function isMouthOpen(landmarks) {
    // Mouth landmarks: upper lip center (13), lower lip center (14)
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];

    // Calculate vertical distance between lips
    const mouthHeight = Math.abs(lowerLip.y - upperLip.y);

    // Get face height for relative threshold
    const nose = landmarks[1];
    const chin = landmarks[152];
    const faceHeight = Math.abs(chin.y - nose.y);

    // If mouth height is > 3.5% of face height, consider it open/smiling
    return mouthHeight / faceHeight > 0.035;
  }

  // Process detection results
  function onResults(results) {
    // Match canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Only draw pumpkin if filter is enabled
    if (
      isFilterEnabled &&
      results.multiFaceLandmarks &&
      results.multiFaceLandmarks.length > 0
    ) {
      const landmarks = results.multiFaceLandmarks[0];

      // Detect if mouth is open
      const detectedMouthState = isMouthOpen(landmarks);

      // Throttle state changes to prevent flickering
      if (detectedMouthState !== lastMouthState) {
        // State changed, reset timer
        lastMouthState = detectedMouthState;
        if (mouthStateTimer) {
          clearTimeout(mouthStateTimer);
        }
        // Wait 200ms before confirming the new state
        mouthStateTimer = setTimeout(() => {
          confirmedMouthState = detectedMouthState;
          mouthStateTimer = null;
        }, STATE_CHANGE_DELAY);
      }

      // Choose pumpkin based on confirmed state (instant switch)
      const pumpkinImg = confirmedMouthState ? pumpkinSmile : pumpkinNormal;

      // Calculate bounding box from landmarks
      let minX = 1,
        minY = 1,
        maxX = 0,
        maxY = 0;
      landmarks.forEach((landmark) => {
        minX = Math.min(minX, landmark.x);
        minY = Math.min(minY, landmark.y);
        maxX = Math.max(maxX, landmark.x);
        maxY = Math.max(maxY, landmark.y);
      });

      // Calculate face dimensions in pixels
      const faceWidth = (maxX - minX) * canvas.width;
      const faceHeight = (maxY - minY) * canvas.height;

      // Use the larger dimension to maintain square aspect ratio
      const faceSize = Math.max(faceWidth, faceHeight);

      // Make pumpkin 2.3x larger than face size
      const pumpkinSize = faceSize * 2.3;

      // Calculate center position
      const centerX = ((minX + maxX) / 2) * canvas.width;
      const centerY = ((minY + maxY) / 2) * canvas.height;

      // Position pumpkin centered on face, moved up slightly
      const x = centerX - pumpkinSize / 2;
      const y = centerY - pumpkinSize / 2 - 50; // Move up by 50 pixels

      // Draw selected pumpkin (instant switch)
      if (pumpkinImg.complete) {
        canvasCtx.drawImage(pumpkinImg, x, y, pumpkinSize, pumpkinSize);
      }
    }
  }

  // Continuously detect faces
  const detectFaces = async () => {
    if (!isDetectionActive || !faceMesh) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      await faceMesh.send({ image: video });
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
      if (mouthStateTimer) {
        clearTimeout(mouthStateTimer);
        mouthStateTimer = null;
      }
      if (faceMesh) {
        faceMesh.close();
      }
    },
    toggleFilter: () => {
      isFilterEnabled = !isFilterEnabled;
      return isFilterEnabled;
    },
    isFilterEnabled: () => isFilterEnabled,
  };
};
