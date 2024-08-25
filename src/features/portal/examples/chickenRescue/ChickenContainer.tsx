import { Direction } from "./ChickenRescueScene";

export class ChickenContainer extends Phaser.GameObjects.Container {
  public sprite: Phaser.GameObjects.Sprite | undefined;

  constructor({ scene, x, y }: { scene: Phaser.Scene; x: number; y: number }) {
    super(scene, x, y);
    this.scene = scene;

    if (!this.scene.anims.exists("walking_down_chicken")) {
      this.scene.anims.create({
        key: "walking_down_chicken",
        frames: this.scene.anims.generateFrameNumbers(
          "walking_chicken" as string,
          {
            start: 0,
            end: 5,
          },
        ),
        repeat: -1,
        frameRate: 10,
      });
    }

    if (!this.scene.anims.exists("walking_left_chicken")) {
      this.scene.anims.create({
        key: "walking_left_chicken",
        frames: this.scene.anims.generateFrameNumbers(
          "walking_chicken" as string,
          {
            start: 6,
            end: 11,
          },
        ),
        repeat: -1,
        frameRate: 10,
      });
    }

    if (!this.scene.anims.exists("walking_up_chicken")) {
      this.scene.anims.create({
        key: "walking_up_chicken",
        frames: this.scene.anims.generateFrameNumbers(
          "walking_chicken" as string,
          {
            start: 12,
            end: 17,
          },
        ),
        repeat: -1,
        frameRate: 10,
      });
    }

    if (!this.scene.anims.exists("walking_right_chicken")) {
      this.scene.anims.create({
        key: "walking_right_chicken",
        frames: this.scene.anims.generateFrameNumbers(
          "walking_chicken" as string,
          {
            start: 18,
            end: 23,
          },
        ),
        repeat: -1,
        frameRate: 10,
      });
    }

    this.sprite = scene.add.sprite(0, 0, "walking_chicken").setOrigin(0.5);
    this.sprite.anims.play("walking_left_chicken", true);

    // Add the sprite to the container
    this.add(this.sprite);

    this.setSize(12, 12);

    // Add the container to the scene
    this.scene.add.existing(this);
  }

  public setDirection(direction: Direction) {
    if (!this.active) return;

    if (direction === "left") {
      this.sprite?.anims.play("walking_left_chicken", true);
    }

    if (direction === "right") {
      this.sprite?.anims.play("walking_right_chicken", true);
    }

    if (direction === "up") {
      this.sprite?.anims.play("walking_up_chicken", true);
    }

    if (direction === "down") {
      this.sprite?.anims.play("walking_down_chicken", true);
    }
  }

  public destroyed = false;
  public disappear() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const container = this;

    if (container.destroyed || !container.scene) {
      return;
    }

    this.destroyed = true;

    this.sprite?.destroy();

    const poof = this.scene.add.sprite(0, 4, "poof").setOrigin(0.5);
    this.add(poof);

    this.scene.anims.create({
      key: `poof_anim`,
      frames: this.scene.anims.generateFrameNumbers("poof", {
        start: 0,
        end: 8,
      }),
      repeat: 0,
      frameRate: 10,
    });

    poof.play(`poof_anim`, true);

    // Listen for the animation complete event
    poof.on("animationcomplete", function (animation: { key: string }) {
      if (animation.key === "poof_anim") {
        container?.destroy();
      }
    });
  }
}
