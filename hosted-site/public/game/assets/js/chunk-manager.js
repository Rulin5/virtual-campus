/* chunk-manager.js — Map chunk loading system
 * Splits large map into smaller chunks, only loads what's visible.
 * Based on reverse-engineered original: 5×5 grid, 28×28 tiles per chunk.
 */
class ChunkManager{
  constructor(scene,mapData,mapInfo,chunkSize,visibleRange){
    this.scene=scene;this.mapData=mapData;this.mapInfo=mapInfo;
    this.chunkSize=chunkSize||28;this.visibleRange=visibleRange||2;
    this.chunksX=Math.ceil(mapInfo.width/this.chunkSize);
    this.chunksY=Math.ceil(mapInfo.height/this.chunkSize);
    this.activeChunks=new Map();this.lastCol=-1;this.lastRow=-1;
    this.preprocessChunks();
    console.log('ChunkManager:',this.chunksX+'x'+this.chunksY,'chunks,','size='+this.chunkSize);
  }
  preprocessChunks(){
    this.cache={};
    const maxLayers=Math.min(8,this.mapData.layers.length);
    for(let li=0;li<maxLayers;li++){
      const layer=this.mapData.layers[li];if(layer.type!=='tilelayer'||!layer.data)continue;
      this.cache[li]={};
      for(let cc=0;cc<this.chunksX;cc++)for(let cr=0;cr<this.chunksY;cr++){
        const tiles=[],key=cc+','+cr;
        for(let r=cr*this.chunkSize;r<Math.min((cr+1)*this.chunkSize,this.mapInfo.height);r++)
          for(let c=cc*this.chunkSize;c<Math.min((cc+1)*this.chunkSize,this.mapInfo.width);c++){
            const tid=layer.data[r*this.mapInfo.width+c];
            if(tid!==0)tiles.push({col:c,row:r,tileId:tid});
          }
        if(tiles.length>0)this.cache[li][key]=tiles;
      }
    }
  }
  getColor(tid){
    if(tid===0)return null;if(tid<300)return 0x3cb043;if(tid<1000)return 0x228B22;
    if(tid<2000)return 0x8b8682;if(tid<3000)return 0x696969;
    if(tid<5000)return 0x4a90d9;if(tid<8000)return 0x8b7355;
    if(tid<15000)return 0x2d5a27;if(tid<30000)return 0xebd49c;
    if(tid<50000)return 0x666666;return 0x444444;
  }
  update(px,py){
    const cc=Math.floor(px/(this.chunkSize*this.mapInfo.tileWidth));
    const cr=Math.floor(py/(this.chunkSize*this.mapInfo.tileHeight));
    if(cc===this.lastCol&&cr===this.lastRow)return;
    this.lastCol=cc;this.lastRow=cr;
    const minC=Math.max(0,cc-this.visibleRange),maxC=Math.min(this.chunksX-1,cc+this.visibleRange);
    const minR=Math.max(0,cr-this.visibleRange),maxR=Math.min(this.chunksY-1,cr+this.visibleRange);
    const visible=new Set();
    for(let c=minC;c<=maxC;c++)for(let r=minR;r<=maxR;r++)visible.add(c+','+r);
    for(const[k,chunk]of this.activeChunks){if(!visible.has(k)){chunk.graphics.destroy();this.activeChunks.delete(k)}}
    for(const k of visible){if(!this.activeChunks.has(k))this.loadChunk(k)}
  }
  loadChunk(key){
    const[cc,cr]=key.split(',').map(Number);
    const tw=this.mapInfo.tileWidth,th=this.mapInfo.tileHeight;
    const x=cc*this.chunkSize*tw,y=cr*this.chunkSize*th;
    const g=this.scene.add.graphics();g.setPosition(x,y);
    const maxLayers=Math.min(8,this.mapData.layers.length);
    for(let li=0;li<maxLayers;li++){
      const tiles=this.cache[li]?.[key];if(!tiles)continue;
      for(const t of tiles){
        const lx=(t.col-cc*this.chunkSize)*tw,ly=(t.row-cr*this.chunkSize)*th;
        const color=this.getColor(t.tileId);if(color===null)continue;
        g.fillStyle(color,1);g.fillRect(lx,ly,tw,th);
      }
    }
    this.activeChunks.set(key,{graphics:g,col:cc,row:cr});
  }
  destroy(){for(const[,c]of this.activeChunks)c.graphics.destroy();this.activeChunks.clear()}
}
window.ChunkManager=ChunkManager;
