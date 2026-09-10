import * as THREE from 'three';
import { GhostData, Vector2D, PlayerState, WallObstacle, FurnitureData } from '../types';
import { soundEngine } from '../audio/soundEngine';

export class GhostEntity {
  public data: GhostData;
  public group: THREE.Group;
  private bodyMesh: THREE.Mesh;
  private policeCapGroup: THREE.Group | null = null;
  private eyeLeft: THREE.Mesh;
  private eyeRight: THREE.Mesh;
  private pupilLeft: THREE.Mesh;
  private pupilRight: THREE.Mesh;
  private alertSprite: THREE.Sprite;
  private alertTextureQuestion: THREE.CanvasTexture;
  private alertTextureExclamation: THREE.CanvasTexture;
  private alertTextureEmpty: THREE.CanvasTexture;
  private visionConeMesh: THREE.Mesh;
  private visionConeMaterial: THREE.MeshBasicMaterial;
  private light: THREE.PointLight;
  private lastMoanTime: number = 0;
  private baseScaleY: number = 1.0;

  constructor(data: GhostData) {
    this.data = { ...data };
    this.group = new THREE.Group();
    this.group.position.set(data.x, data.y, data.z);
    this.group.rotation.y = data.rotationY;

    // --- Alert Textures ---
    this.alertTextureQuestion = this.createAlertTexture('?', '#facc15');
    this.alertTextureExclamation = this.createAlertTexture('!', '#ef4444');
    this.alertTextureEmpty = this.createEmptyTexture();

    const spriteMat = new THREE.SpriteMaterial({ map: this.alertTextureEmpty, transparent: true });
    this.alertSprite = new THREE.Sprite(spriteMat);
    this.alertSprite.position.set(0, 1.3, 0);
    this.alertSprite.scale.set(0.7, 0.7, 1);
    this.group.add(this.alertSprite);

    // --- 1. Cartoon Ghost Body ---
    // Smooth teardrop / sheet shape
    const bodyGeom = new THREE.SphereGeometry(0.55, 24, 24);
    // Skew vertices slightly for draped ghost sheet look
    const pos = bodyGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const py = pos.getY(i);
      if (py < 0) {
        // Stretch downwards into a skirt
        pos.setY(i, py * 1.6);
      }
    }
    bodyGeom.computeVertexNormals();

    const bodyMat = new THREE.MeshToonMaterial({
      color: new THREE.Color(data.color),
      transparent: true,
      opacity: 0.88,
      wireframe: false,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    this.group.add(this.bodyMesh);

    // Skirt ruffle waves at bottom
    const skirtGeom = new THREE.ConeGeometry(0.58, 0.45, 12, 1, true);
    const skirtMat = new THREE.MeshToonMaterial({
      color: new THREE.Color(data.color),
      transparent: true,
      opacity: 0.82,
    });
    const skirtMesh = new THREE.Mesh(skirtGeom, skirtMat);
    skirtMesh.position.y = -0.65;
    skirtMesh.rotation.x = Math.PI;
    this.group.add(skirtMesh);

    // --- 2. Expressive Cartoon Eyes ---
    const eyeGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 }); // Glowy white-yellow
    this.eyeLeft = new THREE.Mesh(eyeGeom, eyeMat);
    this.eyeLeft.position.set(-0.18, 0.15, 0.44);
    this.eyeLeft.scale.set(1, 1.3, 0.6);
    this.group.add(this.eyeLeft);

    this.eyeRight = new THREE.Mesh(eyeGeom, eyeMat);
    this.eyeRight.position.set(0.18, 0.15, 0.44);
    this.eyeRight.scale.set(1, 1.3, 0.6);
    this.group.add(this.eyeRight);

    // Pupils
    const pupilGeom = new THREE.SphereGeometry(0.06, 12, 12);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    this.pupilLeft = new THREE.Mesh(pupilGeom, pupilMat);
    this.pupilLeft.position.set(-0.18, 0.15, 0.51);
    this.group.add(this.pupilLeft);

    this.pupilRight = new THREE.Mesh(pupilGeom, pupilMat);
    this.pupilRight.position.set(0.18, 0.15, 0.51);
    this.group.add(this.pupilRight);

    // --- 3. Role Accessories ---
    if (data.role === 'polisi') {
      this.policeCapGroup = this.createPoliceCap();
      this.policeCapGroup.position.set(0, 0.52, 0.05);
      this.group.add(this.policeCapGroup);
    } else if (data.role === 'anjing_hantu') {
      // Floppy ghost dog ears
      const earGeom = new THREE.ConeGeometry(0.15, 0.4, 8);
      const earMat = new THREE.MeshToonMaterial({ color: data.color });
      const earL = new THREE.Mesh(earGeom, earMat);
      earL.position.set(-0.35, 0.4, 0);
      earL.rotation.z = 0.5;
      this.group.add(earL);

      const earR = new THREE.Mesh(earGeom, earMat);
      earR.position.set(0.35, 0.4, 0);
      earR.rotation.z = -0.5;
      this.group.add(earR);
    }

    // --- 4. Glowing Aura Point Light ---
    this.light = new THREE.PointLight(new THREE.Color(data.color), 1.5, 5);
    this.light.position.set(0, 0.2, 0);
    this.group.add(this.light);

    // --- 5. Projected Vision Cone on Floor ---
    const coneGeom = new THREE.ConeGeometry(
      Math.tan(data.visionAngle / 2) * data.visionDistance,
      data.visionDistance,
      16,
      1,
      false,
      0,
      Math.PI * 2
    );
    // Rotate so cone projects forward on X-Z plane
    coneGeom.rotateX(-Math.PI / 2);
    coneGeom.translate(0, 0, data.visionDistance / 2);

    this.visionConeMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.visionConeMesh = new THREE.Mesh(coneGeom, this.visionConeMaterial);
    // Lower to floor relative to ghost
    this.visionConeMesh.position.y = -data.y + 0.08;
    this.group.add(this.visionConeMesh);
  }

  private createAlertTexture(text: string, color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Circle bubble
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 78px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 66);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private createEmptyTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
  }

  private createPoliceCap(): THREE.Group {
    const cap = new THREE.Group();

    // Dark blue cap crown
    const crownGeom = new THREE.CylinderGeometry(0.35, 0.28, 0.16, 16);
    const crownMat = new THREE.MeshToonMaterial({ color: 0x1e3a8a });
    const crownMesh = new THREE.Mesh(crownGeom, crownMat);
    crownMesh.rotation.x = -0.15;
    cap.add(crownMesh);

    // Black peak visor
    const visorGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.04, 16, 1, false, 0, Math.PI);
    const visorMat = new THREE.MeshToonMaterial({ color: 0x0f172a });
    const visorMesh = new THREE.Mesh(visorGeom, visorMat);
    visorMesh.position.set(0, -0.06, 0.12);
    visorMesh.rotation.x = 0.25;
    cap.add(visorMesh);

    // Golden police badge on front
    const badgeGeom = new THREE.BoxGeometry(0.12, 0.12, 0.04);
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
    badgeMesh.position.set(0, 0.05, 0.32);
    cap.add(badgeMesh);

    return cap;
  }

  public update(
    delta: number,
    time: number,
    player: PlayerState,
    walls: WallObstacle[],
    furniture: FurnitureData[],
    distractionPos: Vector2D | null
  ): boolean {
    // Returns true if player is CAUGHT by this ghost!

    // 1. Visual Bobbing & Floating Animation
    const bob = Math.sin(time * 3 + this.data.id.charCodeAt(0)) * 0.12;
    this.group.position.y = this.data.y + bob;

    // Pupil glance
    const pupilShiftX = Math.sin(time * 2) * 0.03;
    this.pupilLeft.position.x = -0.18 + pupilShiftX;
    this.pupilRight.position.x = 0.18 + pupilShiftX;

    // 2. Sense Player or Distractions
    const dx = player.x - this.group.position.x;
    const dz = player.z - this.group.position.z;
    const distToPlayer = Math.hypot(dx, dz);

    // Check line of sight
    const ghostAngle = this.group.rotation.y;
    // Direction angle from ghost to player
    const angleToPlayer = Math.atan2(dx, dz);
    let diffAngle = Math.abs(ghostAngle - angleToPlayer);
    while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
    diffAngle = Math.abs(diffAngle);

    const canSeePlayer =
      !player.isHiding &&
      player.invisibilityTimeLeft <= 0 &&
      distToPlayer <= this.data.visionDistance &&
      diffAngle <= this.data.visionAngle / 2 &&
      this.hasLineOfSight(this.group.position.x, this.group.position.z, player.x, player.z, walls, furniture);

    // Hearing check
    const isPlayerLoud = player.isSprinting && player.isMoving && !player.isHiding;
    const canHearPlayer = isPlayerLoud && distToPlayer <= this.data.hearingDistance;

    // Distraction check (wind-up toy)
    let heardDistraction = false;
    if (distractionPos) {
      const distDistraction = Math.hypot(
        distractionPos.x - this.group.position.x,
        distractionPos.z - this.group.position.z
      );
      if (distDistraction <= this.data.hearingDistance * 1.5) {
        heardDistraction = true;
      }
    }

    // --- State Machine ---
    if (canSeePlayer) {
      if (this.data.state !== 'chase') {
        soundEngine.playGhostAlert();
        this.data.state = 'chase';
      }
      this.data.targetInvestigatePos = { x: player.x, z: player.z };
      this.data.stateTimer = 5.0; // Stay chasing for 5 seconds after losing sight
    } else if (heardDistraction && distractionPos && this.data.state !== 'chase') {
      if (this.data.state !== 'suspicious') {
        soundEngine.playGhostHuh();
        this.data.state = 'suspicious';
      }
      this.data.targetInvestigatePos = { x: distractionPos.x, z: distractionPos.z };
      this.data.stateTimer = 4.0;
    } else if (canHearPlayer && this.data.state !== 'chase') {
      if (this.data.state !== 'suspicious') {
        soundEngine.playGhostHuh();
        this.data.state = 'suspicious';
      }
      this.data.targetInvestigatePos = { x: player.x, z: player.z };
      this.data.stateTimer = 3.5;
    }

    // Occasional spooky moan in patrol
    if (this.data.state === 'patrol' && time - this.lastMoanTime > 12) {
      this.lastMoanTime = time;
      if (distToPlayer < 14) {
        soundEngine.playGhostMoan();
      }
    }

    // 3. Movement & Behavior Execution
    if (this.data.state === 'chase') {
      // Alert UI: Red Exclamation
      this.alertSprite.material.map = this.alertTextureExclamation;
      this.alertSprite.material.needsUpdate = true;
      this.visionConeMaterial.color.setHex(0xef4444);
      this.visionConeMaterial.opacity = 0.45 + Math.sin(time * 12) * 0.15;
      this.light.color.setHex(0xef4444);

      // Move toward player / target position
      const target = this.data.targetInvestigatePos || { x: player.x, z: player.z };
      this.moveTowards(target.x, target.z, this.data.chaseSpeed * delta, walls);

      // Catch check!
      if (distToPlayer < 1.35 && !player.isHiding && player.invisibilityTimeLeft <= 0) {
        return true; // CAUGHT!
      }

      // Check timer if sight lost
      if (!canSeePlayer) {
        this.data.stateTimer -= delta;
        if (this.data.stateTimer <= 0) {
          this.data.state = 'search';
          this.data.stateTimer = 3.0;
        }
      }
    } else if (this.data.state === 'suspicious') {
      // Alert UI: Yellow Question
      this.alertSprite.material.map = this.alertTextureQuestion;
      this.alertSprite.material.needsUpdate = true;
      this.visionConeMaterial.color.setHex(0xfacc15);
      this.visionConeMaterial.opacity = 0.32;
      this.light.color.setHex(0xfacc15);

      if (this.data.targetInvestigatePos) {
        this.moveTowards(
          this.data.targetInvestigatePos.x,
          this.data.targetInvestigatePos.z,
          this.data.speed * 1.3 * delta,
          walls
        );
        const distToTarget = Math.hypot(
          this.data.targetInvestigatePos.x - this.group.position.x,
          this.data.targetInvestigatePos.z - this.group.position.z
        );
        if (distToTarget < 1.0) {
          this.data.state = 'search';
          this.data.stateTimer = 3.0;
        }
      }
      this.data.stateTimer -= delta;
      if (this.data.stateTimer <= 0) {
        this.data.state = 'patrol';
      }
    } else if (this.data.state === 'search') {
      // Searching: rotate slowly looking around
      this.alertSprite.material.map = this.alertTextureQuestion;
      this.alertSprite.material.needsUpdate = true;
      this.visionConeMaterial.color.setHex(0xfacc15);
      this.visionConeMaterial.opacity = 0.25;

      this.group.rotation.y += delta * 1.8;
      this.data.stateTimer -= delta;
      if (this.data.stateTimer <= 0) {
        this.data.state = 'patrol';
      }
    } else {
      // Normal Patrol
      this.alertSprite.material.map = this.alertTextureEmpty;
      this.alertSprite.material.needsUpdate = true;
      this.visionConeMaterial.color.setHex(0x38bdf8);
      this.visionConeMaterial.opacity = 0.16;
      this.light.color.set(this.data.color);

      // Patrol path waypoints
      const pts = this.data.patrolPoints;
      if (pts.length > 0) {
        const wp = pts[this.data.currentWaypointIdx];
        const distToWp = Math.hypot(wp.x - this.group.position.x, wp.z - this.group.position.z);

        if (distToWp < 0.6) {
          // Reached waypoint, wait or advance
          this.data.stateTimer += delta;
          if (this.data.stateTimer >= (wp.waitTime || 1.5)) {
            this.data.stateTimer = 0;
            this.data.currentWaypointIdx = (this.data.currentWaypointIdx + 1) % pts.length;
          }
        } else {
          this.moveTowards(wp.x, wp.z, this.data.speed * delta, walls);
        }
      }
    }

    return false;
  }

  private moveTowards(targetX: number, targetZ: number, stepDistance: number, walls: WallObstacle[]) {
    const dx = targetX - this.group.position.x;
    const dz = targetZ - this.group.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.05) {
      // Target facing angle
      const targetAngle = Math.atan2(dx, dz);
      // Smoothly rotate towards target
      let diff = targetAngle - this.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.group.rotation.y += diff * 0.12;

      // Calculate step
      const stepX = (dx / dist) * stepDistance;
      const stepZ = (dz / dist) * stepDistance;

      const nextX = this.group.position.x + stepX;
      const nextZ = this.group.position.z + stepZ;

      // Ghost collision with main walls
      if (!this.checkWallCollision(nextX, nextZ, walls)) {
        this.group.position.x = nextX;
        this.group.position.z = nextZ;
      } else {
        // Slide along wall
        if (!this.checkWallCollision(nextX, this.group.position.z, walls)) {
          this.group.position.x = nextX;
        } else if (!this.checkWallCollision(this.group.position.x, nextZ, walls)) {
          this.group.position.z = nextZ;
        }
      }
    }
  }

  private checkWallCollision(x: number, z: number, walls: WallObstacle[]): boolean {
    const ghostRadius = 0.45;
    for (const wall of walls) {
      const minX = Math.min(wall.x1, wall.x2) - wall.thickness / 2 - ghostRadius;
      const maxX = Math.max(wall.x1, wall.x2) + wall.thickness / 2 + ghostRadius;
      const minZ = Math.min(wall.z1, wall.z2) - wall.thickness / 2 - ghostRadius;
      const maxZ = Math.max(wall.z1, wall.z2) + wall.thickness / 2 + ghostRadius;

      if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
        return true;
      }
    }
    return false;
  }

  private hasLineOfSight(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    walls: WallObstacle[],
    furniture: FurnitureData[]
  ): boolean {
    // 2D line segment intersection against walls & tall furniture
    for (const wall of walls) {
      const wx1 = wall.x1;
      const wz1 = wall.z1;
      const wx2 = wall.x2;
      const wz2 = wall.z2;

      if (this.linesIntersect(x1, z1, x2, z2, wx1, wz1, wx2, wz2)) {
        return false;
      }
    }

    // Tall furniture (bookshelf, cabinet) blocks sight
    for (const f of furniture) {
      if (f.height >= 2.0) {
        const halfW = f.width / 2;
        const halfD = f.depth / 2;
        const boxCorners = [
          [f.x - halfW, f.z - halfD, f.x + halfW, f.z - halfD],
          [f.x + halfW, f.z - halfD, f.x + halfW, f.z + halfD],
          [f.x + halfW, f.z + halfD, f.x - halfW, f.z + halfD],
          [f.x - halfW, f.z + halfD, f.x - halfW, f.z - halfD],
        ];
        for (const [bx1, bz1, bx2, bz2] of boxCorners) {
          if (this.linesIntersect(x1, z1, x2, z2, bx1, bz1, bx2, bz2)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private linesIntersect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ): boolean {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }
}
