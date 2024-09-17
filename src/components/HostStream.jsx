import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io('https://video-be.vercel.app'); // Replace with your backend URL

const HostStream = () => {
  const [stream, setStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [cameraFacing, setCameraFacing] = useState('user');
  const videoRef = useRef();
  const peerRef = useRef();

  useEffect(() => {
    // Request access to video and audio
    navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing }, audio: true }).then((mediaStream) => {
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
    });

    socket.on('viewer-request', (signal) => {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
      });

      peer.on('signal', (data) => {
        socket.emit('host-response', { signal: data });
      });

      peer.on('connect', () => {
        console.log('Peer connected');
      });

      peerRef.current = peer;

      peer.signal(signal);
    });

    return () => {
      socket.off('viewer-request');
    };
  }, [stream, cameraFacing]);

  // Toggle audio
  const toggleAudio = () => {
    stream.getAudioTracks()[0].enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
  };

  // Switch camera
  const switchCamera = () => {
    setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-2xl font-semibold">Host Stream</h2>
      <video ref={videoRef} autoPlay muted className="w-full h-auto mt-4" />

      <div className="flex gap-4 mt-4">
        <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={toggleAudio}>
          {audioEnabled ? 'Mute' : 'Unmute'}
        </button>
        <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={switchCamera}>
          Switch Camera
        </button>
      </div>
    </div>
  );
};

export default HostStream;
