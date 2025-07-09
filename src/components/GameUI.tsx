import React from 'react';
import { GameState, Tile } from '../types/game';
import { canCaptureTile, canBuildOn, getBuildingCost, captureArea } from '../utils/gameLogic';
import { Crown, Coins, Users, Sword, Anchor, Home, Wheat, Shield } from 'lucide-react';

interface GameUIProps {
  gameState: GameState;
  onBuild: (tileId: string, buildingType: string) => void;
  onCapture: (tileId: string) => void;
  onTogglePause: () => void;
}

export default function GameUI({ gameState, onBuild, onCapture, onTogglePause }: GameUIProps) {
  const humanPlayer = gameState.players.find(p => !p.isAI);
  const selectedTile = gameState.selectedTile ? gameState.tiles.get(gameState.selectedTile) : null;
  
  // Check if human player can take action (cooldown)
  const currentTime = Date.now() / 1000;
  const canTakeAction = humanPlayer && (currentTime - humanPlayer.lastActionTime >= humanPlayer.actionCooldown);
  const cooldownRemaining = humanPlayer ? Math.max(0, humanPlayer.actionCooldown - (currentTime - humanPlayer.lastActionTime)) : 0;

  if (!humanPlayer) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 border-t border-gray-600">
        <div className="text-center text-red-400">Error: Human player not found</div>
      </div>
    );
  }

  const buildingIcons = {
    city: Home,
    farm: Wheat,
    defense: Shield,
    port: Anchor
  };

  const buildingTypes = [
    { type: 'city', name: 'City', cost: 50, description: 'Increases population cap' },
    { type: 'farm', name: 'Farm', cost: 20, description: 'Provides steady income' },
    { type: 'defense', name: 'Defense', cost: 30, description: 'Strengthens borders' },
    { type: 'port', name: 'Port', cost: 40, description: 'Enables naval units' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 border-t border-gray-600">
      <div className="flex justify-between items-center mb-4">
        {/* Player Resources */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <span className="font-bold" style={{ color: humanPlayer.color }}>
              {humanPlayer.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span>{Math.floor(humanPlayer.resources.gold)}</span>
            <span className="text-xs text-green-400">+{humanPlayer.resources.goldPerSecond.toFixed(1)}/s</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>{Math.floor(humanPlayer.resources.population)}/{humanPlayer.resources.maxPopulation}</span>
            <span className="text-xs text-green-400">+{humanPlayer.resources.populationGrowthRate.toFixed(1)}/s</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Sword className="w-5 h-5 text-red-400" />
            <span>{Math.floor(humanPlayer.resources.population * humanPlayer.resources.militaryRatio)}</span>
          </div>
          
          <div className="text-sm text-gray-400">
            Territories: {humanPlayer.territories.length}
          </div>
          
          {!canTakeAction && (
            <div className="text-sm text-yellow-400">
              Cooldown: {cooldownRemaining.toFixed(1)}s
            </div>
          )}
        </div>

        {/* Empire Status */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-300 space-y-1">
            {gameState.players.map(player => (
              <div key={player.id} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: player.color }}
                />
                <span className={player.isAI ? 'text-gray-400' : 'text-white'}>
                  {player.name}: {player.territories.length}
                </span>
              </div>
            ))}
          </div>
          
          <button
            onClick={onTogglePause}
            className={`px-4 py-2 rounded transition-colors ${
              gameState.isPaused 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {gameState.isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Selected Tile Actions */}
      {selectedTile && (
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg">
                {selectedTile.type === 'water' ? 'Water' : 
                 selectedTile.type === 'coast' ? 'Coastal' : 'Land'} Tile
              </h3>
              <p className="text-sm text-gray-300">
                Position: {selectedTile.position.x}, {selectedTile.position.y}
              </p>
              {selectedTile.owner && (
                <p className="text-sm">
                  Owner: <span style={{ color: gameState.players.find(p => p.id === selectedTile.owner)?.color }}>
                    {gameState.players.find(p => p.id === selectedTile.owner)?.name}
                  </span>
                </p>
              )}
              {selectedTile.resources > 0 && (
                <p className="text-sm text-yellow-400">Resources: {selectedTile.resources}</p>
              )}
            </div>

            {selectedTile.building && (
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  {React.createElement(buildingIcons[selectedTile.building.type as keyof typeof buildingIcons], 
                    { className: "w-5 h-5" })}
                  <span className="capitalize">{selectedTile.building.type}</span>
                  <span className="text-yellow-400">Lv.{selectedTile.building.level}</span>
                </div>
                <div className="text-sm text-gray-300">
                  Health: {selectedTile.building.health}/{selectedTile.building.maxHealth}
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            {/* Capture Action */}
            {canCaptureTile(selectedTile, humanPlayer, gameState.tiles) && (
              <>
              <button
                onClick={() => canTakeAction && onCapture(selectedTile.id)}
                disabled={!canTakeAction}
                className={`px-3 py-2 rounded text-sm transition-colors flex items-center space-x-1 relative ${
                  canTakeAction 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                <Sword className="w-4 h-4" />
                <span>Capture Area</span>
                {(() => {
                  const militaryPop = Math.floor(humanPlayer.resources.population * humanPlayer.resources.militaryRatio);
                  const previewTiles = captureArea(selectedTile, humanPlayer, gameState.tiles);
                  return previewTiles.length > 1 && (
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {previewTiles.length}
                    </span>
                  );
                })()}
              </button>
              <div className="text-xs text-gray-400">
                Military: {Math.floor(humanPlayer.resources.population * humanPlayer.resources.militaryRatio)} units
              </div>
              </>
            )}

            {/* Building Actions */}
            {selectedTile.owner === humanPlayer.id && !selectedTile.building && (
              <div className="flex space-x-2">
                {buildingTypes.map(building => {
                  const canBuild = canBuildOn(selectedTile, building.type, humanPlayer);
                  const canAfford = humanPlayer.resources.gold >= building.cost;
                  const canAct = canTakeAction && canBuild && canAfford;
                  const Icon = buildingIcons[building.type as keyof typeof buildingIcons];
                  
                  return (
                    <button
                      key={building.type}
                      onClick={() => canAct && onBuild(selectedTile.id, building.type)}
                      disabled={!canAct}
                      className={`px-3 py-2 rounded text-sm transition-colors flex items-center space-x-1 ${
                        canAct
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-600 cursor-not-allowed opacity-50'
                      }`}
                      title={`${building.name} - ${building.cost} gold - ${building.description}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{building.name}</span>
                      <span className="text-yellow-400">({building.cost})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Status */}
      {gameState.gamePhase === 'ended' && gameState.winner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Total Conquest Achieved!</h2>
            <p className="text-xl mb-4">
              Conqueror: <span style={{ color: gameState.players.find(p => p.id === gameState.winner)?.color }}>
                {gameState.players.find(p => p.id === gameState.winner)?.name}
              </span>
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Conquered the entire continent in {Math.floor(gameState.gameTime / 60)} minutes and {Math.floor(gameState.gameTime % 60)} seconds
            </p>
            <div className="space-x-4">
              <button
                onClick={() => {
                  localStorage.removeItem('openfront-game');
                  window.location.reload();
                }}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-lg transition-colors"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}