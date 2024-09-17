import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io('https://your-backend-url'); // Replace with your backend URL

const ViewerStream = () => {
  const videoRef = useRef();

  useEffect(() => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
    });

    peer.on('stream', (stream) => {
      videoRef.current.srcObject = stream;
    });

    // Request the stream from the host
    socket.emit('viewer-request', { signal: peer.signal });

    socket.on('host-response', (signal) => {
      peer.signal(signal);
    });

    return () => {
      peer.destroy();
      socket.off('host-response');
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-2xl font-semibold">Viewer Stream</h2>
      <video ref={videoRef} autoPlay className="w-full h-auto mt-4" />
    </div>
  );
};

export default ViewerStream;
