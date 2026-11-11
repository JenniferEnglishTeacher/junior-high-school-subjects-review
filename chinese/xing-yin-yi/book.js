/* 形音義書本單元：全部內容題目化＋計分＋完成一回自動下載成績與錯題 DOCX */
const data=JSON.parse(document.querySelector('#unit-data').textContent);
const score=document.querySelector('#score');
const groups=data.groups;
const total=groups.reduce((n,g)=>n+g.questions.length,0);
const pageTitle=document.querySelector('.hero h1').innerText.replace(/\s+/g,' ').trim();
const results=new Map(); // `${gid}:${i}` -> {ok, selected}
let finished=false;

function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function mark(t){return esc(t).replace(/&lt;br&gt;/g,'<br>').replace(/「([^」]{1,24})」/g,'「<span class="target-text">$1</span>」')}
function rich(t){return String(t).replace(/「([^」]{1,24})」/g,'「<span class="target-text">$1</span>」')}
function table(rows){if(!rows||!rows.length)return'';const [h,...b]=rows;return `<div class="table-wrap"><table class="q-table"><thead><tr>${h.map(c=>`<th>${mark(c)}</th>`).join('')}</tr></thead><tbody>${b.map(r=>`<tr>${r.map(c=>`<td>${mark(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
const okCount=()=>[...results.values()].filter(r=>r.ok).length;

/* ---------- 學生姓名 ---------- */
const nameInput=document.querySelector('#studentName');
const hint=document.querySelector('.student-hint');
function getName(){return nameInput?nameInput.value.trim():''}
function lockState(){const on=!!getName();document.body.classList.toggle('locked',!on);if(hint)hint.textContent=on?`${getName()}，開始作答吧！完成全部 ${total} 題會自動下載成績單。`:'請先輸入姓名才能作答'}
if(nameInput){try{nameInput.value=localStorage.getItem('xyy-student')||''}catch(e){}
  nameInput.addEventListener('input',()=>{try{localStorage.setItem('xyy-student',getName())}catch(e){}lockState()});}
lockState();
function needName(){if(getName())return false;nameInput.focus();nameInput.scrollIntoView({behavior:'smooth',block:'center'});nameInput.classList.add('shake');setTimeout(()=>nameInput.classList.remove('shake'),600);return true}

/* ---------- 錯題整理 ---------- */
function itemFor(g,q,i){
  const r=results.get(`${g.id}:${i}`);const sel=r?r.selected:'未作答';const src=`${g.section}・${g.title}　第 ${i+1} 題`;
  if(g.type==='match')return{source:src,stem:`${q.word}　（□ 應填哪個字？）`,options:[`本組字：${g.chars.join('、')}`],selected:sel,answer:`${q.answer}（${q.full}）`,explanation:q.explanation};
  if(g.type==='dual')return{source:src,stem:`「${q.word}」中的「${q.ch}」：選出注音與字義`,options:[`注音：${q.zyOpts.join('、')}`,`字義：${q.meanOpts.join('／')}`],selected:sel,answer:`${q.zy}／${q.mean}`,explanation:q.explanation};
  return{source:src,box:q.box||[],table:q.table||[],stem:q.stem!==undefined?q.stem:q.prompt,options:q.options,selected:sel,answer:q.answer,explanation:q.explanation};
}
function mistakes(gid){const out=[];groups.forEach(g=>{if(gid&&g.id!==gid)return;g.questions.forEach((q,i)=>{const r=results.get(`${g.id}:${i}`);if(r&&r.ok)return;out.push(itemFor(g,q,i))})});return out}
function stamp(){const d=new Date(),p=n=>String(n).padStart(2,'0');return{text:`${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`,file:`${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`}}
function sectionLines(){const m=new Map();groups.forEach(g=>{const s=m.get(g.section)||{ok:0,n:0};g.questions.forEach((q,i)=>{s.n++;const r=results.get(`${g.id}:${i}`);if(r&&r.ok)s.ok++});m.set(g.section,s)});return[...m].map(([k,v])=>`${k}：${v.ok} / ${v.n}`).join('　｜　')}
function downloadAll(){
  const t=stamp(),ok=okCount(),pts=Math.round(ok/total*100),name=getName()||'未填姓名';
  MistakeDocx.download({title:`${pageTitle} 成績與錯題詳解`,subtitle:'國中國文 · 形音義比較 · 書本單元',
    meta:[`學生姓名：${name}`,`完成日期時間：${t.text}`,`得分：${pts} 分（答對 ${ok} / ${total} 題）`,`各區答對：${sectionLines()}`],
    items:mistakes(null),filename:`${pageTitle.replace(/\s+/g,'')}_${name}_${t.file}_${pts}分`});
}
function downloadGroup(g){
  const done=g.questions.filter((q,i)=>results.has(`${g.id}:${i}`)).length,ok=g.questions.filter((q,i)=>(results.get(`${g.id}:${i}`)||{}).ok).length;
  const t=stamp(),name=getName()||'未填姓名';
  MistakeDocx.download({title:`${pageTitle}｜${g.section}・${g.title} 錯題詳解`,subtitle:'國中國文 · 形音義比較',
    meta:[`學生姓名：${name}`,`下載時間：${t.text}`,`本區答對：${ok} / ${g.questions.length} 題（已作答 ${done} 題）`],
    items:mistakes(g.id),filename:`${pageTitle.replace(/\s+/g,'')}_${g.title}_${name}_${t.file}`});
}


/* ---------- 灑花 ---------- */
function confetti(big){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const c=document.createElement('canvas');c.className='confetti';document.body.appendChild(c);
  const x=c.getContext('2d'),W=c.width=innerWidth,H=c.height=innerHeight;
  const cols=['#c0392b','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#ff6fa8'];
  const N=big?260:140,P=[];
  for(let i=0;i<N;i++){const side=i%2?W*0.15:W*0.85;P.push({x:big?Math.random()*W:side,y:big?-20-Math.random()*H*0.3:H*0.65,
    vx:big?(Math.random()-.5)*4:(i%2?1:-1)*(2+Math.random()*6),vy:big?2+Math.random()*3:-(8+Math.random()*9),
    r:Math.random()*Math.PI,vr:(Math.random()-.5)*.3,w:6+Math.random()*7,h:4+Math.random()*5,c:cols[i%cols.length]})}
  const t0=performance.now();
  (function f(t){x.clearRect(0,0,W,H);let alive=false;
    P.forEach(p=>{p.vy+=0.25;p.vx*=0.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;if(p.y<H+20)alive=true;
      x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2,p.w,p.h);x.restore()});
    if(alive&&t-t0<4500)requestAnimationFrame(f);else c.remove()})(t0);
}
function cheer(el,text){const b=document.createElement('div');b.className='cheer';b.textContent=text;el.appendChild(b);setTimeout(()=>b.remove(),2600)}
const CHEERS=['全對！太厲害了 🎉','滿分！繼續保持 ✨','一題都沒錯 👏','完美！下一區衝 🚀','全對過關 🌟'];

/* ---------- 計分 ---------- */
const bars=new Map();
function record(g,i,ok,selected){
  results.set(`${g.id}:${i}`,{ok,selected});
  const b=bars.get(g.id);if(b)b();
  const n=results.size,ok2=okCount();
  score.classList.add('show');
  score.querySelector('span').textContent=n<total?`進度 ${n} / ${total}・答對 ${ok2} 題`:`全部完成：${ok2} / ${total} 題答對（${Math.round(ok2/total*100)} 分）`;
  if(n===total&&!finished){finished=true;finish()}
}
function finish(){
  dlAll.hidden=false;dlAll.textContent=`再次下載成績與錯題 DOCX（${total-okCount()} 題）`;
  downloadAll();
  if(okCount()===total)confetti(true);
  const box=document.createElement('div');box.className='finish';box.setAttribute('role','status');
  box.innerHTML=`<strong>完成一回！</strong> ${esc(getName())}，得分 ${Math.round(okCount()/total*100)} 分（${okCount()} / ${total}）。成績與錯題 DOCX 已自動下載。`;
  score.before(box);box.scrollIntoView({behavior:'smooth',block:'center'});
}

/* ---------- 題型 ---------- */
function renderMCQ(g,list){
  g.questions.forEach((q,i)=>{
    const card=document.createElement('article');card.className='question';
    const prompt=q.stem!==undefined?q.stem:q.prompt;
    const box=(q.box&&q.box.length)?`<div class="q-box">${q.box.map(t=>`<p>${mark(t)}</p>`).join('')}</div>`:'';
    const after=(q.after&&q.after.length)?q.after.map(t=>`<p class="q-after">${mark(t)}</p>`).join(''):'';
    card.innerHTML=`<div class="q-meta">${esc(q.source||g.title)} · 第 ${i+1} 題</div>${prompt?`<h3>${mark(prompt)}</h3>`:''}${box}${table(q.table)}${after}<div class="options"></div><div class="feedback"><strong></strong><div class="explain"></div></div>`;
    const opts=card.querySelector('.options');if(q.options.some(o=>o.length>14))opts.classList.add('wide');
    q.options.forEach(choice=>{const b=document.createElement('button');b.type='button';b.className='option';b.innerHTML=mark(choice);b.dataset.value=choice;
      b.addEventListener('click',()=>{if(card.dataset.done||needName())return;card.dataset.done='1';const ok=choice===q.answer;
        [...opts.children].forEach(x=>{x.disabled=true;if(x.dataset.value===q.answer)x.classList.add('correct')});if(!ok)b.classList.add('wrong');
        const f=card.querySelector('.feedback');f.classList.add('show');f.querySelector('strong').textContent=ok?'答對了！':'再想想看。';
        f.querySelector('.explain').innerHTML=`正確答案：<span class="target-text">${esc(q.answer)}</span><br>${rich(q.explanation)}`;
        record(g,i,ok,choice)});opts.appendChild(b)});
    list.appendChild(card);
  });
}
function renderMatch(g,list){
  const wrap=document.createElement('div');wrap.className='m-rows';
  g.questions.forEach((q,i)=>{
    const row=document.createElement('div');row.className='m-row';
    row.innerHTML=`<span class="m-num">${i+1}</span><span class="m-w">${esc(q.word).replace('□','<span class="blank">□</span>')}</span><span class="m-btns"></span><div class="m-exp"></div>`;
    const btns=row.querySelector('.m-btns');
    g.chars.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='m-char';b.textContent=c;
      b.addEventListener('click',()=>{if(row.dataset.done||needName())return;row.dataset.done='1';const ok=c===q.answer;
        [...btns.children].forEach(x=>{x.disabled=true;if(x.textContent===q.answer)x.classList.add('correct')});if(!ok)b.classList.add('wrong');
        row.classList.add(ok?'good':'bad');
        row.querySelector('.m-w').innerHTML=esc(q.full).split(esc(q.answer)).join(`<span class="fill">${esc(q.answer)}</span>`);
        row.querySelector('.m-exp').innerHTML=(ok?'':`<strong>應為「${esc(q.answer)}」</strong>　`)+rich(q.explanation).replace(/<br>.*$/,'');
        record(g,i,ok,c)});btns.appendChild(b)});
    wrap.appendChild(row);
  });
  const legend=document.createElement('p');legend.className='m-legend';legend.textContent=`本組字：${g.chars.join('、')}　｜　每列直接點旁邊正確的字，一次一點。`;
  list.appendChild(legend);list.appendChild(wrap);
}
function renderDual(g,list){
  g.questions.forEach((q,i)=>{
    const card=document.createElement('article');card.className='question dual';
    const w=esc(q.word).split(esc(q.ch)).join(`<span class="target-text">${esc(q.ch)}</span>`);
    card.innerHTML=`<div class="q-meta">${esc(g.section)} · 第 ${i+1} 題</div><h3>${w}</h3><p class="d-label">① 注音</p><div class="options zy"></div><p class="d-label">② 字義</p><div class="options wide mean"></div><div class="feedback"><strong></strong><div class="explain"></div></div>`;
    const pick={};
    const row=(cls,arr,key)=>{const box=card.querySelector(cls);arr.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='option';b.textContent=v;b.dataset.value=v;
      b.addEventListener('click',()=>{if(pick[key]!==undefined||needName())return;pick[key]=v;[...box.children].forEach(x=>{x.disabled=true});b.classList.add('picked');
        if(pick.zy!==undefined&&pick.mean!==undefined)judge()});box.appendChild(b)})};
    row('.zy',q.zyOpts,'zy');row('.mean',q.meanOpts,'mean');
    function judge(){const zo=pick.zy===q.zy,mo=pick.mean===q.mean,ok=zo&&mo;
      card.querySelectorAll('.zy .option').forEach(x=>{if(x.dataset.value===q.zy)x.classList.add('correct');else if(x.classList.contains('picked'))x.classList.add('wrong')});
      card.querySelectorAll('.mean .option').forEach(x=>{if(x.dataset.value===q.mean)x.classList.add('correct');else if(x.classList.contains('picked'))x.classList.add('wrong')});
      const f=card.querySelector('.feedback');f.classList.add('show');f.querySelector('strong').textContent=ok?'兩項都答對了！':(!zo&&!mo?'注音和字義都要再留意。':!zo?'字義對了，注音錯了。':'注音對了，字義錯了。');
      f.querySelector('.explain').innerHTML=`正確答案：<span class="target-text">${esc(q.zy)}</span>／${esc(q.mean)}<br>${rich(q.explanation)}`;
      record(g,i,ok,`${pick.zy}／${pick.mean}`)}
    list.appendChild(card);
  });
}

groups.forEach(g=>{
  const list=document.querySelector(`.question-list[data-group="${g.id}"]`);if(!list)return;
  ({match:renderMatch,dual:renderDual}[g.type]||renderMCQ)(g,list);
  const bar=document.createElement('div');bar.className='group-bar';
  bar.innerHTML=`<span class="gprog">本區進度：0 / ${g.questions.length}</span><button type="button" class="dl" disabled>完成本區後可下載錯題詳解 DOCX</button>`;
  const prog=bar.querySelector('.gprog'),btn=bar.querySelector('.dl');btn.addEventListener('click',()=>downloadGroup(g));
  bars.set(g.id,()=>{const done=g.questions.filter((q,i)=>results.has(`${g.id}:${i}`)).length,ok=g.questions.filter((q,i)=>(results.get(`${g.id}:${i}`)||{}).ok).length;
    prog.textContent=`本區進度：${done} / ${g.questions.length}　答對 ${ok} 題`;
    if(done===g.questions.length&&!bar.classList.contains('ready')){btn.disabled=false;bar.classList.add('ready');
      if(ok===g.questions.length){btn.textContent='本區全對！下載紀錄 DOCX';bar.classList.add('perfect');confetti(false);cheer(bar,CHEERS[Math.floor(Math.random()*CHEERS.length)])}
      else btn.textContent=`下載本區錯題詳解 DOCX（${g.questions.length-ok} 題）`}});
  list.after(bar);
});
const dlAll=document.createElement('button');dlAll.type='button';dlAll.className='reset dl-all';dlAll.hidden=true;dlAll.addEventListener('click',downloadAll);
score.querySelector('#resetQuiz').before(dlAll);
score.classList.add('show');score.querySelector('span').textContent=`進度 0 / ${total}`;
document.querySelector('#resetQuiz').addEventListener('click',()=>location.reload());
const wf=document.querySelector('#wordFilter');
if(wf){const rows=[...document.querySelectorAll('#wordTable tbody tr')];wf.addEventListener('input',()=>{const t=wf.value.trim().split(/\s+/).filter(Boolean);rows.forEach(r=>{r.style.display=(t.length===0||t.some(x=>r.textContent.includes(x)))?'':'none'})})}
