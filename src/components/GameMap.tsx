import React, { useRef, useEffect, useState } from 'react';
import { GameState, Tile, Position } from '../types/game';
import { TILE_SIZE, canCaptureTile, canBuildOn, getBuildingCost } from '../utils/gameLogic';

interface GameMapProps {
  gameState: GameState;
  onTileClick: (tile: Tile) => void;
  onBuild: (tileId: string, buildingType: string) => void;
  onCapture: (tileId: string) => void;
}

export default function GameMap({ gameState, onTileClick, onBuild, onCapture }: GameMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });

  // Initialize camera to center of map
  useEffect(() => {
    setCamera({
      x: -(gameState.mapSize.width * TILE_SIZE) / 4,
      y: -(gameState.mapSize.height * TILE_SIZE) / 4,
      zoom: 1
    });
  }, [gameState.mapSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    drawMap(ctx, rect.width, rect.height);
  }, [gameState, camera]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const drawMap = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
    ctx.clearRect(0, 0, width, height);
    
    const tileSize = TILE_SIZE * camera.zoom;
    const startX = Math.max(0, Math.floor(-camera.x / tileSize));
    const startY = Math.max(0, Math.floor(-camera.y / tileSize));
    const endX = Math.min(gameState.mapSize.width, Math.ceil((width - camera.x) / tileSize) + 1);
    const endY = Math.min(gameState.mapSize.height, Math.ceil((height - camera.y) / tileSize) + 1);

    // Validate bounds
    if (startX < 0 || startY < 0 || endX > gameState.mapSize.width || endY > gameState.mapSize.height) {
      console.warn('Invalid tile bounds:', { startX, startY, endX, endY });
    }

    // Draw tiles
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const tile = gameState.tiles.get(`${x}-${y}`);
        if (tile) {
          try {
            drawTile(ctx, tile);
          } catch (error) {
            console.error('Error drawing tile:', tile.id, error);
          }
        }
      }
    }

    // Draw ships
    if (gameState.ships) {
      gameState.ships.forEach(ship => {
        try {
          drawShip(ctx, ship);
        } catch (error) {
          console.error('Error drawing ship:', ship.id, error);
        }
      });
    }

    // Draw selection highlight
    if (gameState.selectedTile) {
      const tile = gameState.tiles.get(gameState.selectedTile);
      if (tile) {
        try {
          drawSelectionHighlight(ctx, tile.position);
        } catch (error) {
          console.error('Error drawing selection highlight:', error);
        }
      }
    }
    } catch (error) {
      console.error('Error in drawMap:', error);
    }
  };

  const drawTile = (ctx: CanvasRenderingContext2D, tile: Tile) => {
    const tileSize = TILE_SIZE * camera.zoom;
    const screenX = tile.position.x * tileSize + camera.x;
    const screenY = tile.position.y * tileSize + camera.y;

    // Base terrain color
    let baseColor = '#8B7355'; // Land
    if (tile.type === 'water') baseColor = '#4A90E2';
    if (tile.type === 'coast') baseColor = '#D4B896';

    ctx.fillStyle = baseColor;
    ctx.fillRect(screenX, screenY, tileSize, tileSize);

    // Territory ownership
    if (tile.owner) {
      const player = gameState.players.find(p => p.id === tile.owner);
      if (player) {
        ctx.fillStyle = player.color + '40'; // Semi-transparent
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        
        // Border
        ctx.strokeStyle = player.color;
        ctx.lineWidth = Math.max(1, camera.zoom);
        ctx.strokeRect(screenX, screenY, tileSize, tileSize);
      }
    }

    // Buildings
    if (tile.building) {
      drawBuilding(ctx, tile.building, screenX + tileSize/4, screenY + tileSize/4, tileSize/2);
    }

    // Resources indicator
    if (tile.type !== 'water' && tile.resources > 0) {
      ctx.fillStyle = '#FFD700';
      for (let i = 0; i < tile.resources; i++) {
        const dotSize = Math.max(1, camera.zoom);
        ctx.fillRect(screenX + 2 * camera.zoom + i * 3 * camera.zoom, screenY + 2 * camera.zoom, dotSize, dotSize);
      }
    }

    // Grid lines (when zoomed in)
    if (camera.zoom > 0.8) {
      ctx.strokeStyle = '#00000020';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX, screenY, tileSize, tileSize);
    }
  };

  const drawBuilding = (ctx: CanvasRenderingContext2D, building: any, x: number, y: number, size: number) => {
    const colors = {
      city: '#FF6B6B',
      farm: '#4ECDC4',
      defense: '#45B7D1',
      port: '#96CEB4'
    };

    ctx.fillStyle = colors[building.type as keyof typeof colors] || '#999';
    
    // Make buildings bigger and more visible
    const buildingSize = size * 1.5;
    const offsetX = x - (buildingSize - size) / 2;
    const offsetY = y - (buildingSize - size) / 2;
    
    switch (building.type) {
      case 'city':
        // Draw city as rectangle with tower
        ctx.fillRect(offsetX, offsetY + buildingSize/3, buildingSize, buildingSize*2/3);
        ctx.fillRect(offsetX + buildingSize/3, offsetY, buildingSize/3, buildingSize/3);
        // Add city walls
        ctx.strokeStyle = '#000';
        ctx.lineWidth = Math.max(1, camera.zoom);
        ctx.strokeRect(offsetX, offsetY + buildingSize/3, buildingSize, buildingSize*2/3);
        break;
      case 'farm':
        // Draw farm as circle
        ctx.beginPath();
        ctx.arc(offsetX + buildingSize/2, offsetY + buildingSize/2, buildingSize/2.5, 0, Math.PI * 2);
        ctx.fill();
        // Add farm fields
        ctx.strokeStyle = '#2D5A27';
        ctx.lineWidth = Math.max(1, camera.zoom);
        ctx.stroke();
        break;
      case 'defense':
        // Draw defense as triangle
        ctx.beginPath();
        ctx.moveTo(offsetX + buildingSize/2, offsetY);
        ctx.lineTo(offsetX, offsetY + buildingSize);
        ctx.lineTo(offsetX + buildingSize, offsetY + buildingSize);
        ctx.closePath();
        ctx.fill();
        // Add defense outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = Math.max(1, camera.zoom);
        ctx.stroke();
        break;
      case 'port':
        // Draw port as rectangle with dock
        ctx.fillRect(offsetX, offsetY, buildingSize, buildingSize*2/3);
        ctx.fillRect(offsetX + buildingSize/4, offsetY + buildingSize*2/3, buildingSize/2, buildingSize/3);
        // Add port details
        ctx.strokeStyle = '#000';
        ctx.lineWidth = Math.max(1, camera.zoom);
        ctx.strokeRect(offsetX, offsetY, buildingSize, buildingSize*2/3);
        break;
    }

    // Building level indicator
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.font = `bold ${Math.max(8, buildingSize/2.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.strokeText(building.level.toString(), offsetX + buildingSize/2, offsetY + buildingSize/2 + buildingSize/8);
    ctx.fillText(building.level.toString(), offsetX + buildingSize/2, offsetY + buildingSize/2 + buildingSize/8);
  };

  const drawShip = (ctx: CanvasRenderingContext2D, ship: any) => {
    const tileSize = TILE_SIZE * camera.zoom;
    const screenX = ship.position.x * tileSize + camera.x;
    const screenY = ship.position.y * tileSize + camera.y;
    const size = tileSize * 0.6;

    const player = gameState.players.find(p => p.id === ship.owner);
    ctx.fillStyle = player?.color || '#666';
    
    // Draw ship as triangle
    ctx.beginPath();
    ctx.moveTo(screenX + size/2, screenY);
    ctx.lineTo(screenX, screenY + size);
    ctx.lineTo(screenX + size, screenY + size);
    ctx.closePath();
    ctx.fill();

    // Ship type indicator
    ctx.fillStyle = ship.type === 'military' ? '#FF0000' : '#00FF00';
    ctx.fillRect(screenX + size/3, screenY + size/3, size/3, size/3);
  };

  const drawSelectionHighlight = (ctx: CanvasRenderingContext2D, position: Position) => {
    const tileSize = TILE_SIZE * camera.zoom;
    const screenX = position.x * tileSize + camera.x;
    const screenY = position.y * tileSize + camera.y;

    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = Math.max(2, 3 * camera.zoom);
    const offset = ctx.lineWidth;
    ctx.strokeRect(screenX - offset, screenY - offset, tileSize + offset * 2, tileSize + offset * 2);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      setCamera(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const tileSize = TILE_SIZE * camera.zoom;
    const tileX = Math.floor((clickX - camera.x) / tileSize);
    const tileY = Math.floor((clickY - camera.y) / tileSize);
    
    const tile = gameState.tiles.get(`${tileX}-${tileY}`);
    if (tile) {
      onTileClick(tile);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
    const newZoom = Math.max(0.3, Math.min(4, camera.zoom * zoomFactor));
    
    // Zoom towards mouse position
    const zoomRatio = newZoom / camera.zoom;
    const newX = mouseX - (mouseX - camera.x) * zoomRatio;
    const newY = mouseY - (mouseY - camera.y) * zoomRatio;
    
    setCamera(prev => ({
      x: newX,
      y: newY,
      zoom: newZoom
    }));
  };

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      
      {/* Minimap */}
      <div className="absolute top-4 right-4 w-48 h-32 bg-black bg-opacity-75 border border-gray-600 rounded overflow-hidden">
        <div className="text-white text-xs p-2 bg-gray-800">Minimap</div>
        <div className="relative w-full h-24 bg-gray-700">
          {/* Simplified minimap representation */}
          {Array.from(gameState.tiles.values()).map(tile => {
            if (tile.type === 'water') return null;
            const x = (tile.position.x / gameState.mapSize.width) * 100;
            const y = (tile.position.y / gameState.mapSize.height) * 100;
            return (
              <div
                key={tile.id}
                className="absolute w-1 h-1"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  backgroundColor: tile.owner ? 
                    gameState.players.find(p => p.id === tile.owner)?.color || '#8B7355' : 
                    '#8B7355'
                }}
              />
            );
          })}
          
          {/* Camera viewport indicator */}
          <div 
            className="absolute border-2 border-yellow-400 pointer-events-none"
            style={{
              left: `${Math.max(0, (-camera.x / (gameState.mapSize.width * TILE_SIZE * camera.zoom)) * 100)}%`,
              top: `${Math.max(0, (-camera.y / (gameState.mapSize.height * TILE_SIZE * camera.zoom)) * 100)}%`,
              width: `${Math.min(100, (window.innerWidth / (gameState.mapSize.width * TILE_SIZE * camera.zoom)) * 100)}%`,
              height: `${Math.min(100, ((window.innerHeight - 200) / (gameState.mapSize.height * TILE_SIZE * camera.zoom)) * 100)}%`
            }}
          />
        </div>
      </div>
      
      {/* Zoom controls */}
      <div className="absolute top-4 left-4 flex flex-col space-y-2">
        <button
          onClick={() => setCamera(prev => ({ ...prev, zoom: Math.min(4, prev.zoom * 1.25) }))}
          className="bg-gray-800 hover:bg-gray-700 text-white w-8 h-8 rounded flex items-center justify-center border border-gray-600"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setCamera(prev => ({ ...prev, zoom: Math.max(0.3, prev.zoom * 0.8) }))}
          className="bg-gray-800 hover:bg-gray-700 text-white w-8 h-8 rounded flex items-center justify-center border border-gray-600"
          title="Zoom Out"
        >
          -
        </button>
        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600">
          {Math.round(camera.zoom * 100)}%
        </div>
      </div>
    </div>
  );
}