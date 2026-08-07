/* virtual-joystick.js — Touch joystick for mobile */
class VirtualJoystick{
  constructor(scene,options={}){
    this.scene=scene;this.x=options.x||100;this.y=options.y||150;
    this.radius=options.radius||60;this.innerRadius=options.innerRadius||25;
    this.visible=false;this.direction={x:0,y:0};
    if(!this.scene.sys.game.device.input.touch){this.enabled=false;return}
    this.enabled=true;this.setupJoystick();
  }
  setupJoystick(){
    this.outer=this.scene.add.graphics().setScrollFactor(0).setDepth(1000).setAlpha(0.4);
    this.inner=this.scene.add.graphics().setScrollFactor(0).setDepth(1001).setAlpha(0.6);
    this.updatePosition();
    this.scene.scale.on('resize',()=>this.updatePosition());
    this.scene.input.on('pointerdown',p=>{if(p.x<this.scene.cameras.main.width/2){this.visible=true;this.startX=p.x;this.startY=p.y;this.updateJoystick(p)}});
    this.scene.input.on('pointermove',p=>{if(this.visible)this.updateJoystick(p)});
    this.scene.input.on('pointerup',()=>{this.visible=false;this.direction.x=0;this.direction.y=0;this.draw()});
    this.draw();
  }
  updatePosition(){const cam=this.scene.cameras.main;this.baseX=this.x;this.baseY=cam.height-this.y}
  updateJoystick(p){
    const dx=p.x-this.startX,dy=p.y-this.startY,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist>this.radius){this.direction.x=dx/dist;this.direction.y=dy/dist}
    else if(dist>10){this.direction.x=dx/this.radius;this.direction.y=dy/this.radius}
    else{this.direction.x=0;this.direction.y=0}
    this.draw();
  }
  draw(){
    this.outer.clear();this.inner.clear();
    this.outer.fillStyle(0xffffff,1);this.outer.lineStyle(3,0xffffff,0.5);this.outer.strokeCircle(this.baseX,this.baseY,this.radius);
    const ix=this.baseX+this.direction.x*(this.radius-this.innerRadius),iy=this.baseY+this.direction.y*(this.radius-this.innerRadius);
    this.inner.fillStyle(0xff0000,1);this.inner.fillCircle(ix,iy,this.innerRadius);
  }
  getDirection(){if(!this.enabled||!this.visible)return{x:0,y:0};return this.direction}
}
window.VirtualJoystick=VirtualJoystick;
