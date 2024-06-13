import PubSub from "pubsub-js";
import mapJson from "assets/map/chicken_rescue.json";
import { SceneId } from "features/world/mmoMachine";
import { BaseScene, WALKING_SPEED } from "features/world/scenes/BaseScene";
import { ChickenContainer } from "./ChickenContainer";
import { Coordinates } from "features/game/expansion/components/MapPlacement";
import { SQUARE_WIDTH } from "features/game/lib/constants";
import { MachineInterpreter } from "./lib/chickenRescueMachine";
import { SUNNYSIDE } from "assets/sunnyside";
import {
  BoundingBox,
  isOverlapping,
  randomEmptyPosition,
} from "features/game/expansion/placeable/lib/collisionDetection";
import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { SOUNDS } from "assets/sound-effects/soundEffects";
import { SleepingChickenContainer } from "./SleepingChickenContainer";

const DISTANCE = 16;

const GRID_SIZE = 16;

export type Direction = "left" | "right" | "up" | "down";

const FENCE_BOUNDS: BoundingBox = {
  x: 11,
  y: 21,
  height: 18,
  width: 18,
};

const MAX_CHICKENS = 200;

export class ChickenRescueScene extends BaseScene {
  sceneId: SceneId = "chicken_rescue";

  // chickenPen: Phaser.GameObjects.Rectangle | undefined;

  fences: Phaser.GameObjects.Rectangle[] = [];

  direction: Direction | undefined = undefined;

  queuedDirection: Direction | undefined = undefined;

  pivots: { x: number; y: number; direction: Direction }[] = [];

  nextMove:
    | {
        direction: Direction;
        moveAt: Coordinates;
      }
    | undefined = undefined;

  // Empty array of followers
  following: (ChickenContainer | null)[] = new Array(MAX_CHICKENS).fill(null);

  obstacles: BoundingBox[] = [];
  sleeping: (BoundingBox & { chicken: SleepingChickenContainer })[] = [];

  goblins: {
    container: BumpkinContainer;
    moveTo?: Coordinates;
  }[] = [];

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

    this.load.audio("game_over", SOUNDS.notifications.maze_over);
    this.load.audio("chicken_1", SOUNDS.resources.chicken_1);
    this.load.audio("chicken_2", SOUNDS.resources.chicken_2);

    this.load.image("rock", SUNNYSIDE.resource.stone_rock);
    this.load.image("boulder", SUNNYSIDE.resource.boulder);
    this.load.image("fox_box", "world/fox_box.png");
    this.load.image("pot_plant", "world/pot_plant.png");

    // Ambience SFX
    if (!this.sound.get("nature_1")) {
      const nature1 = this.sound.add("nature_1");
      nature1.play({ loop: true, volume: 0.01 });
    }

    // Shut down the sound when the scene changes
    this.events.once("shutdown", () => {
      this.sound.getAllPlaying().forEach((sound) => {
        sound?.destroy();
      });
    });
  }

  /**
   * These are handled in the React UI (listen to the events)
   */
  async setupMobileControls() {
    // TODO - clean up listeners

    PubSub.subscribe("GO_DOWN", () => {
      this.queuedDirection = "down";
    });

    PubSub.subscribe("GO_RIGHT", () => {
      this.queuedDirection = "right";
    });

    PubSub.subscribe("GO_LEFT", () => {
      this.queuedDirection = "left";
    });

    PubSub.subscribe("GO_UP", () => {
      this.queuedDirection = "up";
    });
  }

  async create() {
    this.map = this.make.tilemap({
      key: "chicken_rescue",
    });

    super.create();

    this.setupMobileControls();

    this.currentPlayer?.setPosition(
      GRID_SIZE * 20 + GRID_SIZE / 2,
      GRID_SIZE * 20 + GRID_SIZE / 2
    );

    // Reset all scene data
    this.pivots = [];
    this.direction = undefined;
    this.queuedDirection = undefined;
    this.nextMove = undefined;
    this.following = new Array(MAX_CHICKENS).fill(null);
    this.obstacles = [];
    this.sleeping = [];
    this.goblins = [];
    this.isDead = false;

    // Create initial objects
    for (let i = 0; i < 5; i++) {
      this.addSleepingChicken();
      this.addStaticObstacle({ name: "rock" });
      this.addStaticObstacle({ name: "pot_plant" });
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

    if (this.physics.world.drawDebug) {
      // Draw coordinates at each grid position
      for (let x = 0; x < this.map.widthInPixels; x += GRID_SIZE) {
        for (let y = 0; y < this.map.heightInPixels; y += GRID_SIZE) {
          const name = this.add.bitmapText(
            x,
            y,
            "Teeny Tiny Pixls",
            `${x / GRID_SIZE},${y / GRID_SIZE}`,
            5
          );
          name.setScale(0.5);
        }
      }
    }

    this.portalService?.onEvent((event) => {
      if (event.type === "RETRY") {
        this.scene.restart();
      }
    });
  }

  getBoundingBoxes(): BoundingBox[] {
    const sleepingBoxes = this.sleeping.map((sleeping) => ({
      x: sleeping.x,
      y: sleeping.y,
      width: 1,
      height: 1,
    }));

    // Give them a wide area with a buffer so don't spawn right next to them
    const enemies = this.obstacles.map((enemy) => ({
      x: enemy.x - Math.floor(enemy.width / 2),
      y: enemy.y + Math.floor(enemy.height / 2),
      width: 2 + Math.floor(enemy.width / 2),
      height: 2 + Math.floor(enemy.height / 2),
    }));

    const PLAYER_RADIUS = 6;
    const playerGridPosition = {
      x:
        Math.floor((this.currentPlayer?.x ?? 0) / SQUARE_WIDTH) -
        PLAYER_RADIUS / 2,
      y:
        Math.floor((this.currentPlayer?.y ?? 0) / SQUARE_WIDTH) +
        PLAYER_RADIUS / 2,
      width: PLAYER_RADIUS,
      height: PLAYER_RADIUS,
    };

    const followingGridPositions = this.following.map((follower) => ({
      x: Math.floor((follower?.x ?? 0) / SQUARE_WIDTH),
      y: Math.floor((follower?.y ?? 0) / SQUARE_WIDTH),
      width: 1,
      height: 1,
    }));

    const goblinGridPositions = this.goblins.map((goblin) => ({
      x: Math.floor(goblin.container.x / SQUARE_WIDTH),
      y: Math.floor(goblin.container.y / SQUARE_WIDTH),
      width: 1,
      height: 1,
    }));

    const goblinPathPositions: Coordinates[] = [];
    this.goblins
      .filter((goblin) => goblin.moveTo)
      // Fill in all positions between the goblin and the moveTo
      .forEach((goblin) => {
        const { x: moveToX, y: moveToY } = goblin.moveTo as Coordinates;
        const { x: goblinX, y: goblinY } = goblin.container;

        const goblinGridCoords = {
          x: Math.floor(goblinX / SQUARE_WIDTH),
          y: Math.floor(goblinY / SQUARE_WIDTH),
        };

        for (
          let x = Math.min(goblinGridCoords.x, moveToX) + 1;
          x < Math.max(goblinGridCoords.x, moveToX);
          x++
        ) {
          goblinPathPositions.push({ x, y: goblinGridCoords.y });
        }

        for (
          let y = Math.min(goblinGridCoords.y, moveToY) + 1;
          y < Math.max(goblinGridCoords.y, moveToY);
          y++
        ) {
          goblinPathPositions.push({ x: goblinGridCoords.x, y });
        }
      });

    return [
      ...enemies,
      ...sleepingBoxes,
      ...followingGridPositions,
      ...goblinGridPositions,
      ...goblinPathPositions.map((position) => ({
        ...position,
        width: 1,
        height: 1,
      })),
      playerGridPosition,
    ];
  }

  pickEmptyGridPosition({ width, height }: { width: number; height: number }) {
    const coordinates = randomEmptyPosition({
      bounding: FENCE_BOUNDS,
      boxes: this.getBoundingBoxes(),
      item: { width, height },
    });

    return coordinates;
  }

  addGoblin() {
    const coordinates = this.pickEmptyGridPosition({
      width: 1,
      height: 1,
    });
    // const coordinates = {
    //   x: FENCE_BOUNDS.x,
    //   y: FENCE_BOUNDS.y,
    // };
    if (!coordinates) {
      return;
    }

    const x = coordinates.x * SQUARE_WIDTH + SQUARE_WIDTH / 2;
    const y = coordinates.y * SQUARE_WIDTH + SQUARE_WIDTH / 2;

    const goblin = new BumpkinContainer({
      clothing: {
        body: "Goblin Potion",
        shirt: "Red Farmer Shirt",
        pants: "Farmer Overalls",
        shoes: "Black Farmer Boots",
        updatedAt: 0,
      },
      scene: this,
      x,
      y,
    });

    (goblin.body as Phaser.Physics.Arcade.Body)
      .setSize(10, 10)
      .setOffset(3, 3)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    // On collide destroy the chicken
    this.physics.add.overlap(
      this.currentPlayer as Phaser.GameObjects.GameObject,
      goblin as Phaser.GameObjects.GameObject,
      () => {
        this.gameOver();
      }
    );

    this.goblins.push({
      container: goblin,
    });

    const index = this.goblins.length - 1;

    this.goblinMover = setInterval(() => {
      this.moveGoblin(index);
    }, 5000);
  }

  private goblinMover: NodeJS.Timeout | undefined;

  async moveGoblin(index: number) {
    const goblin = this.goblins[index];

    const coordinates = {
      x: Math.floor(goblin.container.x / SQUARE_WIDTH),
      y: Math.floor(goblin.container.y / SQUARE_WIDTH),
    };

    // Find point to move to
    const boxes = this.getBoundingBoxes();
    const potentialPoints: Coordinates[] = [];

    // Iterate through the grid to find potential points to the right
    for (
      let coordX = coordinates.x + 1;
      coordX < FENCE_BOUNDS.x + FENCE_BOUNDS.width;
      coordX++
    ) {
      const isEmpty = boxes.every(
        (box) =>
          !isOverlapping(
            {
              x: coordX,
              y: coordinates.y,
              width: 1,
              height: 1,
            },
            box
          )
      );

      if (!isEmpty) {
        break;
      }

      potentialPoints.push({
        x: coordX,
        y: coordinates.y,
      });
    }

    // Iterate through the grid to find potential points to the left
    for (let coordX = coordinates.x - 1; coordX >= FENCE_BOUNDS.x; coordX--) {
      const isEmpty = boxes.every(
        (box) =>
          !isOverlapping(
            {
              x: coordX,
              y: coordinates.y,
              width: 1,
              height: 1,
            },
            box
          )
      );

      if (!isEmpty) {
        break;
      }

      potentialPoints.push({
        x: coordX,
        y: coordinates.y,
      });
    }

    // Iterate through the grid to find potential points upwards
    for (
      let coordY = coordinates.y - 1;
      coordY > FENCE_BOUNDS.y - FENCE_BOUNDS.height;
      coordY--
    ) {
      const isEmpty = boxes.every(
        (box) =>
          !isOverlapping(
            {
              x: coordinates.x,
              y: coordY,
              width: 1,
              height: 1,
            },
            box
          )
      );

      if (!isEmpty) {
        break;
      }

      potentialPoints.push({
        x: coordinates.x,
        y: coordY,
      });
    }

    // Iterate through the grid to find potential points downwards
    for (let coordY = coordinates.y + 1; coordY < FENCE_BOUNDS.y; coordY++) {
      const isEmpty = boxes.every(
        (box) =>
          !isOverlapping(
            {
              x: coordinates.x,
              y: coordY,
              width: 1,
              height: 1,
            },
            box
          )
      );

      if (!isEmpty) {
        break;
      }

      potentialPoints.push({
        x: coordinates.x,
        y: coordY,
      });
    }

    // Pick random point
    let moveTo: Coordinates | undefined;
    if (potentialPoints.length > 0) {
      moveTo =
        potentialPoints[Math.floor(Math.random() * potentialPoints.length)];
    }

    if (!moveTo) return;

    this.goblins[index].container.alerted();

    await new Promise((res) => setTimeout(res, 1000));

    this.goblins[index].moveTo = moveTo;

    // Face left
    if (moveTo.x < coordinates.x) {
      this.goblins[index].container.faceLeft();
    }

    // Face right
    if (moveTo.x > coordinates.x) {
      this.goblins[index].container.faceRight();
    }

    this.goblins[index].container.walk();
  }

  addSleepingChicken() {
    const coordinates = this.pickEmptyGridPosition({ width: 1, height: 1 });

    if (!coordinates) {
      return;
    }

    const onRemove = () => {
      // Remove from list
      this.sleeping = this.sleeping.filter(
        (sleeping) =>
          sleeping.x !== coordinates.x && sleeping.y !== coordinates.y
      );
    };

    const chicken = new SleepingChickenContainer({
      scene: this,
      x: coordinates.x * SQUARE_WIDTH + SQUARE_WIDTH / 2,
      y: coordinates.y * SQUARE_WIDTH + SQUARE_WIDTH / 2,
      onDisappear: onRemove,
    });

    // Add a collider to the chicken
    this.physics.world.enable(chicken);

    this.sleeping.push({
      x: coordinates.x,
      y: coordinates.y,
      width: 1,
      height: 1,
      chicken,
    });

    // On collide destroy the chicken
    this.physics.add.overlap(
      this.currentPlayer as Phaser.GameObjects.GameObject,
      chicken,
      () => {
        onRemove();
        // Add chicken to conga line
        this.onAddFollower();

        chicken?.destroy();
      }
    );
  }

  addStaticObstacle({
    name,
  }: {
    name: "rock" | "boulder" | "fox_box" | "pot_plant";
  }) {
    const dimensions = {
      rock: { width: 1, height: 1 },
      boulder: { width: 2, height: 2 },
      fox_box: { width: 2, height: 2 },
      pot_plant: { width: 2, height: 2 },
    }[name];

    const coordinates = this.pickEmptyGridPosition(dimensions);

    if (!coordinates) {
      return;
    }

    if (dimensions.width === 2) {
      coordinates.x += 1;
    }

    let x = coordinates.x * SQUARE_WIDTH;
    let y = coordinates.y * SQUARE_WIDTH;

    if (dimensions.width % 2 === 1) {
      x += SQUARE_WIDTH / 2;
    }

    if (dimensions.height % 2 === 1) {
      y += SQUARE_WIDTH / 2;
    }

    const enemySprite = this.add.sprite(x, y, name);

    this.physics.world.enable(enemySprite);

    const body = enemySprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(
      dimensions.width * SQUARE_WIDTH - 6,
      dimensions.height * SQUARE_WIDTH - 6
    );

    // On collide destroy the chicken
    this.physics.add.overlap(
      this.currentPlayer as Phaser.GameObjects.GameObject,
      enemySprite,
      () => {
        this.gameOver();
      }
    );

    this.obstacles.push({
      x: coordinates.x,
      y: coordinates.y,
      ...dimensions,
    });
  }

  private isDead = false;

  async gameOver() {
    console.log("OVER!", this.isDead);
    if (this.isDead) return;

    this.isDead = true;

    (this.currentPlayer?.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

    this.currentPlayer?.disappear();

    const sfx = this.sound.add("game_over");
    sfx.play({ loop: false, volume: 0.3 });

    this.following.forEach((follower, index) => {
      follower?.disappear();
    });

    this.walkAudioController?.handleWalkSound(false);

    await new Promise((res) => setTimeout(res, 1000));

    if (this.chickenSpawnInterval) {
      clearInterval(this.chickenSpawnInterval);
      this.chickenSpawnInterval = undefined;
    }

    if (this.rockSpawnInterval) {
      clearInterval(this.rockSpawnInterval);
      this.rockSpawnInterval = undefined;
    }

    if (this.potPlantSpawnInterval) {
      clearInterval(this.potPlantSpawnInterval);
      this.potPlantSpawnInterval = undefined;
    }

    if (this.goblinSpawnInterval) {
      clearInterval(this.goblinSpawnInterval);
      this.goblinSpawnInterval = undefined;
    }

    if (this.goblinMover) {
      clearInterval(this.goblinMover);
      this.goblinMover = undefined;
    }

    console.log("SEND SERVICE");
    this.portalService?.send("GAME_OVER");

    this.walkingSpeed = WALKING_SPEED;
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

    this.portalService?.send("CHICKEN_RESCUED", {
      points: 1,
    });

    this.physics.add.overlap(
      this.currentPlayer as Phaser.GameObjects.GameObject,
      chicken,
      () => {
        if (chicken.destroyed) return;

        // To close in line to hit
        if (index <= 2) return;

        this.gameOver();
      }
    );

    const sounds = ["chicken_1", "chicken_2"];
    // Pick random sound
    const sound = sounds[Math.floor(Math.random() * sounds.length)];
    const cluck = this.sound.add(sound);
    cluck.play({ loop: false, volume: 1 });

    const count = this.following.filter(Boolean).length;

    if (count % 10 === 0) {
      if (count <= 30) {
        this.walkingSpeed += 5;
      } else {
        this.walkingSpeed += 3;
      }
    }
  }

  updateDirection() {
    const previous = this.direction;

    let newDirection: "left" | "right" | "up" | "down" | undefined =
      this.queuedDirection;

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

    // if (this.nextMove) {
    //   this.queuedDirection = newDirection;
    //   return;
    // }

    // if (!newDirection) return;

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

    if (!this.direction && newDirection) {
      this.start();
    }

    const currentDirection = this.direction;

    this.direction = newDirection;

    const player = this.currentPlayer as Coordinates;

    const direction = this.direction;

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

    (this.currentPlayer?.body as Phaser.Physics.Arcade.Body).setVelocity(
      xVelocity,
      yVelocity
    );

    console.log({
      x: Math.floor(player.x / 16),
      y: Math.floor(player.x / 16),
      direction: currentDirection,
    });
    this.pivots = [
      {
        // TODO get grid spot?
        x: player.x,
        y: player.y,
        direction: currentDirection,
      },
      ...this.pivots,
    ];

    this.direction = direction;

    this.nextMove = undefined;
  }

  get score() {
    return this.portalService?.state.context.score ?? 0;
  }

  chickenSpawnInterval: NodeJS.Timer | undefined;
  rockSpawnInterval: NodeJS.Timer | undefined;
  potPlantSpawnInterval: NodeJS.Timer | undefined;
  goblinSpawnInterval: NodeJS.Timer | undefined;

  start() {
    this.portalService?.send("START");

    this.walkAudioController?.handleWalkSound(true);

    this.chickenSpawnInterval = setInterval(() => {
      let chickenLimit = 10;

      if (this.score > 20) {
        chickenLimit = 5;
      }

      if (this.sleeping.length < chickenLimit) {
        this.addSleepingChicken();
      }
    }, 1000);

    console.log("START");
    this.rockSpawnInterval = setInterval(() => {
      console.log("ROCK SPAWN");
      this.addStaticObstacle({ name: "rock" });
    }, 6000);

    this.potPlantSpawnInterval = setInterval(() => {
      // Don't spawn too many pot plants
      if (this.obstacles.length <= 30) {
        this.addStaticObstacle({ name: "pot_plant" });
      }
    }, 11000);

    this.goblinSpawnInterval = setInterval(() => {
      // Every 10 score, add a goblin
      const limit = Math.floor(this.score / 10);

      if (this.goblins.length < limit) {
        this.addGoblin();
      }
    }, 10000);
  }

  movePlayer() {
    const player = this.currentPlayer as Coordinates;
    const currentDirection = this.direction ?? "up";

    const direction = this.direction;

    if (direction === currentDirection) return;

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

    (this.currentPlayer?.body as Phaser.Physics.Arcade.Body).setVelocity(
      xVelocity,
      yVelocity
    );

    this.pivots = [
      {
        // TODO get grid spot?
        x: Math.floor(player.x / 16),
        y: this.currentPlayer?.y ?? 0,
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

      // Define the target position
      const {
        x: targetX,
        y: targetY,
        direction,
      } = this.getPositionInConga(index);

      follower.setDirection(direction);

      // Define the speed of movement (adjust as needed)
      const speed = 0.2; // You can adjust this value based on the desired smoothness

      // If follower is already at target position, no need for interpolation
      if (follower.x === targetX && follower.y === targetY) {
        return;
      }

      // Perform linear interpolation
      follower.x = Phaser.Math.Interpolation.Linear(
        [follower.x, targetX],
        speed
      );
      follower.y = Phaser.Math.Interpolation.Linear(
        [follower.y, targetY],
        speed
      );
    });
  }

  moveGoblins() {
    this.goblins.forEach((goblin) => {
      if (goblin.moveTo) {
        const { x, y } = goblin.moveTo;

        const mapX = x * SQUARE_WIDTH + SQUARE_WIDTH / 2;
        const mapY = y * SQUARE_WIDTH + SQUARE_WIDTH / 2;

        this.physics.moveTo(goblin.container, mapX, mapY, this.walkingSpeed);

        if (
          Phaser.Math.Distance.BetweenPoints(goblin.container, {
            x: mapX,
            y: mapY,
          }) < 1
        ) {
          goblin.moveTo = undefined;
          (goblin.container.body as Phaser.Physics.Arcade.Body).setVelocity(
            0,
            0
          );
          goblin.container.idle();
          // Reached it!
        }
      }
    });
  }

  update() {
    this.debug();

    if (this.isDead) return;

    console.log("RENDER");

    this.updateDirection();
    // this.movePlayer();
    this.updateFollowingChickens();
    this.moveGoblins();

    this.currentPlayer?.setDepth(1000000000);
  }

  debug() {
    // Draw the pivots
    // this.pivots.forEach((pivot) => {
    //   this.add.circle(pivot.x, pivot.y, 2, 0xff0000);
    // });
    // Clear points
  }
}
