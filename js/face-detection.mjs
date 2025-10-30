export const initFaceDetection = () => {
  const video = document.getElementById("stream");
  const canvas = document.getElementById("overlay-canvas");
  const canvasCtx = canvas.getContext("2d");

  const pumpkinImg = new Image();
  pumpkinImg.src = "./assets/jack-o-lantern.png";

  let faceMesh = null;
  let isDetectionActive = false;
  let isFilterEnabled = true;
  let currentMouthRatio = 0;

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

  function getMouthOpenRatio(landmarks) {
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];

    const mouthHeight = Math.abs(lowerLip.y - upperLip.y);

    const nose = landmarks[1];
    const chin = landmarks[152];
    const faceHeight = Math.abs(chin.y - nose.y);

    const ratio = mouthHeight / faceHeight;

    const normalizedRatio = Math.max(0, (ratio - 0.02) / 0.06);

    return {
      ratio: normalizedRatio,
      isOpen: ratio > 0.035,
    };
  }

  function onResults(results) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    if (
      isFilterEnabled &&
      results.multiFaceLandmarks &&
      results.multiFaceLandmarks.length > 0
    ) {
      const landmarks = results.multiFaceLandmarks[0];

      const mouthData = getMouthOpenRatio(landmarks);
      currentMouthRatio = Math.min(mouthData.ratio, 1.0);

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

      const faceWidth = (maxX - minX) * canvas.width;
      const faceHeight = (maxY - minY) * canvas.height;

      const faceSize = Math.max(faceWidth, faceHeight);

      const pumpkinSize = faceSize * 3.45;

      const centerX = ((minX + maxX) / 2) * canvas.width;
      const centerY = ((minY + maxY) / 2) * canvas.height;

      const x = centerX - pumpkinSize / 2;
      const y = centerY - pumpkinSize / 2 - 20;

      if (pumpkinImg.complete) {
        canvasCtx.save();

        const mouthScale = 1 + currentMouthRatio * 0.17;

        const centerPumpkinX = x + pumpkinSize / 2;
        const centerPumpkinY = y + pumpkinSize / 2;

        canvasCtx.translate(centerPumpkinX, centerPumpkinY);

        canvasCtx.scale(1, mouthScale);

        canvasCtx.drawImage(
          pumpkinImg,
          -pumpkinSize / 2,
          -pumpkinSize / 2,
          pumpkinSize,
          pumpkinSize
        );

        canvasCtx.restore();
      }
    }
  }

  const detectFaces = async () => {
    if (!isDetectionActive || !faceMesh) return;

    if (video.readyState >= video.HAVE_ENOUGH_DATA) {
      try {
        await faceMesh.send({ image: video });
      } catch (error) {
        // Handle errors gracefully during stream transitions
        console.debug("Face detection frame skipped:", error);
      }
    }

    requestAnimationFrame(detectFaces);
  };

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

  // Handle video stream changes (camera switching)
  const handleStreamChange = () => {
    // Wait for new stream to be ready
    if (video.readyState >= 2) {
      // Stream is ready, detection will continue automatically
      console.debug("Video stream ready after change");
    }
  };

  video.addEventListener("loadedmetadata", handleStreamChange);
  video.addEventListener("loadeddata", handleStreamChange);

  setTimeout(startDetection, 1000);

  return {
    stop: () => {
      isDetectionActive = false;
      if (faceMesh) {
        faceMesh.close();
      }
      video.removeEventListener("loadedmetadata", handleStreamChange);
      video.removeEventListener("loadeddata", handleStreamChange);
    },
    toggleFilter: () => {
      isFilterEnabled = !isFilterEnabled;
      return isFilterEnabled;
    },
    isFilterEnabled: () => isFilterEnabled,
  };
};
