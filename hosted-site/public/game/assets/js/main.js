/* main.js */
(function(){
  console.log('Starting...');

  // Show Play button after short delay (simulating load)
  setTimeout(()=>{
    try{
      var bar=document.getElementById('progress-bar');
      var txt=document.getElementById('progress-text');
      if(bar)bar.style.width='100%';
      if(txt)txt.textContent='100%';
    }catch(e){console.error(e)}

    setTimeout(()=>{
      try{
        var ps=document.getElementById('preloader-screen');
        var pb=document.getElementById('play-box');
        var il=document.getElementById('init-load');
        if(ps)ps.style.display='none';
        if(pb)pb.style.display='flex';
        if(il)il.style.display='none';
      }catch(e){console.error(e)}
    },500);
  },1500);

  // Animate progress
  (function animProgress(){
    var bar=document.getElementById('progress-bar');
    var txt=document.getElementById('progress-text');
    var p=parseInt(txt?txt.textContent:'0')||0;
    if(p<95){
      p+=Math.floor(Math.random()*5)+1;
      if(p>95)p=95;
      if(bar)bar.style.width=p+'%';
      if(txt)txt.textContent=p+'%';
      setTimeout(animProgress,100+Math.random()*200);
    }
  })();

  // Init game on Play click
  function initGame(){
    var pb=document.getElementById('play-box');
    var mc=document.getElementById('main-content');
    if(pb)pb.style.display='none';
    if(mc)mc.style.display='block';

    window.isModalOpen=false;
    window.modalManager=new ModalManager();
    document.querySelectorAll('[data-modal]').forEach(function(button){
      button.addEventListener('click',function(){
        window.modalManager.open(button.dataset.modal);
      });
    });

    var vw=window.visualViewport?window.visualViewport.width:window.innerWidth;
    var vh=window.visualViewport?window.visualViewport.height:window.innerHeight;
    var sf=2;
    var rw=Math.floor(vw/sf);
    var rh=Math.floor(vh/sf);

    if(typeof Phaser==='undefined'){
      alert('Phaser not loaded');
      return;
    }

    var game=new Phaser.Game({
      type:Phaser.AUTO,width:rw,height:rh,parent:'game-div',
      scale:{mode:Phaser.Scale.NONE,autoCenter:Phaser.Scale.NO_CENTER},
      render:{pixelArt:true,antialias:false,roundPixels:true},
      physics:{default:'arcade',arcade:{gravity:{y:0}}},
      backgroundColor:'#206020',
      scene:[GameScene]
    });

    game.events.once('poststep',function(){
      game.canvas.style.width=vw+'px';
      game.canvas.style.height=vh+'px';
      game.canvas.style.position='fixed';
      game.canvas.style.left='0';
      game.canvas.style.top='0';
      game.canvas.style.imageRendering='pixelated';
    });

    var rt;
    window.addEventListener('resize',function(){
      clearTimeout(rt);
      rt=setTimeout(function(){
        var w=window.visualViewport?window.visualViewport.width:window.innerWidth;
        var h=window.visualViewport?window.visualViewport.height:window.innerHeight;
        var s2=2;
        game.scale.resize(Math.floor(w/s2),Math.floor(h/s2));
        game.canvas.style.width=w+'px';
        game.canvas.style.height=h+'px';
      },200);
    });

    window.game=game;
    console.log('Game started '+rw+'x'+rh);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){
      var btn=document.getElementById('btn-play');
      if(btn)btn.addEventListener('click',initGame);
    });
  }else{
    var btn=document.getElementById('btn-play');
    if(btn)btn.addEventListener('click',initGame);
  }
})();
