/* ============================================================
   articles.js — Article Notebook with Folders
   ============================================================ */

const Articles = {
  filter: null,

  init(){
    if(!this.filter) this.filter = State.articleFolders[0]?.id || 'default';
  },

  setFilter(f){
    this.filter = f;
    this.renderTabs();
    this.render();
  },

  renderTabs(){
    const tabs = document.getElementById('articleTabs');
    const folders = State.articleFolders;
    tabs.innerHTML = folders.map(f=>
      `<button class="tab-btn ${f.id===this.filter?'active':''}" onclick="Articles.setFilter('${f.id}')">${esc(f.name)}</button>`
    ).join('') + `<button class="tab-btn" onclick="Articles.addFolderInline()" style="font-size:16px; padding:0 10px;">＋</button>`;
  },

  render(){
    const el = document.getElementById('articlesList');
    const list = State.articles.filter(a=>a.folder===this.filter);
    if(list.length===0){
      el.innerHTML = `<div class="empty"><span class="big"><i class="ph ph-file-text"></i></span>還沒有筆記</div>`;
      return;
    }
    el.innerHTML = list.map(a=>{
      const folder = State.articleFolders.find(f=>f.id===a.folder);
      return `<div class="art-card">
        <div class="top">
          <h4>${esc(a.title)}</h4>
          ${folder?`<span class="pill" style="background:var(--c-note-bg); color:var(--c-note);">${esc(folder.name)}</span>`:''}
        </div>
        ${a.summary? `<div class="sum">${esc(a.summary)}</div>`:''}
        <div class="meta">
          <span><i class="ph ph-calendar"></i> ${niceDate(a.date)}</span>
          ${a.tag?`<span class="pill" style="background:var(--paper-2);">${esc(a.tag)}</span>`:''}
          <span style="margin-left:auto;">
            <span style="cursor:pointer; margin-right:8px;" onclick="Articles.openEdit('${a.id}')"><i class="ph ph-pencil-simple"></i></span>
            <span style="cursor:pointer; color:#a1503e;" onclick="Articles.deleteArticle('${a.id}')"><i class="ph ph-trash"></i></span>
          </span>
        </div>
      </div>`;
    }).join('');
  },

  openForm(){
    const folders = State.articleFolders;
    App.openSheet(`
      <div class="sheet-head"><h3>新增筆記</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div class="field"><label>標題</label><input id="rTitle" placeholder="文章 / 筆記標題"></div>
      <div class="row2">
        <div class="field"><label>日期</label><input id="rDate" type="date" value="${todayStr()}"></div>
        <div class="field"><label>標籤</label><input id="rTag" placeholder="例如：工作"></div>
      </div>
      <div class="field"><label>資料夾</label><select id="rFolder">${folders.map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select></div>
      <div class="field"><label>摘要 / 心得</label><textarea id="rSum" placeholder="重點整理…"></textarea></div>
      <button class="btn btn-primary btn-block" style="margin-top:18px;" onclick="Articles.save()">儲存</button>
    `);
  },

  save(){
    const title = document.getElementById('rTitle').value.trim(); if(!title) return;
    State.articles.unshift({
      id:uid(), title,
      date:document.getElementById('rDate').value||todayStr(),
      tag:document.getElementById('rTag').value.trim(),
      summary:document.getElementById('rSum').value.trim(),
      folder:document.getElementById('rFolder').value
    });
    save('articles', State.articles); App.closeSheet(); this.render();
  },

  openEdit(id){
    const a = State.articles.find(x=>x.id===id); if(!a) return;
    const folders = State.articleFolders;
    App.openSheet(`
      <div class="sheet-head"><h3>編輯筆記</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div class="field"><label>標題</label><input id="rTitle" value="${esc(a.title)}"></div>
      <div class="row2">
        <div class="field"><label>日期</label><input id="rDate" type="date" value="${a.date||''}"></div>
        <div class="field"><label>標籤</label><input id="rTag" value="${esc(a.tag||'')}"></div>
      </div>
      <div class="field"><label>資料夾</label><select id="rFolder">${folders.map(f=>`<option value="${f.id}" ${f.id===a.folder?'selected':''}>${esc(f.name)}</option>`).join('')}</select></div>
      <div class="field"><label>摘要 / 心得</label><textarea id="rSum">${esc(a.summary||'')}</textarea></div>
      <button class="btn btn-primary btn-block" style="margin-top:18px;" onclick="Articles.update('${id}')">儲存</button>
    `);
  },

  update(id){
    const a = State.articles.find(x=>x.id===id); if(!a) return;
    a.title = document.getElementById('rTitle').value.trim() || a.title;
    a.date = document.getElementById('rDate').value || a.date;
    a.tag = document.getElementById('rTag').value.trim();
    a.summary = document.getElementById('rSum').value.trim();
    a.folder = document.getElementById('rFolder').value;
    save('articles', State.articles); App.closeSheet(); this.render();
  },

  deleteArticle(id){
    if(!confirm('確定要刪除這篇筆記嗎？')) return;
    State.articles = State.articles.filter(x=>x.id!==id);
    save('articles', State.articles); this.render();
  },

  addFolderInline(){
    const name = prompt('資料夾名稱：');
    if(!name || !name.trim()) return;
    const id = uid();
    State.articleFolders.push({id, name:name.trim()});
    save('articleFolders', State.articleFolders);
    this.filter = id;
    this.renderTabs();
    this.render();
  },

  openFolderManager(){
    const folders = State.articleFolders;
    App.openSheet(`
      <div class="sheet-head"><h3>管理資料夾</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div id="folderList">
        ${folders.map(f=>`
          <div class="folder-row">
            <input class="folder-name-input" data-id="${f.id}" value="${esc(f.name)}" ${f.id==='default'?'disabled':''}>
            ${f.id!=='default'?`<button class="btn-text-sm" onclick="Articles.deleteFolder('${f.id}')"><i class="ph ph-trash"></i></button>`:''}
          </div>
        `).join('')}
      </div>
      <button class="btn btn-ghost btn-block" style="margin-top:12px;" onclick="Articles.addFolder()">＋ 新增資料夾</button>
      <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="Articles.saveFolders()">儲存</button>
    `);
  },

  addFolder(){
    const id = uid();
    State.articleFolders.push({id, name:'新資料夾'});
    const list = document.getElementById('folderList');
    const row = document.createElement('div');
    row.className = 'folder-row';
    row.innerHTML = `<input class="folder-name-input" data-id="${id}" value="新資料夾"><button class="btn-text-sm" onclick="Articles.deleteFolder('${id}')"><i class="ph ph-trash"></i></button>`;
    list.appendChild(row);
  },

  deleteFolder(id){
    State.articleFolders = State.articleFolders.filter(f=>f.id!==id);
    State.articles.forEach(a=>{ if(a.folder===id) a.folder='default'; });
    this.openFolderManager();
  },

  saveFolders(){
    document.querySelectorAll('.folder-name-input').forEach(el=>{
      const f = State.articleFolders.find(x=>x.id===el.dataset.id);
      if(f) f.name = el.value.trim() || f.name;
    });
    save('articleFolders', State.articleFolders);
    if(!State.articleFolders.find(f=>f.id===this.filter)){
      this.filter = State.articleFolders[0]?.id || 'default';
    }
    App.closeSheet(); this.renderTabs(); this.render();
  }
};
