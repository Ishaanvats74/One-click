"use client";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useRef, useState } from "react";
import { filterAnchors, overlayFilters } from "../utils/filter";
import * as faceapi from 'face-api.js';



const PhotoCapture = () => {
  const { user } = useUser();
  const username = user?.username || user?.firstName || user?.id;
  const photoref = useRef(null);
  const canvasRef = useRef(null);
  const [filter, setFilter] = useState("none");
  const [overlay, setOverlay] = useState('none');
  

  const filters = {
    none: "none",
    grayscale: "grayscale(1)",
    sepia: "sepia(1)",
    invert: "invert(1)",
    blur: "blur(4px)",
  };

useEffect(() => {
  let animationFrameId;
    async function camera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (photoref.current) {
          photoref.current.srcObject = stream;
        }
      } catch (error) {
        console.log("Error accessing camera:", error);
      };
    };

    async function loadModels() {
      const modelUrl = '/models';
      await Promise.all([        
        faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
      ]);
      console.log('face model loaded')
      runDetection();
    };
    const runDetection = async () => {
      const video = photoref.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.setTransform(-1, 0, 0, 1, canvas.width, 0); // mirror
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.filter = filters[filter];
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const resized = faceapi.resizeResults(detections, {
        width: video.videoWidth,
        height: video.videoHeight,
      });

      const selectedFilter = overlayFilters[overlay];
      if (selectedFilter) {
        const filterImg = new Image();
        filterImg.src = selectedFilter.src;
        await new Promise((resolve) => (filterImg.onload = resolve));

        for (const detection of resized) {
          const landmarks = detection.landmarks;
          const anchorFunc =
            selectedFilter.anchorFunc || filterAnchors[selectedFilter.anchor];
          if (!anchorFunc) continue;

          const { x, y, width } = anchorFunc(landmarks);
          const scaledWidth = width * selectedFilter.scale;
          const height = scaledWidth * (filterImg.height / filterImg.width);
          context.drawImage(
            filterImg,
            x - scaledWidth / 2,
            y - height / 2,
            scaledWidth,
            height
          );
        }
      }
      requestAnimationFrame(runDetection); }
    loadModels()
    camera();
  },[]);


  const CaptureImage = async () => {
      const video = photoref.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      console.log("Resolution:", video.videoWidth, "x", video.videoHeight);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.filter = filters[filter];
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
      const resized = faceapi.resizeResults(detections, {width: video.videoWidth, height:video.videoHeight});
      faceapi.draw.drawFaceLandmarks(canvas, resized);
      const selectedFilter  = overlayFilters[overlay];
      if(!selectedFilter) return;
      
      const filterImg = new Image();
      filterImg.src = selectedFilter.src;
      await new Promise((resolve) => (filterImg.onload = resolve));
      for (const detection of resized) {
        const landmarks = detection.landmarks;
        const anchorFunc = selectedFilter.anchorFunc || filterAnchors[selectedFilter.anchor];
        if (!anchorFunc) continue;
        
        const { x, y, width } = anchorFunc(landmarks);
        const scaledWidth = width * selectedFilter.scale;
        const height = scaledWidth * (filterImg.height / filterImg.width);
        context.drawImage(filterImg, x - scaledWidth / 2, y - height / 2, scaledWidth, height);
      }
      
      const imageData = canvas.toDataURL("image/png");
      console.log("Sending to /api/upload", { imageData, username });

      if (user) {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: JSON.stringify({ imageData, username }),
          headers: { "Content-Type": "application/json" },
        });
        console.log("Raw response", res);
        const result = await res.json();
        console.log("Upload result:", result);
        if (result.success) {
          console.log("Photo saved to Supabase!");
        } else {
          alert("Failed to upload.");
        }
      } else {
        alert("User not signed in!");
      }
    };

  return (
    <div className="p-4 flex flex-col items-center gap-4">
      <video
        ref={photoref}
        autoPlay
        playsInline
        className="rounded border"
        style={{
          filter: filters[filter],
          transform: "scaleX(-1)",
          width: "640px",
          height: "480px",
        }}
      ></video>
      <div className="flex flex-wrap gap-2">
        {Object.keys(filters).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded text-sm ${
              filter === key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.keys(overlayFilters).map((key) => (
          <button
            key={key}
            onClick={() => setOverlay(key)}
            className={`px-3 py-1 rounded text-sm ${
              overlay === key
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div>
        <button
          onClick={CaptureImage}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          Capture Photo
        </button>
      </div>
    </div>
  );
};

export default PhotoCapture;
