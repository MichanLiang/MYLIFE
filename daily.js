/* ============================================================
   daily.js — Daily Life Notes
   Tabs: plan, chart, review, diary
   ============================================================ */

const Daily = {
  tab: 'plan',
  draftBlocks: {},
  selectedMood: 'happy',
  activeCat: 'work',
  todayEntryId: null,

  setTab(t){
    this.tab = t;
    ['dTabPlan','dTabChart','dTabReview','dTabDiary'].forEach(id=>document.getElementById(id).classList.remove('active'));
    document.getElementById('dTab'+t.charAt(0).toUpperCase()+t.slice(1)).classList.add('active');
    document.getElementById('dailyPlanPane').style.display = t==='plan'?'':'none';
    document.getElementById('dailyChartPane').style.display = t==='chart'?'':'none';
    document.getElementById('dailyReviewPane').style.display = t==='review'?'':'none';
    document.getElementById('dailyDiaryPane').style.display = t==='diary'?'':'none';
    this.render();
  },

  render(){
    if(this.tab==='plan') this.renderPlan();
    else if(this.tab==='chart') this.renderChart();
    else if(this.tab==='review') this.renderReview();
    else if(this.tab==='diary') this.renderDiary();
  },

  /* ---- Plan Tab ---- */
  renderPlan(){
    const today = todayStr();
    const el = document.getElementById('dailyPlanPane');
    
    // Load today's entry or create empty
    const existing = State.daily.find(e=>e.date===today);
    if(existing){
      this.todayEntryId = existing.id;
      this.draftBlocks = existing.blocks ? {...existing.blocks} : {};
      this.selectedMood = moodByKey(existing.mood).key;
    } else {
      this.todayEntryId = null;
      this.draftBlocks = {};
      this.selectedMood = 'happy';
    }
    
    el.innerHTML = `
      <div class="section-title"><h2>時間軸記錄</h2></div>
      <div class="card entry-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="d">${niceDate(today)} · 星期${WD[new Date(today).getDay()]}</span>
          <span class="mood" id="dailyMoodDisplay">${moodIconHtml(this.selectedMood,22)}</span>
        </div>
        <div class="field"><label>今天的心情</label>
          <div class="mood-row" id="moodRow">
            ${MOODS.map(m=>`<div class="mood-opt ${m.key===this.selectedMood?'sel':''}" data-m="${m.key}" onclick="Daily.pickMood(this,'${m.key}')"><i class="${m.icon}" style="color:${m.color}"></i><span class="mood-label">${m.label}</span></div>`).join('')}
          </div>
        </div>
        <div class="field"><label>寫點什麼</label><textarea id="dailyText" placeholder="今天發生了什麼有趣的事？" oninput="Daily.autoSave()">${existing?esc(existing.text):''}</textarea></div>
        <div class="field"><label>時間軸（點選填色，6:00–22:00）</label>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
            ${TBLOCK_CATS.filter(c=>c.k!=='none').map(c=>`<button type="button" class="pill" data-cat="${c.k}" style="background:${c.color}22; color:${c.color}; border:1px solid ${c.color}; cursor:pointer;${c.k===this.activeCat?' outline:2px solid var(--ink);':''}" onclick="Daily.setActiveCat(this,'${c.k}')">${c.label}</button>`).join('')}
          </div>
          <div class="tblock-grid" id="formBlocks">
            ${tblockHours().map(h=>{
              const cat = this.draftBlocks[h] || 'none';
              const catObj = TBLOCK_CATS.find(c=>c.k===cat);
              const bg = catObj && catObj.k!=='none' ? catObj.color+'33' : '';
              const bc = catObj && catObj.k!=='none' ? catObj.color : '';
              return `<div class="tblock" data-h="${h}" style="${bg?'background:'+bg+';':''}${bc?'border-color:'+bc+';':''}" onclick="Daily.paintBlock(${h})">${h}</div>`;
            }).join('')}
          </div>
          <div class="legend">
            ${TBLOCK_CATS.filter(c=>c.k!=='none').map(c=>`<span><i style="background:${c.color}"></i>${c.label}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  },

  saveGoal(type, value){
    const today = todayStr();
    if(!State.dailyGoals[today]) State.dailyGoals[today] = { year:'', month:'', day:'' };
    State.dailyGoals[today][type] = value;
    save('dailyGoals', State.dailyGoals);
  },

  pickMood(el, m){
    document.querySelectorAll('#moodRow .mood-opt').forEach(e=>e.classList.remove('sel'));
    el.classList.add('sel');
    this.selectedMood = m;
    document.getElementById('dailyMoodDisplay').innerHTML = moodIconHtml(m,22);
    this.autoSave();
  },

  setActiveCat(el, k){
    document.querySelectorAll('#dailyPlanPane .pill[data-cat]').forEach(e=>e.style.outline='none');
    el.style.outline='2px solid var(--ink)';
    this.activeCat = k;
  },

  paintBlock(h){
    this.draftBlocks[h] = this.draftBlocks[h]===this.activeCat ? 'none' : this.activeCat;
    const cat = TBLOCK_CATS.find(c=>c.k===this.draftBlocks[h]);
    const cell = document.querySelector(`#formBlocks .tblock[data-h="${h}"]`);
    cell.style.background = cat.k==='none' ? '' : cat.color+'33';
    cell.style.borderColor = cat.k==='none' ? '' : cat.color;
    this.autoSave();
  },

  autoSave(){
    const textEl = document.getElementById('dailyText');
    if(!textEl) return;
    const text = textEl.value.trim();
    const today = todayStr();
    
    if(!text && Object.keys(this.draftBlocks).filter(k=>this.draftBlocks[k]!=='none').length===0){
      // Nothing to save, remove entry if exists
      if(this.todayEntryId){
        State.daily = State.daily.filter(e=>e.id!==this.todayEntryId);
        this.todayEntryId = null;
        save('daily', State.daily);
        Home.render();
      }
      return;
    }
    
    const entry = {
      id: this.todayEntryId || uid(),
      date: today,
      mood: this.selectedMood,
      text,
      blocks:{...this.draftBlocks}
    };
    
    if(this.todayEntryId){
      // Update existing
      const idx = State.daily.findIndex(e=>e.id===this.todayEntryId);
      if(idx>=0) State.daily[idx] = entry;
    } else {
      // Create new
      State.daily.unshift(entry);
      this.todayEntryId = entry.id;
    }
    
    State.daily.sort((a,b)=>b.date.localeCompare(a.date));
    save('daily', State.daily);
    Home.render();
  },

  deleteEntry(id){
    if(!confirm('刪除這篇筆記？')) return;
    State.daily = State.daily.filter(e=>e.id!==id);
    save('daily', State.daily);
    this.render();
  },

  /* ---- Chart Tab ---- */
  renderChart(){
    const el = document.getElementById('dailyChartPane');
    if(State.daily.length===0){
      el.innerHTML = `<div class="empty"><span class="big"><i class="ph ph-chart-bar"></i></span>還沒有任何日常筆記</div>`;
      return;
    }
    const counts = {};
    TBLOCK_CATS.filter(c=>c.k!=='none').forEach(c=>counts[c.k]=0);
    State.daily.forEach(e=>{
      if(e.blocks){
        Object.values(e.blocks).forEach(v=>{
          if(v!=='none' && counts[v]!==undefined) counts[v]++;
        });
      }
    });
    const total = Object.values(counts).reduce((s,v)=>s+v,0) || 1;
    el.innerHTML = `
      <div class="card">
        <h3 style="font-size:15px; margin-bottom:12px;">每日類別時間分布</h3>
        ${TBLOCK_CATS.filter(c=>c.k!=='none').map(c=>{
          const pct = Math.round(counts[c.k]/total*100);
          return `<div class="chart-bar">
            <span class="bar-label">${c.label}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${c.color};"></div></div>
            <span class="bar-val">${pct}%</span>
          </div>`;
        }).join('')}
      </div>
      <div class="card">
        <h3 style="font-size:15px; margin-bottom:8px;">統計摘要</h3>
        <div style="font-size:13px; color:var(--ink-soft);">
          共 ${State.daily.length} 篇筆記<br>
          ${TBLOCK_CATS.filter(c=>c.k!=='none').map(c=>`${c.label}：${counts[c.k]} 小時`).join('<br>')}
        </div>
      </div>
    `;
  },

  /* ---- Review Tab ---- */
  renderReview(){
    const el = document.getElementById('dailyReviewPane');
    const reviews = State.reviews;
    el.innerHTML = `
      <div class="tabs" style="margin-top:0;">
        <button class="tab-btn active" id="revTabWeek" onclick="Daily.showReviewType('week')">週檢討</button>
        <button class="tab-btn" id="revTabMonth" onclick="Daily.showReviewType('month')">月檢討</button>
        <button class="tab-btn" id="revTabYear" onclick="Daily.showReviewType('year')">年檢討</button>
      </div>
      <div id="reviewContent"></div>
    `;
    this.showReviewType('week');
  },

  showReviewType(type){
    ['revTabWeek','revTabMonth','revTabYear'].forEach(id=>{
      document.getElementById(id).classList.remove('active');
    });
    document.getElementById('revTab'+type.charAt(0).toUpperCase()+type.slice(1)).classList.add('active');

    const el = document.getElementById('reviewContent');
    const weekKey = 'week-'+this.getWeekKey();
    const monthKey = 'month-'+new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0');
    const yearKey = 'year-'+new Date().getFullYear();

    const keyMap = { week:weekKey, month:monthKey, year:yearKey };
    const labelMap = { week:'本週', month:'本月', year:'本年' };
    const currentKey = keyMap[type];
    const content = State.reviews[currentKey] || '';

    el.innerHTML = `
      <div class="review-card">
        <h4>${labelMap[type]}檢討</h4>
        <textarea id="reviewText" placeholder="這${type==='week'?'週':type==='month'?'個月':'年'}的反思與收穫…" onblur="Daily.saveReview('${currentKey}',this.value)">${esc(content)}</textarea>
      </div>
      <div class="section-title"><h2>歷史檢討</h2></div>
      ${this.getReviewHistory(type)}
    `;
  },

  getWeekKey(){
    const d = new Date();
    const start = getWeekStart(d);
    return fmtDate(start);
  },

  saveReview(key, value){
    State.reviews[key] = value;
    save('reviews', State.reviews);
  },

  getReviewHistory(type){
    const keys = Object.keys(State.reviews).filter(k=>k.startsWith(type+'-')).sort().reverse();
    if(keys.length===0) return `<div class="empty" style="padding:20px;">還沒有檢討紀錄</div>`;
    return keys.map(k=>{
      const val = State.reviews[k];
      if(!val) return '';
      const label = k.replace(/^(week|month|year)-/, '');
      return `<div class="review-card"><h4>${label}</h4><div class="review-text">${esc(val)}</div></div>`;
    }).join('');
  },

  /* ---- Diary Tab ---- */
  renderDiary(){
    const el = document.getElementById('dailyDiaryPane');
    const entries = State.daily.filter(e=>e.text && e.text.trim());
    if(entries.length===0){
      el.innerHTML = `<div class="empty"><span class="big"><i class="ph ph-book"></i></span>還沒有日記紀錄<br>在計劃表「寫點什麼」欄位寫下心情，就會出现在這裡</div>`;
      return;
    }
    el.innerHTML = entries.map(e=>`
      <div class="card entry-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="d">${niceDate(e.date)} · 星期${WD[new Date(e.date).getDay()]}</span>
          <span class="mood">${moodIconHtml(e.mood,22)}</span>
        </div>
        <div class="txt">${esc(e.text)}</div>
        <div style="margin-top:10px; text-align:right;"><span class="more" style="color:var(--ink-soft); font-size:11.5px; cursor:pointer;" onclick="Daily.deleteEntry('${e.id}')">刪除</span></div>
      </div>`).join('');
  }
};
