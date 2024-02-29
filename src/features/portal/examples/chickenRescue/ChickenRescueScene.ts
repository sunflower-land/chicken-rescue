import mapJson from "assets/map/chicken_rescue.json";
import { SceneId } from "features/world/mmoMachine";
import { BaseScene } from "features/world/scenes/BaseScene";
import { ChickenContainer } from "./ChickenContainer";
import { Coordinates } from "features/game/expansion/components/MapPlacement";
import { SQUARE_WIDTH } from "features/game/lib/constants";
import { MachineInterpreter } from "./lib/portalMachine";
import { SUNNYSIDE } from "assets/sunnyside";
import {
  BoundingBox,
  pickEmptyPosition,
  randomEmptyPosition,
} from "features/game/expansion/placeable/lib/collisionDetection";

const DISTANCE = 16;

const GRID_SIZE = 16;

export type Direction = "left" | "right" | "up" | "down";

const FENCE_BOUNDS: BoundingBox = {
  x: 11,
  y: 21,
  height: 18,
  width: 18,
};

export class ChickenRescueScene extends BaseScene {
  sceneId: SceneId = "chicken_rescue";

  chickenPen: Phaser.GameObjects.Rectangle | undefined;

  fences: Phaser.GameObjects.Rectangle[] = [];

  direction: Direction | undefined = undefined;

  pivots: { x: number; y: number; direction: Direction }[] = [];

  nextMove:
    | {
        direction: Direction;
        moveAt: Coordinates;
      }
    | undefined = undefined;

  // Empty array of followers
  following: (ChickenContainer | null)[] = new Array(50).fill(null);

  enemies: BoundingBox[] = [];
  sleeping: BoundingBox[] = [];

  constructor() {
    super({
      name: "chicken_rescue",
      map: { json: mapJson },
      audio: { fx: { walk_key: "dirt_footstep" } },
    });
  }

  public get portalService() {
    return this.registry.get("portalService") as MachineInterpreter | undefined;
  }

  preload() {
    super.preload();

    // Load chicken rescue assets
    this.load.spritesheet("walking_chicken", "world/walking_chicken.png", {
      frameWidth: 16,
      frameHeight: 15,
    });

    this.load.spritesheet("sleeping_chicken", "world/sleeping_chicken.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.image("rock", SUNNYSIDE.resource.stone_rock);

    // Ambience SFX
    if (!this.sound.get("nature_1")) {
      const nature1 = this.sound.add("nature_1");
      nature1.play({ loop: true, volume: 0.01 });
    }

    // Shut down the sound when the scene changes
    this.events.once("shutdown", () => {
      this.sound.getAllPlaying().forEach((sound) => {
        sound.destroy();
      });
    });
  }

  async create() {
    this.map = this.make.tilemap({
      key: "chicken_rescue",
    });

    super.create();

    this.chickenPen = this.add.rectangle(
      GRID_SIZE * 19 + GRID_SIZE,
      GRID_SIZE * 20 + GRID_SIZE / 2,
      GRID_SIZE * 4,
      GRID_SIZE,
      0x000000,
      0
    ); // 0x000000 is black, 0 is alpha

    this.physics.world.enable(this.chickenPen);

    this.currentPlayer?.setPosition(
      GRID_SIZE * 20 + GRID_SIZE / 2,
      GRID_SIZE * 20 + GRID_SIZE / 2
    );

    this.pivots = [];

    // Create X sleeping chickens
    for (let i = 0; i < 10; i++) {
      this.addSleepingChicken();
    }

    // Create X static enemies
    for (let i = 0; i < 20; i++) {
      this.addStaticEnemy({ enemy: "rock" });
    }

    // Fences
    const leftFence = this.add.rectangle(
      GRID_SIZE * FENCE_BOUNDS.x - GRID_SIZE / 2,
      GRID_SIZE * 13, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE / 2,
      GRID_SIZE * FENCE_BOUNDS.height,
      0x000000,
      0
    );

    const rightFence = this.add.rectangle(
      GRID_SIZE * (FENCE_BOUNDS.x + FENCE_BOUNDS.width) + GRID_SIZE / 2,
      GRID_SIZE * 13, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE / 2,
      GRID_SIZE * FENCE_BOUNDS.height,
      0x000000,
      0
    );

    const bottomFence = this.add.rectangle(
      GRID_SIZE * 20,
      GRID_SIZE * 23 - GRID_SIZE / 2, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE * FENCE_BOUNDS.width,
      GRID_SIZE / 2,
      0x000000,
      0
    );

    const topFence = this.add.rectangle(
      GRID_SIZE * 20,
      GRID_SIZE * 4 - GRID_SIZE / 2, // GRID_SIZE * (FENCE_BOUNDS.y - FENCE_BOUNDS.height),
      GRID_SIZE * FENCE_BOUNDS.width,
      GRID_SIZE / 2,
      0x000000,
      0
    );

    this.physics.world.enable(leftFence);
    this.physics.world.enable(rightFence);
    this.physics.world.enable(bottomFence);
    this.physics.world.enable(topFence);

    // On collide destroy the chicken
    this.physics.add.overlap(
      this.currentPlayer as Phaser.GameObjects.GameObject,
      [leftFence, rightFence, bottomFence, topFence],
      () => {
        this.gameOver();
      }
    );
  }

  pickEmptyGridPosition({ width, height }: { width: number; height: number }) {
    const sleepingBoxes = this.sleeping.map((sleeping) => ({
      x: Math.floor(sleeping.x / SQUARE_WIDTH),
      y: Math.floor(sleeping.y / SQUARE_WIDTH),
      // Give them a wide area
      width: 3,
      height: 3,
    }));

    const enemies = this.enemies.map((enemy) => ({
      ...enemy,
      // Give them a wide area
      width: 3,
      height: 3,
    }));

    const chickenPen: BoundingBox = {
      y: 20,
      x: 20,
      width: 8,
      height: 5,
    };

    // this.add.rectangle(
    //   chickenPen.x * SQUARE_WIDTH,
    //   chickenPen.y * SQUARE_WIDTH,
    //   chickenPen.width * SQUARE_WIDTH,
    //   chickenPen.height * SQUARE_WIDTH,
    //   0xff0000
    // );

    const coordinates = randomEmptyPosition({
      bounding: FENCE_BOUNDS,
      boxes: [...enemies, ...sleepingBoxes, chickenPen],
    });

    return coordinates;
  }

  addSleepingChicken() {
    const coordinates = this.pickEmptyGridPosition({ width: 1, height: 1 });

    if (!coordinates) {
      console.log("NO AVAILABLE POSITIONS!");
      return;
    }

    console.log({
      x: coordinates.x * SQUARE_WIDTH + SQUARE_WIDTH / 2,
      y: coordinates.y * SQUARE_WIDTH + SQUARE_WIDTH / 2,
    });

    const chicken = this.add.sprite(
      coordinates.x * SQUARE_WIDTH + SQUARE_WIDTH / 2,
      coordinates.y * SQUARE_WIDTH + SQUARE_WIDTH / 2,
      "sleeping_chicken"
    );

    if (!this.anims.exists("sleeping_chicken_anim")) {
      this.anims.create({
        key: "sleeping_chicken_anim",
        frames: this.anims.generateFrameNumbers("sleeping_chicken" as string, {
          start: 0,
          end: 1,
        }),
        repeat: -1,
        frameRate: 2,
      });
    }

    chicken.play("sleeping_chicken_anim", true);

    // Add a collider to the chicken
    this.physics.world.enable(chicken);

    this.sleeping.push({
      x: coordinates.x * SQUARE_WIDTH,
      y: coordinates.y * SQUARE_WIDTH,
      width: 1,
      height: 1,
    });

    const body = chicken.body as Phaser.Physics.Arcade.Body;

    // Set chicken bounds
    body.setSize(10, 10);

    // On collide destroy the chicken
    this.physics.add.overlap(
      this.currentPlayer as Phaser.GameObjects.GameObject,
      chicken,
      () => {
        chicken.destroy();
        this.onAddFollower();
      }
    );
  }

  addStaticEnemy({}: { enemy: "rock" }) {
    const coordinates = this.pickEmptyGridPosition({ width: 1, height: 1 });

    if (!coordinates) {
      console.log("No available positions for enemy");
      return;
    }

    const enemy = this.add.sprite(
      coordinates.x * SQUARE_WIDTH + SQUARE_WIDTH / 2,
      coordinates.y * SQUARE_WIDTH + SQUARE_WIDTH / 2,
      "rock"
    );

    this.physics.world.enable(enemy);

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 10);

    // On collide destroy the chicken
    this.physics.add.overlap(
      this.currentPlayer as Phaser.GameObjects.GameObject,
      enemy,
      () => {
        this.gameOver();
      }
    );

    this.enemies.push({
      x: coordinates.x * SQUARE_WIDTH,
      y: coordinates.y * SQUARE_WIDTH,
      width: 1,
      height: 1,
    });
  }

  private isDead = false;

  async gameOver() {
    this.isDead = true;

    this.currentPlayer?.body?.setVelocity(0, 0);

    this.currentPlayer?.disappear();

    this.following.forEach((follower, index) => {
      setInterval(() => follower?.disappear(), (index + 1) * 100);
    });

    console.log("DEAD!");

    await new Promise((res) => setTimeout(res, 1000));

    this.portalService?.send("GAME_OVER");
  }

  onAddFollower() {
    // Find first empty position in conga line
    const index = this.following.findIndex((follower) => !follower);

    const { x, y } = this.getPositionInConga(index);

    const chicken = new ChickenContainer({
      scene: this,
      x,
      y,
    });

    this.physics.world.enable(chicken);

    this.following[index] = chicken;

    this.physics.add.overlap(
      this.chickenPen as Phaser.GameObjects.GameObject,
      chicken,
      () => {
        if (chicken.destroyed) return;

        chicken.disappear();
        this.following[index] = null;

        this.portalService?.send("CHICKEN_RESCUED", {
          points: 1,
        });
        const points = 1;
      }
    );
  }

  updateDirection() {
    // A move is already scheduled
    if (this.nextMove) {
      return;
    }

    const previous = this.direction;
    let newDirection: "left" | "right" | "up" | "down" | undefined = undefined;

    // use keyboard control if joystick is not active
    if (newDirection === undefined) {
      if (document.activeElement?.tagName === "INPUT") return;

      if (this.cursorKeys?.left.isDown || this.cursorKeys?.a?.isDown) {
        newDirection = "left";
      }

      if (this.cursorKeys?.right.isDown || this.cursorKeys?.d?.isDown) {
        newDirection = "right";
      }

      if (this.cursorKeys?.up.isDown || this.cursorKeys?.w?.isDown) {
        newDirection = "up";
      }

      if (this.cursorKeys?.down.isDown || this.cursorKeys?.s?.isDown) {
        newDirection = "down";
      }
    }

    // Cannot go backwards
    const isOppositeDirection = (previous?: Direction, current?: Direction) => {
      return (
        (previous === "left" && current === "right") ||
        (previous === "right" && current === "left") ||
        (previous === "up" && current === "down") ||
        (previous === "down" && current === "up")
      );
    };

    if (newDirection === undefined || previous === newDirection) {
      return;
    }

    if (isOppositeDirection(previous, newDirection)) {
      return;
    }

    this.currentPlayer?.walk();

    const nextGridSquare: Coordinates = {
      x: this.currentPlayer?.x ?? 0,
      y: this.currentPlayer?.y ?? 0,
    };

    if (this.direction === "right") {
      nextGridSquare.x =
        Math.floor(nextGridSquare.x / 16) * 16 + 16 + SQUARE_WIDTH / 2;
    }

    if (this.direction === "left") {
      nextGridSquare.x =
        Math.floor(nextGridSquare.x / 16) * 16 - SQUARE_WIDTH / 2;
    }

    if (this.direction === "up") {
      nextGridSquare.y =
        Math.floor(nextGridSquare.y / 16) * 16 - SQUARE_WIDTH / 2;
    }

    if (this.direction === "down") {
      nextGridSquare.y =
        Math.floor(nextGridSquare.y / 16) * 16 + 16 + SQUARE_WIDTH / 2;
    }

    this.nextMove = {
      direction: newDirection,
      moveAt: nextGridSquare,
    };
  }

  movePlayer() {
    if (!this.nextMove) {
      return;
    }

    const player = this.currentPlayer as Coordinates;
    const currentDirection = this.direction ?? "up";
    const { direction, moveAt } = this.nextMove;

    // Has player reached its destination
    let hasReachedDestination = false;
    if (currentDirection === "right" && player.x >= moveAt.x) {
      hasReachedDestination = true;
    }

    if (currentDirection === "left" && player.x <= moveAt.x) {
      hasReachedDestination = true;
    }

    if (currentDirection === "up" && player.y <= moveAt.y) {
      hasReachedDestination = true;
    }

    if (currentDirection === "down" && player.y >= moveAt.y) {
      hasReachedDestination = true;
    }

    if (!hasReachedDestination) return;

    this.currentPlayer?.setPosition(moveAt.x, moveAt.y);

    let yVelocity = 0;
    if (direction === "up") {
      yVelocity = -this.walkingSpeed;
    }

    if (direction === "down") {
      yVelocity = this.walkingSpeed;
    }

    let xVelocity = 0;
    if (direction === "left") {
      xVelocity = -this.walkingSpeed;

      this.currentPlayer?.faceLeft();
    }

    if (direction === "right") {
      xVelocity = this.walkingSpeed;
      this.currentPlayer?.faceRight();
    }

    if (!this.direction) {
      this.portalService?.send("START");
    }

    this.currentPlayer?.body?.setVelocity(xVelocity, yVelocity);

    this.pivots = [
      {
        ...moveAt,
        direction: currentDirection,
      },
      ...this.pivots,
    ];

    this.direction = direction;

    this.nextMove = undefined;
  }

  calculatePosition(
    currentPosition: Coordinates,
    targetPosition: Coordinates,
    speed: number
  ) {
    // Calculate direction vector from current position to target position
    const directionX = targetPosition.x - currentPosition.x;
    const directionY = targetPosition.y - currentPosition.y;

    // Calculate distance between current position and target position
    const distance = Math.sqrt(
      directionX * directionX + directionY * directionY
    );

    // Calculate normalized direction vector
    const normalizedDirectionX = directionX / distance;
    const normalizedDirectionY = directionY / distance;

    // Calculate new speed based on linear motion
    const newSpeedX = normalizedDirectionX * speed;
    const newSpeedY = normalizedDirectionY * speed;

    return { x: newSpeedX, y: newSpeedY };
  }

  getPositionInConga(index: number) {
    // Update position on conga line
    const points = [
      {
        x: this.currentPlayer?.x ?? 0,
        y: this.currentPlayer?.y ?? 0,
        direction: this.direction,
      },
      ...this.pivots,
    ];

    // How far from the front they should be
    let distanceRemaining = DISTANCE * (index + 1);

    let pointIndex = 0;

    let x = 0;
    let y = 0;

    while (pointIndex < points.length - 1) {
      const point = points[pointIndex];
      const nextPoint = points[pointIndex + 1];

      const distanceToNextPoint =
        Math.abs(nextPoint.x - point.x) + Math.abs(nextPoint.y - point.y);

      if (distanceRemaining > distanceToNextPoint) {
        // distance += distanceToNextPoint;
        pointIndex += 1;
        distanceRemaining -= distanceToNextPoint;
      } else {
        if (point.direction === "left" || point.direction === "right") {
          // Moving horizontally
          x =
            point.direction === "left"
              ? point.x + distanceRemaining
              : point.x - distanceRemaining;
          y = point.y;
        } else {
          // Moving vertically
          x = point.x;
          y =
            point.direction === "up"
              ? point.y + distanceRemaining
              : point.y - distanceRemaining;
        }

        break;
      }
    }

    const direction = points[pointIndex].direction ?? "up";

    return { x, y, direction };
  }

  updateFollowingChickens() {
    if (!this.currentPlayer?.body) {
      return;
    }

    // Update the positions
    this.following.forEach((follower, index) => {
      if (!follower) {
        return;
      }

      const { x, y, direction } = this.getPositionInConga(index);

      follower.x = x;
      follower.y = y;

      follower.setDirection(direction);
    });
  }

  update() {
    this.updateDirection();
    this.debug();

    if (this.isDead) return;

    this.movePlayer();
    this.updateFollowingChickens();
  }

  debug() {
    // Draw the pivots
    // this.pivots.forEach((pivot) => {
    //   this.add.circle(pivot.x, pivot.y, 2, 0xff0000);
    // });
    // Clear points
  }
}
