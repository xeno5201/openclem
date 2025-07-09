import React from 'react';
import GameMap from './components/GameMap';
import GameUI from './components/GameUI';
import { useGameState } from './hooks/useGameState';
import { Crown, RotateCcw } from 'lucide-react';

function App() {
  const { gameState, selectTile, captureTile, buildOnTile, togglePause, resetGame, setGameSpeed } = useGameState();
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Crown className="w-8 h-8 text-yellow-400" />
          <h1 className="text-2xl font-bold">OpenFront Conquest</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-300">
            Time: {formatTime(gameState.gameTime)} | {gameState.players.length} Empires
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePause}
              className={`px-3 py-2 rounded transition-colors flex items-center space-x-2 ${
                !gameState.isPaused 
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
              title={gameState.isPaused ? "Resume Game" : "Pause Game"}
            >
              {!gameState.isPaused ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Live</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Paused</span>
                </>
              )}
            </button>
            
            <select
              value={gameState.gameSpeed}
              onChange={(e) => setGameSpeed(parseFloat(e.target.value))}
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
              title="Time Speed"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
              <option value={8}>8x</option>
            </select>
          </div>
          
          <button
            onClick={resetGame}
            className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded transition-colors flex items-center space-x-2"
            title="New Game"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Game</span>
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative">
        <GameMap
          gameState={gameState}
          onTileClick={selectTile}
          onBuild={buildOnTile}
          onCapture={captureTile}
        />
        
        <GameUI
          gameState={gameState}
          onBuild={buildOnTile}
          onCapture={captureTile}
          onTogglePause={togglePause}
        />
      </div>

      {/* Game Status Indicator */}
      {gameState.isPaused && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 text-white px-6 py-3 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-yellow-400 rounded"></div>
            <span>
              Game Paused - Click Resume to Continue
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;