/* ============================================================
   calendar.js — Calendar
   Modes: week, month
   Features: todos, auto-items, weekly/monthly review
   ============================================================ */

const Calendar = {
  mode: 'week',
  anchor: new Date(),
  selDate: todayStr(),

  setMode(m){
    this.mode = m;
    this.render();
  },

  shift(dir){
    if(this.mode==='week') this.anchor.setDate(this.anchor.getDate()+dir*7);
    else this.anchor.setMonth(this.anchor.getMonth()+dir);
    this.render();
  },

  render(){
    ['calTabWeek','calTabMonth'].forEach(id=>document.getElementById(id).classList.remove('active'));
    document.getElementById('calTab'+this.mode.charAt(0).toUpperCase()+this.mode.slice(1)).classList.add('active');
    document.getElementById('calWeekView').style.display = this.mode==='week'?'flex':'none';
    document.getElementById('calMonthView').style.display = this.mode==='month'?'block':'none';

    if(this.mode==='week') this.renderWeek();
    else this.renderMonth();

    document.getElementById('dayPanelTitle').textContent = this.selDate===todayStr() ? '今天 · '+niceDate(this.selDate) : niceDate(this.selDate);
    this.renderDayPanel();
    this.renderReviews();
  },

  dayHasEvents(dstr){
    const dots=[];
    if((State.todos[dstr]||[]).length) dots.push('var(--ink)');
    if(State.articles.some(a=>a.date===dstr)) dots.push('var(--c-note)');
    if(State.items.some(it=>it.expiry===dstr)) dots.push('var(--c-item)');
    return dots;
  },

  renderWeek(){
    const start = new Date(this.anchor);
    start.setDate(start.getDate()-start.getDay());
    document.getElementById('calLabel').textContent = `${start.getMonth()+1}月`;
    const wk = document.getElementById('calWeekView'); wk.innerHTML='';
    for(let i=0;i<7;i++){
      const d = new Date(start); d.setDate(start.getDate()+i);
      const ds = fmtDate(d);
      const dots = this.dayHasEvents(ds);
      const div = document.createElement('div');
      div.className = 'wk-day'+(ds===this.selDate?' sel':'');
      div.innerHTML = `<div class="d">${WD[d.getDay()]}</div><div class="n">${d.getDate()}</div><div class="dots">${dots.map(c=>`<i style="background:${c}"></i>`).join('')}</div>`;
      div.onclick = ()=>{ this.selDate=ds; this.render(); };
      wk.appendChild(div);
    }
  },

  renderMonth(){
    const y = this.anchor.getFullYear(), m = this.anchor.getMonth();
    document.getElementById('calLabel').textContent = `${y}年 ${m+1}月`;
    const head = document.getElementById('monGridHead'); head.innerHTML = WD.map(w=>`<div class="wd">${w}</div>`).join('');
    const body = document.getElementById('monGridBody'); body.innerHTML='';
    const first = new Date(y,m,1); const startOffset = first.getDay();
    const daysInMonth = new Date(y,m+1,0).getDate();
    const todayS = todayStr();
    for(let i=0;i<startOffset;i++){
      const d = new Date(y,m,1-(startOffset-i));
      body.appendChild(this.monCell(d, true, todayS));
    }
    for(let d=1; d<=daysInMonth; d++){ body.appendChild(this.monCell(new Date(y,m,d), false, todayS)); }
    const rem = (7 - (body.children.length % 7)) % 7;
    for(let i=1;i<=rem;i++){ body.appendChild(this.monCell(new Date(y,m+1,i), true, todayS)); }
  },

  monCell(d, other, todayS){
    const ds = fmtDate(d);
    const dots = this.dayHasEvents(ds);
    const el = document.createElement('div');
    el.className = 'mon-cell'+(other?' other':'')+(ds===todayS?' today':'')+(ds===this.selDate?' sel':'');
    el.innerHTML = `<span>${d.getDate()}</span><span class="dots">${dots.slice(0,3).map(c=>`<i style="background:${ds===this.selDate?'var(--paper)':c}"></i>`).join('')}</span>`;
    el.onclick = ()=>{ this.selDate=ds; this.render(); };
    return el;
  },

  renderDayPanel(){
    const auto = document.getElementById('dayAutoItems');
    const arts = State.articles.filter(a=>a.date===this.selDate);
    const exps = State.items.filter(it=>it.expiry===this.selDate);
    let html='';
    arts.forEach(a=>html+=`<div class="todo-row"><span class="mini-tag" style="background:var(--c-note-bg); color:var(--c-note);">筆記</span><div class="t">${esc(a.title)}</div></div>`);
    exps.forEach(it=>html+=`<div class="todo-row"><span class="mini-tag" style="background:var(--c-item-bg); color:var(--c-item);">到期</span><div class="t">${esc(it.name)} 需更換</div></div>`);
    auto.innerHTML = html;

    const list = document.getElementById('dayTodoList');
    const todos = State.todos[this.selDate]||[];
    list.innerHTML = todos.length===0 && !html ? `<div class="empty" style="padding:20px;">這天還沒有任何安排</div>` : todos.map(t=>`
      <div class="todo-row">
        <div class="chk ${t.done?'done':''}" onclick="Calendar.toggleTodo('${this.selDate}','${t.id}')">${t.done?'✓':''}</div>
        <div class="t ${t.done?'done':''}">${esc(t.text)}</div>
        <span style="color:var(--ink-soft); cursor:pointer; font-size:12px;" onclick="Calendar.deleteTodo('${this.selDate}','${t.id}')">✕</span>
      </div>`).join('');
  },

  addTodo(){
    const input = document.getElementById('newTodoInput');
    const text = input.value.trim(); if(!text) return;
    if(!State.todos[this.selDate]) State.todos[this.selDate]=[];
    State.todos[this.selDate].push({id:uid(), text, done:false});
    save('todos', State.todos); input.value=''; this.render();
  },

  toggleTodo(ds,id){
    const t=(State.todos[ds]||[]).find(x=>x.id===id);
    if(t){t.done=!t.done; save('todos', State.todos); this.render(); App.render();}
  },

  deleteTodo(ds,id){
    State.todos[ds] = (State.todos[ds]||[]).filter(x=>x.id!==id);
    save('todos', State.todos); this.render();
  },

  /* ---- Weekly/Monthly Review ---- */
  renderReviews(){
    // Weekly review
    const weekStart = getWeekStart(new Date());
    const weekKey = 'calweek-'+fmtDate(weekStart);
    const weekReview = State.calReviews[weekKey] || '';

    const weekStats = this.getWeekStats(weekStart);
    document.getElementById('calWeekReview').innerHTML = `
      <div class="cal-review-card">
        <div class="summary" style="margin-bottom:8px;">
          <i class="ph ph-check-circle"></i> 代辦完成 ${weekStats.todosDone}/${weekStats.todosTotal} 項 ·
          新增 ${weekStats.dailyCount} 篇日記 ·
          記帳 ${weekStats.moneyTx} 筆
        </div>
        <textarea placeholder="這週的反思…" onblur="Calendar.saveCalReview('${weekKey}',this.value)">${esc(weekReview)}</textarea>
      </div>
    `;

    // Monthly review
    const now = new Date();
    const monthKey = 'calmonth-'+now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    const monthReview = State.calReviews[monthKey] || '';
    const monthStats = this.getMonthStats(now.getFullYear(), now.getMonth());

    document.getElementById('calMonthReview').innerHTML = `
      <div class="cal-review-card">
        <div class="summary" style="margin-bottom:8px;">
          <i class="ph ph-check-circle"></i> 代辦完成 ${monthStats.todosDone}/${monthStats.todosTotal} 項 ·
          新增 ${monthStats.dailyCount} 篇日記 ·
          記帳 ${monthStats.moneyTx} 筆 ·
          支出 NT$${monthStats.totalOut.toLocaleString()}
        </div>
        <textarea placeholder="這個月的反思…" onblur="Calendar.saveCalReview('${monthKey}',this.value)">${esc(monthReview)}</textarea>
      </div>
    `;
  },

  getWeekStats(start){
    const dates = dateRange(start, new Date(start.getTime()+6*86400000));
    let todosTotal=0, todosDone=0;
    dates.forEach(d=>{
      const todos = State.todos[d]||[];
      todosTotal += todos.length;
      todosDone += todos.filter(t=>t.done).length;
    });
    const dailyCount = State.daily.filter(e=>dates.includes(e.date)).length;
    const moneyTx = State.money.filter(t=>dates.includes(t.date)).length;
    return { todosTotal, todosDone, dailyCount, moneyTx };
  },

  getMonthStats(year, month){
    const prefix = year+'-'+String(month+1).padStart(2,'0');
    let todosTotal=0, todosDone=0;
    Object.keys(State.todos).forEach(k=>{
      if(k.startsWith(prefix)){
        const todos = State.todos[k];
        todosTotal += todos.length;
        todosDone += todos.filter(t=>t.done).length;
      }
    });
    const dailyCount = State.daily.filter(e=>e.date.startsWith(prefix)).length;
    const monthTx = State.money.filter(t=>t.date.startsWith(prefix));
    const moneyTx = monthTx.length;
    const totalOut = monthTx.filter(t=>t.type==='out').reduce((s,t)=>s+t.amount,0);
    return { todosTotal, todosDone, dailyCount, moneyTx, totalOut };
  },

  saveCalReview(key, value){
    State.calReviews[key] = value;
    save('calReviews', State.calReviews);
  }
};
