import * as faceapi from "face-api.js";

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model/";
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  modelsLoaded = true;
}

export async function detectFaces(imageElement: HTMLImageElement): Promise<number> {
  await loadModels();
  const detections = await faceapi.detectAllFaces(
    imageElement,
    new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
  );
  return detections.length;
}
