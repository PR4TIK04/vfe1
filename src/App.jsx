import React, { useState } from 'react';
import HostStream from './components/HostStream';
import ViewerStream from './components/ViewerStream';

const App = () => {
  const [role, setRole] = useState('viewer'); // Default to viewer role

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold mb-6">Live Video Streaming</h1>
      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => setRole('host')}
        >
          Host
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={() => setRole('viewer')}
        >
          Viewer
        </button>
      </div>
      <div className="mt-8 w-full flex justify-center">
        {role === 'host' ? <HostStream /> : <ViewerStream />}
      </div>
    </div>
  );
};

export default App;

