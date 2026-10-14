/* 錯題詳解 DOCX 產生器（純前端，不需外部套件）
   用法：MistakeDocx.download({title, subtitle, items:[{number, source, box:[], table:[[...]], stem, options:[], selected, answer, explanation}], filename}) */
(function(){
const enc=new TextEncoder();
const le16=n=>new Uint8Array([n&255,(n>>>8)&255]);
const le32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
const join=cs=>{const o=new Uint8Array(cs.reduce((s,c)=>s+c.length,0));let a=0;for(const c of cs){o.set(c,a);a+=c.length}return o};
const T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=d=>{let c=0xffffffff;for(const b of d)c=T[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0};
function stamp(){const d=new Date(),y=Math.max(1980,d.getFullYear());return{time:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date:((y-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()}}
function zip(files){const L=[],C=[];let off=0;const s=stamp();
  for(const[name,text]of files){const nb=enc.encode(name),d=enc.encode(text),c=crc32(d);
    const l=join([le32(0x04034b50),le16(20),le16(0x0800),le16(0),le16(s.time),le16(s.date),le32(c),le32(d.length),le32(d.length),le16(nb.length),le16(0),nb,d]);
    const ce=join([le32(0x02014b50),le16(20),le16(20),le16(0x0800),le16(0),le16(s.time),le16(s.date),le32(c),le32(d.length),le32(d.length),le16(nb.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(off),nb]);
    L.push(l);C.push(ce);off+=l.length}
  const cd=join(C),end=join([le32(0x06054b50),le16(0),le16(0),le16(files.length),le16(files.length),le32(cd.length),le32(off),le16(0)]);
  return new Blob([...L,cd,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
const x=s=>String(s??'').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function run(t,o={}){const rp=`<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Microsoft JhengHei"/>${o.bold?'<w:b/>':''}${o.color?`<w:color w:val="${o.color}"/>`:''}<w:sz w:val="${o.size||22}"/><w:szCs w:val="${o.size||22}"/></w:rPr>`;
  return String(t).split('\n').map((ln,i)=>`${i?'<w:r><w:br/></w:r>':''}<w:r>${rp}<w:t xml:space="preserve">${x(ln)}</w:t></w:r>`).join('')}
// 「」內文字以紅色標示
function rich(t,o={}){const parts=String(t??'').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').split(/(「[^」]{1,24}」)/);
  return parts.map(p=>{const m=p.match(/^「(.*)」$/);return m?run('「',o)+run(m[1],{...o,color:'C0392B',bold:true})+run('」',o):run(p,o)}).join('')}
function para(inner,o={}){const sh=o.shade?`<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>`:'';const bd=o.border?`<w:pBdr><w:left w:val="single" w:sz="18" w:space="6" w:color="${o.border}"/></w:pBdr>`:'';
  return `<w:p><w:pPr>${bd}${sh}<w:spacing w:before="${o.before||0}" w:after="${o.after??80}" w:line="300" w:lineRule="auto"/>${o.ind?`<w:ind w:left="${o.ind}"/>`:''}</w:pPr>${inner}</w:p>`}
function table(rows){if(!rows||!rows.length)return'';const cell=(c,h)=>`<w:tc><w:tcPr><w:tcBorders>${['top','left','bottom','right'].map(s=>`<w:${s} w:val="single" w:sz="4" w:color="999999"/>`).join('')}</w:tcBorders>${h?'<w:shd w:val="clear" w:color="auto" w:fill="E6F2F1"/>':''}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>${rich(c,{size:20,bold:h})}</w:p></w:tc>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:jc w:val="center"/></w:tblPr>${rows.map((r,i)=>`<w:tr>${r.map(c=>cell(c,i===0)).join('')}</w:tr>`).join('')}</w:tbl>`+para('',{after:60})}
function build({title,subtitle,items}){
  let b=para(run(title,{bold:true,size:34,color:'0F6E6E'}),{after:100});
  if(subtitle)b+=para(run(subtitle,{size:21,color:'555555'}),{after:60});
  b+=para(run(`錯題與未作答共 ${items.length} 題　｜　下載時間：${new Date().toLocaleString('zh-TW')}`,{bold:true,size:21,color:'A33A35'}),{after:200});
  if(!items.length)b+=para(run('本次全部答對，沒有需要訂正的題目。太棒了！',{size:24}),{after:120});
  items.forEach((m,i)=>{
    b+=para(run(`第 ${i+1} 題　${m.source||''}`,{bold:true,size:24,color:'0F6E6E'}),{before:i?240:0,after:80,border:'0F6E6E'});
    (m.box||[]).forEach(t=>b+=para(rich(t,{size:20,color:'444444'}),{shade:'FFF6E6',after:30}));
    b+=table(m.table);
    if(m.stem)b+=para(rich(m.stem,{bold:true,size:22}),{after:80});
    (m.options||[]).forEach(o=>b+=para(rich(o,{size:21}),{after:30,ind:240}));
    b+=para(run('你的答案：',{bold:true,size:21,color:'A33A35'})+rich(m.selected||'未作答',{size:21,color:'A33A35'}),{before:80,after:30});
    b+=para(run('正確答案：',{bold:true,size:21,color:'0B6B57'})+rich(m.answer,{size:21,color:'0B6B57',bold:true}),{after:40});
    b+=para(run('詳解：',{bold:true,size:21})+rich(m.explanation,{size:21}),{shade:'F2F7F7',after:60});
  });
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${b}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  return zip([['[Content_Types].xml',ct],['_rels/.rels',rels],['word/document.xml',doc]]);
}
function download(opts){const blob=build(opts);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(opts.filename||opts.title||'錯題詳解')+'.docx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
window.MistakeDocx={build,download};
})();
