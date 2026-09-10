import * as THREE from 'three';
import {
  LevelConfig,
  PlayerState,
  LootItem,
  HidingSpot,
  Vector2D,
  InteractionTarget,
} from '../types';
import { GhostEntity } from './ghostAI';
import {
  createCartoonWoodFloorTexture,
  createCartoonCheckeredFloorTexture,
  createCartoonWallpaperTexture,
  createSpookyPortraitTexture,
  createWardrobeLouverTexture,
  createCarpetRugTexture,
} from './proceduralTextures';
import { soundEngine } from '../audio/soundEngine';

export type { InteractionTarget };

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Level & World Objects
  public currentLevel: LevelConfig | null = null;
  private levelGroup: THREE.Group;
  private lootMeshMap: Map<string, THREE.Group> = new Map();
  private hidingMeshMap: Map<string, THREE.Group> = new Map();
  private exitDoorMesh: THREE.Group | null = null;
  public ghosts: GhostEntity[] = [];

  // Player State
  public player: PlayerState;
  private cameraBobOffset: number = 0;
  private playerLight: THREE.SpotLight;
  private playerThiefHand: THREE.Group;

  // Distraction Object in world
  private activeDistraction: {
    mesh: THREE.Group;
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    timeLeft: number;
  } | null = null;

  // Callbacks for UI
  public onInteractionPrompt: (target: InteractionTarget | null) => void = () => {};
  public onLootCollected: (item: LootItem) => void = () => {};
  public onPlayerCaught: () => void = () => {};
  public onVictory: () => void = () => {};
  public onHeartbeatUpdate: (intensity: number) => void = () => {};

  // Textures cache
  private woodFloorTex: THREE.CanvasTexture;
  private checkerFloorTex: THREE.CanvasTexture;
  private wallpaperTex: THREE.CanvasTexture;
  private portraitTex: THREE.CanvasTexture;
  private wardrobeTex: THREE.CanvasTexture;
  private carpetTex: THREE.CanvasTexture;

  // Control inputs
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  public virtualMoveX: number = 0;
  public virtualMoveY: number = 0;
  public mouseLookSensitivity: number = 0.0024;
  public isPointerLocked: boolean = false;

  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16); // Midnight spooky fog
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.045);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 80);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 3. Preload procedural textures
    this.woodFloorTex = createCartoonWoodFloorTexture();
    this.checkerFloorTex = createCartoonCheckeredFloorTexture();
    this.wallpaperTex = createCartoonWallpaperTexture();
    this.portraitTex = createSpookyPortraitTexture();
    this.wardrobeTex = createWardrobeLouverTexture();
    this.carpetTex = createCarpetRugTexture();

    this.levelGroup = new THREE.Group();
    this.scene.add(this.levelGroup);

    // 4. Player State
    this.player = {
      x: 0,
      y: 1.6,
      z: 0,
      rotationY: 0,
      pitch: 0,
      isCrouching: false,
      isSprinting: false,
      isMoving: false,
      isHiding: false,
      hidingSpotId: null,
      noiseLevel: 0,
      flashlightOn: true,
      distractionToys: 2,
      smokeBombs: 1,
      invisibilityTimeLeft: 0,
      health: 100,
    };

    // 5. Flashlight on Camera
    this.playerLight = new THREE.SpotLight(0xfff5db, 2.5, 14, Math.PI / 4, 0.4, 1.2);
    this.playerLight.position.set(0, 0, 0);
    this.camera.add(this.playerLight);
    this.playerLight.target = new THREE.Object3D();
    this.playerLight.target.position.set(0, 0, -5);
    this.camera.add(this.playerLight.target);

    // 6. Cartoon Burglar Hand & Flashlight (First-person model)
    this.playerThiefHand = this.createFirstPersonThiefHand();
    this.camera.add(this.playerThiefHand);
    this.scene.add(this.camera);

    // 7. General Lighting
    const ambientLight = new THREE.AmbientLight(0x384260, 0.85); // Cool spooky ambient
    this.scene.add(ambientLight);

    // 8. Event Listeners
    this.setupControls();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  private createFirstPersonThiefHand(): THREE.Group {
    const handGroup = new THREE.Group();
    handGroup.position.set(0.35, -0.32, -0.6);

    // Black cartoon burglar glove
    const gloveMat = new THREE.MeshToonMaterial({ color: 0x18181b });
    const armGeom = new THREE.CylinderGeometry(0.065, 0.08, 0.4, 12);
    const armMesh = new THREE.Mesh(armGeom, gloveMat);
    armMesh.rotation.x = Math.PI / 2.5;
    armMesh.position.set(0, 0, 0.15);
    handGroup.add(armMesh);

    // Cartoon Flashlight in hand
    const torchBodyGeom = new THREE.CylinderGeometry(0.04, 0.045, 0.35, 12);
    const torchMat = new THREE.MeshToonMaterial({ color: 0xeab308 }); // Brass/Yellow cartoon torch
    const torchMesh = new THREE.Mesh(torchBodyGeom, torchMat);
    torchMesh.rotation.x = Math.PI / 2;
    handGroup.add(torchMesh);

    // Torch head rim
    const headGeom = new THREE.CylinderGeometry(0.065, 0.045, 0.1, 12);
    const headMat = new THREE.MeshToonMaterial({ color: 0x0f172a });
    const headMesh = new THREE.Mesh(headGeom, headMat);
    headMesh.rotation.x = Math.PI / 2;
    headMesh.position.set(0, 0, -0.2);
    handGroup.add(headMesh);

    // Torch lens glow
    const lensGeom = new THREE.CircleGeometry(0.058, 12);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    const lensMesh = new THREE.Mesh(lensGeom, lensMat);
    lensMesh.position.set(0, 0, -0.252);
    handGroup.add(lensMesh);

    return handGroup;
  }

  public loadLevel(level: LevelConfig) {
    this.currentLevel = JSON.parse(JSON.stringify(level)); // deep clone
    // Clear previous
    while (this.levelGroup.children.length > 0) {
      this.levelGroup.remove(this.levelGroup.children[0]);
    }
    this.lootMeshMap.clear();
    this.hidingMeshMap.clear();
    this.ghosts = [];

    // Reset player
    this.player.x = level.playerStart.x;
    this.player.y = 1.6;
    this.player.z = level.playerStart.z;
    this.player.rotationY = level.playerStart.rotationY;
    this.player.pitch = 0;
    this.player.isCrouching = false;
    this.player.isSprinting = false;
    this.player.isHiding = false;
    this.player.hidingSpotId = null;
    this.player.invisibilityTimeLeft = 0;
    this.player.distractionToys = 2;
    this.player.smokeBombs = 1;

    // 1. Build Rooms (Floors & Ceilings)
    for (const room of level.rooms) {
      this.buildRoom(room);
    }

    // 2. Build Walls
    for (const wall of level.walls) {
      this.buildWall(wall);
    }

    // 3. Build Furniture
    for (const furn of level.furniture) {
      this.buildFurniture(furn);
    }

    // 4. Build Hiding Spots (Wardrobes)
    for (const spot of level.hidingSpots) {
      this.buildHidingSpot(spot);
    }

    // 5. Build Loot Items
    for (const loot of this.currentLevel.loot) {
      this.buildLootItem(loot);
    }

    // 6. Build Exit Door
    this.buildExitDoor(level.exitDoor);

    // 7. Spawn Ghosts
    for (const ghostData of level.ghosts) {
      const ghost = new GhostEntity(ghostData);
      this.ghosts.push(ghost);
      this.levelGroup.add(ghost.group);
    }

    soundEngine.startAmbient();
  }

  private buildRoom(room: LevelConfig['rooms'][0]) {
    // Floor
    const floorGeom = new THREE.PlaneGeometry(room.width, room.depth);
    let floorMat: THREE.Material;
    if (room.floorTexture === 'checker') {
      floorMat = new THREE.MeshStandardMaterial({ map: this.checkerFloorTex, roughness: 0.4 });
    } else if (room.floorTexture === 'carpet_red') {
      floorMat = new THREE.MeshStandardMaterial({ map: this.carpetTex, roughness: 0.8 });
    } else {
      floorMat = new THREE.MeshStandardMaterial({ map: this.woodFloorTex, roughness: 0.6 });
    }
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(room.x, 0, room.z);
    this.levelGroup.add(floorMesh);

    // Ceiling
    const ceilGeom = new THREE.PlaneGeometry(room.width, room.depth);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1e1b2e, roughness: 0.9 });
    const ceilMesh = new THREE.Mesh(ceilGeom, ceilMat);
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.position.set(room.x, 3.5, room.z);
    this.levelGroup.add(ceilMesh);

    // Center ceiling chandelier / warm light sconce
    const sconceLight = new THREE.PointLight(0xfef08a, 0.9, 10, 1.8);
    sconceLight.position.set(room.x, 3.1, room.z);
    this.levelGroup.add(sconceLight);

    // Chandelier visual model
    const chanGeom = new THREE.CylinderGeometry(0.5, 0.7, 0.25, 8);
    const chanMat = new THREE.MeshToonMaterial({ color: 0xca8a04 });
    const chanMesh = new THREE.Mesh(chanGeom, chanMat);
    chanMesh.position.set(room.x, 3.3, room.z);
    this.levelGroup.add(chanMesh);
  }

  private buildWall(wall: LevelConfig['walls'][0]) {
    const dx = wall.x2 - wall.x1;
    const dz = wall.z2 - wall.z1;
    const length = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);
    const midX = (wall.x1 + wall.x2) / 2;
    const midZ = (wall.z1 + wall.z2) / 2;

    const wallGeom = new THREE.BoxGeometry(length, wall.height, wall.thickness);
    const wallMat = new THREE.MeshStandardMaterial({
      map: this.wallpaperTex,
      roughness: 0.7,
    });

    const wallMesh = new THREE.Mesh(wallGeom, wallMat);
    wallMesh.position.set(midX, wall.height / 2, midZ);
    wallMesh.rotation.y = -angle;
    this.levelGroup.add(wallMesh);

    // Wood baseboard skirting at bottom
    const baseGeom = new THREE.BoxGeometry(length, 0.24, wall.thickness + 0.04);
    const baseMat = new THREE.MeshToonMaterial({ color: 0x451a03 });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.set(midX, 0.12, midZ);
    baseMesh.rotation.y = -angle;
    this.levelGroup.add(baseMesh);

    // Occasionally hang a spooky portrait on long walls
    if (length > 5.0 && Math.random() > 0.4) {
      const portraitGeom = new THREE.PlaneGeometry(1.2, 1.5);
      const portraitMat = new THREE.MeshBasicMaterial({ map: this.portraitTex });
      const portraitMesh = new THREE.Mesh(portraitGeom, portraitMat);
      // Offset slightly from wall face
      const normalX = -Math.sin(-angle) * (wall.thickness / 2 + 0.02);
      const normalZ = Math.cos(-angle) * (wall.thickness / 2 + 0.02);
      portraitMesh.position.set(midX + normalX, 2.0, midZ + normalZ);
      portraitMesh.rotation.y = -angle + Math.PI / 2;
      this.levelGroup.add(portraitMesh);
    }
  }

  private buildFurniture(f: LevelConfig['furniture'][0]) {
    const group = new THREE.Group();
    group.position.set(f.x, f.y, f.z);
    if (f.rotationY) group.rotation.y = f.rotationY;

    const mainColor = f.color ? new THREE.Color(f.color) : new THREE.Color(0x78350f);
    const woodMat = new THREE.MeshToonMaterial({ color: mainColor });

    if (f.type === 'table' || f.type === 'desk') {
      // Table top
      const topGeom = new THREE.BoxGeometry(f.width, 0.12, f.depth);
      const topMesh = new THREE.Mesh(topGeom, woodMat);
      topMesh.position.y = f.height / 2 - 0.06;
      group.add(topMesh);

      // 4 Legs
      const legGeom = new THREE.BoxGeometry(0.12, f.height - 0.12, 0.12);
      const legMat = new THREE.MeshToonMaterial({ color: 0x451a03 });
      const legOffsets = [
        [-f.width / 2 + 0.15, -f.depth / 2 + 0.15],
        [f.width / 2 - 0.15, -f.depth / 2 + 0.15],
        [-f.width / 2 + 0.15, f.depth / 2 - 0.15],
        [f.width / 2 - 0.15, f.depth / 2 - 0.15],
      ];
      legOffsets.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeom, legMat);
        leg.position.set(lx, 0, lz);
        group.add(leg);
      });
    } else if (f.type === 'sofa') {
      // Sofa seat
      const seatGeom = new THREE.BoxGeometry(f.width, 0.45, f.depth);
      const seatMesh = new THREE.Mesh(seatGeom, woodMat);
      seatMesh.position.y = 0;
      group.add(seatMesh);

      // Backrest
      const backGeom = new THREE.BoxGeometry(f.width, 0.7, 0.25);
      const backMesh = new THREE.Mesh(backGeom, woodMat);
      backMesh.position.set(0, 0.45, -f.depth / 2 + 0.12);
      group.add(backMesh);
    } else if (f.type === 'bookshelf') {
      // Bookshelf cabinet
      const shelfGeom = new THREE.BoxGeometry(f.width, f.height, f.depth);
      const shelfMesh = new THREE.Mesh(shelfGeom, woodMat);
      group.add(shelfMesh);

      // Add colorful book rows
      for (let sy = -f.height / 3; sy <= f.height / 3; sy += 0.8) {
        const bookGeom = new THREE.BoxGeometry(f.width * 0.9, 0.45, f.depth + 0.02);
        const bookMat = new THREE.MeshToonMaterial({ color: 0x991b1b });
        const bookMesh = new THREE.Mesh(bookGeom, bookMat);
        bookMesh.position.y = sy;
        group.add(bookMesh);
      }
    } else if (f.type === 'clock') {
      // Grandfather clock
      const clockGeom = new THREE.BoxGeometry(f.width, f.height, f.depth);
      const clockMesh = new THREE.Mesh(clockGeom, woodMat);
      group.add(clockMesh);

      // Clock face circle
      const faceGeom = new THREE.CircleGeometry(0.24, 16);
      const faceMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const faceMesh = new THREE.Mesh(faceGeom, faceMat);
      faceMesh.position.set(0, f.height / 2 - 0.4, f.depth / 2 + 0.01);
      group.add(faceMesh);
    } else {
      // Standard block/cabinet
      const boxGeom = new THREE.BoxGeometry(f.width, f.height, f.depth);
      const boxMesh = new THREE.Mesh(boxGeom, woodMat);
      group.add(boxMesh);
    }

    this.levelGroup.add(group);
  }

  private buildHidingSpot(spot: HidingSpot) {
    const group = new THREE.Group();
    group.position.set(spot.x, spot.y, spot.z);
    group.rotation.y = spot.rotationY;

    // Antique Wardrobe Cabinet
    const width = 1.4;
    const height = 2.7;
    const depth = 1.0;

    const wardrobeMat = new THREE.MeshStandardMaterial({
      map: this.wardrobeTex,
      roughness: 0.6,
    });
    const cabGeom = new THREE.BoxGeometry(width, height, depth);
    const cabMesh = new THREE.Mesh(cabGeom, wardrobeMat);
    cabMesh.position.y = height / 2;
    group.add(cabMesh);

    // Ornate top pediment
    const crownGeom = new THREE.BoxGeometry(width + 0.15, 0.2, depth + 0.15);
    const crownMat = new THREE.MeshToonMaterial({ color: 0x1c1917 });
    const crownMesh = new THREE.Mesh(crownGeom, crownMat);
    crownMesh.position.y = height + 0.1;
    group.add(crownMesh);

    this.hidingMeshMap.set(spot.id, group);
    this.levelGroup.add(group);
  }

  private buildLootItem(item: LootItem) {
    const group = new THREE.Group();
    group.position.set(item.x, item.y, item.z);

    // Model based on item.modelType
    if (item.modelType === 'chalice') {
      // Golden / Jewel Chalice
      const chaliceMat = new THREE.MeshToonMaterial({ color: new THREE.Color(item.color) });
      const cupGeom = new THREE.CylinderGeometry(0.18, 0.06, 0.25, 12);
      const cupMesh = new THREE.Mesh(cupGeom, chaliceMat);
      cupMesh.position.y = 0.16;
      group.add(cupMesh);

      const stemGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8);
      const stemMesh = new THREE.Mesh(stemGeom, chaliceMat);
      stemMesh.position.y = 0.04;
      group.add(stemMesh);

      const baseGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12);
      const baseMesh = new THREE.Mesh(baseGeom, chaliceMat);
      baseMesh.position.y = -0.04;
      group.add(baseMesh);
    } else if (item.modelType === 'skull') {
      // Glowing Crystal Skull
      const skullMat = new THREE.MeshToonMaterial({
        color: new THREE.Color(item.color),
        transparent: true,
        opacity: 0.9,
      });
      const skullGeom = new THREE.SphereGeometry(0.18, 16, 16);
      const skullMesh = new THREE.Mesh(skullGeom, skullMat);
      skullMesh.scale.set(0.9, 1.1, 1.2);
      group.add(skullMesh);

      // Eye sockets
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
      eyeL.position.set(-0.06, 0.02, 0.18);
      group.add(eyeL);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
      eyeR.position.set(0.06, 0.02, 0.18);
      group.add(eyeR);
    } else if (item.modelType === 'music_box') {
      // Antique Music Box
      const boxMat = new THREE.MeshToonMaterial({ color: new THREE.Color(item.color) });
      const boxGeom = new THREE.BoxGeometry(0.3, 0.2, 0.24);
      const boxMesh = new THREE.Mesh(boxGeom, boxMat);
      group.add(boxMesh);

      // Brass wind-up key on top
      const keyMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const keyGeom = new THREE.TorusGeometry(0.05, 0.015, 8, 12);
      const keyMesh = new THREE.Mesh(keyGeom, keyMat);
      keyMesh.position.set(0, 0.14, 0);
      keyMesh.rotation.x = Math.PI / 2;
      group.add(keyMesh);
    } else if (item.modelType === 'ancient_urn') {
      // Ancient Urn
      const urnMat = new THREE.MeshToonMaterial({ color: new THREE.Color(item.color) });
      const urnGeom = new THREE.SphereGeometry(0.2, 12, 12);
      const urnMesh = new THREE.Mesh(urnGeom, urnMat);
      urnMesh.scale.set(0.9, 1.4, 0.9);
      group.add(urnMesh);
    } else {
      // Gem or Coins
      const gemMat = new THREE.MeshToonMaterial({ color: new THREE.Color(item.color) });
      const gemGeom = new THREE.OctahedronGeometry(0.15);
      const gemMesh = new THREE.Mesh(gemGeom, gemMat);
      group.add(gemMesh);
    }

    // Sparkle Point Light for objectives
    if (item.isObjective) {
      const sparkleLight = new THREE.PointLight(new THREE.Color(item.sparkleColor), 1.2, 3);
      group.add(sparkleLight);
    }

    this.lootMeshMap.set(item.id, group);
    this.levelGroup.add(group);
  }

  private buildExitDoor(door: LevelConfig['exitDoor']) {
    const group = new THREE.Group();
    group.position.set(door.x, door.height / 2, door.z);

    // Door Frame
    const frameMat = new THREE.MeshToonMaterial({ color: 0x0f172a });
    const frameGeom = new THREE.BoxGeometry(door.width + 0.3, door.height + 0.2, door.depth + 0.1);
    const frameMesh = new THREE.Mesh(frameGeom, frameMat);
    group.add(frameMesh);

    // Door Panel
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const doorGeom = new THREE.BoxGeometry(door.width, door.height, door.depth);
    const doorMesh = new THREE.Mesh(doorGeom, doorMat);
    group.add(doorMesh);

    // Exit Sign on top
    const signGeom = new THREE.BoxGeometry(1.2, 0.4, 0.1);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Red locked, green unlocked
    const signMesh = new THREE.Mesh(signGeom, signMat);
    signMesh.position.set(0, door.height / 2 - 0.2, 0.25);
    group.add(signMesh);

    // Lock Indicator Light
    const doorLight = new THREE.PointLight(0xef4444, 1.5, 4);
    doorLight.position.set(0, 0, 0.6);
    group.add(doorLight);

    this.exitDoorMesh = group;
    this.levelGroup.add(group);
  }

  public updateExitDoorStatus(allObjectivesCollected: boolean) {
    if (!this.exitDoorMesh) return;
    const sign = this.exitDoorMesh.children[2] as THREE.Mesh;
    const light = this.exitDoorMesh.children[3] as THREE.PointLight;
    if (allObjectivesCollected) {
      (sign.material as THREE.MeshBasicMaterial).color.setHex(0x22c55e); // Neon green
      light.color.setHex(0x22c55e);
      light.intensity = 2.5;
    } else {
      (sign.material as THREE.MeshBasicMaterial).color.setHex(0xef4444); // Red locked
      light.color.setHex(0xef4444);
      light.intensity = 1.5;
    }
  }

  public start() {
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate(this.lastFrameTime);
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    soundEngine.stopAmbient();
    soundEngine.stopHeartbeat();
  }

  private animate(currentTime: number) {
    if (!this.isRunning) return;
    this.animationFrameId = requestAnimationFrame((t) => this.animate(t));

    const delta = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;
    const timeSec = currentTime / 1000;

    // 1. Update Invisibility Timer
    if (this.player.invisibilityTimeLeft > 0) {
      this.player.invisibilityTimeLeft = Math.max(0, this.player.invisibilityTimeLeft - delta);
    }

    // 2. Update Active Distraction Toy
    if (this.activeDistraction) {
      const d = this.activeDistraction;
      d.timeLeft -= delta;
      d.pos.addScaledVector(d.vel, delta);
      d.vel.y -= 9.8 * delta; // Gravity

      // Bounce on floor
      if (d.pos.y <= 0.15) {
        d.pos.y = 0.15;
        d.vel.y = -d.vel.y * 0.5;
        d.vel.x *= 0.7;
        d.vel.z *= 0.7;
      }
      d.mesh.position.copy(d.pos);
      d.mesh.rotation.y += delta * 15;

      if (d.timeLeft <= 0) {
        this.scene.remove(d.mesh);
        this.activeDistraction = null;
      }
    }

    // 3. Update Player Movement (unless hidden in wardrobe)
    this.updatePlayerMovement(delta, timeSec);

    // 4. Update Loot Spinning & Floating Animation
    this.lootMeshMap.forEach((mesh) => {
      mesh.rotation.y += delta * 1.6;
      mesh.position.y += Math.sin(timeSec * 3 + mesh.position.x) * 0.001;
    });

    // 5. Update Ghosts
    let minGhostDist = 999;
    let anyGhostChasing = false;
    const distractionPos: Vector2D | null = this.activeDistraction
      ? { x: this.activeDistraction.pos.x, z: this.activeDistraction.pos.z }
      : null;

    for (const ghost of this.ghosts) {
      const isCaught = ghost.update(
        delta,
        timeSec,
        this.player,
        this.currentLevel ? this.currentLevel.walls : [],
        this.currentLevel ? this.currentLevel.furniture : [],
        distractionPos
      );

      if (isCaught) {
        soundEngine.playCaught();
        this.onPlayerCaught();
        this.stop();
        return;
      }

      const dist = Math.hypot(ghost.group.position.x - this.player.x, ghost.group.position.z - this.player.z);
      if (dist < minGhostDist) minGhostDist = dist;
      if (ghost.data.state === 'chase') anyGhostChasing = true;
    }

    // Heartbeat Sound & Screen Vignette
    if (anyGhostChasing) {
      this.onHeartbeatUpdate(1.0);
      soundEngine.startHeartbeat(1.0);
    } else if (minGhostDist < 7.0 && !this.player.isHiding) {
      const intensity = 1.0 - (minGhostDist - 1.5) / 5.5;
      const clamped = Math.max(0.1, Math.min(1.0, intensity));
      this.onHeartbeatUpdate(clamped);
      soundEngine.startHeartbeat(clamped);
    } else {
      this.onHeartbeatUpdate(0);
      soundEngine.stopHeartbeat();
    }

    // 6. Raycast Interaction Checks (Look at loot, wardrobe, exit door)
    this.checkInteractionTargets();

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }

  private updatePlayerMovement(delta: number, timeSec: number) {
    if (this.player.isHiding) {
      // Player is locked inside wardrobe, peeking out!
      return;
    }

    // Determine speed
    let speed = 2.8; // Normal walk
    let noise = 0.25;

    if (this.player.isCrouching) {
      speed = 1.4;
      noise = 0.0; // Complete stealth silence!
    } else if (this.player.isSprinting) {
      speed = 5.0;
      noise = 0.9; // Loud sprint noise!
    }

    // Calculate movement vector from Keyboard + Touch joystick
    let forwardInput = 0;
    let strafeInput = 0;

    if (this.moveForward) forwardInput += 1;
    if (this.moveBackward) forwardInput -= 1;
    if (this.moveLeft) strafeInput -= 1;
    if (this.moveRight) strafeInput += 1;

    // Add touch joystick input
    forwardInput -= this.virtualMoveY;
    strafeInput += this.virtualMoveX;

    const inputLen = Math.hypot(forwardInput, strafeInput);
    if (inputLen > 0.05) {
      this.player.isMoving = true;
      this.player.noiseLevel = noise;

      // Footstep sound
      soundEngine.playFootstep(this.player.isSprinting, this.player.isCrouching);

      // Headbob animation
      this.cameraBobOffset = Math.sin(timeSec * (this.player.isSprinting ? 14 : 9)) * (this.player.isSprinting ? 0.08 : 0.04);

      // Hand sway
      this.playerThiefHand.position.x = 0.35 + Math.sin(timeSec * 8) * 0.03;
      this.playerThiefHand.position.y = -0.32 + Math.cos(timeSec * 8) * 0.03;

      // Move along player's facing direction
      const angle = this.player.rotationY;
      const nx = forwardInput * Math.sin(angle) + strafeInput * Math.cos(angle);
      const nz = forwardInput * Math.cos(angle) - strafeInput * Math.sin(angle);

      const norm = Math.hypot(nx, nz);
      const moveX = (nx / norm) * speed * delta;
      const moveZ = (nz / norm) * speed * delta;

      const targetX = this.player.x - moveX;
      const targetZ = this.player.z - moveZ;

      // Collision checks with walls & furniture
      if (!this.checkPlayerCollision(targetX, targetZ)) {
        this.player.x = targetX;
        this.player.z = targetZ;
      } else {
        // Slide along X or Z
        if (!this.checkPlayerCollision(targetX, this.player.z)) {
          this.player.x = targetX;
        } else if (!this.checkPlayerCollision(this.player.x, targetZ)) {
          this.player.z = targetZ;
        }
      }
    } else {
      this.player.isMoving = false;
      this.player.noiseLevel = 0;
      this.cameraBobOffset = Math.sin(timeSec * 2) * 0.01; // subtle breathing idle
      this.playerThiefHand.position.set(0.35, -0.32, -0.6);
    }

    // Camera height (crouch vs stand)
    const targetHeight = this.player.isCrouching ? 0.95 : 1.6;
    this.player.y += (targetHeight - this.player.y) * 0.2;

    // Apply to camera
    this.camera.position.set(this.player.x, this.player.y + this.cameraBobOffset, this.player.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.rotationY;
    this.camera.rotation.x = this.player.pitch;

    // Flashlight toggle
    this.playerLight.intensity = this.player.flashlightOn ? 2.8 : 0.0;
    this.playerThiefHand.visible = true;
  }

  private checkPlayerCollision(x: number, z: number): boolean {
    if (!this.currentLevel) return false;
    const playerRadius = 0.4;

    // Walls
    for (const wall of this.currentLevel.walls) {
      const minX = Math.min(wall.x1, wall.x2) - wall.thickness / 2 - playerRadius;
      const maxX = Math.max(wall.x1, wall.x2) + wall.thickness / 2 + playerRadius;
      const minZ = Math.min(wall.z1, wall.z2) - wall.thickness / 2 - playerRadius;
      const maxZ = Math.max(wall.z1, wall.z2) + wall.thickness / 2 + playerRadius;

      if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
        return true;
      }
    }

    // Furniture
    for (const f of this.currentLevel.furniture) {
      const halfW = f.width / 2 + playerRadius;
      const halfD = f.depth / 2 + playerRadius;
      if (x >= f.x - halfW && x <= f.x + halfW && z >= f.z - halfD && z <= f.z + halfD) {
        return true;
      }
    }

    // Hiding Wardrobes (solid when not hiding inside)
    for (const spot of this.currentLevel.hidingSpots) {
      if (spot.id !== this.player.hidingSpotId) {
        const halfW = 0.7 + playerRadius;
        const halfD = 0.5 + playerRadius;
        if (x >= spot.x - halfW && x <= spot.x + halfW && z >= spot.z - halfD && z <= spot.z + halfD) {
          return true;
        }
      }
    }

    return false;
  }

  private checkInteractionTargets() {
    if (!this.currentLevel) return;

    if (this.player.isHiding) {
      // Prompt to exit wardrobe
      this.onInteractionPrompt({
        type: 'hiding_spot',
        id: this.player.hidingSpotId || '',
        name: 'Keluar dari Lemari',
        distance: 0,
      });
      return;
    }

    // 1. Check Exit Door
    const exit = this.currentLevel.exitDoor;
    const distToExit = Math.hypot(this.player.x - exit.x, this.player.z - exit.z);
    if (distToExit < 2.5) {
      const allObjectives = this.currentLevel.loot
        .filter((l) => l.isObjective)
        .every((l) => l.collected);

      if (allObjectives) {
        this.onInteractionPrompt({
          type: 'exit',
          id: 'exit_door',
          name: 'PINTU KELUAR (Kabur Sekarang!)',
          distance: distToExit,
        });
        return;
      } else {
        this.onInteractionPrompt({
          type: 'exit',
          id: 'exit_door_locked',
          name: 'Pintu Terkunci (Cari Semua Barang Sasaran Dulu!)',
          distance: distToExit,
        });
        return;
      }
    }

    // 2. Check Hiding Spots (Wardrobes)
    for (const spot of this.currentLevel.hidingSpots) {
      const dist = Math.hypot(this.player.x - spot.x, this.player.z - spot.z);
      if (dist < 2.0) {
        this.onInteractionPrompt({
          type: 'hiding_spot',
          id: spot.id,
          name: 'Sembunyi di Lemari',
          distance: dist,
        });
        return;
      }
    }

    // 3. Check Loot
    let closestLoot: LootItem | null = null;
    let closestDist = 2.4;

    for (const loot of this.currentLevel.loot) {
      if (loot.collected) continue;
      const dist = Math.hypot(this.player.x - loot.x, this.player.z - loot.z);
      if (dist < closestDist) {
        closestDist = dist;
        closestLoot = loot;
      }
    }

    if (closestLoot) {
      this.onInteractionPrompt({
        type: 'loot',
        id: closestLoot.id,
        name: `Ambil ${closestLoot.nameIndo} (+${closestLoot.value})`,
        distance: closestDist,
      });
      return;
    }

    // No target in range
    this.onInteractionPrompt(null);
  }

  public interact() {
    if (!this.currentLevel) return;

    // If currently hiding -> Exit wardrobe
    if (this.player.isHiding) {
      soundEngine.playClosetDoor(true);
      this.player.isHiding = false;
      // Step slightly out in front of wardrobe
      const spot = this.currentLevel.hidingSpots.find((s) => s.id === this.player.hidingSpotId);
      if (spot) {
        this.player.x = spot.x + Math.sin(spot.rotationY) * 1.2;
        this.player.z = spot.z + Math.cos(spot.rotationY) * 1.2;
      }
      this.player.hidingSpotId = null;
      return;
    }

    // Check Exit Door
    const exit = this.currentLevel.exitDoor;
    const distToExit = Math.hypot(this.player.x - exit.x, this.player.z - exit.z);
    if (distToExit < 2.5) {
      const allObjectives = this.currentLevel.loot
        .filter((l) => l.isObjective)
        .every((l) => l.collected);
      if (allObjectives) {
        soundEngine.playVictory();
        this.onVictory();
        this.stop();
        return;
      }
    }

    // Check Hiding Spots
    for (const spot of this.currentLevel.hidingSpots) {
      const dist = Math.hypot(this.player.x - spot.x, this.player.z - spot.z);
      if (dist < 2.0) {
        soundEngine.playClosetDoor(false);
        this.player.isHiding = true;
        this.player.hidingSpotId = spot.id;
        this.player.x = spot.x;
        this.player.z = spot.z;
        this.player.rotationY = spot.rotationY; // Face out through door slats
        this.player.pitch = 0;
        this.camera.position.set(spot.x, 1.4, spot.z);
        this.camera.rotation.set(0, spot.rotationY, 0);
        return;
      }
    }

    // Check Loot Items
    for (const loot of this.currentLevel.loot) {
      if (loot.collected) continue;
      const dist = Math.hypot(this.player.x - loot.x, this.player.z - loot.z);
      if (dist < 2.4) {
        loot.collected = true;
        const mesh = this.lootMeshMap.get(loot.id);
        if (mesh) {
          this.levelGroup.remove(mesh);
        }

        if (loot.isObjective) {
          soundEngine.playObjectivePickup();
        } else {
          soundEngine.playItemPickup();
        }

        this.onLootCollected(loot);

        // Check if all objectives collected -> update door light
        const allObjectives = this.currentLevel.loot
          .filter((l) => l.isObjective)
          .every((l) => l.collected);
        this.updateExitDoorStatus(allObjectives);
        return;
      }
    }
  }

  public throwDistractionToy(): boolean {
    if (this.player.distractionToys <= 0 || this.player.isHiding) return false;
    this.player.distractionToys -= 1;

    soundEngine.playDistractionToy();

    // Create 3D cartoon wind-up mouse/toy
    const toyGroup = new THREE.Group();
    const toyMat = new THREE.MeshToonMaterial({ color: 0xef4444 });
    const toyGeom = new THREE.SphereGeometry(0.12, 12, 12);
    const toyMesh = new THREE.Mesh(toyGeom, toyMat);
    toyGroup.add(toyMesh);

    // Position in front of player
    const spawnPos = new THREE.Vector3(
      this.player.x - Math.sin(this.player.rotationY) * 0.8,
      1.2,
      this.player.z - Math.cos(this.player.rotationY) * 0.8
    );
    toyGroup.position.copy(spawnPos);

    // Throw velocity forward
    const throwVel = new THREE.Vector3(
      -Math.sin(this.player.rotationY) * 7.5,
      3.0,
      -Math.cos(this.player.rotationY) * 7.5
    );

    this.scene.add(toyGroup);
    this.activeDistraction = {
      mesh: toyGroup,
      pos: spawnPos,
      vel: throwVel,
      timeLeft: 6.0,
    };

    return true;
  }

  public useSmokeBomb(): boolean {
    if (this.player.smokeBombs <= 0 || this.player.isHiding) return false;
    this.player.smokeBombs -= 1;
    this.player.invisibilityTimeLeft = 4.5; // 4.5 seconds of invisibility!
    soundEngine.playGhostHuh();
    return true;
  }

  public toggleFlashlight() {
    this.player.flashlightOn = !this.player.flashlightOn;
  }

  public toggleCrouch() {
    this.player.isCrouching = !this.player.isCrouching;
    if (this.player.isCrouching) {
      this.player.isSprinting = false;
    }
  }

  public setSprinting(sprint: boolean) {
    this.player.isSprinting = sprint;
    if (sprint) {
      this.player.isCrouching = false;
    }
  }

  private setupControls() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = true;
          break;
        case 'KeyC':
          this.toggleCrouch();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.setSprinting(true);
          break;
        case 'KeyE':
        case 'Space':
          this.interact();
          break;
        case 'KeyF':
          this.throwDistractionToy();
          break;
        case 'KeyG':
          this.useSmokeBomb();
          break;
        case 'KeyT':
          this.toggleFlashlight();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.setSprinting(false);
          break;
      }
    });

    // Pointer Lock & Mouse Look
    this.container.addEventListener('click', () => {
      if (!this.isPointerLocked && !this.player.isHiding) {
        try {
          this.container.requestPointerLock();
        } catch {
          // Pointer lock rejected
        }
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.container;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.player.rotationY -= e.movementX * this.mouseLookSensitivity;
        this.player.pitch -= e.movementY * this.mouseLookSensitivity;
        // Clamp pitch so camera doesn't flip
        this.player.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.player.pitch));
      }
    });
  }

  public rotatePlayerBy(dx: number, dy: number) {
    this.player.rotationY -= dx * 0.005;
    this.player.pitch -= dy * 0.005;
    this.player.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.player.pitch));
  }

  private handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
