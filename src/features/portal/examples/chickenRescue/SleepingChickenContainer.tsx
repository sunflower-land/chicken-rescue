export class SleepingChickenContainer extends Phaser.GameObjects.Container {
  public sprite: Phaser.GameObjects.Sprite | undefined;

  private timeout: NodeJS.Timeout | undefined = undefined;

  constructor({
    scene,
    x,
    y,
    onDisappear,
  }: {
    scene: Phaser.Scene;
    x: number;
    y: number;
    onDisappear: () => void;
  }) {
    super(scene, x, y);
    this.scene = scene;

    this.sprite = scene.add.sprite(1.5, -2, "sleeping_chicken").setOrigin(0.5);

    if (!this.scene.anims.exists("sleeping_chicken_anim")) {
      this.scene.anims.create({
        key: "sleeping_chicken_anim",
        frames: this.scene.anims.generateFrameNumbers(
          "sleeping_chicken" as string,
          {
            start: 0,
            end: 1,
          },
        ),
        repeat: -1,
        frameRate: 2,
      });
    }

    this.sprite.anims.play("sleeping_chicken_anim", true);

    // Add the sprite to the container
    this.add(this.sprite);

    this.setSize(10, 10);

    // Add the container to the scene
    this.scene.add.existing(this);

    const max = 40;
    const min = 30;
    const timeoutSeconds = Math.random() * (max - min + 1) + min;
    this.timeout = setTimeout(() => {
      onDisappear();
      this.disappear();
    }, timeoutSeconds * 1000);
  }

  public destroy() {
    this.sprite?.destroy();

    super.destroy();

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }

  public destroyed = false;
  public async disappear() {
    // Create a tween that changes the alpha of the sprite
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0 }, // animate from full opacity to transparent
      duration: 500, // duration of each flash (in milliseconds)
      yoyo: true, // reverse the tween back to the original value
      repeat: -1, // repeat forever
    });

    await new Promise((res) => setTimeout(res, 5000));

    // Flashing effect
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const container = this;

    if (container.destroyed || !container.scene) {
      return;
    }

    this.destroyed = true;

    this.sprite?.destroy();

    const poof = this.scene.add.sprite(0, -4, "poof").setOrigin(0.5);
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
        container.destroy();
      }
    });

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }
}
