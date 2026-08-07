/* ============================================================
   money.js — Money Record
   Tabs: list, stat, transfer
   ============================================================ */

const Money = {
  tab: 'list',
  txType: 'out',

  setTab(t){
    this.tab = t;
    ['mTabList','mTabStat','mTabTransfer'].forEach(id=>document.getElementById(id).classList.remove('active'));
    document.getElementById('mTab'+t.charAt(0).toUpperCase()+t.slice(1)).classList.add('active');
    document.getElementById('moneyListPane').style.display = t==='list'?'':'none';
    document.getElementById('moneyStatPane').style.display = t==='stat'?'':'none';
    document.getElementById('moneyTransferPane').style.display = t==='transfer'?'':'none';
    this.render();
  },

  render(){
    this.renderPockets();
    if(this.tab==='list') this.renderList();
    else if(this.tab==='stat') this.renderStat();
    else if(this.tab==='transfer') this.renderTransfer();
  },

  renderPockets(){
    const ps = document.getElementById('pocketScroll');
    ps.innerHTML = State.pockets.map(p=>`
      <div class="pocket-card">
        <div class="nm">${p.icon} ${esc(p.name)}</div>
        <div class="bal">NT$${p.balance.toLocaleString()}</div>
      </div>
    `).join('') + `<div class="pocket-card add" onclick="Money.openPocketForm()">＋ 新增存錢處</div>`;
  },

  /* ---- List Tab ---- */
  renderList(){
    const el = document.getElementById('moneyListPane');
    if(State.money.length===0){
      el.innerHTML = `<div class="empty"><span class="big"><i class="ph ph-wallet"></i></span>還沒有任何記帳紀錄</div>`;
      return;
    }
    el.innerHTML = State.money.slice(0,60).map(t=>{
      const cat = MONEY_CATS.find(c=>c.k===t.cat) || MONEY_CATS[MONEY_CATS.length-1];
      const p = pocketById(t.pocket);
      const typeLabel = t.type==='in'?'+':t.type==='transfer'?'↔':'-';
      const typeClass = t.type;
      return `<div class="card tx-row">
        <div class="tx-ic" style="background:${t.type==='in'?'var(--c-daily-bg)':t.type==='transfer'?'var(--c-money-bg)':'var(--c-item-bg)'};">${cat.ic}</div>
        <div class="tx-mid">
          <div class="nm">${esc(t.note||t.cat)}</div>
          <div class="sub">${niceDate(t.date)} · ${t.type==='transfer'?(pocketById(t.fromPocket)?.name||'?')+' → '+(pocketById(t.toPocket)?.name||'?'):(p?p.icon+' '+esc(p.name):'—')}</div>
        </div>
        <div class="tx-amt ${typeClass}">${typeLabel}${t.amount.toLocaleString()}</div>
      </div>`;
    }).join('');
  },

  openPocketForm(){
    App.openSheet(`
      <div class="sheet-head"><h3>新增存錢處</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div class="field"><label>名稱</label><input id="pName" placeholder="例如：悠遊卡"></div>
      <div class="row2">
        <div class="field"><label>圖示</label><input id="pIcon" placeholder="ph ph-wallet" value="ph ph-wallet"></div>
        <div class="field"><label>目前餘額</label><input id="pBal" type="number" placeholder="0"></div>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:18px;" onclick="Money.savePocket()">新增</button>
    `);
  },

  savePocket(){
    const name = document.getElementById('pName').value.trim(); if(!name) return;
    const icon = document.getElementById('pIcon').value.trim()||'ph ph-wallet';
    const balance = parseFloat(document.getElementById('pBal').value)||0;
    State.pockets.push({id:uid(), name, icon, balance});
    save('pockets', State.pockets); App.closeSheet(); this.render();
  },

  openMoneyForm(){
    if(State.pockets.length===0){ alert('請先新增一個存錢處'); this.openPocketForm(); return; }
    this.txType = 'out';
    App.openSheet(`
      <div class="sheet-head"><h3>新增記帳</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div class="tabs" id="typeTabs">
        <button type="button" class="tab-btn active" data-t="out" onclick="Money.setTxType('out')">支出</button>
        <button type="button" class="tab-btn" data-t="in" onclick="Money.setTxType('in')">收入</button>
      </div>
      <div class="row2">
        <div class="field"><label>金額</label><input id="tAmt" type="number" placeholder="0"></div>
        <div class="field"><label>日期</label><input id="tDate" type="date" value="${todayStr()}"></div>
      </div>
      <div class="field"><label>存錢處</label><select id="tPocket">${State.pockets.map(p=>`<option value="${p.id}">${p.icon} ${esc(p.name)}</option>`).join('')}</select></div>
      <div class="field"><label>用途分類</label><select id="tCat">${MONEY_CATS.map(c=>`<option value="${c.k}">${c.ic} ${c.k}</option>`).join('')}</select></div>
      <div class="field"><label>備註</label><input id="tNote" placeholder="選填"></div>
      <button class="btn btn-primary btn-block" style="margin-top:18px;" onclick="Money.saveMoney()">儲存</button>
    `);
  },

  setTxType(t){
    this.txType = t;
    document.querySelectorAll('#typeTabs .tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.t===t));
  },

  saveMoney(){
    const amount = parseFloat(document.getElementById('tAmt').value); if(!amount) return;
    const date = document.getElementById('tDate').value||todayStr();
    const pocket = document.getElementById('tPocket').value;
    const cat = document.getElementById('tCat').value;
    const note = document.getElementById('tNote').value.trim();
    State.money.unshift({id:uid(), type:this.txType, amount, date, pocket, cat, note});
    const p = pocketById(pocket);
    if(p) p.balance += (this.txType==='in'?amount:-amount);
    save('money', State.money); save('pockets', State.pockets);
    App.closeSheet(); this.render();
  },

  /* ---- Stat Tab ---- */
  renderStat(){
    const el = document.getElementById('moneyStatPane');
    const now = new Date();
    const thisMonth = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    const monthTx = State.money.filter(t=>t.date.startsWith(thisMonth));
    const totalOut = monthTx.filter(t=>t.type==='out').reduce((s,t)=>s+t.amount,0);
    const totalIn = monthTx.filter(t=>t.type==='in').reduce((s,t)=>s+t.amount,0);
    const budget = State.budget.monthly;

    const byCat = {};
    monthTx.filter(t=>t.type==='out').forEach(t=>{ byCat[t.cat]=(byCat[t.cat]||0)+t.amount; });
    const rows = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);

    el.innerHTML = `
      <div class="budget-box">
        <div class="budget-header">
          <h4>預算進度（本月）</h4>
          <span style="font-size:12px; cursor:pointer; color:var(--c-money);" onclick="Money.editBudget()"><i class="ph ph-pencil-simple"></i> 設定預算</span>
        </div>
        ${budget>0 ? `
          <div style="font-size:13px;">已花 <strong>NT$${totalOut.toLocaleString()}</strong> / NT$${budget.toLocaleString()}</div>
          <div class="budget-bar"><div class="budget-fill" style="width:${Math.min(100,Math.round(totalOut/budget*100))}%; background:${totalOut>budget?'#a1503e':'var(--c-money)'};"></div></div>
          <div class="budget-info">
            <span>剩餘 NT$${Math.max(0,budget-totalOut).toLocaleString()}</span>
            <span>${Math.round(totalOut/budget*100)}%</span>
          </div>
        ` : `<div style="font-size:13px; color:var(--ink-soft);">尚未設定月預算，點此設定</div>`}
      </div>
      <div class="card">
        <div style="font-size:12px; color:var(--ink-soft); font-weight:700;">本月概覽</div>
        <div style="display:flex; gap:16px; margin-top:8px;">
          <div><div style="font-size:11px; color:var(--ink-soft);">支出</div><div style="font-family:'Fraunces',serif; font-size:20px; font-weight:700; color:#a1503e;">NT$${totalOut.toLocaleString()}</div></div>
          <div><div style="font-size:11px; color:var(--ink-soft);">收入</div><div style="font-family:'Fraunces',serif; font-size:20px; font-weight:700; color:var(--c-daily);">NT$${totalIn.toLocaleString()}</div></div>
        </div>
      </div>
      <div class="section-title" style="margin-top:16px;"><h2 style="font-size:15px;">支出分類佔比</h2></div>
      ${rows.length===0? `<div class="empty">尚無支出紀錄</div>` : rows.map(([cat,amt])=>{
        const cc = MONEY_CATS.find(c=>c.k===cat)||MONEY_CATS[MONEY_CATS.length-1];
        const pct = totalOut? Math.round(amt/totalOut*100):0;
        return `<div class="cat-row"><span class="cat-label">${cc.ic} ${cat}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:var(--c-money);"></div></div><span style="width:40px; text-align:right;">${pct}%</span></div>`;
      }).join('')}
    `;
  },

  editBudget(){
    const current = State.budget.monthly;
    App.openSheet(`
      <div class="sheet-head"><h3>設定月預算</h3><button class="close-x" onclick="App.closeSheet()">✕</button></div>
      <div class="field"><label>每月預算金額</label><input id="budgetAmt" type="number" value="${current||''}" placeholder="例如：15000"></div>
      <button class="btn btn-primary btn-block" style="margin-top:18px;" onclick="Money.saveBudget()">儲存</button>
    `);
  },

  saveBudget(){
    const amt = parseFloat(document.getElementById('budgetAmt').value)||0;
    State.budget.monthly = amt;
    save('budget', State.budget);
    App.closeSheet(); this.render();
  },

  /* ---- Transfer Tab ---- */
  renderTransfer(){
    const el = document.getElementById('moneyTransferPane');
    if(State.pockets.length<2){
      el.innerHTML = `<div class="empty"><span class="big"><i class="ph ph-arrows-clockwise"></i></span>需要至少兩個存錢處才能轉帳</div>`;
      return;
    }
    el.innerHTML = `
      <div class="card">
        <div class="field"><label>轉出存錢處</label><select id="fromPocket">${State.pockets.map(p=>`<option value="${p.id}">${p.icon} ${esc(p.name)} (餘額 NT$${p.balance.toLocaleString()})</option>`).join('')}</select></div>
        <div class="transfer-arrow">↓</div>
        <div class="field"><label>轉入存錢處</label><select id="toPocket">${State.pockets.map(p=>`<option value="${p.id}">${p.icon} ${esc(p.name)} (餘額 NT$${p.balance.toLocaleString()})</option>`).join('')}</select></div>
        <div class="field"><label>金額</label><input id="transferAmt" type="number" placeholder="0"></div>
        <div class="field"><label>備註（選填）</label><input id="transferNote" placeholder="例如：從銀行提領"></div>
        <button class="btn btn-primary btn-block" style="margin-top:18px;" onclick="Money.doTransfer()">確認轉帳</button>
      </div>
    `;
    // Set second option as destination
    if(State.pockets.length>1){
      document.getElementById('toPocket').selectedIndex = 1;
    }
  },

  doTransfer(){
    const fromId = document.getElementById('fromPocket').value;
    const toId = document.getElementById('toPocket').value;
    const amount = parseFloat(document.getElementById('transferAmt').value);
    const note = document.getElementById('transferNote').value.trim();

    if(fromId===toId){ alert('轉出與轉入不能是同一個存錢處'); return; }
    if(!amount || amount<=0){ alert('請輸入正確金額'); return; }

    const from = pocketById(fromId);
    const to = pocketById(toId);
    if(from.balance<amount){ alert('轉出存錢處餘額不足'); return; }

    from.balance -= amount;
    to.balance += amount;

    State.money.unshift({
      id:uid(), type:'transfer', amount, date:todayStr(),
      pocket:fromId, fromPocket:fromId, toPocket:toId,
      cat:'轉帳', note:note||`${from.name} → ${to.name}`
    });

    save('money', State.money); save('pockets', State.pockets);
    alert('轉帳成功！');
    this.render();
  },

  deleteTx(id){
    if(!confirm('刪除這筆紀錄？')) return;
    const tx = State.money.find(t=>t.id===id);
    if(tx && tx.type!=='transfer'){
      const p = pocketById(tx.pocket);
      if(p) p.balance += (tx.type==='in'?-tx.amount:tx.amount);
      save('pockets', State.pockets);
    }
    State.money = State.money.filter(t=>t.id!==id);
    save('money', State.money);
    this.render();
  }
};
