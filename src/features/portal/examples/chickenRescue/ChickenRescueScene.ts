import mapJson from "assets/map/chicken_rescue.json";
import { SceneId } from "features/world/mmoMachine";
import { BaseScene } from "features/world/scenes/BaseScene";
import { ChickenContainer } from "./ChickenContainer";
import { Coordinates } from "features/game/expansion/components/MapPlacement";

type Pivot = {
  coordinates: Coordinates;
  velocity: Coordinates;
};
export class ChickenRescueScene extends BaseScene {
  sceneId: SceneId = "chicken_rescue";

  direction: number | undefined;

  following: {
    container: ChickenContainer;
    pivots: Pivot[];
  }[] = [];

  constructor() {
    super({
      name: "chicken_rescue",
      map: { json: mapJson },
      audio: { fx: { walk_key: "dirt_footstep" } },
    });
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

    const spawn = {
      x: this.currentPlayer?.x ?? 0,
      y: this.currentPlayer?.y ?? 0,
    };

    this.addSleepingChicken({
      x: spawn.x,
      y: spawn.y - 50,
    });

    this.addSleepingChicken({
      x: spawn.x + 50,
      y: spawn.y - 100,
    });

    this.addSleepingChicken({
      x: spawn.x + 80,
      y: spawn.y - 120,
    });
  }

  addSleepingChicken(coordinates: Coordinates) {
    const chicken = this.add.sprite(
      coordinates.x,
      coordinates.y,
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

    // Set chicken bounds
    chicken.body?.setSize(32, 32);

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

  getChickenPhysics() {
    let following: Phaser.Physics.Arcade.Body;
    let pivots: Pivot[] = [];

    if (this.following.length > 0) {
      following = this.following[this.following.length - 1].container
        .body as Phaser.Physics.Arcade.Body;
      pivots = this.following[this.following.length - 1].pivots;
    } else {
      following = this.currentPlayer?.body as Phaser.Physics.Arcade.Body;
    }

    const spawn = {
      x: following.x,
      y: following.y,
    };

    if (following.velocity.x >= 1) {
      spawn.x -= 16;
    }

    if (following.velocity.x <= -1) {
      spawn.x += 16;
    }

    if (following.velocity.y >= 1) {
      spawn.y -= 16;
    }

    if (following.velocity.y <= -1) {
      spawn.y += 16;
    }

    return {
      spawn,
      velocity: following.velocity,
      pivots,
    };
  }

  onAddFollower() {
    const { spawn, velocity, pivots } = this.getChickenPhysics();

    const chicken = new ChickenContainer({
      scene: this,
      x: spawn.x,
      y: spawn.y,
    });

    this.physics.world.enable(chicken);

    const chickenBody = chicken.body as Phaser.Physics.Arcade.Body;

    chickenBody.setOffset(0, 0).setSize(16, 16).setCollideWorldBounds(true);

    chickenBody.setVelocity(velocity.x, velocity.y);

    // Set direction
    if (velocity.x > 1) {
      chicken.faceRight();
    }

    if (velocity.x < -1) {
      chicken.faceLeft();
    }

    if (velocity.y > 1) {
      chicken.faceDown();
    }

    if (velocity.y < -1) {
      chicken.faceUp();
    }

    this.following.push({
      container: chicken,
      pivots,
    });
  }

  updateDirection() {
    const previous = this.direction;
    let newDirection: number | undefined = undefined;

    // joystick is active if force is greater than zero
    newDirection = this.joystick?.force ? this.joystick?.angle : undefined;

    // use keyboard control if joystick is not active
    if (newDirection === undefined) {
      if (document.activeElement?.tagName === "INPUT") return;

      const left =
        (this.cursorKeys?.left.isDown || this.cursorKeys?.a?.isDown) ?? false;
      const right =
        (this.cursorKeys?.right.isDown || this.cursorKeys?.d?.isDown) ?? false;
      const up =
        (this.cursorKeys?.up.isDown || this.cursorKeys?.w?.isDown) ?? false;
      const down =
        (this.cursorKeys?.down.isDown || this.cursorKeys?.s?.isDown) ?? false;

      newDirection = this.keysToAngle(left, right, up, down);
    }

    // Cannot go backwards
    const isOppositeDirection = (previous?: number, current?: number) => {
      return Math.abs(current! - previous!) === 180;
    };

    if (newDirection === undefined || previous === newDirection) {
      return;
    }

    if (isOppositeDirection(previous, newDirection)) {
      return;
    }

    this.currentPlayer?.walk();

    if (newDirection === 0) {
      this.currentPlayer?.faceRight();
    }

    if (newDirection === 180) {
      this.currentPlayer?.faceLeft();
    }

    this.currentPlayer?.body?.setVelocity(
      this.walkingSpeed * Math.cos((newDirection * Math.PI) / 180),
      this.walkingSpeed * Math.sin((newDirection * Math.PI) / 180)
    );

    const pivotCordinates = {
      x: this.currentPlayer?.x ?? 0,
      y: this.currentPlayer?.y ?? 0,
    };

    // Add the new pivot to each chicken
    this.following = this.following.map((follower) => ({
      ...follower,
      pivots: follower.pivots.concat({
        coordinates: pivotCordinates,
        velocity: {
          x: this.currentPlayer?.body?.velocity.x ?? 0,
          y: this.currentPlayer?.body?.velocity.y ?? 0,
        },
      }),
    }));

    this.direction = newDirection;
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

  updateFollowingChickens() {
    if (!this.currentPlayer?.body) {
      return;
    }

    this.following.forEach((follower, index) => {
      let nextPivot = follower.pivots[0]?.coordinates;

      let following = this.currentPlayer?.body as Phaser.Physics.Arcade.Body;
      if (index > 0) {
        following = this.following[index - 1].container
          .body as Phaser.Physics.Arcade.Body;
      }

      if (!nextPivot) {
        this.physics.moveTo(
          follower.container,
          following.x,
          following.y,
          this.walkingSpeed
        );

        return;
      }

      this.physics.moveTo(
        follower.container,
        nextPivot.x,
        nextPivot.y,
        this.walkingSpeed
      );

      const distance = Phaser.Math.Distance.BetweenPoints(
        follower.container.body as Coordinates,
        nextPivot
      );

      const hasReachedDestination = distance <= 1;

      if (hasReachedDestination) {
        // Set direction
        // if (newPosition.x > followerBody.x) {
        //   follower.container.faceRight();
        // }

        // if (newPosition.x < followerBody.x) {
        //   follower.container.faceLeft();
        // }

        // if (newPosition.y > followerBody.y) {
        //   follower.container.faceDown();
        // }

        // if (newPosition.y < followerBody.y) {
        //   follower.container.faceUp();
        // }

        // Remove pivot
        follower.pivots.shift();
      }
    });
  }

  update() {
    this.updateDirection();

    this.updateFollowingChickens();
  }
}
