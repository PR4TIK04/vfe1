import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io('https://video-be.vercel.app'); // Replace with the URL of your backend

const HostStream = () => {
  const [stream, setStream] = useState(null);
  const videoRef = useRef();
  const peerRef = useRef();

  useEffect(() => {
    // Capture the host's video stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
    });

    socket.on('viewer-request', ({ signal }) => {
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

      // Signal handling
      peer.signal(signal);
    });

    return () => {
      socket.off('viewer-request');
    };
  }, [stream]);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold">Host Stream</h2>
      <video ref={videoRef} autoPlay muted className="w-full h-auto mt-4" />
    </div>
  );
};

export default HostStream;
