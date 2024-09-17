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

  // Function to get media stream with a specific camera direction
  const getMediaStream = (facingMode = 'user') => {
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true,
    });
  };

  // Initialize host stream and peer connection
  useEffect(() => {
    getMediaStream(cameraFacing).then((mediaStream) => {
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;

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

  // Toggle audio
  const toggleAudio = () => {
    stream.getAudioTracks()[0].enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
  };

  // Switch camera
  const switchCamera = () => {
    const newFacingMode = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacingMode);

    // Get the new camera stream
    getMediaStream(newFacingMode).then((newStream) => {
      const videoTrack = newStream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      // Replace the current stream with the new stream
      peerRef.current.replaceTrack(stream.getVideoTracks()[0], videoTrack, stream);
      setStream(new MediaStream([videoTrack, audioTrack]));
      videoRef.current.srcObject = newStream;
    });
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
