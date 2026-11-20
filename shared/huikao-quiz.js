/* 會考歷屆試題（圖片題）通用作答引擎：讀取 ./bank.json，依 ?year= 或 ?cat= 篩選；<body data-subject="自然"> */
(async function(){
const L='ABCD';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const P=new URLSearchParams(location.search);
const YEAR=P.get('year'), CAT=P.get('cat'), SUB=P.get('sub');
const SUBJ=document.body.dataset.subject||'';
const B=await (await fetch('./bank.json?v=20261116b')).json();
B.groups=B.groups||[];B.questions.forEach(q=>{q.fig=q.fig??true;q.opts=q.opts||[];q.sub=q.sub||'';q.group=q.group||null;q.eimgs=q.eimgs||[];q.exp=q.exp||''});
const G=Object.fromEntries(B.groups.map(g=>[g.id,g]));
let Q=B.questions.filter(q=>(!YEAR||String(q.year)===YEAR)&&(!CAT||q.cat===CAT)&&(!SUB||q.sub===SUB));
Q.sort((a,b)=>YEAR?a.n-b.n:(b.year-a.year)||(a.n-b.n));
const title=YEAR?`${YEAR} 年會考${SUBJ}`:`${CAT}${SUB?'（'+SUB+'）':''}`;
document.title=`${title}｜會考${SUBJ}歷屆試題`;
document.getElementById('crumb').textContent=title;
document.getElementById('title').textContent=title;
document.getElementById('eyebrow').textContent=YEAR?`會考${SUBJ}歷屆試題 · 依年份`:`會考${SUBJ}歷屆試題 · 依分類`;
document.getElementById('intro').textContent=YEAR?
  `${YEAR} 年國中教育會考${SUBJ}科單題，共 ${Q.length} 題。點選答案立即看正確答案與詳解；全部作答完會自動下載成績與錯題 DOCX。`:
  `收錄 106～115 年會考${SUBJ}「${CAT}${SUB?'・'+SUB:''}」共 ${Q.length} 題，由新到舊排列。點選答案立即看詳解；全部作答完會自動下載成績與錯題 DOCX。`;

// 年份篩選（題型模式）
const years=[...new Set(Q.map(q=>q.year))].sort((a,b)=>b-a);
let yearFilter='all';
const fbox=document.getElementById('filters');
if(!YEAR&&years.length>1){
  fbox.innerHTML=`<button class="on" data-y="all">全部年份</button>`+years.map(y=>`<button data-y="${y}">${y} 年</button>`).join('');
  fbox.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;yearFilter=b.dataset.y;
    fbox.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
    document.querySelectorAll('[data-year]').forEach(el=>el.style.display=(yearFilter==='all'||el.dataset.year===yearFilter)?'':'none')});
}

const main=document.getElementById('quiz');const state={};let autoDone=false;
const nameEl=document.getElementById('studentName');
try{nameEl.value=localStorage.getItem('jhsStudentName')||''}catch(e){}
const nameOK=()=>nameEl.value.trim().length>0;
function syncName(){const ok=nameOK();document.querySelector('.student').classList.toggle('ok',ok);document.querySelector('.student-hint').textContent=ok?'可以開始作答了！':'輸入姓名後開始作答';main.classList.toggle('locked',!ok);try{localStorage.setItem('jhsStudentName',nameEl.value.trim())}catch(e){}}
nameEl.addEventListener('input',syncName);

const paras=t=>esc(t).split('\n').map(p=>`<p>${p}</p>`).join('');
const figs=a=>a.length?`<div class="fig">${a.map(s=>`<img src="./${s}" alt="試題圖" loading="lazy">`).join('')}</div>`:'';
let html='',lastGroup=null,idx=0;
for(const q of Q){
  idx++;
  if(q.group&&q.group!==lastGroup){const g=G[q.group];
    if(g)html+=`<div class="passage" data-year="${q.year}"><h3>${g.year} 年 題組（第 ${g.rng[0]}～${g.rng[1]} 題）${g.sub?`<span class="chip">${esc(g.sub)}</span>`:''}</h3>${g.imgs.length?figs(g.imgs):paras(g.text)}</div>`}
  lastGroup=q.group;
  const optHtml=q.fig?
    `<div class="opts row">${[0,1,2,3].map(i=>`<button class="opt letter-only" data-o="${i}"><span class="L">(${L[i]})</span></button>`).join('')}</div>`:
    `<div class="opts">${q.opts.map((o,i)=>`<button class="opt" data-o="${i}"><span class="L">(${L[i]})</span><span>${esc(o)}</span></button>`).join('')}</div>`;
  html+=`<div class="q" id="q-${q.id}" data-id="${q.id}" data-year="${q.year}"><div class="q-top"><span class="num">${YEAR?q.n:idx}</span><div style="flex:1;min-width:0">
    <div class="src">${q.year} 年會考 第 ${q.n} 題<span class="chip">${esc(q.cat)}${q.sub?'・'+esc(q.sub):''}</span></div>
    ${q.fig?figs(q.imgs)+'<div class="hint">請看圖作答，點選下方答案代號</div>':`<div class="stem">${esc(q.stem)}</div>`}</div></div>
    ${optHtml}
    <div class="fb"><div class="ans"></div>${q.exp?`<div class="exp">💡 ${esc(q.exp)}</div>`:'<div class="exp">💡 詳解：</div>'}${figs(q.eimgs)}</div></div>`;
}
main.innerHTML=`<section class="panel">${html}</section>`;
const byId=Object.fromEntries(Q.map(q=>[q.id,q]));
main.addEventListener('click',e=>{const b=e.target.closest('.opt');if(!b)return;const card=b.closest('.q');const id=card.dataset.id;if(state[id]!==undefined)return;
  if(!nameOK()){nameEl.focus();nameEl.scrollIntoView({behavior:'smooth',block:'center'});return}
  const q=byId[id];const pick=+b.dataset.o;state[id]=pick;const ok=pick===q.ans;
  card.classList.add('done',ok?'correct':'incorrect');b.classList.add(ok?'good':'bad');card.querySelector(`[data-o="${q.ans}"]`).classList.add('good');
  card.querySelector('.ans').textContent=ok?`✔ 答對了！答案 (${L[q.ans]})`:`✘ 你選 (${L[pick]})，正確答案是 (${L[q.ans]})${q.fig?'':' '+q.opts[q.ans]}`;
  update()});
function update(){const all=Object.keys(state).length;const right=Object.keys(state).filter(i=>state[i]===byId[i].ans).length;
  document.getElementById('score').textContent=`已作答 ${all} / ${Q.length}　答對 ${right}`;
  if(all===Q.length&&!autoDone){autoDone=true;if(right===all)confetti();setTimeout(download,600)}}
function confetti(){const em=['🎉','🌸','✨','🎊','⭐'];for(let i=0;i<36;i++){const d=document.createElement('div');d.className='confetti';d.textContent=em[i%em.length];d.style.left=Math.random()*100+'vw';d.style.animationDelay=Math.random()*.8+'s';document.body.appendChild(d);setTimeout(()=>d.remove(),3600)}}

/* ---------- DOCX（含圖片） ---------- */
const enc=new TextEncoder();
const le16=n=>new Uint8Array([n&255,(n>>>8)&255]);
const le32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
const join=cs=>{const o=new Uint8Array(cs.reduce((s,c)=>s+c.length,0));let a=0;for(const c of cs){o.set(c,a);a+=c.length}return o};
const T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=d=>{let c=0xffffffff;for(const b of d)c=T[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0};
function zip(files){const Ls=[],C=[];let off=0;const d=new Date(),y=Math.max(1980,d.getFullYear());const tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),dt=((y-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  for(const[name,body]of files){const nb=enc.encode(name),data=body instanceof Uint8Array?body:enc.encode(body),c=crc32(data);
    const l=join([le32(0x04034b50),le16(20),le16(0x0800),le16(0),le16(tm),le16(dt),le32(c),le32(data.length),le32(data.length),le16(nb.length),le16(0),nb,data]);
    const ce=join([le32(0x02014b50),le16(20),le16(20),le16(0x0800),le16(0),le16(tm),le16(dt),le32(c),le32(data.length),le32(data.length),le16(nb.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(off),nb]);
    Ls.push(l);C.push(ce);off+=l.length}
  const cd=join(C),end=join([le32(0x06054b50),le16(0),le16(0),le16(files.length),le16(files.length),le32(cd.length),le32(off),le16(0)]);
  return new Blob([...Ls,cd,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
const x=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function run(t,o={}){const rp=`<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Microsoft JhengHei"/>${o.bold?'<w:b/>':''}${o.color?`<w:color w:val="${o.color}"/>`:''}<w:sz w:val="${o.size||22}"/><w:szCs w:val="${o.size||22}"/></w:rPr>`;
  return String(t).split('\n').map((ln,i)=>`${i?'<w:r><w:br/></w:r>':''}<w:r>${rp}<w:t xml:space="preserve">${x(ln)}</w:t></w:r>`).join('')}
function para(inner,o={}){const sh=o.shade?`<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>`:'';const bd=o.border?`<w:pBdr><w:left w:val="single" w:sz="18" w:space="6" w:color="${o.border}"/></w:pBdr>`:'';
  return `<w:p><w:pPr>${bd}${sh}<w:spacing w:before="${o.before||0}" w:after="${o.after??80}" w:line="300" w:lineRule="auto"/>${o.ind?`<w:ind w:left="${o.ind}"/>`:''}</w:pPr>${inner}</w:p>`}
async function loadPng(src){const r=await fetch(src);if(!r.ok)throw new Error(src);const b=new Uint8Array(await r.arrayBuffer());const dv=new DataView(b.buffer);return{bytes:b,w:dv.getUint32(16),h:dv.getUint32(20)}}
let picId=0;
function imgPara(im){const maxW=6.3*914400,cx=Math.round(Math.min(maxW,im.w/150*914400)),cy=Math.round(cx*im.h/im.w);const id=++picId;
  return `<w:p><w:pPr><w:spacing w:after="80"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="圖${id}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="image${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${im.rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`}
async function download(){
  const btn=document.getElementById('dl');btn.disabled=true;btn.textContent='產生中…';
  try{
  const nm=nameEl.value.trim()||'未填姓名';
  const items=Q.filter(q=>state[q.id]!==undefined&&state[q.id]!==q.ans&&(yearFilter==='all'||String(q.year)===yearFilter));
  const scope=Q.filter(q=>yearFilter==='all'||String(q.year)===yearFilter);
  const right=scope.filter(q=>state[q.id]===q.ans).length;
  const media=[],rels=[],cache={};picId=0;
  async function pic(src){if(!cache[src]){const p=await loadPng('./'+src),n=media.length+1;media.push([`word/media/image${n}.png`,p.bytes]);rels.push(`<Relationship Id="rImg${n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${n}.png"/>`);cache[src]={rid:`rImg${n}`,w:p.w,h:p.h}}return imgPara(cache[src])}
  let b=para(run(`${title} 成績與錯題詳解`,{bold:true,size:34,color:'6E2E43'}),{after:100});
  b+=para(run(`國中教育會考 · ${SUBJ}科歷屆試題（106～115 年）`,{size:21,color:'555555'}),{after:60});
  b+=para(run(`學生：${nm}`,{bold:true,size:22}),{after:40,shade:'F8EEF1'});
  b+=para(run(`成績：答對 ${right} / ${scope.length} 題（${scope.length?Math.round(right/scope.length*100):0} 分）`,{bold:true,size:22}),{after:40,shade:'F8EEF1'});
  b+=para(run(`答錯共 ${items.length} 題　｜　下載時間：${new Date().toLocaleString('zh-TW')}`,{bold:true,size:21,color:'A33A35'}),{after:200});
  if(!items.length)b+=para(run('全部答對，沒有需要訂正的題目。太棒了！',{size:24}));
  let lastG=null;
  for(const [i,q] of items.entries()){
    b+=para(run(`第 ${i+1} 題　${q.year} 年會考 第 ${q.n} 題｜${q.cat}${q.sub?'・'+q.sub:''}`,{bold:true,size:24,color:'6E2E43'}),{before:i?240:0,after:80,border:'A04D69'});
    if(q.group&&q.group!==lastG){const g=G[q.group];if(g){b+=para(run(`題組（第 ${g.rng[0]}～${g.rng[1]} 題）閱讀材料`,{bold:true,size:21,color:'8A5A12'}),{after:40});
      if(g.imgs.length){for(const s of g.imgs)try{b+=await pic(s)}catch(e){}}else b+=para(run(g.text,{size:20,color:'444444'}),{shade:'FFF6E6',after:60})}}
    lastG=q.group;
    if(q.fig){for(const s of q.imgs)try{b+=await pic(s)}catch(e){}}
    else{b+=para(run(q.stem,{bold:true,size:22}),{after:80});q.opts.forEach((o,k)=>b+=para(run(`(${L[k]})${o}`,{size:21}),{after:30,ind:240}))}
    const p=state[q.id];
    b+=para(run('你的答案：',{bold:true,size:21,color:'A33A35'})+run(p===undefined?'未作答':`(${L[p]})${q.fig?'':q.opts[p]}`,{size:21,color:'A33A35'}),{before:80,after:30});
    b+=para(run('正確答案：',{bold:true,size:21,color:'0B6B57'})+run(`(${L[q.ans]})${q.fig?'':q.opts[q.ans]}`,{size:21,color:'0B6B57',bold:true}),{after:40});
    b+=para(run('詳解：',{bold:true,size:21})+run(q.exp||'',{size:21}),{shade:'F2F7F7',after:60});
    for(const s of q.eimgs)try{b+=await pic(s)}catch(e){}
  }
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${b}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const root=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const dr=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`;
  const blob=zip([['[Content_Types].xml',ct],['_rels/.rels',root],['word/document.xml',doc],['word/_rels/document.xml.rels',dr],...media]);
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`會考${SUBJ}_${title}_${nm}.docx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }finally{btn.disabled=false;btn.textContent='下載錯題 DOCX'}
}
window.__buildDocxForTest=download;
document.getElementById('dl').addEventListener('click',download);
document.getElementById('reset').addEventListener('click',()=>{if(!confirm('確定要清除所有作答紀錄重新開始？'))return;for(const k in state)delete state[k];autoDone=false;
  document.querySelectorAll('.q').forEach(c=>{c.classList.remove('done','correct','incorrect');c.querySelectorAll('.opt').forEach(o=>o.classList.remove('good','bad'))});update();window.scrollTo({top:0,behavior:'smooth'})});
update();syncName();
})();
