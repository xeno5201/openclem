export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  id: string;
  position: Position;
  type: 'land' | 'water' | 'coast';
  owner: string | null;
  resources: number;
  building: Building | null;
  isVisible: boolean;
}

export interface Building {
  id: string;
  type: 'city' | 'farm' | 'defense' | 'port';
  level: number;
  position: Position;
  owner: string;
  health: number;
  maxHealth: number;
}

export interface Ship {
  id: string;
  type: 'trade' | 'military';
  position: Position;
  owner: string;
  health: number;
  maxHealth: number;
  cargo?: number;
  destination?: Position;
  isMoving: boolean;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  isAI: boolean;
  lastActionTime: number; // when player last took action
  actionCooldown: number; // seconds between actions
  resources: {
    gold: number;
    population: number;
    maxPopulation: number;
    militaryRatio: number;
    goldPerSecond: number;
    populationGrowthRate: number;
  };
  territories: string[];
  buildings: Building[];
  ships: Ship[];
}

export interface GameState {
  gameTime: number; // seconds since game start
  lastUpdateTime: number;
  players: Player[];
  tiles: Map<string, Tile>;
  ships: Ship[];
  selectedTile: string | null;
  selectedShip: string | null;
  gamePhase: 'setup' | 'playing' | 'ended';
  winner: string | null;
  mapSize: { width: number; height: number };
  camera: { x: number; y: number; zoom: number };
  gameSpeed: number; // time multiplier (1x, 2x, 4x, etc.)
  isPaused: boolean;
}

export interface GameAction {
  type: 'CAPTURE_TILE' | 'BUILD' | 'MOVE_SHIP' | 'ATTACK' | 'SELECT_TILE' | 'SELECT_SHIP' | 'PAUSE_GAME' | 'SET_SPEED';
  payload: any;
  playerId: string;
}