/* ============================================================
   app.js — Entry Point, Routing, Boot
   ============================================================ */

const App = {
  curView: 'home',

  init(){
    this.boot();
  },

  boot(){
    if(!State.user){
      document.getElementById('view-login').classList.add('active');
      Auth.init();
      return;
    }
    
    Auth.init();
    this.showShell();
  },

  showShell(){
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-login').style.display='none';
    document.getElementById('shell').style.display='block';
    document.documentElement.setAttribute('data-theme', State.theme==='default'?'':State.theme);
    initDefaultPockets();
    applyModuleColors();

    if(State.user.picture){
      document.getElementById('avatarImg').src = State.user.picture;
      document.getElementById('avatarImg').style.display='block';
      document.getElementById('avatarInitial').style.display='none';
    } else {
      document.getElementById('avatarBtn').textContent = State.user.initial;
    }

    this.go('home');
  },

  go(v){
    this.curView = v;
    document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
    document.getElementById('view-'+v).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(el=>el.classList.toggle('active', el.dataset.v===v));
    document.getElementById('fabBtn').style.display = ['home','settings','calendar'].includes(v) ? 'none' : 'flex';
    this.render();
    window.scrollTo(0,0);
  },

  renderNav(){
    const bar = document.getElementById('bottomNav'); bar.innerHTML='';
    State.order.forEach(k=>{
      const m = NAV_META[k]; if(!m) return;
      const b = document.createElement('button');
      b.className = 'nav-btn'+(this.curView===k?' active':'');
      b.dataset.v = k;
      b.innerHTML = `<span class="ic"><i class="${m.icon}"></i></span><span>${m.label}</span>`;
      b.onclick = ()=>this.go(k);
      bar.appendChild(b);
    });
  },

  render(){
    this.renderNav();
    if(this.curView==='home') Home.render();
    else if(this.curView==='calendar') Calendar.render();
    else if(this.curView==='daily') Daily.render();
    else if(this.curView==='money') Money.render();
    else if(this.curView==='items') Items.render();
    else if(this.curView==='articles') Articles.render();
    else if(this.curView==='settings') Settings.render();
  },

  onFab(){
    if(this.curView==='daily'){
      Daily.todayEntryId = null;
      Daily.draftBlocks={};
      Daily.selectedMood='😊';
      Daily.setTab('plan');
    }
    else if(this.curView==='money') Money.openMoneyForm();
    else if(this.curView==='items'){
      if(Items.tab==='items') Items.openItemForm();
      else if(Items.tab==='chores') Items.openChoreForm();
    }
    else if(this.curView==='articles') Articles.openForm();
    else if(this.curView==='calendar') document.getElementById('newTodoInput').focus();
  },

  /* ---- Sheet (Modal) ---- */
  openSheet(html){
    document.getElementById('sheet').innerHTML = html;
    document.getElementById('overlay').classList.add('active');
  },
  closeSheet(){
    document.getElementById('overlay').classList.remove('active');
  },

  /* ---- Data Management ---- */
  clearAllData(){
    if(!confirm('確定要清空所有資料嗎？此操作無法復原！')) return;
    if(!confirm('再次確認：真的要刪除所有資料嗎？')) return;
    Object.values(LS).forEach(k=>localStorage.removeItem(k));
    location.reload();
  }
};

/* ---- Boot on load ---- */
document.addEventListener('DOMContentLoaded', ()=>App.init());
