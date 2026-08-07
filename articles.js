/* ============================================================
   articles.js — Article Notebook
   Tabs: all, 待讀, 已讀
   ============================================================ */

const Articles = {
  filter: 'all',

  setFilter(f){
    this.filter = f;
    ['aTabAll','aTabTodo','aTabDone'].forEach(id=>document.getElementById(id).classList.remove('active'));
    document.getElementById(f==='all'?'aTabAll':f==='待讀'?'aTabTodo':'aTabDone').classList.add('active');
    this.render();
  },

  render(){
    const el = document.getElementById('articlesList');
    const list = State.articles.filter(a=>this.filter==='all'||a.status===this.filter);
    if(list.length===0){
      el.innerHTML = `<div class="empty"><span class="big">📰</span>還沒有筆記</div>`;
      return;
    }
    el.innerHTML = list.map(a=>`
      <div class="art-card">
        <div class="top">
          <h4>${esc(a.title)}</h4>
          <span class="pill" style="background:${a.status==='已讀'?'var(--c-daily-bg)':'var(--c-note-bg)'}; color:${a.status==='已讀'?'var(--c-daily)':'var(--c-note)'};">${a.status}</span>
        </div>
        ${a.summary? `<div class="sum">${esc(a.summary)}</div>`:''}
        <div class="meta">
          <span>🗓️ ${niceDate(a.date)}</span>
          ${a.tag?`<span class="pill" style="background:var(--paper-2);">${esc(a.tag)}</span>`:''}
          <span style="margin-left:auto; cursor:pointer;" onclick="Articles.toggleStatus('${a.id}')">${a.status==='待讀'?'標記已讀 ✓':'標記待讀 ↺'}</span>
        </div>
      </div>`).join('');
  },

  toggleStatus(id){
    const a=State.articles.find(x=>x.id===id);
    a.status = a.status==='待讀'?'已讀':'待讀';
    save('articles', State.articles); this.render();
  },

  openForm(){
    App.openSheet(`
      <div class="sheet-head"><h3>新增文章筆記</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div class="field"><label>標題</label><input id="rTitle" placeholder="文章 / 筆記標題"></div>
      <div class="row2">
        <div class="field"><label>日期</label><input id="rDate" type="date" value="${todayStr()}"></div>
        <div class="field"><label>標籤</label><input id="rTag" placeholder="例如：工作"></div>
      </div>
      <div class="field"><label>摘要 / 心得</label><textarea id="rSum" placeholder="重點整理…"></textarea></div>
      <div class="field"><label>狀態</label>
        <div class="tabs" style="margin-top:4px;">
          <button type="button" class="tab-btn active" data-s="待讀" onclick="Articles.setFormStatus(this,'待讀')">待讀</button>
          <button type="button" class="tab-btn" data-s="已讀" onclick="Articles.setFormStatus(this,'已讀')">已讀</button>
        </div>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:18px;" onclick="Articles.save()">儲存</button>
    `);
  },

  formStatus: '待讀',
  setFormStatus(el, s){
    this.formStatus = s;
    el.closest('.tabs').querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.s===s));
  },

  save(){
    const title = document.getElementById('rTitle').value.trim(); if(!title) return;
    State.articles.unshift({
      id:uid(), title,
      date:document.getElementById('rDate').value||todayStr(),
      tag:document.getElementById('rTag').value.trim(),
      summary:document.getElementById('rSum').value.trim(),
      status:this.formStatus
    });
    save('articles', State.articles); App.closeSheet(); this.render();
  }
};
