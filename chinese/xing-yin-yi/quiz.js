const data=JSON.parse(document.querySelector('#unit-data').textContent);
const list=document.querySelector('#questionList');
const score=document.querySelector('#score');
let answered=0,correct=0;const results=[];

function esc(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function markTarget(text){let out=esc(text);for(const token of data.highlight){if(!token)continue;out=out.replaceAll(esc(token),`<span class="target-text">${esc(token)}</span>`)}return out;}

data.questions.forEach((q,index)=>{
  const card=document.createElement('article');card.className='question';
  card.innerHTML=`<div class="q-meta">${esc(q.source)} · 第 ${index+1} 題</div><h3>${markTarget(q.prompt)}</h3><div class="options"></div><div class="feedback"><strong></strong><div class="explain"></div></div>`;
  const options=card.querySelector('.options');
  q.options.forEach(choice=>{
    const button=document.createElement('button');button.className='option';button.type='button';button.innerHTML=markTarget(choice);
    button.addEventListener('click',()=>{
      if(card.dataset.done)return;card.dataset.done='1';answered++;
      const ok=choice===q.answer;if(ok)correct++;results.push({index,selected:choice,ok});
      [...options.children].forEach(item=>{item.disabled=true;if(item.textContent===q.answer)item.classList.add('correct')});
      if(!ok)button.classList.add('wrong');
      const feedback=card.querySelector('.feedback');feedback.classList.add('show');
      feedback.querySelector('strong').textContent=ok?'答對了！':'再留意這組字詞。';
      feedback.querySelector('.explain').innerHTML=`正確答案：<span class="target-text">${esc(q.answer)}</span><br>${markTarget(q.explanation)}`;
      if(answered===data.questions.length){score.classList.add('show');score.querySelector('span').textContent=`完成：${correct} / ${data.questions.length} 題答對`;dl.hidden=false;dl.textContent=`下載錯題詳解 DOCX（${data.questions.length-correct} 題）`}
    });options.appendChild(button);
  });list.appendChild(card);
});

const dl=document.createElement('button');dl.type='button';dl.className='reset dl-all';dl.hidden=true;
dl.addEventListener('click',()=>{const title=document.querySelector('.hero h1').textContent.trim();const type=document.querySelector('.hero .eyebrow').textContent.trim();
  const items=data.questions.map((q,i)=>({q,i,r:results.find(x=>x.index===i)})).filter(o=>!o.r||!o.r.ok).map(o=>({source:`${o.q.source} · 第 ${o.i+1} 題`,stem:o.q.prompt,options:o.q.options,selected:o.r?o.r.selected:'未作答',answer:o.q.answer,explanation:o.q.explanation}));
  MistakeDocx.download({title:`${title} 錯題詳解`,subtitle:`國中國文 · 形音義比較 · ${type}　｜　得分：${correct} / ${data.questions.length} 題答對`,items,filename:`形音義_${title}_錯題詳解`})});
document.querySelector('#resetQuiz').before(dl);
document.querySelector('#resetQuiz').addEventListener('click',()=>location.reload());
