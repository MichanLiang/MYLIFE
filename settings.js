/* ============================================================
   settings.js — Settings Page
   ============================================================ */

const THEMES = [
  {k:'default', label:'原木暖調', c1:'#F7F2E7', c2:'#7A5540'},
  {k:'ink', label:'墨夜', c1:'#20211D', c2:'#E7D8B8'},
  {k:'blush', label:'胭脂', c1:'#FBF1EE', c2:'#B15C4B'},
  {k:'sea', label:'海霧', c1:'#EFF4F2', c2:'#2E6E62'},
];

const Settings = {
  render(){
    const user = State.user;
    document.getElementById('setAvatar').textContent = user?.initial || '我';
    document.getElementById('setName').textContent = user?.name || '訪客';
    document.getElementById('setEmail').textContent = user?.email || '';

    if(user?.picture){
      document.getElementById('setAvatar').innerHTML = `<img src="${user.picture}" alt="${user.name}">`;
    }

    const tr = document.getElementById('themeRow');
    tr.innerHTML = THEMES.map(t=>`<div class="theme-swatch ${State.theme===t.k?'sel':''}" title="${t.label}" style="background:linear-gradient(135deg, ${t.c1} 50%, ${t.c2} 50%);" onclick="Settings.setTheme('${t.k}')"></div>`).join('');

    const ol = document.getElementById('orderList');
    ol.innerHTML = State.order.map((k,i)=>{
      const m = NAV_META[k];
      return `<div class="order-row">
        <span class="ic"><i class="${m.icon}"></i></span><span class="nm">${m.label}</span>
        <div class="order-arrows">
          <button ${i===0?'disabled':''} onclick="Settings.moveOrder(${i},-1)"><i class="ph ph-caret-up"></i></button>
          <button ${i===State.order.length-1?'disabled':''} onclick="Settings.moveOrder(${i},1)"><i class="ph ph-caret-down"></i></button>
        </div>
      </div>`;
    }).join('');
  },

  setTheme(k){
    State.theme=k;
    save('theme',k);
    document.documentElement.setAttribute('data-theme', k==='default'?'':k);
    this.render();
  },

  moveOrder(i,dir){
    const j=i+dir; if(j<0||j>=State.order.length) return;
    [State.order[i], State.order[j]] = [State.order[j], State.order[i]];
    save('order', State.order); this.render(); App.renderNav();
  }
};
