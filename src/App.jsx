import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import SwarmCanvas from './components/SwarmCanvas/SwarmCanvas';
import SwarmHeader from './components/SwarmHeader/SwarmHeader';
import SignalBusConsole from './components/SignalBus/SignalBusConsole';
import OutputViewer from './components/OutputPanel/OutputViewer';
import { useSwarmStore } from './stores/swarmStore';
import './App.css';

function App() {
  const { isExecuting, showOutput } = useSwarmStore();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Bar */}
      <SwarmHeader />
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <SwarmCanvas />
          </ReactFlowProvider>
          
          {/* Execution Overlay */}
          {isExecuting && (
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="text-lg font-medium">Swarm Executing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Output Panel (Collapsible) */}
        {showOutput && (
          <div className="w-96 border-l bg-white">
            <OutputViewer />
          </div>
        )}
      </div>
      
      {/* Signal Bus Console */}
      <SignalBusConsole />
    </div>
  );
}

export default App; 