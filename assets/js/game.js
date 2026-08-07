/* game.js — Offline Phaser 3 reconstruction */
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('portfolio-map', 'assets/maps/portfolio-map.webp');
    this.load.spritesheet('player', 'assets/sprites/player.webp', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('npc-man', 'assets/sprites/npc-man.webp', {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.spritesheet('npc-woman', 'assets/sprites/npc-woman.webp', {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  create() {
    const worldWidth = 2240;
    const worldHeight = 2240;
    this.add.image(0, 0, 'portfolio-map').setOrigin(0).setDepth(0);

    this.createAnimations();
    this.playerSprite = this.physics.add.sprite(1490, 1100, 'player', 48)
      .setDepth(100)
      .setScale(1.3)
      .setCollideWorldBounds(true)
      .setSize(18, 24)
      .setOffset(15, 20);

    this.createNPC(1010, 1020, 'npc-man', 48, 1020, 1190);
    this.createNPC(1210, 980, 'npc-woman', 48, 1210, 1380);
    this.createNPC(780, 1160, 'npc-woman', 16, 780, 900);
    this.createNPC(1460, 1260, 'npc-man', 16, 1460, 1610);

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.playerSprite, true, 0.09, 0.09);
    this.cameras.main.setZoom(1);
    this.cameras.main.roundPixels = true;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey('W'),
      down: this.input.keyboard.addKey('S'),
      left: this.input.keyboard.addKey('A'),
      right: this.input.keyboard.addKey('D'),
    };
    this.interactKey = this.input.keyboard.addKey('E');

    this.interactionZones = [
      { x: 1130, y: 905, radius: 64, modalId: 'about', label: 'About me' },
      { x: 1260, y: 905, radius: 64, modalId: 'cv', label: 'Curriculum vitae' },
      { x: 1390, y: 905, radius: 64, modalId: 'projects', label: 'Projects' },
      { x: 1520, y: 905, radius: 64, modalId: 'tech', label: 'Technologies' },
      { x: 1660, y: 905, radius: 64, modalId: 'underhood', label: 'Under the hood' },
      { x: 1790, y: 905, radius: 64, modalId: 'contact', label: 'Contact' },
      { x: 1020, y: 1580, radius: 72, modalId: 'bigmap', label: 'Map' },
    ];

    this.currentZone = null;
    this.zoneHint = this.add.text(0, 0, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#111',
      backgroundColor: '#fff',
      padding: { x: 10, y: 7 },
      stroke: '#fff',
      strokeThickness: 1,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setVisible(false);

    window.virtualJoystick = new VirtualJoystick(this, { x: 90, y: 110 });
    window.dispatchEvent(new CustomEvent('portfolio-game-ready'));
  }

  createAnimations() {
    const animations = [
      ['walk-right', 0, 7],
      ['walk-left', 8, 15],
      ['walk-up', 16, 23],
      ['walk-down', 24, 31],
    ];
    animations.forEach(([key, start, end]) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers('player', { start, end }),
          frameRate: 10,
          repeat: -1,
        });
      }
    });
  }

  createNPC(x, y, texture, frame, minX, maxX) {
    const npc = this.add.sprite(x, y, texture, frame).setDepth(90).setScale(1.15);
    this.tweens.add({
      targets: npc,
      x: maxX,
      duration: Math.max(2500, (maxX - minX) * 28),
      yoyo: true,
      repeat: -1,
      ease: 'Linear',
      onYoyo: () => npc.setFlipX(true),
      onRepeat: () => npc.setFlipX(false),
    });
  }

  update() {
    const speed = 105;
    let vx = 0;
    let vy = 0;

    if (!window.isModalOpen) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;
      if (window.virtualJoystick?.enabled) {
        const joystick = window.virtualJoystick.getDirection();
        if (joystick.x || joystick.y) {
          vx = joystick.x;
          vy = joystick.y;
        }
      }
    }

    if (vx && vy) {
      vx *= 0.707;
      vy *= 0.707;
    }
    this.playerSprite.setVelocity(vx * speed, vy * speed);

    if (vx < 0) this.playerSprite.anims.play('walk-left', true);
    else if (vx > 0) this.playerSprite.anims.play('walk-right', true);
    else if (vy < 0) this.playerSprite.anims.play('walk-up', true);
    else if (vy > 0) this.playerSprite.anims.play('walk-down', true);
    else this.playerSprite.anims.stop();

    const zone = this.interactionZones.find((item) =>
      Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, item.x, item.y) < item.radius
    ) || null;
    if (zone !== this.currentZone) {
      this.currentZone = zone;
      this.zoneHint.setVisible(Boolean(zone));
      if (zone) {
        this.zoneHint
          .setText(`E  ${zone.label}`)
          .setPosition(this.cameras.main.width / 2, this.cameras.main.height - 28);
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && zone) {
      window.modalManager?.open(zone.modalId);
    }
  }
}

window.GameScene = GameScene;
