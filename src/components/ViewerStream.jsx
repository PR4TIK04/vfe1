import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io('https://video-be.vercel.app'); // Replace with your backend URL

const ViewerStream = () => {
  const videoRef = useRef();
  const [peer, setPeer] = useState(null);

  useEffect(() => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
    });

    peer.on('stream', (stream) => {
      videoRef.current.srcObject = stream;
    });

    // Signal the host to start the connection
    socket.emit('viewer-request', { signal: peer.signal });

    socket.on('host-response', ({ signal }) => {
      peer.signal(signal);
    });

    setPeer(peer);

    return () => {
      peer.destroy();
      socket.off('host-response');
    };
  }, []);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold">Viewer Stream</h2>
      <video ref={videoRef} autoPlay className="w-full h-auto mt-4" />
    </div>
  );
};

export default ViewerStream;
