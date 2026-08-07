/* ============================================================
   home.js — Home Page
   ============================================================ */

const Home = {
  render(){
    const d = new Date();
    document.getElementById('homeDateBig').textContent = `${d.getMonth()+1}/${d.getDate()}`;
    document.getElementById('homeDow').textContent = '星期'+WD[d.getDay()];

    document.getElementById('sumDaily').textContent = State.daily.length
      ? `共 ${State.daily.length} 篇 · 最新：${niceDate(State.daily[0].date)}` : '尚無紀錄，點此新增';

    const bal = State.pockets.reduce((s,p)=>s+p.balance,0);
    document.getElementById('sumMoney').textContent = `總餘額 NT$${bal.toLocaleString()}`;

    const soon = State.items.filter(it=>daysUntil(it.expiry)!==null && daysUntil(it.expiry)<=7).length;
    document.getElementById('sumItems').textContent = soon>0 ? `⚠ ${soon} 項即將到期` : `共 ${State.items.length} 項追蹤中`;

    document.getElementById('sumArticles').textContent = State.articles.length
      ? `${State.articles.filter(a=>a.status==='待讀').length} 篇待讀` : '尚無紀錄，點此新增';

    const list = document.getElementById('homeTodos');
    const todos = (State.todos[todayStr()]||[]);
    if(todos.length===0){
      list.innerHTML = `<div class="empty"><span class="big">☀️</span>今天還沒有安排代辦事項<br><span style="font-size:12px;" onclick="App.go('calendar')">前往行事曆新增 →</span></div>`;
      return;
    }
    list.innerHTML = todos.map(t=>`
      <div class="todo-row">
        <div class="chk ${t.done?'done':''}" onclick="Calendar.toggleTodo('${todayStr()}','${t.id}')">${t.done?'✓':''}</div>
        <div class="t ${t.done?'done':''}">${esc(t.text)}</div>
      </div>`).join('');
  }
};
