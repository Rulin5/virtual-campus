/* game.js — Phaser reconstruction with animated citizens, traffic and HUD map */
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.worldSize = 2240;
    this.lastPlayerDirection = 'down';
    this.playerIdleMs = 0;
    this.nextIdleActionAt = 2800;
  }

  preload() {
    this.load.image('portfolio-map', 'assets/maps/portfolio-map.webp');
    ['player', 'npc-man', 'npc-man2', 'npc-man3', 'npc-man4', 'npc-woman',
      'npc-woman2', 'npc-woman3', 'npc-woman4', 'npc-woman6', 'npc-woman7']
      .forEach((key) => this.load.spritesheet(key, `assets/sprites/${key}.webp`, {
        frameWidth: 48, frameHeight: 48,
      }));
    ['player-eating', 'player-scratching', 'player-sitting', 'player-tying-shoe']
      .forEach((key) => this.load.spritesheet(key, `assets/sprites/${key}.webp`, {
        frameWidth: 128, frameHeight: 128,
      }));
    ['car1', 'car2', 'car3', 'car6', 'car8', 'car10'].forEach((key) =>
      this.load.spritesheet(key, `assets/sprites/cars/${key}.webp`, {
        frameWidth: 84, frameHeight: 84,
      })
    );
  }

  create() {
    this.add.image(0, 0, 'portfolio-map').setOrigin(0).setDepth(0);
    this.createAnimations();

    this.playerSprite = this.physics.add.sprite(1490, 1100, 'player', 24)
      .setDepth(2000).setScale(.82).setCollideWorldBounds(true)
      .setSize(18, 24).setOffset(15, 20);
    this.createWorldCollisions();

    this.citizens = [];
    this.traffic = [];
    this.createPopulation();
    this.createTraffic();
    this.physics.add.collider(this.playerSprite, this.worldObstacles);

    this.physics.world.setBounds(0, 0, this.worldSize, this.worldSize);
    this.cameras.main.setBounds(0, 0, this.worldSize, this.worldSize);
    this.cameras.main.startFollow(this.playerSprite, true, 0.09, 0.09);
    this.cameras.main.roundPixels = true;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey('W'), down: this.input.keyboard.addKey('S'),
      left: this.input.keyboard.addKey('A'), right: this.input.keyboard.addKey('D'),
    };
    this.interactKey = this.input.keyboard.addKey('E');
    this.interactionZones = [
      { x: 1130, y: 905, radius: 64, modalId: 'about', label: 'About me' },
      { x: 1260, y: 905, radius: 64, modalId: 'cv', label: 'Curriculum vitae' },
      { x: 1390, y: 905, radius: 64, modalId: 'projects', label: 'Projects' },
      { x: 1520, y: 905, radius: 64, modalId: 'tech', label: 'Technologies' },
      { x: 1660, y: 905, radius: 64, modalId: 'underhood', label: 'Under the hood' },
      { x: 1790, y: 905, radius: 64, modalId: 'contact', label: 'Contact' },
    ];
    this.currentZone = null;
    this.zoneHint = this.add.text(0, 0, '', {
      fontFamily: '"Press Start 2P", monospace', fontSize: '7px',
      color: '#111', backgroundColor: '#fff', padding: { x: 10, y: 7 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5000).setVisible(false);

    window.virtualJoystick = new VirtualJoystick(this, { x: 90, y: 110 });
    window.dispatchEvent(new CustomEvent('portfolio-game-ready'));
  }

  createAnimations() {
    const textures = ['player', 'npc-man', 'npc-man2', 'npc-man3', 'npc-man4',
      'npc-woman', 'npc-woman2', 'npc-woman3', 'npc-woman4', 'npc-woman6', 'npc-woman7'];
    /* The source atlas uses eight directional rows:
       NE, E, W, N, SE, SW, S, NW. */
    const rows = {
      'up-right': [0, 7], right: [8, 15], left: [16, 23], up: [24, 31],
      'down-right': [32, 39], 'down-left': [40, 47], down: [48, 55], 'up-left': [56, 63],
    };
    textures.forEach((texture) => Object.entries(rows).forEach(([direction, range]) => {
      const key = `${texture}-walk-${direction}`;
      if (!this.anims.exists(key)) this.anims.create({
        key, frames: this.anims.generateFrameNumbers(texture, { start: range[0], end: range[1] }),
        frameRate: 10, repeat: -1,
      });
    }));
    [['player-scratching', 6], ['player-tying-shoe', 7], ['player-eating', 7]]
      .forEach(([texture, rate]) => {
        const key = `${texture}-idle`;
        if (!this.anims.exists(key)) this.anims.create({
          key, frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 15 }),
          frameRate: rate, repeat: 0, hideOnComplete: false,
        });
      });
  }

  createPopulation() {
    const configs = [
      ['npc-man', 930, 1015, [[930,1015],[1110,1015],[1110,1120],[930,1120]], 31],
      ['npc-woman', 1175, 980, [[1175,980],[1375,980],[1375,1050],[1175,1050]], 29],
      ['npc-woman2', 760, 1160, [[760,1160],[930,1160],[930,1260],[760,1260]], 27],
      ['npc-man2', 1430, 1250, [[1430,1250],[1600,1250],[1600,1370],[1430,1370]], 34],
      ['npc-woman3', 1670, 1060, [[1670,1060],[1830,1060],[1830,1190],[1670,1190]], 30],
      ['npc-man3', 1040, 1390, [[1040,1390],[1220,1390],[1220,1500],[1040,1500]], 26],
      ['npc-woman4', 1320, 1530, [[1320,1530],[1510,1530],[1510,1660],[1320,1660]], 32],
      ['npc-man4', 1740, 1450, [[1740,1450],[1880,1450],[1880,1580],[1740,1580]], 28],
      ['npc-woman6', 720, 1420, [[720,1420],[860,1420],[860,1570],[720,1570]], 35],
      ['npc-woman7', 1120, 1740, [[1120,1740],[1360,1740],[1360,1810],[1120,1810]], 27],
      ['npc-man', 1510, 770, [[1510,770],[1700,770],[1700,850],[1510,850]], 33],
      ['npc-woman2', 860, 830, [[860,830],[1030,830],[1030,910],[860,910]], 29],
      ['npc-man3', 1940, 1220, [[1940,1220],[2040,1220],[2040,1400],[1940,1400]], 31],
      ['npc-woman3', 620, 980, [[620,980],[700,980],[700,1140],[620,1140]], 28],
      ['npc-man2', 860, 285, [[860,285],[1010,285],[1010,320],[860,320]], 24],
      ['npc-woman4', 1040, 300, [[1040,300],[1190,300],[1190,325],[1040,325]], 23],
      ['npc-man4', 1220, 280, [[1220,280],[1330,280],[1330,320],[1220,320]], 25],
      ['npc-woman7', 1810, 300, [[1810,300],[2050,300],[2050,330],[1810,330]], 24],
    ];
    configs.forEach(([texture, x, y, path, speed], index) => {
      const sprite = this.add.sprite(x, y, texture, 24).setScale(.82).setDepth(1000 + y);
      this.citizens.push({ sprite, texture, path, target: 1, speed, pause: index % 3 ? 0 : 500 });
    });
  }

  createWorldCollisions() {
    this.worldObstacles = this.physics.add.staticGroup();
    const buildings = [
      [760,0,610,330],[0,395,470,355],[1635,395,605,480],
      [0,760,650,390],[1735,900,505,560],[745,1270,700,180],
      [45,1640,360,260],[1160,1650,300,250],[1740,1510,500,360],
    ];
    buildings.forEach(([x,y,w,h]) => {
      const zone = this.add.zone(x+w/2,y+h/2,w,h);
      this.physics.add.existing(zone,true);
      this.worldObstacles.add(zone);
    });
  }

  createTraffic() {
    /* Vehicles stay in marked lanes. They wrap outside the camera instead of
       cutting across pavements to turn around. */
    const configs = [
      ['car1', 1530, 1540, 'up', 76, 430, 2160],
      ['car3', 1530, 920, 'up', 70, 430, 2160],
      ['car6', 1590, 620, 'down', 74, 430, 2160],
      ['car10', 1590, 1720, 'down', 68, 430, 2160],
      ['car2', 720, 1530, 'right', 82, 40, 1460],
      ['car8', 1310, 1578, 'left', 78, 40, 1460],
    ];
    configs.forEach(([texture, x, y, direction, speed, min, max]) => {
      const frames = { down: 0, right: 2, up: 4, left: 6 };
      const sprite = this.add.sprite(x, y, texture, frames[direction]).setScale(.68).setDepth(900 + y);
      this.traffic.push({ sprite, direction, speed, min, max, frame: frames[direction] });
    });
  }

  moveRoute(entity, delta, isCar = false) {
    if (entity.pause > 0) { entity.pause -= delta; return; }
    const target = entity.path[entity.target];
    const dx = target[0] - entity.sprite.x, dy = target[1] - entity.sprite.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 2) {
      entity.sprite.setPosition(target[0], target[1]);
      entity.target = (entity.target + 1) % entity.path.length;
      if (!isCar && Math.random() < .25) entity.pause = 400 + Math.random() * 900;
      return;
    }
    const step = Math.min(distance, entity.speed * delta / 1000);
    const vx = dx / distance, vy = dy / distance;
    entity.sprite.x += vx * step; entity.sprite.y += vy * step;
    entity.sprite.setDepth((isCar ? 900 : 1000) + entity.sprite.y);
    if (isCar) {
      const horizontal = Math.abs(vx) >= Math.abs(vy);
      entity.sprite.setFrame(horizontal ? (vx > 0 ? 2 : 6) : (vy > 0 ? 4 : 0));
    } else {
      let direction;
      if (Math.abs(vx) > .35 && Math.abs(vy) > .35) {
        direction = `${vy > 0 ? 'down' : 'up'}-${vx > 0 ? 'right' : 'left'}`;
      } else {
        direction = Math.abs(vx) >= Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
      }
      entity.sprite.anims.play(`${entity.texture}-walk-${direction}`, true);
    }
  }

  moveTraffic(car, delta) {
    const px=this.playerSprite.x,py=this.playerSprite.y;
    const vertical=car.direction==='up'||car.direction==='down';
    const sameLane=vertical?Math.abs(px-car.sprite.x)<34:Math.abs(py-car.sprite.y)<34;
    const ahead=car.direction==='up'?py<car.sprite.y&&car.sprite.y-py<105:
      car.direction==='down'?py>car.sprite.y&&py-car.sprite.y<105:
      car.direction==='left'?px<car.sprite.x&&car.sprite.x-px<105:
      px>car.sprite.x&&px-car.sprite.x<105;
    if(sameLane&&ahead){car.sprite.setAlpha(.9);return}
    car.sprite.setAlpha(1);
    const amount = car.speed * delta / 1000;
    if (car.direction === 'up') {
      car.sprite.y -= amount;
      if(car.sprite.y<car.min){car.sprite.y=car.min;car.direction='down';car.frame=0}
    } else if (car.direction === 'down') {
      car.sprite.y += amount;
      if(car.sprite.y>car.max){car.sprite.y=car.max;car.direction='up';car.frame=4}
    } else if (car.direction === 'right') {
      car.sprite.x += amount;
      if(car.sprite.x>car.max){car.sprite.x=car.max;car.direction='left';car.frame=6}
    } else {
      car.sprite.x -= amount;
      if(car.sprite.x<car.min){car.sprite.x=car.min;car.direction='right';car.frame=2}
    }
    car.sprite.setFrame(car.frame).setDepth(900 + car.sprite.y);
  }

  updatePlayerAnimation(vx, vy, delta) {
    if (vx || vy) {
      this.playerIdleMs = 0;
      this.nextIdleActionAt = 2600 + Math.random() * 2600;
      if (Math.abs(vx) > .35 && Math.abs(vy) > .35) {
        this.lastPlayerDirection = `${vy > 0 ? 'down' : 'up'}-${vx > 0 ? 'right' : 'left'}`;
      } else {
        this.lastPlayerDirection = Math.abs(vx) >= Math.abs(vy)
          ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
      }
      this.playerSprite.anims.play(`player-walk-${this.lastPlayerDirection}`, true);
      return;
    }
    this.playerIdleMs += delta;
    if (this.playerSprite.anims.isPlaying && this.playerSprite.anims.currentAnim?.key.includes('walk')) {
      const standFrames = {
        'up-right': 0, right: 8, left: 16, up: 24,
        'down-right': 32, 'down-left': 40, down: 48, 'up-left': 56,
      };
      this.playerSprite.anims.stop();
      this.playerSprite.setFrame(standFrames[this.lastPlayerDirection]);
    }
    if (this.playerIdleMs > this.nextIdleActionAt && !this.playerSprite.anims.isPlaying) {
      const actions = ['player-scratching-idle', 'player-tying-shoe-idle', 'player-eating-idle'];
      this.playerSprite.anims.play(Phaser.Utils.Array.GetRandom(actions));
      this.playerSprite.once('animationcomplete', () => {
        this.playerIdleMs = 0;
        this.nextIdleActionAt = 3200 + Math.random() * 3500;
      });
    }
  }

  update(time, delta) {
    let vx = 0, vy = 0;
    if (!window.isModalOpen) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;
      if (window.virtualJoystick?.enabled) {
        const joystick = window.virtualJoystick.getDirection();
        if (joystick.x || joystick.y) { vx = joystick.x; vy = joystick.y; }
      }
    }
    if (vx && vy) { vx *= .707; vy *= .707; }
    this.playerSprite.setVelocity(vx * 105, vy * 105).setDepth(2000 + this.playerSprite.y);
    this.updatePlayerAnimation(vx, vy, delta);
    this.citizens.forEach((npc) => this.moveRoute(npc, delta));
    this.traffic.forEach((car) => this.moveTraffic(car, delta));

    const zone = this.interactionZones.find((item) =>
      Phaser.Math.Distance.Between(this.playerSprite.x, this.playerSprite.y, item.x, item.y) < item.radius
    ) || null;
    if (zone !== this.currentZone) {
      this.currentZone = zone; this.zoneHint.setVisible(Boolean(zone));
      if (zone) this.zoneHint.setText(`E  ${zone.label}`)
        .setPosition(this.cameras.main.width / 2, this.cameras.main.height - 28);
    }
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && zone) window.modalManager?.open(zone.modalId);

    const dot = document.getElementById('hud-map-player');
    if (dot) {
      dot.style.left = `${(this.playerSprite.x / this.worldSize) * 100}%`;
      dot.style.top = `${(this.playerSprite.y / this.worldSize) * 100}%`;
    }
  }
}
window.GameScene = GameScene;
