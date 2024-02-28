import { Coordinates } from "features/game/expansion/components/MapPlacement";

export class ChickenContainer extends Phaser.GameObjects.Container {
  public sprite: Phaser.GameObjects.Sprite | undefined;

  constructor({ scene, x, y }: { scene: Phaser.Scene; x: number; y: number }) {
    super(scene, x, y);
    this.scene = scene;

    console.log({ x, y });

    if (!this.scene.anims.exists("walking_down_chicken")) {
      this.scene.anims.create({
        key: "walking_down_chicken",
        frames: this.scene.anims.generateFrameNumbers(
          "walking_chicken" as string,
          {
            start: 0,
            end: 5,
          }
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
          }
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
          }
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
          }
        ),
        repeat: -1,
        frameRate: 10,
      });
    }

    this.sprite = scene.add.sprite(4, 4, "walking_chicken").setOrigin(0.5);
    this.sprite.anims.play("walking_left_chicken", true);

    // Add the sprite to the container
    this.add(this.sprite);

    // Add the container to the scene
    this.scene.add.existing(this);
  }

  public faceLeft() {
    this.sprite?.anims.play("walking_left_chicken", true);
  }

  public faceRight() {
    this.sprite?.anims.play("walking_right_chicken", true);
  }

  public faceUp() {
    this.sprite?.anims.play("walking_up_chicken", true);
  }

  public faceDown() {
    this.sprite?.anims.play("walking_down_chicken", true);
  }
}
