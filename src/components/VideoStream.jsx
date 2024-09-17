import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
const socket = io('http://localhost:5000'); // Change if your backend is hosted

const VideoStream = () => {
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const myVideo = useRef();
  const userVideo = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      myVideo.current.srcObject = currentStream;

      socket.emit('join-room', 'room-id'); // Modify room-id to handle unique rooms

      socket.on('user-joined', (userId) => {
        const newPeer = createPeer(userId, socket.id, currentStream);
        setPeer(newPeer);
      });

      socket.on('receiving-returned-signal', (signal) => {
        peer.signal(signal);
      });
    });
  }, []);

  function createPeer(userToSignal, callerId, stream) {
    const newPeer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    newPeer.on('signal', (signal) => {
      socket.emit('sending-signal', { userToSignal, callerId, signal });
    });

    newPeer.on('stream', (stream) => {
      userVideo.current.srcObject = stream;
    });

    return newPeer;
  }

  const muteAudio = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      setAudioMuted(!audioMuted);
    }
  };

  const switchCamera = async () => {
    const videoTrack = stream.getVideoTracks()[0];
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const currentIndex = videoDevices.findIndex(device => device.deviceId === videoTrack.getSettings().deviceId);
    const nextDevice = videoDevices[(currentIndex + 1) % videoDevices.length];

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: nextDevice.deviceId },
      audio: true
    });

    setStream(newStream);
    myVideo.current.srcObject = newStream;
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Live Stream</h2>
      <div className="grid grid-cols-2 gap-4">
        <video ref={myVideo} className="border-2 border-gray-300" muted autoPlay playsInline />
        <video ref={userVideo} className="border-2 border-gray-300" autoPlay playsInline />
      </div>
      <div className="mt-4">
        <button className="px-4 py-2 bg-blue-500 text-white mr-2" onClick={muteAudio}>
          {audioMuted ? 'Unmute' : 'Mute'}
        </button>
        <button className="px-4 py-2 bg-green-500 text-white" onClick={switchCamera}>Switch Camera</button>
      </div>
    </div>
  );
};

export default VideoStream;
