const data=JSON.parse(document.querySelector('#unit-data').textContent);
const score=document.querySelector('#score');
const total=data.groups.reduce((n,g)=>n+g.questions.length,0);
const pageTitle=document.querySelector('.hero h1').innerText.replace(/\s+/g,' ').trim();
let answered=0,correct=0;
const results=[]; // {group, q, index, selected, ok}

function esc(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function mark(text){return esc(text).replace(/&lt;br&gt;/g,'<br>').replace(/「([^」]{1,24})」/g,'「<span class="target-text">$1</span>」');}
function table(rows){if(!rows||!rows.length)return'';const [head,...body]=rows;return `<div class="table-wrap"><table class="q-table"><thead><tr>${head.map(c=>`<th>${mark(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${mark(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}

function mistakes(groupId){
  const out=[];
  data.groups.forEach(g=>{
    if(groupId&&g.id!==groupId)return;
    g.questions.forEach((q,i)=>{
      const r=results.find(x=>x.group===g.id&&x.index===i);
      if(r&&r.ok)return;
      out.push({source:`${g.title.replace("牛刀小試｜","牛刀小試・")}　${q.source.replace(/^(牛刀小試|綜合測驗) /,"")} 第 ${i+1} 題`,box:q.box||[],table:q.table||[],stem:q.stem!==undefined?q.stem:q.prompt,options:q.options,selected:r?r.selected:'未作答',answer:q.answer,explanation:q.explanation});
    });
  });
  return out;
}
function download(groupId){
  const g=groupId&&data.groups.find(x=>x.id===groupId);
  const list=mistakes(groupId);
  const done=groupId?results.filter(r=>r.group===groupId):results;
  const right=done.filter(r=>r.ok).length, n=groupId?g.questions.length:total;
  const name=`${pageTitle}${g?'｜'+g.title.replace('｜',' '):'｜全部題目'}`;
  MistakeDocx.download({title:`${name} 錯題詳解`,subtitle:`國中國文 · 形音義比較　｜　得分：${right} / ${n} 題答對`,items:list,filename:`${name}_錯題詳解`});
}

data.groups.forEach(group=>{
  const list=document.querySelector(`.question-list[data-group="${group.id}"]`);
  if(!list)return;
  const bar=document.createElement('div');bar.className='group-bar';
  bar.innerHTML=`<span class="gprog">本區進度：0 / ${group.questions.length}</span><button type="button" class="dl" disabled>完成本區後可下載錯題詳解 DOCX</button>`;
  const prog=bar.querySelector('.gprog'),btn=bar.querySelector('.dl');
  btn.addEventListener('click',()=>download(group.id));
  function refresh(){
    const done=results.filter(r=>r.group===group.id),ok=done.filter(r=>r.ok).length;
    prog.textContent=`本區進度：${done.length} / ${group.questions.length}　答對 ${ok} 題`;
    if(done.length===group.questions.length){btn.disabled=false;btn.textContent=`下載本區錯題詳解 DOCX（${group.questions.length-ok} 題）`;bar.classList.add('ready')}
  }
  group.questions.forEach((q,index)=>{
    const card=document.createElement('article');card.className='question';
    const prompt=q.stem!==undefined?q.stem:q.prompt;
    const box=(q.box&&q.box.length)?`<div class="q-box">${q.box.map(t=>`<p>${mark(t)}</p>`).join('')}</div>`:'';
    const after=(q.after&&q.after.length)?q.after.map(t=>`<p class="q-after">${mark(t)}</p>`).join(''):'';
    card.innerHTML=`<div class="q-meta">${esc(q.source)} · 第 ${index+1} 題</div>${prompt?`<h3>${mark(prompt)}</h3>`:''}${box}${table(q.table)}${after}<div class="options"></div><div class="feedback"><strong></strong><div class="explain"></div></div>`;
    const options=card.querySelector('.options');
    if(q.options.some(o=>o.length>14))options.classList.add('wide');
    q.options.forEach(choice=>{
      const button=document.createElement('button');button.className='option';button.type='button';button.innerHTML=mark(choice);button.dataset.value=choice;
      button.addEventListener('click',()=>{
        if(card.dataset.done)return;card.dataset.done='1';answered++;
        const ok=choice===q.answer;if(ok)correct++;
        results.push({group:group.id,index,selected:choice,ok});
        [...options.children].forEach(item=>{item.disabled=true;if(item.dataset.value===q.answer)item.classList.add('correct')});
        if(!ok)button.classList.add('wrong');
        const feedback=card.querySelector('.feedback');feedback.classList.add('show');
        feedback.querySelector('strong').textContent=ok?'答對了！':'再留意這組字詞。';
        feedback.querySelector('.explain').innerHTML=`正確答案：<span class="target-text">${esc(q.answer)}</span><br>${mark(q.explanation)}`;
        refresh();
        if(answered===total){score.classList.add('show');score.querySelector('span').textContent=`全部完成：${correct} / ${total} 題答對`;dlAll.hidden=false;dlAll.textContent=`下載全部錯題詳解 DOCX（${total-correct} 題）`}
      });options.appendChild(button);
    });
    list.appendChild(card);
  });
  list.after(bar);
});
const dlAll=document.createElement('button');dlAll.type='button';dlAll.className='reset dl-all';dlAll.hidden=true;dlAll.addEventListener('click',()=>download(null));
score.querySelector('#resetQuiz').before(dlAll);
document.querySelector('#resetQuiz').addEventListener('click',()=>location.reload());
const wf=document.querySelector('#wordFilter');
if(wf){const rows=[...document.querySelectorAll('#wordTable tbody tr')];wf.addEventListener('input',()=>{const t=wf.value.trim().split(/\s+/).filter(Boolean);rows.forEach(r=>{r.style.display=(t.length===0||t.some(x=>r.textContent.includes(x)))?'':'none'})})}
