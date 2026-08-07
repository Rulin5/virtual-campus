/* modal-manager.js — Modal window management */
class ModalManager{
  constructor(){
    this.modals={tech:document.getElementById('modal-tech'),about:document.getElementById('modal-about'),cv:document.getElementById('modal-cv'),projects:document.getElementById('modal-projects'),contact:document.getElementById('modal-contact'),bigmap:document.getElementById('modal-bigmap'),underhood:document.getElementById('modal-underhood')};
    this.activeModalId=null;
    this.backdrop=document.getElementById('modal-backdrop');
    this.bindEvents();
    console.log('✅ ModalManager ready');
  }
  bindEvents(){
    document.querySelectorAll('.close-btn').forEach(b=>b.addEventListener('click',()=>this.close()));
    this.backdrop.addEventListener('click',()=>this.close());
    document.addEventListener('keydown',e=>{if(e.key==='Escape')this.close()});
    document.querySelectorAll('.scroll-up-btn').forEach(b=>b.addEventListener('click',()=>{const m=b.closest('.modal');if(m){const f=m.querySelector('.frame-wrp');if(f)f.scrollTo({top:0,behavior:'smooth'})}}));
    document.querySelectorAll('.under-hood-nav-item').forEach(b=>b.addEventListener('click',()=>{const tab=b.dataset.tab;document.querySelectorAll('.under-hood-nav-item').forEach(n=>n.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.under-hood-section').forEach(s=>s.hidden=s.dataset.tab!==tab)}));
    document.querySelectorAll('.cv-projects-toggle').forEach(b=>b.addEventListener('click',()=>{const l=b.parentElement.querySelector('.cv-projects-list');if(l){l.classList.toggle('open');b.querySelector('span').textContent=l.classList.contains('open')?'Hide projects':'Show projects'}}));
  }
  open(id){
    if(this.activeModalId)this.modals[this.activeModalId].classList.remove('active','is-visible');
    const m=this.modals[id];if(!m){console.error('Modal not found:',id);return}
    m.classList.add('active','is-visible');this.backdrop.classList.add('active','is-visible');this.activeModalId=id;
    window.isModalOpen=true;
    const f=m.querySelector('.frame-wrp');if(f)f.scrollTop=0;
  }
  close(){
    if(!this.activeModalId)return;
    this.modals[this.activeModalId].classList.remove('active','is-visible');
    this.backdrop.classList.remove('active','is-visible');this.activeModalId=null;
    window.isModalOpen=false;
  }
}
window.ModalManager=ModalManager;
