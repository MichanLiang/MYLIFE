/* ============================================================
   utils.js — Utilities, State, Constants
   ============================================================ */

const LS = {
  user:'mylife_user', theme:'mylife_theme', order:'mylife_order',
  daily:'mylife_daily', money:'mylife_money', pockets:'mylife_pockets',
  items:'mylife_items', chores:'mylife_chores', articles:'mylife_articles',
  todos:'mylife_todos', budget:'mylife_budget', lists:'mylife_lists',
  dailyGoals:'mylife_dailyGoals', reviews:'mylife_reviews',
  calReviews:'mylife_calReviews'
};

function load(key, fallback){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; }catch(e){return fallback;} }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function todayStr(){ return fmtDate(new Date()); }
function fmtDate(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function niceDate(dstr){ const [y,m,d]=dstr.split('-'); return `${parseInt(m)}月${parseInt(d)}日`; }
function esc(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
const WD = ['日','一','二','三','四','五','六'];

function daysUntil(dateStr){
  if(!dateStr) return null;
  const d=new Date(dateStr+'T00:00:00');
  const t=new Date(todayStr()+'T00:00:00');
  return Math.round((d-t)/86400000);
}

function getWeekStart(date){
  const d=new Date(date);
  d.setDate(d.getDate()-d.getDay());
  return d;
}

function getMonthStart(date){
  const d=new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function dateRange(start, end){
  const dates=[];
  const d=new Date(start);
  while(d<=end){ dates.push(fmtDate(d)); d.setDate(d.getDate()+1); }
  return dates;
}

/* ---- Constants ---- */
const MOODS = ['😊','😌','😴','😤','😢','🤩','😐'];

const TBLOCK_CATS = [
  {k:'work', label:'工作/課業', color:'#4E6E8E'},
  {k:'rest', label:'休息', color:'#6F8F63'},
  {k:'life', label:'生活瑣事', color:'#B8842E'},
  {k:'social', label:'社交', color:'#8A5578'},
  {k:'none', label:'未填', color:'#DFD5BE'},
];

const MONEY_CATS = [
  {k:'食', ic:'🍚'}, {k:'交通', ic:'🚌'}, {k:'生活用品', ic:'🧴'}, {k:'娛樂', ic:'🎮'},
  {k:'學業', ic:'📚'}, {k:'醫療', ic:'💊'}, {k:'其他', ic:'✨'}
];

function tblockHours(){ const arr=[]; for(let h=6;h<23;h++) arr.push(h); return arr; }

/* ---- State ---- */
const State = {
  user: load(LS.user, null),
  theme: load(LS.theme, 'default'),
  order: load(LS.order, ['home','calendar','daily','money','items','articles']),
  daily: load(LS.daily, []),
  pockets: load(LS.pockets, [
    {id:uid(), name:'錢包', balance:1500, icon:'👛'},
    {id:uid(), name:'銀行帳戶', balance:20000, icon:'🏦'}
  ]),
  money: load(LS.money, []),
  items: load(LS.items, []),
  chores: load(LS.chores, []),
  articles: load(LS.articles, []),
  todos: load(LS.todos, {}),
  budget: load(LS.budget, { monthly: 0 }),
  lists: load(LS.lists, [{id:'default', name:'預設清單'}]),
  dailyGoals: load(LS.dailyGoals, {}),
  reviews: load(LS.reviews, {}),
  calReviews: load(LS.calReviews, {})
};

function saveState(key){ save(LS[key], State[key]); }
function pocketById(id){ return State.pockets.find(p=>p.id===id); }
function listById(id){ return State.lists.find(l=>l.id===id); }

/* ---- NAV ---- */
const NAV_META = {
  home:{icon:'🏠', label:'首頁'},
  calendar:{icon:'🗓️', label:'行事曆'},
  daily:{icon:'📓', label:'日常筆記'},
  money:{icon:'💰', label:'記帳'},
  items:{icon:'🧺', label:'消耗品'},
  articles:{icon:'📰', label:'筆記本'},
};

/* ---- Categories for items ---- */
const ITEM_CATEGORIES = ['保養品','食品','清潔用品','文具','日用品','其他'];
