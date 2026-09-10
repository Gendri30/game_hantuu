export interface InteractionTarget {
  type: 'loot' | 'hiding_spot' | 'exit';
  id: string;
  name: string;
  distance: number;
}

export type GhostState = 'patrol' | 'suspicious' | 'chase' | 'search';

export interface Vector2D {
  x: number;
  z: number;
}

export interface Waypoint {
  x: number;
  z: number;
  waitTime?: number; // seconds to linger
}

export interface LootItem {
  id: string;
  name: string;
  nameIndo: string;
  value: number;
  isObjective: boolean; // Required to finish level
  x: number;
  y: number;
  z: number;
  collected: boolean;
  modelType: 'chalice' | 'skull' | 'music_box' | 'painting' | 'gem' | 'coin_stack' | 'ancient_urn';
  color: string;
  sparkleColor: string;
  description: string;
}

export interface HidingSpot {
  id: string;
  type: 'wardrobe' | 'under_bed';
  x: number;
  y: number;
  z: number;
  rotationY: number;
  isOpen: boolean;
}

export interface GhostData {
  id: string;
  name: string;
  role: 'polisi' | 'penjaga' | 'anjing_hantu';
  x: number;
  y: number;
  z: number;
  rotationY: number;
  speed: number;
  chaseSpeed: number;
  state: GhostState;
  patrolPoints: Waypoint[];
  currentWaypointIdx: number;
  targetInvestigatePos: Vector2D | null;
  stateTimer: number;
  alertLevel: number; // 0 to 100
  visionAngle: number; // radians (e.g. Math.PI / 2.5)
  visionDistance: number;
  hearingDistance: number;
  color: string;
}

export interface RoomRect {
  x: number;
  z: number;
  width: number;
  depth: number;
  wallHeight?: number;
  floorTexture?: 'wood' | 'carpet_red' | 'checker' | 'stone';
  wallColor?: string;
  name: string;
}

export interface WallObstacle {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  thickness: number;
  height: number;
  color?: string;
}

export interface FurnitureData {
  type: 'table' | 'desk' | 'cabinet' | 'bed' | 'sofa' | 'bookshelf' | 'pillar' | 'clock';
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  rotationY?: number;
  color?: string;
}

export interface LevelConfig {
  id: number;
  title: string;
  titleIndo: string;
  subtitle: string;
  theme: 'mansion' | 'gallery' | 'vault';
  playerStart: { x: number; z: number; rotationY: number };
  exitDoor: { x: number; z: number; width: number; height: number; depth: number };
  rooms: RoomRect[];
  walls: WallObstacle[];
  furniture: FurnitureData[];
  hidingSpots: HidingSpot[];
  loot: LootItem[];
  ghosts: GhostData[];
  timeLimitSeconds: number;
  parTimeSeconds: number;
}

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  pitch: number;
  isCrouching: boolean;
  isSprinting: boolean;
  isMoving: boolean;
  isHiding: boolean;
  hidingSpotId: string | null;
  noiseLevel: number; // 0 (silent) to 1.0 (loud sprint)
  flashlightOn: boolean;
  distractionToys: number;
  smokeBombs: number;
  invisibilityTimeLeft: number;
  health: number; // 100
}

export interface GameStats {
  score: number;
  lootCollected: number;
  totalObjectiveLoot: number;
  totalLoot: number;
  timeElapsed: number;
  spottedCount: number;
  starsEarned: number;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'caught' | 'victory';
