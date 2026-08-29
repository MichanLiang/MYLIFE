/* ============================================================
   app.js — Entry Point, Routing, Boot
   ============================================================ */

const App = {
  curView: 'home',

  init(){
    this.boot();
  },

  boot(){
    if(State.user){
      this.showShell();
    }
    Auth.init();
  },

  showLogin(){
    const loginHtml = `
      <div class="login-wrap">
        <div class="logo">MY LIFE</div>
        <div class="eyebrow" style="margin-top:8px;">Everything, one place</div>
        <div class="tag"></div>
        <button class="g-btn" onclick="Auth.login()">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3c-7.7 0-14.3 4.4-17.7 10.7z"/><path fill="#4CAF50" d="M24 45c5.3 0 10.2-2 13.9-5.4l-6.4-5.4C29.4 35.9 26.8 37 24 37c-5.3 0-9.8-3.4-11.4-8.1l-6.6 5.1C9.6 40.4 16.2 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3-3.1 5.4-5.8 6.9l6.4 5.4C39.4 37.5 43 31.4 43 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
          使用 Google 帳號登入
        </button>
      </div>
    `;
    const div = document.createElement('div');
    div.className = 'view active';
    div.id = 'view-login';
    div.innerHTML = loginHtml;
    document.getElementById('app').prepend(div);
  },

  showShell(){
    const loginEl = document.getElementById('view-login');
    if(loginEl) loginEl.remove();
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
    else if(this.curView==='articles'){
      Articles.renderTabs();
      Articles.render();
    }
    else if(this.curView==='settings') Settings.render();
  },

  onFab(){
    if(this.curView==='daily'){
      Daily.todayEntryId = null;
      Daily.draftBlocks={};
      Daily.selectedMood='happy';
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
