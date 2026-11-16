/* 語文常識 MCQ 引擎：讀取 <script id="bank" type="application/json"> */
(function(){
const U=JSON.parse(document.getElementById('bank').textContent);
const L='ABCD';const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const main=document.getElementById('quiz');const state={};let total=0,autoDone=false;
const nameEl=document.getElementById('studentName');
try{nameEl.value=localStorage.getItem('jhsStudentName')||''}catch(e){}
function nameOK(){return nameEl.value.trim().length>0}
function syncName(){const ok=nameOK();document.querySelector('.student').classList.toggle('ok',ok);document.querySelector('.student-hint').textContent=ok?'可以開始作答了！':'輸入姓名後開始作答';main.classList.toggle('locked',!ok);try{localStorage.setItem('jhsStudentName',nameEl.value.trim())}catch(e){}}
nameEl.addEventListener('input',syncName);
let html='';
U.sections.forEach((s,si)=>{
  html+=`<section class="panel" id="${s.id}"><div class="section-head"><div><p class="eyebrow">PART ${si+1}</p><h2>${esc(s.title)}</h2></div><span class="sec-score" id="ss-${s.id}">0 / ${s.items.length}</span></div>`;
  if(s.ref)html+=`<details class="ref"><summary>先看重點整理（作答時建議收起）</summary>${s.ref}</details>`;
  s.items.forEach((q,qi)=>{const id=`${s.id}-${qi}`;total++;
    html+=`<div class="q" id="q-${id}" data-id="${id}"><div class="q-top"><span class="num">${qi+1}</span><div>${q.src?`<div class="src">${esc(q.src)}</div>`:''}${(q.box||[]).map(b=>`<div class="box">${esc(b)}</div>`).join('')}<div class="stem">${esc(q.stem)}</div></div></div>
    <div class="opts">${q.opts.map((o,oi)=>`<button class="opt" data-o="${oi}"><span class="L">(${L[oi]})</span><span>${esc(o)}</span></button>`).join('')}</div>
    <div class="fb"><div class="ans"></div><div class="exp">💡 ${esc(q.exp)}</div></div></div>`});
  html+=`</section>`});
main.innerHTML=html;
const find=id=>{const[sid,qi]=id.split(/-(?=\d+$)/);const s=U.sections.find(x=>x.id===sid);return{s,q:s.items[+qi],qi:+qi}};
main.addEventListener('click',e=>{const b=e.target.closest('.opt');if(!b)return;const card=b.closest('.q');const id=card.dataset.id;if(state[id]!==undefined)return;
  if(!nameOK()){nameEl.focus();nameEl.scrollIntoView({behavior:'smooth',block:'center'});return}
  const{s,q}=find(id);const pick=+b.dataset.o;state[id]=pick;const ok=pick===q.ans;
  card.classList.add('done',ok?'correct':'incorrect');b.classList.add(ok?'good':'bad');card.querySelector(`[data-o="${q.ans}"]`).classList.add('good');
  card.querySelector('.ans').textContent=ok?`✔ 答對了！答案 (${L[q.ans]})`:`✘ 你選 (${L[pick]})，正確答案是 (${L[q.ans]}) ${q.opts[q.ans]}`;
  update(s)});
function update(s){const ids=s.items.map((_,i)=>`${s.id}-${i}`);const done=ids.filter(i=>state[i]!==undefined);const right=done.filter(i=>{const f=find(i);return state[i]===f.q.ans});
  document.getElementById('ss-'+s.id).textContent=`答對 ${right.length} / ${s.items.length}`;
  if(done.length===ids.length&&right.length===ids.length)confetti();
  const all=Object.keys(state).length;const allRight=Object.keys(state).filter(i=>state[i]===find(i).q.ans).length;
  document.getElementById('score').textContent=`已作答 ${all} / ${total}　答對 ${allRight}`;
  if(all===total&&!autoDone){autoDone=true;setTimeout(download,600)}}
function confetti(){const em=['🎉','🌸','✨','🎊','⭐'];for(let i=0;i<36;i++){const d=document.createElement('div');d.className='confetti';d.textContent=em[i%em.length];d.style.left=Math.random()*100+'vw';d.style.animationDelay=Math.random()*.8+'s';document.body.appendChild(d);setTimeout(()=>d.remove(),3600)}}
function download(){const items=[];let right=0,all=0;
  U.sections.forEach(s=>s.items.forEach((q,qi)=>{const id=`${s.id}-${qi}`;all++;const p=state[id];if(p===q.ans){right++;return}
    items.push({source:`${s.title}　第 ${qi+1} 題${q.src?'｜'+q.src:''}`,box:q.box||[],stem:q.stem,options:q.opts.map((o,i)=>`(${L[i]})${o}`),selected:p===undefined?'未作答':`(${L[p]})${q.opts[p]}`,answer:`(${L[q.ans]})${q.opts[q.ans]}`,explanation:q.exp})}));
  const nm=nameEl.value.trim()||'未填姓名';
  MistakeDocx.download({title:`${U.title} 成績與錯題詳解`,subtitle:'國中國文 · 語文常識',meta:[`學生：${nm}`,`成績：答對 ${right} / ${all} 題（${Math.round(right/all*100)} 分）`],items,filename:`語文常識_${U.title}_${nm}`})}
document.getElementById('dl').addEventListener('click',download);
document.getElementById('reset').addEventListener('click',()=>{if(!confirm('確定要清除所有作答紀錄重新開始？'))return;for(const k in state)delete state[k];autoDone=false;
  document.querySelectorAll('.q').forEach(c=>{c.classList.remove('done','correct','incorrect');c.querySelectorAll('.opt').forEach(o=>o.classList.remove('good','bad'))});U.sections.forEach(update);window.scrollTo({top:0,behavior:'smooth'})});
document.getElementById('score').textContent=`已作答 0 / ${total}　答對 0`;
syncName();
})();
