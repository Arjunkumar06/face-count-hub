import * as faceapi from "face-api.js";

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model/";
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export async function detectFaces(imageElement: HTMLImageElement): Promise<number> {
  await loadModels();
  
  // Use SSD MobileNet (more accurate) as primary detector
  const ssdDetections = await faceapi.detectAllFaces(
    imageElement,
    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 })
  );

  // Also run TinyFaceDetector to catch faces SSD might miss
  const tinyDetections = await faceapi.detectAllFaces(
    imageElement,
    new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 })
  );

  // Return the higher count from both detectors
  return Math.max(ssdDetections.length, tinyDetections.length);
}
