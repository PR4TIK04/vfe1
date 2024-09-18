import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const socket = io('https://video-be.vercel.app'); // Replace with your backend URL

const HostStream = () => {
  const [stream, setStream] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('user');
  const videoRef = useRef();
  const canvasRef = useRef();
  const peerRef = useRef();
  const [model, setModel] = useState(null);

  // Function to get media stream based on the camera direction
  const getMediaStream = (facingMode = 'user') => {
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true,
    });
  };

  // Initialize host stream, peer connection, and load object detection model
  useEffect(() => {
    // Load the pre-trained object detection model
    cocoSsd.load().then((loadedModel) => {
      setModel(loadedModel);
    });

    getMediaStream(cameraFacing).then((mediaStream) => {
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;

      // Wait for viewer connection request
      socket.on('viewer-request', (signal) => {
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: mediaStream,
        });

        peer.on('signal', (data) => {
          socket.emit('host-response', { signal: data });
        });

        peerRef.current = peer;
        peer.signal(signal);
      });
    });

    return () => {
      socket.off('viewer-request');
    };
  }, [cameraFacing]);

  // Switch the camera (front/rear)
  const switchCamera = () => {
    const newFacingMode = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacingMode);

    getMediaStream(newFacingMode).then((newStream) => {
      const videoTrack = newStream.getVideoTracks()[0];
      peerRef.current.replaceTrack(stream.getVideoTracks()[0], videoTrack, stream);
      setStream(newStream);
      videoRef.current.srcObject = newStream;
    });
  };

  // Object detection and rendering on the canvas
  const detectFrame = async () => {
    const video = videoRef.current;
    if (model) {
      const predictions = await model.detect(video);
      renderPredictions(predictions);
      requestAnimationFrame(detectFrame); // Continuously detect
    }
  };

  const renderPredictions = (predictions) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Ensure the canvas matches the video dimensions
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;

    // Clear previous predictions
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scaling factor between video original size and displayed size
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    // Loop through predictions and draw bounding boxes and labels
    predictions.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;

      // Scale the bounding box according to the video display size
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      // Draw bounding box
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw the label background
      const textWidth = ctx.measureText(prediction.class).width;
      const textHeight = 16; // Height of the text box

      ctx.fillStyle = '#00FF00';
      ctx.fillRect(scaledX, scaledY - textHeight, textWidth + 4, textHeight);

      // Draw the label text
      ctx.fillStyle = '#000000';
      ctx.fillText(prediction.class, scaledX, scaledY - 4);
    });
  };

  useEffect(() => {
    if (videoRef.current && model) {
      videoRef.current.onloadeddata = () => {
        detectFrame();
      };
    }
  }, [model]);

  return (
    <div className="w-full flex flex-col items-center relative">
      <h2 className="text-2xl font-semibold">Host Stream</h2>

      {/* Video stream */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{  height: 'auto', display: 'block' }}        />
        {/* Canvas for object detection */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: '24vh',
            left: 0,
            height: 'auto',
            pointerEvents: 'none' // Ensures the canvas does not interfere with video controls
          }}        />
      </div>

      {/* Buttons for switching camera */}
      <div className="flex gap-4 mt-4">
        <button className="bg-gray-800 text-white px-4 py-3 rounded" onClick={switchCamera}>
          Switch Camera
        </button>
      </div>
    </div>
  );
};

export default HostStream;
