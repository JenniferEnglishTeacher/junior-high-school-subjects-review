const data=JSON.parse(document.querySelector('#unit-data').textContent);
const score=document.querySelector('#score');
const total=data.groups.reduce((n,g)=>n+g.questions.length,0);
let answered=0,correct=0;

function esc(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
// mark text inside 「」 in red; keep <br> from explanations
function mark(text){return esc(text).replace(/&lt;br&gt;/g,'<br>').replace(/「([^」]{1,24})」/g,'「<span class="target-text">$1</span>」');}
function table(rows){if(!rows||!rows.length)return'';const [head,...body]=rows;return `<div class="table-wrap"><table class="q-table"><thead><tr>${head.map(c=>`<th>${mark(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${mark(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}

data.groups.forEach(group=>{
  const list=document.querySelector(`.question-list[data-group="${group.id}"]`);
  if(!list)return;
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
        [...options.children].forEach(item=>{item.disabled=true;if(item.dataset.value===q.answer)item.classList.add('correct')});
        if(!ok)button.classList.add('wrong');
        const feedback=card.querySelector('.feedback');feedback.classList.add('show');
        feedback.querySelector('strong').textContent=ok?'答對了！':'再留意這組字詞。';
        feedback.querySelector('.explain').innerHTML=`正確答案：<span class="target-text">${esc(q.answer)}</span><br>${mark(q.explanation)}`;
        if(answered===total){score.classList.add('show');score.querySelector('span').textContent=`全部完成：${correct} / ${total} 題答對`}
      });options.appendChild(button);
    });
    list.appendChild(card);
  });
});
document.querySelector('#resetQuiz').addEventListener('click',()=>location.reload());
const wf=document.querySelector('#wordFilter');
if(wf){const rows=[...document.querySelectorAll('#wordTable tbody tr')];wf.addEventListener('input',()=>{const t=wf.value.trim().split(/\s+/).filter(Boolean);rows.forEach(r=>{r.style.display=(t.length===0||t.some(x=>r.textContent.includes(x)))?'':'none'})})}
