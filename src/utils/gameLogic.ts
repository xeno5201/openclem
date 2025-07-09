import { GameState, Player, Tile, Building, Ship, Position } from '../types/game';

export const TILE_SIZE = 16;
export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 60;

export function createInitialGameState(): GameState {
  const tiles = new Map<string, Tile>();
  
  // Generate map based on Europe.webp reference
  for (let x = 0; x < MAP_WIDTH; x++) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const tileId = `${x}-${y}`;
      const isWater = isWaterTile(x, y);
      const isCoast = !isWater && hasAdjacentWater(x, y);
      
      tiles.set(tileId, {
        id: tileId,
        position: { x, y },
        type: isWater ? 'water' : isCoast ? 'coast' : 'land',
        owner: null,
        resources: isWater ? 0 : Math.floor(Math.random() * 3) + 1,
        building: null,
        isVisible: true
      });
    }
  }

  const players: Player[] = [
    {
      id: 'player',
      name: 'Player',
      color: '#3b82f6',
      isAI: false,
      lastActionTime: 0,
      actionCooldown: 2, // 2 seconds between actions
      resources: { 
        gold: 100, 
        population: 10, 
        maxPopulation: 10, 
        militaryRatio: 0.3,
        goldPerSecond: 2,
        populationGrowthRate: 0.5
      },
      territories: [],
      buildings: [],
      ships: []
    },
    {
      id: 'ai1',
      name: 'Roman Empire',
      color: '#ef4444',
      isAI: true,
      lastActionTime: 0,
      actionCooldown: 3,
      resources: { 
        gold: 100, 
        population: 10, 
        maxPopulation: 10, 
        militaryRatio: 0.3,
        goldPerSecond: 2,
        populationGrowthRate: 0.5
      },
      territories: [],
      buildings: [],
      ships: []
    },
    {
      id: 'ai2',
      name: 'Byzantine Empire',
      color: '#10b981',
      isAI: true,
      lastActionTime: 0,
      actionCooldown: 3.5,
      resources: { 
        gold: 100, 
        population: 10, 
        maxPopulation: 10, 
        militaryRatio: 0.3,
        goldPerSecond: 2,
        populationGrowthRate: 0.5
      },
      territories: [],
      buildings: [],
      ships: []
    },
    {
      id: 'ai3',
      name: 'Holy Roman Empire',
      color: '#f59e0b',
      isAI: true,
      lastActionTime: 0,
      actionCooldown: 4,
      resources: { 
        gold: 100, 
        population: 10, 
        maxPopulation: 10, 
        militaryRatio: 0.4,
        goldPerSecond: 2,
        populationGrowthRate: 0.5
      },
      territories: [],
      buildings: [],
      ships: []
    },
    {
      id: 'ai4',
      name: 'French Kingdom',
      color: '#8b5cf6',
      isAI: true,
      lastActionTime: 0,
      actionCooldown: 3.2,
      resources: { 
        gold: 100, 
        population: 10, 
        maxPopulation: 10, 
        militaryRatio: 0.35,
        goldPerSecond: 2,
        populationGrowthRate: 0.5
      },
      territories: [],
      buildings: [],
      ships: []
    },
    {
      id: 'ai5',
      name: 'English Kingdom',
      color: '#06b6d4',
      isAI: true,
      lastActionTime: 0,
      actionCooldown: 4.5,
      resources: { 
        gold: 100, 
        population: 10, 
        maxPopulation: 10, 
        militaryRatio: 0.25,
        goldPerSecond: 2,
        populationGrowthRate: 0.5
      },
      territories: [],
      buildings: [],
      ships: []
    },
    {
      id: 'ai6',
      name: 'Viking Clans',
      color: '#84cc16',
      isAI: true,
      lastActionTime: 0,
      actionCooldown: 2.5,
      resources: { 
        gold: 80, 
        population: 8, 
        maxPopulation: 8, 
        militaryRatio: 0.6,
        goldPerSecond: 1.5,
        populationGrowthRate: 0.4
      },
      territories: [],
      buildings: [],
      ships: []
    }
  ];

  // Give each player starting territories
  giveStartingTerritories(players, tiles);

  const now = Date.now() / 1000;
  return {
    gameTime: 0,
    lastUpdateTime: now,
    players,
    tiles,
    ships: [],
    selectedTile: null,
    selectedShip: null,
    gamePhase: 'playing',
    winner: null,
    mapSize: { width: MAP_WIDTH, height: MAP_HEIGHT },
    camera: { x: 0, y: 0, zoom: 1 },
    gameSpeed: 1,
    isPaused: false
  };
}

function isWaterTile(x: number, y: number): boolean {
  // Create water bodies similar to European geography
  const centerX = MAP_WIDTH / 2;
  const centerY = MAP_HEIGHT / 2;
  
  // Mediterranean-like sea
  if (y > centerY + 10 && y < centerY + 25 && x > centerX - 20 && x < centerX + 20) {
    return true;
  }
  
  // North Sea-like area
  if (y < centerY - 15 && x > centerX - 10 && x < centerX + 15) {
    return true;
  }
  
  // Atlantic-like western edge
  if (x < 5) return true;
  
  // Random islands and lakes
  const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1);
  return noise > 0.7;
}

function hasAdjacentWater(x: number, y: number): boolean {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      if (isWaterTile(x + dx, y + dy)) return true;
    }
  }
  return false;
}

function giveStartingTerritories(players: Player[], tiles: Map<string, Tile>) {
  const startingPositions = [
    { x: 15, y: 25 }, // Player - Western Europe
    { x: 50, y: 20 }, // Roman Empire - Eastern Europe
    { x: 55, y: 35 }, // Byzantine Empire - Southeast Europe
    { x: 35, y: 15 }, // Holy Roman Empire - Central Europe
    { x: 20, y: 20 }, // French Kingdom - Western Central Europe
    { x: 10, y: 15 }, // English Kingdom - Northwest Europe
    { x: 25, y: 10 }  // Viking Clans - Northern Europe
  ];

  players.forEach((player, index) => {
    const startPos = startingPositions[index] || { x: 40 + index * 5, y: 30 + index * 3 };
    const startingTiles = getAdjacentTiles(startPos.x, startPos.y, 2, tiles);
    
    startingTiles.forEach(tile => {
      if (tile.type !== 'water') {
        tile.owner = player.id;
        player.territories.push(tile.id);
      }
    });

    // Add starting city
    const centerTile = tiles.get(`${startPos.x}-${startPos.y}`);
    if (centerTile && centerTile.type !== 'water') {
      const city: Building = {
        id: `city-${player.id}-start`,
        type: 'city',
        level: 1,
        position: startPos,
        owner: player.id,
        health: 100,
        maxHealth: 100
      };
      centerTile.building = city;
      player.buildings.push(city);
      player.resources.maxPopulation += 20;
    }
  });
}

export function getAdjacentTiles(x: number, y: number, radius: number, tiles: Map<string, Tile>): Tile[] {
  const result: Tile[] = [];
  
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const tileId = `${x + dx}-${y + dy}`;
      const tile = tiles.get(tileId);
      if (tile) {
        result.push(tile);
      }
    }
  }
  
  return result;
}

export function canCaptureTile(tile: Tile, player: Player, tiles: Map<string, Tile>): boolean {
  if (tile.owner === player.id) return false;
  if (tile.type === 'water') return false;
  
  // Check if player has adjacent territory
  const adjacent = getAdjacentTiles(tile.position.x, tile.position.y, 1, tiles);
  return adjacent.some(adjTile => adjTile.owner === player.id && adjTile.type !== 'water');
}

export function captureArea(centerTile: Tile, player: Player, tiles: Map<string, Tile>): Tile[] {
  if (!canCaptureTile(centerTile, player, tiles)) return [];
  
  const capturedTiles: Tile[] = [];
  const militaryPop = Math.floor(player.resources.population * player.resources.militaryRatio);
  
  // Determine capture radius based on military strength
  let captureRadius = 1;
  if (militaryPop > 15) captureRadius = 2;
  if (militaryPop > 30) captureRadius = 3;
  
  // Get all tiles in capture radius
  const targetTiles = getAdjacentTiles(centerTile.position.x, centerTile.position.y, captureRadius, tiles)
    .filter(tile => tile.type !== 'water' && tile.owner !== player.id);
  
  // Capture tiles based on military strength (limit to prevent over-expansion)
  const maxCaptures = Math.min(Math.floor(militaryPop / 3), targetTiles.length, 8);
  
  // Prioritize tiles closer to center and with fewer defenses
  targetTiles.sort((a, b) => {
    const distA = Math.abs(a.position.x - centerTile.position.x) + Math.abs(a.position.y - centerTile.position.y);
    const distB = Math.abs(b.position.x - centerTile.position.x) + Math.abs(b.position.y - centerTile.position.y);
    return distA - distB;
  });
  
  for (let i = 0; i < maxCaptures && i < targetTiles.length; i++) {
    const tile = targetTiles[i];
    if (tile && canCaptureTile(tile, player, tiles)) {
      capturedTiles.push(tile);
    }
  }
  
  return capturedTiles;
}

export function updatePlayerResources(player: Player, tiles: Map<string, Tile>, deltaTime: number): void {
  if (!player || !tiles || deltaTime <= 0) return;
  
  // Calculate base income rate
  let goldPerSecond = player.resources.goldPerSecond;
  let populationGrowthRate = player.resources.populationGrowthRate;
  
  // Base income from territories
  player.territories.forEach(tileId => {
    const tile = tiles.get(tileId);
    if (tile && tile.type !== 'water') {
      goldPerSecond += tile.resources * 0.1; // 0.1 gold per second per resource
    }
  });
  
  // Building bonuses
  (player.buildings || []).forEach(building => {
    if (!building || !building.type) return;
    
    switch (building.type) {
      case 'city':
        goldPerSecond += building.level * 0.5;
        populationGrowthRate += building.level * 0.1;
        break;
      case 'farm':
        goldPerSecond += building.level * 0.3;
        populationGrowthRate += building.level * 0.2;
        break;
      case 'port':
        goldPerSecond += building.level * 0.4;
        break;
      default:
        break;
    }
  });
  
  // Apply resource changes over time
  player.resources.gold = Math.max(0, player.resources.gold + goldPerSecond * deltaTime);
  
  const populationIncrease = populationGrowthRate * deltaTime;
  player.resources.population = Math.min(
    player.resources.maxPopulation,
    Math.max(1, player.resources.population + populationIncrease)
  );
  
  // Update rates for display
  player.resources.goldPerSecond = goldPerSecond;
  player.resources.populationGrowthRate = populationGrowthRate;
}

export function canBuildOn(tile: Tile, buildingType: string, player: Player): boolean {
  if (!tile || !buildingType || !player) return false;
  if (tile.owner !== player.id) return false;
  if (tile.building) return false;
  if (tile.type === 'water') return false;
  
  switch (buildingType) {
    case 'port':
      return tile.type === 'coast';
    case 'city':
    case 'farm':
    case 'defense':
      return tile.type === 'land' || tile.type === 'coast';
    default:
      return false;
  }
}

export function getBuildingCost(buildingType: string): number {
  switch (buildingType) {
    case 'city': return 50;
    case 'farm': return 20;
    case 'defense': return 30;
    case 'port': return 40;
    default: return 0;
  }
}

export function processAIActions(player: Player, gameState: GameState, currentTime: number): GameState {
  // Check if AI can take action (cooldown)
  if (currentTime - player.lastActionTime < player.actionCooldown) {
    return gameState;
  }
  
  const newState = { 
    ...gameState,
    tiles: new Map(gameState.tiles),
    players: gameState.players.map(p => ({ ...p }))
  };
  const currentPlayer = newState.players.find(p => p.id === player.id)!;
  
  if (!currentPlayer) {
    return newState;
  }
  
  // Update last action time
  currentPlayer.lastActionTime = currentTime;
  
  // Enhanced AI Strategy based on empire type
  const aiPersonality = getAIPersonality(currentPlayer.name);
  
  // 1. Try to capture adjacent tiles
  const ownedTiles = (currentPlayer.territories || [])
    .map(id => newState.tiles.get(id))
    .filter(tile => tile && tile.type !== 'water') as Tile[];
    
  const expansionTargets: Tile[] = [];
  
  ownedTiles.forEach(tile => {
    if (!tile) return;
    const adjacent = getAdjacentTiles(tile.position.x, tile.position.y, 1, newState.tiles);
    adjacent.forEach(adjTile => {
      if (adjTile && adjTile.type !== 'water' && canCaptureTile(adjTile, currentPlayer, newState.tiles)) {
        expansionTargets.push(adjTile);
      }
    });
  });
  
  // Capture tiles if we have enough military population
  const militaryPop = Math.floor(currentPlayer.resources.population * currentPlayer.resources.militaryRatio);
  const shouldExpand = expansionTargets.length > 0 && 
                      militaryPop > aiPersonality.minMilitaryForExpansion && 
                      currentPlayer.resources.population > aiPersonality.minPopulationForExpansion;
                      
  if (shouldExpand && Math.random() < aiPersonality.aggressiveness) {
    const target = expansionTargets[Math.floor(Math.random() * expansionTargets.length)];
    if (target) {
      // Use area capture for AI
      const capturedTiles = captureArea(target, currentPlayer, newState.tiles);
      
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
        
        // Combat losses
        const losses = Math.max(1, Math.floor(capturedTiles.length / 2));
        currentPlayer.resources.population = Math.max(1, currentPlayer.resources.population - losses);
      }
    }
  }
  
  // 2. Build infrastructure
  if (currentPlayer.resources.gold > aiPersonality.minGoldForBuilding) {
    const buildableTiles = ownedTiles.filter(tile => tile && !tile.building && tile.type !== 'water');
    if (buildableTiles.length > 0) {
      const tile = buildableTiles[Math.floor(Math.random() * buildableTiles.length)];
      if (tile) {
        let buildingType = aiPersonality.preferredBuilding;
        
        // Smart building placement
        if (tile.type === 'coast' && Math.random() < aiPersonality.portPreference) {
          buildingType = 'port';
        } else if (Math.random() < aiPersonality.cityPreference) {
          buildingType = 'city';
        } else if (Math.random() < aiPersonality.defensePreference) {
          buildingType = 'defense';
        }
        
        const cost = getBuildingCost(buildingType);
        if (currentPlayer.resources.gold >= cost && canBuildOn(tile, buildingType, currentPlayer)) {
          const building: Building = {
            id: `${buildingType}-${currentPlayer.id}-${Date.now()}`,
            type: buildingType as any,
            level: 1,
            position: tile.position,
            owner: currentPlayer.id,
            health: 100,
            maxHealth: 100
          };
          
          tile.building = building;
          if (!currentPlayer.buildings) currentPlayer.buildings = [];
          currentPlayer.buildings.push(building);
          currentPlayer.resources.gold = Math.max(0, currentPlayer.resources.gold - cost);
          
          if (buildingType === 'city') {
            currentPlayer.resources.maxPopulation += 20;
          }
        }
      }
    }
  }
  
  return newState;
}

function getAIPersonality(empireName: string) {
  const personalities = {
    'Roman Empire': {
      aggressiveness: 0.8,
      minMilitaryForExpansion: 8,
      minPopulationForExpansion: 8,
      minGoldForBuilding: 25,
      preferredBuilding: 'city',
      cityPreference: 0.4,
      portPreference: 0.3,
      defensePreference: 0.2
    },
    'Byzantine Empire': {
      aggressiveness: 0.6,
      minMilitaryForExpansion: 6,
      minPopulationForExpansion: 6,
      minGoldForBuilding: 30,
      preferredBuilding: 'defense',
      cityPreference: 0.3,
      portPreference: 0.4,
      defensePreference: 0.4
    },
    'Holy Roman Empire': {
      aggressiveness: 0.7,
      minMilitaryForExpansion: 10,
      minPopulationForExpansion: 10,
      minGoldForBuilding: 35,
      preferredBuilding: 'city',
      cityPreference: 0.5,
      portPreference: 0.2,
      defensePreference: 0.3
    },
    'French Kingdom': {
      aggressiveness: 0.75,
      minMilitaryForExpansion: 7,
      minPopulationForExpansion: 7,
      minGoldForBuilding: 28,
      preferredBuilding: 'farm',
      cityPreference: 0.35,
      portPreference: 0.25,
      defensePreference: 0.25
    },
    'English Kingdom': {
      aggressiveness: 0.5,
      minMilitaryForExpansion: 5,
      minPopulationForExpansion: 8,
      minGoldForBuilding: 40,
      preferredBuilding: 'port',
      cityPreference: 0.3,
      portPreference: 0.5,
      defensePreference: 0.2
    },
    'Viking Clans': {
      aggressiveness: 0.9,
      minMilitaryForExpansion: 4,
      minPopulationForExpansion: 4,
      minGoldForBuilding: 20,
      preferredBuilding: 'port',
      cityPreference: 0.2,
      portPreference: 0.6,
      defensePreference: 0.1
    }
  };
  
  return personalities[empireName as keyof typeof personalities] || personalities['Roman Empire'];
}