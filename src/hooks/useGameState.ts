import { useState, useCallback, useEffect } from 'react';
import { GameState, GameAction, Tile, Building } from '../types/game';
import { 
  createInitialGameState, 
  canCaptureTile, 
  captureArea,
  canBuildOn, 
  getBuildingCost, 
  updatePlayerResources,
  processAIActions 
} from '../utils/gameLogic';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem('openfront-game');
      if (saved) {
        const parsedState = JSON.parse(saved);
        // Convert tiles object back to Map
        if (parsedState.tiles && typeof parsedState.tiles === 'object' && !parsedState.tiles.has) {
          parsedState.tiles = new Map(Object.entries(parsedState.tiles));
        }
        // Validate the loaded state
        if (parsedState.players && parsedState.tiles) {
          // Update lastUpdateTime to current time
          parsedState.lastUpdateTime = Date.now() / 1000;
          return parsedState;
        }
      }
    } catch (error) {
      console.warn('Failed to load saved game:', error);
      localStorage.removeItem('openfront-game');
    }
    return createInitialGameState();
  });

  // Auto-save to localStorage
  useEffect(() => {
    try {
      // Convert Map to object for serialization
      const stateToSave = {
        ...gameState,
        tiles: Object.fromEntries(gameState.tiles)
      };
      localStorage.setItem('openfront-game', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save game:', error);
    }
  }, [gameState]);

  // Real-time game loop
  useEffect(() => {
    if (gameState.gamePhase !== 'playing' || gameState.isPaused) return;

    const gameLoop = () => {
      const currentTime = Date.now() / 1000;
      const deltaTime = (currentTime - gameState.lastUpdateTime) * gameState.gameSpeed;
      
      if (deltaTime < 0.1) return; // Minimum update interval

      setGameState(prevState => {
        const newState = {
          ...prevState,
          gameTime: prevState.gameTime + deltaTime,
          lastUpdateTime: currentTime,
          tiles: new Map(prevState.tiles),
          players: prevState.players.map(p => ({ ...p }))
        };

        // Update all players' resources
        newState.players.forEach(player => {
          updatePlayerResources(player, newState.tiles, deltaTime);
        });

        // Process AI actions
        newState.players.forEach(player => {
          if (player.isAI) {
            const updatedState = processAIActions(player, newState, currentTime);
            Object.assign(newState, updatedState);
          }
        });

        // Check win condition - total conquest
        const totalLandTiles = Array.from(newState.tiles.values()).filter(t => t.type !== 'water').length;
        for (const player of newState.players) {
          if (player.territories.length >= totalLandTiles) {
            newState.gamePhase = 'ended';
            newState.winner = player.id;
            break;
          }
        }

        return newState;
      });
    };

    const intervalId = setInterval(gameLoop, 100); // 10 FPS update rate
    return () => clearInterval(intervalId);
  }, [gameState.gamePhase, gameState.isPaused, gameState.gameSpeed, gameState.lastUpdateTime]);
  const dispatch = useCallback((action: GameAction) => {
    setGameState(prevState => {
      const newState = { 
        ...prevState,
        tiles: new Map(prevState.tiles),
        players: prevState.players.map(p => ({ ...p }))
      };
      

      switch (action.type) {
        case 'SELECT_TILE':
          newState.selectedTile = action.payload.tileId;
          newState.selectedShip = null;
          break;

        case 'CAPTURE_TILE':
          const currentPlayer = newState.players.find(p => p.id === action.playerId);
          if (!currentPlayer) break;
          
          // Check cooldown for human players
          const currentTime = Date.now() / 1000;
          if (!currentPlayer.isAI && currentTime - currentPlayer.lastActionTime < currentPlayer.actionCooldown) {
            break;
          }
          
          const centerTile = newState.tiles.get(action.payload.tileId);
          if (centerTile && centerTile.type !== 'water') {
            const capturedTiles = captureArea(centerTile, currentPlayer, newState.tiles);
            
            if (capturedTiles.length > 0) {
              capturedTiles.forEach(tile => {
                // Remove from previous owner
                if (tile.owner) {
                  const prevOwner = newState.players.find(p => p.id === tile.owner);
                  if (prevOwner) {
                    prevOwner.territories = prevOwner.territories.filter(id => id !== tile.id);
                  }
                }
                
                // Add to current player
                tile.owner = currentPlayer.id;
                currentPlayer.territories.push(tile.id);
              });
              
              // Combat losses based on area captured
              const losses = Math.max(1, Math.floor(capturedTiles.length / 2));
              currentPlayer.resources.population = Math.max(1, currentPlayer.resources.population - losses);
              
              // Update action time
              currentPlayer.lastActionTime = currentTime;
            }
          }
          break;

        case 'BUILD':
          const buildPlayer = newState.players.find(p => p.id === action.playerId);
          if (!buildPlayer) break;
          
          const buildTile = newState.tiles.get(action.payload.tileId);
          const buildingType = action.payload.buildingType;
          
          if (!buildTile || buildTile.owner !== buildPlayer.id || buildTile.building) {
            break;
          }
          
          const cost = getBuildingCost(buildingType);
          if (buildPlayer.resources.gold >= cost && canBuildOn(buildTile, buildingType, buildPlayer)) {
            
            const building: Building = {
              id: `${buildingType}-${buildPlayer.id}-${Date.now()}`,
              type: buildingType,
              level: 1,
              position: buildTile.position,
              owner: buildPlayer.id,
              health: 100,
              maxHealth: 100
            };
            
            buildTile.building = building;
            buildPlayer.buildings.push(building);
            buildPlayer.resources.gold -= cost;
            
            // Building effects
            if (buildingType === 'city') {
              buildPlayer.resources.maxPopulation += 20;
            }
          }
          break;

        case 'PAUSE_GAME':
          newState.isPaused = !newState.isPaused;
          break;
          
        case 'SET_SPEED':
          newState.gameSpeed = action.payload.speed;
          break;
        
        default:
          console.warn('Unknown action type:', action.type);
          return prevState;
      }


      return newState;
    });
  }, []);

  const selectTile = useCallback((tile: Tile) => {
    dispatch({
      type: 'SELECT_TILE',
      payload: { tileId: tile.id },
      playerId: 'player'
    });
  }, [dispatch, gameState.currentPlayer]);

  const captureTile = useCallback((tileId: string) => {
    dispatch({
      type: 'CAPTURE_TILE',
      payload: { tileId },
      playerId: 'player'
    });
  }, [dispatch, gameState.currentPlayer]);

  const buildOnTile = useCallback((tileId: string, buildingType: string) => {
    dispatch({
      type: 'BUILD',
      payload: { tileId, buildingType },
      playerId: 'player'
    });
  }, [dispatch, gameState.currentPlayer]);

  const togglePause = useCallback(() => {
    dispatch({
      type: 'PAUSE_GAME',
      payload: {},
      playerId: 'player'
    });
  }, [dispatch]);

  const setGameSpeed = useCallback((speed: number) => {
    dispatch({
      type: 'SET_SPEED',
      payload: { speed },
      playerId: 'player'
    });
  }, [dispatch]);
  const resetGame = useCallback(() => {
    localStorage.removeItem('openfront-game');
    setGameState(createInitialGameState());
  }, []);


  return {
    gameState,
    selectTile,
    captureTile,
    buildOnTile,
    togglePause,
    resetGame,
    setGameSpeed
  };
}