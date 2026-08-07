/* npc.js — NPC system: pedestrians + cars + viewport culling */
class NPCManager{
  constructor(scene){this.scene=scene;this.npcs=[]}
  addNPC(config){
    let npc;if(config.type==='car')npc=new CarNPC(this.scene,config);else npc=new PedestrianNPC(this.scene,config);
    this.npcs.push(npc);return npc;
  }
  update(delta){
    const cam=this.scene.cameras.main;
    this.npcs.forEach(n=>{
      const inView=this.isInView(n,cam);n.setVisible(inView);if(inView)n.update(delta);
    });
  }
  isInView(npc,cam){
    const b=cam.worldView,m=80;
    return npc.sprite.x>b.x-m&&npc.sprite.x<b.x+b.width+m&&npc.sprite.y>b.y-m&&npc.sprite.y<b.y+b.height+m;
  }
}
class PedestrianNPC{
  constructor(scene,config){
    this.scene=scene;this.speed=config.speed||30;this.color=config.color||0xff6600;
    this.path=config.path||[];this.pi=0;this.dir=1;
    this.sprite=this.createSprite(config.x,config.y);
    if(this.path.length>0)this.moveNext();
  }
  createSprite(x,y){
    const g=this.scene.add.graphics();g.fillStyle(this.color,1);
    g.fillRect(-4,-6,8,12);g.fillStyle(0x000000,1);g.fillRect(-2,-8,4,4);g.setPosition(x,y);return g;
  }
  moveNext(){
    if(this.path.length===0)return;const t=this.path[this.pi];
    const d=Phaser.Math.Distance.Between(this.sprite.x,this.sprite.y,t.x,t.y);
    this.scene.tweens.add({targets:this.sprite,x:t.x,y:t.y,duration:(d/this.speed)*1000,ease:'Linear',
      onComplete:()=>{this.pi+=this.dir;if(this.pi>=this.path.length){this.pi=this.path.length-2;this.dir=-1}if(this.pi<0){this.pi=1;this.dir=1}this.moveNext()}});
  }
  update(delta){}setVisible(v){this.sprite.setVisible(v)}
}
class CarNPC{
  constructor(scene,config){
    this.scene=scene;this.speed=config.speed||60;this.color=config.color||0xff0000;
    this.path=config.path||[];this.pi=0;this.dir=1;
    this.sprite=this.createSprite(config.x,config.y);
    if(this.path.length>0)this.moveNext();
  }
  createSprite(x,y){
    const g=this.scene.add.graphics();g.fillStyle(this.color,1);g.fillRect(-10,-5,20,10);
    g.fillStyle(0x333333,1);g.fillRect(-7,-7,8,5);
    g.fillStyle(0x000000,1);g.fillRect(-8,-6,3,2);g.fillRect(5,-6,3,2);g.fillRect(-8,4,3,2);g.fillRect(5,4,3,2);
    g.setPosition(x,y);return g;
  }
  moveNext(){
    if(this.path.length===0)return;const t=this.path[this.pi];
    const d=Phaser.Math.Distance.Between(this.sprite.x,this.sprite.y,t.x,t.y);
    this.scene.tweens.add({targets:this.sprite,x:t.x,y:t.y,duration:(d/this.speed)*1000,ease:'Linear',
      onComplete:()=>{this.pi+=this.dir;if(this.pi>=this.path.length){this.pi=this.path.length-2;this.dir=-1}if(this.pi<0){this.pi=1;this.dir=1}this.moveNext()}});
  }
  update(delta){}setVisible(v){this.sprite.setVisible(v)}
}
window.NPCManager=NPCManager;
