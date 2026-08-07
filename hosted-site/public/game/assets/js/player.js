/* player.js — Player character with keyboard + touch input */
class Player{
  constructor(scene,x,y){
    this.scene=scene;this.speed=100;this.direction='down';
    this.sprite=this.createSprite(x,y);
    this.setupInput();
    console.log('✅ Player at',x,y);
  }
  createSprite(x,y){
    const g=this.scene.add.graphics();
    g.fillStyle(0xffcc99,1);g.fillRect(-8,-6,16,14);
    g.fillStyle(0x333333,1);g.fillRect(-6,-8,12,4);
    g.fillStyle(0xffffff,1);g.fillRect(-4,-2,3,2);g.fillRect(1,-2,3,2);
    g.fillStyle(0x000000,1);g.fillRect(-3,-1,2,1);g.fillRect(2,-1,2,1);
    g.fillStyle(0x3366cc,1);g.fillRect(-6,4,12,6);
    const c=this.scene.add.container(x,y);c.add(g);
    this.scene.physics.world.enable(c);c.body.setSize(16,14);c.body.setOffset(-8,-7);
    c.body.setCollideWorldBounds(true);
    return c;
  }
  setupInput(){
    this.cursors=this.scene.input.keyboard.createCursorKeys();
    this.wasd={up:this.scene.input.keyboard.addKey('W'),down:this.scene.input.keyboard.addKey('S'),left:this.scene.input.keyboard.addKey('A'),right:this.scene.input.keyboard.addKey('D')};
  }
  update(delta){
    if(window.isModalOpen){this.sprite.body.setVelocity(0,0);return}
    let vx=0,vy=0;
    if(this.cursors.left.isDown||this.wasd.left.isDown)vx=-1;
    if(this.cursors.right.isDown||this.wasd.right.isDown)vx=1;
    if(this.cursors.up.isDown||this.wasd.up.isDown)vy=-1;
    if(this.cursors.down.isDown||this.wasd.down.isDown)vy=1;
    if(window.virtualJoystick&&window.virtualJoystick.enabled){const j=window.virtualJoystick.getDirection();if(j.x!==0||j.y!==0){vx=j.x;vy=j.y}}
    if(vx!==0&&vy!==0){vx*=0.707;vy*=0.707}
    this.sprite.body.setVelocity(vx*this.speed,vy*this.speed);
    if(vy<0)this.direction='up';if(vy>0)this.direction='down';if(vx<0)this.direction='left';if(vx>0)this.direction='right';
  }
  getPosition(){return{x:this.sprite.x,y:this.sprite.y}}
}
window.Player=Player;
