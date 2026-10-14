const data=JSON.parse(document.querySelector('#unit-data').textContent);
const list=document.querySelector('#questionList');
const score=document.querySelector('#score');
let answered=0,correct=0;

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
      const ok=choice===q.answer;if(ok)correct++;
      [...options.children].forEach(item=>{item.disabled=true;if(item.textContent===q.answer)item.classList.add('correct')});
      if(!ok)button.classList.add('wrong');
      const feedback=card.querySelector('.feedback');feedback.classList.add('show');
      feedback.querySelector('strong').textContent=ok?'答對了！':'再留意這組字詞。';
      feedback.querySelector('.explain').innerHTML=`正確答案：<span class="target-text">${esc(q.answer)}</span><br>${markTarget(q.explanation)}`;
      if(answered===data.questions.length){score.classList.add('show');score.querySelector('span').textContent=`完成：${correct} / ${data.questions.length} 題答對`}
    });options.appendChild(button);
  });list.appendChild(card);
});

document.querySelector('#resetQuiz').addEventListener('click',()=>location.reload());
