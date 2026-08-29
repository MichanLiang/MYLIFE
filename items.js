/* ============================================================
   items.js — Consumables & Chores
   Tabs: items, chores, week, month
   ============================================================ */

const Items = {
  tab: 'items',
  viewMode: 'grid',
  collapsed: {},

  setTab(t){
    this.tab = t;
    ['iTabItems','iTabChores','iTabWeek','iTabMonth'].forEach(id=>document.getElementById(id).classList.remove('active'));
    const tabId = 'iTab'+t.charAt(0).toUpperCase()+t.slice(1);
    document.getElementById(tabId).classList.add('active');
    document.getElementById('itemsPane').style.display = t==='items'?'':'none';
    document.getElementById('choresPane').style.display = t==='chores'?'':'none';
    document.getElementById('itemsWeekPane').style.display = t==='week'?'':'none';
    document.getElementById('itemsMonthPane').style.display = t==='month'?'':'none';
    this.render();
  },

  render(){
    if(this.tab==='items') this.renderItems();
    else if(this.tab==='chores') this.renderChores();
    else if(this.tab==='week') this.renderWeek();
    else if(this.tab==='month') this.renderMonth();
  },

  /* ---- Items Tab ---- */
  renderItems(){
    const el = document.getElementById('itemsPane');
    if(State.items.length===0){
      el.innerHTML = `<div class="empty"><span class="big"><i class="ph ph-package"></i></span>還沒有追蹤任何消耗品</div>`;
      return;
    }

    // Group by list
    const groups = {};
    State.lists.forEach(l=>groups[l.id]=[]);
    State.items.forEach(it=>{
      const lid = it.listId || 'default';
      if(!groups[lid]) groups[lid]=[];
      groups[lid].push(it);
    });

    const isGrid = this.viewMode === 'grid';

    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <span style="font-size:13px; color:var(--ink-soft);">共 ${State.items.length} 項</span>
      <div style="display:flex; gap:8px; align-items:center;">
        <span style="font-size:12px; cursor:pointer; color:var(--c-item);" onclick="Items.openListManager()">管理清單 →</span>
        <div style="display:flex; gap:2px; background:var(--paper-2); border-radius:8px; padding:2px;">
          <button class="view-toggle ${isGrid?'active':''}" onclick="Items.setViewMode('grid')"><i class="ph ph-squares-four"></i></button>
          <button class="view-toggle ${!isGrid?'active':''}" onclick="Items.setViewMode('list')"><i class="ph ph-list"></i></button>
        </div>
      </div>
    </div>`;

    State.lists.forEach(list=>{
      const items = groups[list.id] || [];
      if(items.length===0) return;
      const sorted = [...items].sort((a,b)=>{
        const da=daysUntil(a.expiry), db=daysUntil(b.expiry);
        return (da===null?9999:da) - (db===null?9999:db);
      });
      const collapsed = this.collapsed[list.id];
      html += `<div class="list-group">
        <div class="list-group-header" onclick="Items.toggleCollapse('${list.id}')" style="cursor:pointer;">
          <h3>${esc(list.name)} (${items.length})</h3>
          <i class="ph ${collapsed?'ph-caret-right':'ph-caret-down'}" style="font-size:14px; color:var(--ink-soft);"></i>
        </div>
        ${collapsed ? '' : `<div class="${isGrid?'item-grid':'item-list'}">
          ${sorted.map(it=> isGrid ? this.renderItemCard(it) : this.renderItemRow(it)).join('')}
        </div>`}
      </div>`;
    });

    el.innerHTML = html;
  },

  setViewMode(mode){
    this.viewMode = mode;
    this.renderItems();
  },

  toggleCollapse(listId){
    this.collapsed[listId] = !this.collapsed[listId];
    this.renderItems();
  },

  renderItemRow(it){
    const du = daysUntil(it.expiry);
    let statusColor = '#6F8F63', statusTxt='狀況良好';
    if(du!==null){
      if(du<0){statusColor='#a1503e'; statusTxt='已過期';}
      else if(du<=7){statusColor='#B8842E'; statusTxt=`剩 ${du} 天`;}
      else{statusTxt=`剩 ${du} 天`;}
    }
    return `<div class="item-row" onclick="Items.openItemDetail('${it.id}')">
      <div class="item-row-left">
        <span class="item-row-icon"><i class="${it.icon||'ph ph-drop'}"></i></span>
        <div class="item-row-info">
          <span class="item-row-name">${esc(it.name)}</span>
          <span class="item-row-sub">${esc(it.category||'一般')} · ${it.opened?'使用中':'未開封'}${it.quantity!==undefined?' · 庫存 '+it.quantity:''}</span>
        </div>
      </div>
      <span class="item-row-status" style="color:${statusColor};">${statusTxt}</span>
    </div>`;

  renderItemCard(it){
    const du = daysUntil(it.expiry);
    let statusColor = '#6F8F63', statusTxt='狀況良好';
    if(du!==null){
      if(du<0){statusColor='#a1503e'; statusTxt='已過期';}
      else if(du<=7){statusColor='#B8842E'; statusTxt=`剩 ${du} 天`;}
      else{statusTxt=`剩 ${du} 天`;}
    }
    return `<div class="item-card" onclick="Items.openItemDetail('${it.id}')">
      <div class="top"><span class="ic"><i class="${it.icon||'ph ph-drop'}"></i></span><span class="status-dot" style="background:${statusColor}"></span></div>
      <h4>${esc(it.name)}</h4>
      <div class="sub">${esc(it.category||'一般')} · ${it.opened?'使用中':'未開封'}</div>
      ${it.quantity!==undefined? `<div class="qty">庫存：${it.quantity}</div>`:''}
      ${it.daysPerUnit? `<div class="sub">每 ${it.daysPerUnit} 天消耗一單位</div>`:''}
      <div class="sub" style="color:${statusColor}; font-weight:700; margin-top:4px;">${statusTxt}</div>
    </div>`;
  },

  openItemDetail(id){
    const it = State.items.find(x=>x.id===id); if(!it) return;
    App.openSheet(`
      <div class="sheet-head"><h3>${esc(it.name)}</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div style="text-align:center; font-size:48px; margin:10px 0;"><i class="${it.icon||'ph ph-drop'}"></i></div>
      <div class="card">
        <div class="flex-between mb-8"><span style="color:var(--ink-soft); font-size:13px;">分類</span><span style="font-weight:600;">${esc(it.category||'一般')}</span></div>
        <div class="flex-between mb-8"><span style="color:var(--ink-soft); font-size:13px;">狀態</span><span style="font-weight:600;">${it.opened?'使用中':'未開封'}</span></div>
        ${it.quantity!==undefined? `<div class="flex-between mb-8"><span style="color:var(--ink-soft); font-size:13px;">庫存數量</span><span style="font-weight:600; font-family:'Fraunces',serif; font-size:16px; color:var(--c-item);">${it.quantity}</span></div>`:''}
        ${it.daysPerUnit? `<div class="flex-between mb-8"><span style="color:var(--ink-soft); font-size:13px;">消耗速度</span><span style="font-weight:600;">每 ${it.daysPerUnit} 天一單位</span></div>`:''}
        ${it.expiry? `<div class="flex-between mb-8"><span style="color:var(--ink-soft); font-size:13px;">到期日</span><span style="font-weight:600;">${niceDate(it.expiry)}</span></div>`:''}
        ${it.buyDate? `<div class="flex-between mb-8"><span style="color:var(--ink-soft); font-size:13px;">購買日期</span><span style="font-weight:600;">${niceDate(it.buyDate)}</span></div>`:''}
        ${it.purchasePlace? `<div class="flex-between mb-8"><span style="color:var(--ink-soft); font-size:13px;">購買地點</span><span style="font-weight:600;">${esc(it.purchasePlace)}</span></div>`:''}
      </div>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button class="btn btn-ghost" style="flex:1;" onclick="Items.openEditItem('${it.id}')">編輯</button>
        <button class="btn btn-danger" style="flex:1;" onclick="Items.deleteItem('${it.id}')">刪除</button>
      </div>
    `);
  },

  openEditItem(id){
    const it = State.items.find(x=>x.id===id); if(!it) return;
    const currentIcon = it.icon||'ph ph-drop';
    const icons = [
      {v:'ph ph-drop', l:'保養'}, {v:'ph ph-package', l:'用品'}, {v:'ph ph-spray-bottle', l:'清潔'},
      {v:'ph ph-fork-knife', l:'食品'}, {v:'ph ph-pencil-simple', l:'文具'}, {v:'ph ph-dots-three', l:'其他'}
    ];
    App.openSheet(`
      <div class="sheet-head"><h3>編輯消耗品</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div class="field"><label>名稱</label><input id="eName" value="${esc(it.name)}"></div>
      <div class="field"><label>圖示</label>
        <div class="icon-picker" id="iconPicker">
          ${icons.map(i=>`<div class="icon-opt ${i.v===currentIcon?'sel':''}" data-icon="${i.v}" onclick="Items.pickIcon(this)"><i class="${i.v}"></i><span>${i.l}</span></div>`).join('')}
        </div>
      </div>
      <div class="field"><label>分類</label><input id="eCat" value="${esc(it.category||'')}"></div>
      <div class="field"><label>所屬清單</label><select id="eList">${State.lists.map(l=>`<option value="${l.id}" ${l.id===(it.listId||'default')?'selected':''}>${esc(l.name)}</option>`).join('')}</select></div>
      <div class="row2">
        <div class="field"><label>庫存數量</label><input id="eQty" type="number" value="${it.quantity??''}"></div>
        <div class="field"><label>消耗一單位天數</label><input id="eDays" type="number" value="${it.daysPerUnit||''}"></div>
      </div>
      <div class="row2">
        <div class="field"><label>購買日期</label><input id="eBuy" type="date" value="${it.buyDate||''}"></div>
        <div class="field"><label>預估到期日</label><input id="eExp" type="date" value="${it.expiry||''}"></div>
      </div>
      <div class="field"><label>購買地點（選填）</label><input id="ePlace" value="${esc(it.purchasePlace||'')}"></div>
      <div class="field"><label><input type="checkbox" id="eOpened" ${it.opened?'checked':''} style="width:auto; margin-right:6px;">使用中</label></div>
      <button class="btn btn-primary btn-block" style="margin-top:18px;" onclick="Items.saveEditItem('${it.id}')">儲存</button>
    `);
  },

  saveEditItem(id){
    const it = State.items.find(x=>x.id===id); if(!it) return;
    it.name = document.getElementById('eName').value.trim()||it.name;
    const selIcon = document.querySelector('#iconPicker .icon-opt.sel');
    it.icon = selIcon ? selIcon.dataset.icon : it.icon;
    it.category = document.getElementById('eCat').value.trim();
    it.listId = document.getElementById('eList').value;
    it.quantity = document.getElementById('eQty').value!==''? parseFloat(document.getElementById('eQty').value):undefined;
    it.daysPerUnit = document.getElementById('eDays').value? parseInt(document.getElementById('eDays').value):null;
    it.buyDate = document.getElementById('eBuy').value;
    it.expiry = document.getElementById('eExp').value;
    it.purchasePlace = document.getElementById('ePlace').value.trim();
    it.opened = document.getElementById('eOpened').checked;
    save('items', State.items);
    App.closeSheet(); this.render();
  },

  pickIcon(el){
    document.querySelectorAll('#iconPicker .icon-opt').forEach(e=>e.classList.remove('sel'));
    el.classList.add('sel');
  },

  openItemForm(){
    const icons = [
      {v:'ph ph-drop', l:'保養'}, {v:'ph ph-package', l:'用品'}, {v:'ph ph-spray-bottle', l:'清潔'},
      {v:'ph ph-fork-knife', l:'食品'}, {v:'ph ph-pencil-simple', l:'文具'}, {v:'ph ph-dots-three', l:'其他'}
    ];
    App.openSheet(`
      <div class="sheet-head"><h3>新增消耗品</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div class="field"><label>名稱</label><input id="iName" placeholder="例如：洗面乳"></div>
      <div class="field"><label>圖示</label>
        <div class="icon-picker" id="iconPicker">
          ${icons.map(i=>`<div class="icon-opt ${i.v==='ph ph-drop'?'sel':''}" data-icon="${i.v}" onclick="Items.pickIcon(this)"><i class="${i.v}"></i><span>${i.l}</span></div>`).join('')}
        </div>
      </div>
      <div class="field"><label>分類</label><input id="iCat" placeholder="例如：保養品" list="catList"><datalist id="catList">${ITEM_CATEGORIES.map(c=>`<option value="${c}">`).join('')}</datalist></div>
      <div class="field"><label>所屬清單</label><select id="iList">${State.lists.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select></div>
      <div class="row2">
        <div class="field"><label>庫存數量</label><input id="iQty" type="number" placeholder="選填"></div>
        <div class="field"><label>消耗一單位天數</label><input id="iDays" type="number" placeholder="選填"></div>
      </div>
      <div class="row2">
        <div class="field"><label>購買日期</label><input id="iBuy" type="date" value="${todayStr()}"></div>
        <div class="field"><label>預估到期日</label><input id="iExp" type="date"></div>
      </div>
      <div class="field"><label>購買地點（選填）</label><input id="iPlace" placeholder="例如：屈臣氏"></div>
      <div class="field"><label><input type="checkbox" id="iOpened" style="width:auto; margin-right:6px;">使用中</label></div>
      <button class="btn btn-primary btn-block" style="margin-top:18px;" onclick="Items.saveItem()">儲存</button>
    `);
  },

  saveItem(){
    const name = document.getElementById('iName').value.trim(); if(!name) return;
    const qty = document.getElementById('iQty').value;
    const selIcon = document.querySelector('#iconPicker .icon-opt.sel');
    const icon = selIcon ? selIcon.dataset.icon : 'ph ph-drop';
    State.items.push({
      id:uid(), name, icon,
      category:document.getElementById('iCat').value.trim(),
      listId:document.getElementById('iList').value,
      quantity:qty!==''? parseFloat(qty):undefined,
      daysPerUnit:document.getElementById('iDays').value? parseInt(document.getElementById('iDays').value):null,
      buyDate:document.getElementById('iBuy').value,
      expiry:document.getElementById('iExp').value,
      purchasePlace:document.getElementById('iPlace').value.trim(),
      opened:document.getElementById('iOpened').checked
    });
    save('items', State.items); App.closeSheet(); this.render();
  },

  deleteItem(id){
    if(!confirm('刪除這個項目？')) return;
    State.items = State.items.filter(i=>i.id!==id);
    save('items', State.items); App.closeSheet(); this.render();
  },

  /* ---- List Manager ---- */
  openListManager(){
    App.openSheet(`
      <div class="sheet-head"><h3>管理清單</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div id="listManagerContent"></div>
      <div style="margin-top:12px;">
        <div style="display:flex; gap:8px;">
          <input id="newListName" placeholder="新清單名稱" style="flex:1;">
          <button class="btn btn-primary" onclick="Items.addList()">新增</button>
        </div>
      </div>
    `);
    this.renderListManager();
  },

  renderListManager(){
    const el = document.getElementById('listManagerContent');
    el.innerHTML = State.lists.map(l=>{
      const count = State.items.filter(it=>(it.listId||'default')===l.id).length;
      return `<div class="card" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px;">
        <div><strong>${esc(l.name)}</strong> <span style="font-size:11px; color:var(--ink-soft);">(${count} 項)</span></div>
        ${l.id!=='default'? `<span style="cursor:pointer; font-size:12px; color:#a1503e;" onclick="Items.deleteList('${l.id}')">刪除</span>`:''}
      </div>`;
    }).join('');
  },

  addList(){
    const name = document.getElementById('newListName').value.trim(); if(!name) return;
    State.lists.push({id:uid(), name});
    save('lists', State.lists);
    document.getElementById('newListName').value='';
    this.renderListManager();
  },

  deleteList(id){
    if(!confirm('刪除這個清單？物品不會被刪除，會移到預設清單。')) return;
    State.items.forEach(it=>{ if(it.listId===id) it.listId='default'; });
    State.lists = State.lists.filter(l=>l.id!==id);
    save('lists', State.lists); save('items', State.items);
    this.renderListManager();
  },

  /* ---- Chores Tab ---- */
  renderChores(){
    const el = document.getElementById('choresPane');
    if(State.chores.length===0){
      el.innerHTML = `<div class="empty"><span class="big"><i class="ph ph-broom"></i></span>還沒有瑣事項目</div>`;
      return;
    }
    el.innerHTML = State.chores.map(c=>{
      const next = this.nextChoreDate(c);
      const du = daysUntil(next);
      const ready = du <= 2;
      return `<div class="card chore-card">
        <div class="chore-row" style="border:none; padding:0;">
          <div style="flex:1;">
            <div class="nm"><i class="ph ph-broom"></i> ${esc(c.name)}</div>
            <div class="sub">每 ${c.freq} 天一次 · 下次：${niceDate(next)}${ready?' <span style="color:var(--c-item); font-weight:700;">可完成</span>':' · 剩 '+du+' 天'}</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            ${ready ? `<div class="btn btn-ghost btn-sm" onclick="Items.doneChore('${c.id}')">完成 ✓</div>` : ''}
            <button class="btn-text-sm" onclick="Items.openEditChore('${c.id}')"><i class="ph ph-pencil-simple"></i></button>
            <button class="btn-text-sm" onclick="Items.deleteChore('${c.id}')"><i class="ph ph-trash"></i></button>
          </div>
        </div>
      </div>`;
    }).join('');
  },

  nextChoreDate(c){
    const last=new Date((c.last||todayStr())+'T00:00:00');
    last.setDate(last.getDate()+c.freq);
    return fmtDate(last);
  },

  doneChore(id){
    const c=State.chores.find(x=>x.id===id);
    if(!c) return;
    c.last=todayStr();
    save('chores', State.chores); this.render();
  },

  openChoreForm(){
    App.openSheet(`
      <div class="sheet-head"><h3>新增瑣事</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div class="field"><label>名稱</label><input id="cName" placeholder="例如：清冰箱"></div>
      <div class="field"><label>每次間隔（天）</label><input id="cFreq" type="number" value="7"></div>
      <div class="field"><label>上次完成日期</label><input id="cLast" type="date" value="${todayStr()}"></div>
      <button class="btn btn-primary btn-block" style="margin-top:18px;" onclick="Items.saveChore()">儲存</button>
    `);
  },

  saveChore(){
    const name = document.getElementById('cName').value.trim(); if(!name) return;
    const freq = parseInt(document.getElementById('cFreq').value)||7;
    const last = document.getElementById('cLast').value || todayStr();
    State.chores.push({id:uid(), name, freq, last});
    save('chores', State.chores); App.closeSheet(); this.render();
  },

  openEditChore(id){
    const c = State.chores.find(x=>x.id===id); if(!c) return;
    App.openSheet(`
      <div class="sheet-head"><h3>編輯瑣事</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div class="field"><label>名稱</label><input id="eCName" value="${esc(c.name)}"></div>
      <div class="field"><label>每次間隔（天）</label><input id="eCFreq" type="number" value="${c.freq}"></div>
      <div class="field"><label>上次完成日期</label><input id="eCLast" type="date" value="${c.last||todayStr()}"></div>
      <button class="btn btn-primary btn-block" style="margin-top:18px;" onclick="Items.saveEditChore('${id}')">儲存</button>
    `);
  },

  saveEditChore(id){
    const c = State.chores.find(x=>x.id===id); if(!c) return;
    c.name = document.getElementById('eCName').value.trim() || c.name;
    c.freq = parseInt(document.getElementById('eCFreq').value) || c.freq;
    c.last = document.getElementById('eCLast').value || c.last;
    save('chores', State.chores); App.closeSheet(); this.render();
  },

  deleteChore(id){
    if(!confirm('確定要刪除這項瑣事嗎？')) return;
    State.chores = State.chores.filter(x=>x.id!==id);
    save('chores', State.chores); this.render();
  },

  /* ---- Week View ---- */
  renderWeek(){
    const el = document.getElementById('itemsWeekPane');
    const start = getWeekStart(new Date());
    const dates = dateRange(start, new Date(start.getTime()+6*86400000));

    let html = `<div class="card"><h3 style="font-size:15px; margin-bottom:10px;">本週檢視</h3>`;
    html += dates.map(d=>{
      const dayItems = State.items.filter(it=>it.expiry===d);
      const dayChores = State.chores.filter(c=>this.nextChoreDate(c)===d);
      if(dayItems.length===0 && dayChores.length===0) return '';
      return `<div class="view-day-row">
        <div class="date-label">${niceDate(d)}<br><span style="font-size:10px;">星期${WD[new Date(d).getDay()]}</span></div>
        <div class="items">
          ${dayItems.map(it=>`<span class="pill" style="background:var(--c-item-bg); color:var(--c-item); margin:2px;"><i class="${it.icon||'ph ph-drop'}"></i> ${esc(it.name)} 到期</span>`).join('')}
          ${dayChores.map(c=>`<span class="pill" style="background:var(--c-daily-bg); color:var(--c-daily); margin:2px;"><i class="ph ph-broom"></i> ${esc(c.name)}</span>`).join('')}
        </div>
      </div>`;
    }).join('');
    html += '</div>';

    // Expiring soon
    const expiringSoon = State.items.filter(it=>{
      const du = daysUntil(it.expiry);
      return du!==null && du>=0 && du<=7;
    });
    if(expiringSoon.length>0){
      html += `<div class="card"><h3 style="font-size:15px; margin-bottom:10px;"><i class="ph ph-warning"></i> 本週即將到期</h3>`;
      html += expiringSoon.map(it=>{
        const du = daysUntil(it.expiry);
        return `<div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--line);">
          <span><i class="${it.icon||'ph ph-drop'}"></i></span>
          <span style="flex:1; font-weight:600;">${esc(it.name)}</span>
          <span style="font-size:12px; color:${du<=3?'#a1503e':'var(--c-item)'};">${du===0?'今天':du+'天後'}</span>
        </div>`;
      }).join('');
      html += '</div>';
    }

    if(!html.includes('view-day-row')){
      html = `<div class="empty"><span class="big"><i class="ph ph-calendar"></i></span>本週沒有消耗品到期或瑣事需完成</div>`;
    }
    el.innerHTML = html;
  },

  /* ---- Month View ---- */
  renderMonth(){
    const el = document.getElementById('itemsMonthPane');
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth();
    const daysInMonth = new Date(year, month+1, 0).getDate();

    let html = `<div class="card"><h3 style="font-size:15px; margin-bottom:10px;">${year}年 ${month+1}月 消耗品到期表</h3>`;
    for(let d=1; d<=daysInMonth; d++){
      const dateStr = fmtDate(new Date(year, month, d));
      const dayItems = State.items.filter(it=>it.expiry===dateStr);
      const dayChores = State.chores.filter(c=>this.nextChoreDate(c)===dateStr);
      if(dayItems.length===0 && dayChores.length===0) continue;
      html += `<div class="view-day-row">
        <div class="date-label">${month+1}/${d}</div>
        <div class="items">
          ${dayItems.map(it=>`<span class="pill" style="background:var(--c-item-bg); color:var(--c-item); margin:2px;"><i class="${it.icon||'ph ph-drop'}"></i> ${esc(it.name)}</span>`).join('')}
          ${dayChores.map(c=>`<span class="pill" style="background:var(--c-daily-bg); color:var(--c-daily); margin:2px;"><i class="ph ph-broom"></i> ${esc(c.name)}</span>`).join('')}
        </div>
      </div>`;
    }
    html += '</div>';

    // Summary
    const monthItems = State.items.filter(it=>{
      if(!it.expiry) return false;
      const d = new Date(it.expiry);
      return d.getFullYear()===year && d.getMonth()===month;
    });
    html += `<div class="card"><div style="font-size:12px; color:var(--ink-soft);">本月共 ${monthItems.length} 項消耗品到期</div></div>`;

    el.innerHTML = html;
  }
};
