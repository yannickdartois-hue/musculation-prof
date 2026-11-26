/* =====================================================================
   prof.js — outil prof de musculation CA5 Terminale (Lycée G. Pompidou)
   v1.0 : classes (import Pronote, repris de gym-prof), QR de la classe, code du cours (eps-code.js).
   v7.0 : carnet du professeur sur le modèle de l'outil prof demi-fond : un dossier par élève,
   séances reçues par QR de binôme, tableau de bord, séances, fiches, Note (CCF), Pilotage, exports.
   Données : sur l'iPad (localStorage 'mup-db'). La clé du code du cours
   de chaque classe est dans la sauvegarde : la garder à jour.
   ===================================================================== */
'use strict';
const KDB='mup-db', URL_APP='https://yannickdartois-hue.github.io/musculation-eleves/';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const DEMO=/[?&]demo\b/.test(location.search);
let DB=DEMO?demoDB():(()=>{try{return JSON.parse(localStorage.getItem(KDB))||null}catch(e){return null}})()||{classes:{},carnets:{},classe:'',vue:'classes'};
DB.classes=DB.classes||{};DB.carnets=DB.carnets||{};DB.vue=DB.vue||'accueil';
function sauver(){if(DEMO)return;DB.maj=Date.now();try{localStorage.setItem(KDB,JSON.stringify(DB))}catch(e){alert('Mémoire pleine : faites une sauvegarde puis supprimez des carnets anciens.')}}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),3200)}
function chargerScript(src){return new Promise((ok,ko)=>{const e=document.createElement('script');e.src=src;e.onload=()=>ok();e.onerror=()=>ko(new Error('Impossible de charger '+src));document.head.appendChild(e)})}
function fen(html,large){const d=document.createElement('div');d.className='voile';d.innerHTML=`<div class="fen"${large?' style="max-width:760px"':''}>${html}</div>`;d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-fermer]'))d.remove()});document.body.appendChild(d);return d}
/* QR « MUS » : JSON compressé (deflate-raw) en base64url — même format que l'appli élève et l'écran de cours */
async function encoderQR(o){
  const json=new TextEncoder().encode(JSON.stringify(o)),b64=u=>{let s='';u.forEach(x=>s+=String.fromCharCode(x));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
  if(typeof CompressionStream==='function'){try{return 'MUS1:'+b64(new Uint8Array(await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()))}catch(e){}}
  return 'MUS0:'+b64(json);
}
function svgQR(t){const q=qrcode(0,'M');q.addData(t);q.make();return q.createSvgTag({cellSize:6,margin:2,scalable:true})}
function demoDB(){
  const l=['Inès AMRANI','Lucas BERNARD','Chloé DUBOIS','Yanis FERRAND','Léa MARTIN','Hugo MOREAU','Sarah PETIT','Noah ROUX'];
  return {classes:{'DÉMO':{eleves:l,lien:'',cc:'ZGVtb2RlbW9kZW1v'}},carnets:{},classe:'DÉMO',vue:'classes'};
}

/* ---------- Classes : import des listes Pronote (repris de gym-prof) ---------- */
function partsNom(t){
  const w=String(t||'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
  const maj=x=>x===x.toUpperCase()&&/[A-ZÀ-Ý]/.test(x),part=x=>/^(de|du|des|d'|d’|le|la|van|von|der|den|di|da|del|dos)$/.test(x);
  const dans=w.map(maj);
  for(let i=w.length-2;i>=0;i--)if(!dans[i]&&part(w[i])&&dans[i+1])dans[i]=true;
  return {nom:w.filter((x,i)=>dans[i]).join(' '),pre:w.filter((x,i)=>!dans[i]).join(' ')};
}
function decouperNom(t){t=String(t||'').replace(/\s+/g,' ').trim();if(!t)return null;const {nom,pre}=partsNom(t);return nom&&pre?pre+' '+nom:t}
function lireLignes(rows,classeDefaut){
  rows=rows.map(r=>(r||[]).map(c=>c==null?'':String(c).trim()));
  const hi=rows.findIndex(r=>r.some(c=>/^(é|e)l(è|e)ve|^nom\b|^nom$|pr(é|e)nom/i.test(c)));
  const H=hi>=0?rows[hi].map(c=>norm(c)):[];
  const col=re=>H.findIndex(h=>re.test(h));
  const iNom=col(/^nom( de famille)?$/),iPre=col(/^prenom/),iEl=col(/^eleve|^nom prenom|^nom et prenom|^identite/),iCl=col(/^classe/);
  const out={};
  rows.slice(hi+1).forEach(r=>{
    let n='';
    if(iNom>=0&&iPre>=0&&r[iNom])n=r[iPre]+' '+r[iNom].toUpperCase();
    else if(iEl>=0)n=decouperNom(r[iEl]);
    else if(hi<0)n=decouperNom(r[0]);
    if(!n||/^(total|effectif)/i.test(n))return;
    const c=classeDefaut||(iCl>=0&&r[iCl]);if(!c)return; /* nom écrit = groupe : remplace la classe Pronote (groupes de Terminale) */
    (out[c]=out[c]||new Set()).add(n.trim());
  });
  return out;
}
const triNom=(a,b)=>{const k=n=>{const p=partsNom(n);return norm(p.nom+' '+p.pre)};return k(a).localeCompare(k(b))};
/* Classe déjà présente : ajouter les élèves du fichier à la liste actuelle, ou remplacer la liste */
const cleNomL=n=>String(n||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().split(/[\s'’-]+/).filter(Boolean).sort().join(' ');
function modeListe(C,actuelle,tout){
  const ex=C.filter(c=>(actuelle(c)||[]).length);if(!ex.length)return Promise.resolve('remplacer');
  const e=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  let petit=false;
  const lignes=ex.map(c=>{const a=actuelle(c),ka=new Set(a.map(cleNomL)),f=[...tout[c].keys()],kf=new Set(f.map(cleNomL));
    const nv=f.filter(n=>!ka.has(cleNomL(n))).length,abs=a.filter(n=>!kf.has(cleNomL(n))).length;if(f.length<a.length/2)petit=true;
    return `<li><b>${e(c)}</b> : ${a.length} élève${a.length>1?'s':''} dans l’appli, ${f.length} dans le fichier — ${nv} nouveau${nv>1?'x':''}${abs?`, ${abs} absent${abs>1?'s':''} du fichier`:''}</li>`}).join('');
  return new Promise(ok=>{const d=document.createElement('div');
    d.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(15,20,30,.55);display:flex;align-items:center;justify-content:center;padding:16px';
    const bt=(v,t,s,pri)=>`<button type="button" data-v="${v}" style="display:block;width:100%;text-align:left;min-height:52px;margin:8px 0 0;padding:10px 14px;border-radius:12px;border:0;font:inherit;cursor:pointer;background:${pri?'#1c2128':'#e5e9f0'};color:${pri?'#fff':'#14181f'}"><b>${t}</b><br><span style="font-size:14px;opacity:.85">${s}</span></button>`;
    d.innerHTML=`<div role="dialog" aria-modal="true" style="background:#fff;color:#14181f;border-radius:16px;max-width:500px;width:100%;max-height:90vh;overflow:auto;padding:18px;font-size:17px;line-height:1.4;box-shadow:0 12px 40px rgba(0,0,0,.3)">
      <h3 style="margin:0 0 6px;font-size:21px">Cette classe existe déjà</h3><ul style="margin:6px 0;padding-left:20px;font-size:15px">${lignes}</ul>
      ${bt('ajout','Ajouter ces élèves','Garde la liste actuelle et ajoute seulement les noms nouveaux. Pour un élève arrivé en cours d’année.',petit)}
      ${bt('remplacer','Remplacer la liste','La liste devient celle du fichier. Un élève absent du fichier garde ses résultats, mais passe « Hors liste ».',!petit)}
      ${bt('','Annuler','Ne rien changer.',false)}</div>`;
    d.addEventListener('click',ev=>{const b=ev.target.closest('button[data-v]');if(!b)return;d.remove();ok(b.dataset.v||null)});
    document.body.appendChild(d)})}
function fusionListe(t,anciens){const vus=new Set([...t.keys()].map(cleNomL));(anciens||[]).forEach(n=>{if(!vus.has(cleNomL(n))){t instanceof Map?t.set(n,''):t.add(n)}})}
async function importerListe(files,texte,classeDefaut){
  const lots=[];
  if(files&&files.length&&!window.XLSX)await chargerScript('xlsx.js');
  for(const f of files||[]){
    const buf=await f.arrayBuffer();let wb;
    if(/\.(csv|txt)$/i.test(f.name)||/text|csv/.test(f.type)){
      let t;try{t=new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch(e){t=new TextDecoder('windows-1252').decode(buf)}
      t=t.replace(/^﻿/,'');const l0=t.split(/\r?\n/)[0],sep=['\t',';',','].map(c=>[c,l0.split(c).length]).sort((a,b)=>b[1]-a[1])[0][0];
      wb=XLSX.read(t,{type:'string',FS:sep});
    }else wb=XLSX.read(buf,{type:'array'});
    wb.SheetNames.forEach(sn=>lots.push(XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,raw:false,defval:''})));
  }
  if(texte&&texte.trim())lots.push(texte.trim().split(/\r?\n/).map(l=>l.split(/\t|;/)));
  const tout={};lots.forEach(rows=>Object.entries(lireLignes(rows,classeDefaut)).forEach(([c,set])=>{tout[c]=tout[c]||new Set();set.forEach(n=>tout[c].add(n))}));
  const C=Object.keys(tout);
  if(!C.length){alert(classeDefaut?'Aucun nom trouvé.':'Aucun élève trouvé. Il faut une colonne « Classe », ou écrire le nom de la classe avant d’importer.');return}
  const avant={};C.forEach(c=>avant[c]=((DB.classes[c]||{}).eleves||[]).slice());
  const mode=await modeListe(C,c=>avant[c],tout);if(!mode)return;
  if(mode==='ajout')C.forEach(c=>fusionListe(tout[c],avant[c]));
  C.forEach(c=>{const old=DB.classes[c]||{};DB.classes[c]=Object.assign(old,{eleves:[...tout[c]].sort(triNom),lien:old.lien||''})});
if(mode==='ajout'){const r=C.map(c=>{const ka=new Set(avant[c].map(cleNomL)),nv=[...tout[c].keys()].filter(n=>!ka.has(cleNomL(n)));return c+' : '+(nv.length?'+'+nv.length+' ('+nv.join(', ')+')':'aucun nouveau nom')+' → '+tout[c].size+' élèves'});setTimeout(()=>alert('Élèves ajoutés\n'+r.join('\n')+'\n\nPense à refaire scanner le QR de la classe aux binômes de cette classe.'),50)}
  DB.classe=C[0];sauver();rendre();toast(C.map(c=>c+' : '+tout[c].size+' élèves').join(' · '));
}

/* ---------- Vues ---------- */
function vClasses(){
  const C=Object.keys(DB.classes).sort(),c=DB.classes[DB.classe]?DB.classe:C[0],L=c?DB.classes[c]:null;DB.classe=c||'';
  return `<h2>Classes</h2>
  <section class="carte"><h3>Importer une liste Pronote</h3><p class="small">Fichier xlsx, xls ou csv exporté de Pronote (ou le fichier fait par « Mes classes » du portail). Avec une colonne « Classe », plusieurs classes d'un coup. Pour un <b>groupe de Terminale</b>, écrivez son nom : il remplace la classe Pronote.</p>
   <div class="rangee"><input id="impNom" type="text" placeholder="Nom du groupe (facultatif), ex. TG-muscu-1" style="max-width:340px"><label class="bt act">📂 Choisir le fichier<input id="impFic" type="file" accept=".xlsx,.xls,.csv,.txt" multiple hidden></label></div>
   <details><summary>Ou coller des noms (un par ligne, « Prénom NOM »)</summary><textarea id="impTxt" rows="5" placeholder="Léa MARTIN&#10;Hugo BERNARD"></textarea><button type="button" class="bt" data-act="coller">Ajouter ces élèves</button></details></section>
  ${C.length?`<div class="puces">${C.map(x=>`<button type="button" class="${x===c?'ici':''}" data-classe="${esc(x)}">${esc(x)} <small>${DB.classes[x].eleves.length}</small></button>`).join('')}</div>`:'<p class="muted">Aucune classe pour l\'instant.</p>'}
  ${L?`<section class="carte act"><h3>${esc(c)} · ${L.eleves.length} élèves</h3>
   <div class="rangee"><button type="button" class="bt act" data-act="qr">▦ QR de la classe</button><button type="button" class="bt noir" data-act="code">🔑 Code du cours</button><button type="button" class="bt" data-act="affiche">🖨 Affiche du premier cours</button></div>
   <p class="small muted">Les binômes scannent le QR de la classe dans l'appli élève : la liste des noms s'affiche, ils choisissent les leurs. Le QR affiché un jour de cours ouvre aussi la séance choisie dans « Code du cours », sans code à taper.</p>
   <label class="ch" for="lien">Lien du dépôt Nuage de la classe (facultatif)</label><input id="lien" type="url" value="${esc(L.lien||'')}" placeholder="https://nuage03.apps.education.fr/s/…">
   <details><summary>Liste des élèves</summary><ol class="liste">${L.eleves.map(n=>`<li>${esc(n)}</li>`).join('')}</ol></details>
   <p><button type="button" class="lien danger" data-act="supprClasse">Supprimer cette classe</button></p></section>`:''}
  ${DEMO?'':`<section class="carte"><h3>Démonstration</h3><p class="small muted">Pour découvrir l'outil avec une classe fictive. Rien n'est enregistré : vos vraies classes et carnets ne sont pas touchés.</p><a class="bt" href="?demo">🎭 Ouvrir la démo</a></section>`}`;
}
/* 24/11/2026 : choisir la séance que le QR de la classe ouvre aujourd'hui (même mémoire que « Code du cours ») */
const SQR={
  lire(app,c){try{const m=JSON.parse(localStorage.getItem('eps-code-prof:'+app)||'{}')[c];return m&&m.d===EPSCode.jour()?String(m.s):''}catch(e){return ''}},
  ecrire(app,c,s){try{const k='eps-code-prof:'+app,m=JSON.parse(localStorage.getItem(k)||'{}');m[c]={s:String(s),d:EPSCode.jour()};localStorage.setItem(k,JSON.stringify(m))}catch(e){}},
  html(app,c,L){const s=SQR.lire(app,c),x=L.find(y=>String(y.v)===s),on=y=>String(y.v)===s;
    return `<div class="sqr" style="margin:8px 0"><p style="margin:0 0 6px">${x?'Ce QR ouvre la <b>'+esc(x.n)+'</b> aujourd’hui pendant 2 h, sans code à taper. Autre séance :':'<b>Choisissez la séance</b> que ce QR ouvre aujourd’hui :'}</p><div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${L.map(y=>`<button type="button" data-sqr="${esc(c)}|${esc(String(y.v))}" aria-pressed="${on(y)}" style="min-width:52px;min-height:48px;border-radius:12px;font-weight:800;font-size:17px;cursor:pointer;border:2px solid ${on(y)?'#15803d':'#cbd5e1'};background:${on(y)?'#15803d':'#fff'};color:${on(y)?'#fff':'#111'}">${esc(y.c)}</button>`).join('')}</div></div>`},
  brancher(app,rouvrir){document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-sqr]');if(!b)return;e.preventDefault();e.stopPropagation();
    const v=b.dataset.sqr,i=v.lastIndexOf('|'),c=v.slice(0,i);SQR.ecrire(app,c,v.slice(i+1));document.querySelectorAll('.qr-plein,.voile').forEach(x=>{if(x.contains(b))x.remove()});rouvrir(c)},true)}
};
SQR.brancher('mup',c=>montrerQR(c));
async function qrClasse(c){
  const L=DB.classes[c];if(!L.cc){L.cc=EPSCode.nouvelleCle();sauver()}
  const cj=await EPSCode.cjDuJour('mup',c,L.cc,null);
  const txt=await encoderQR({a:'MUS',v:1,t:'C',c,l:L.eleves,u:L.lien||'',cc:L.cc,cj,ts:Math.round(Date.now()/1000)});
  let svg;try{svg=svgQR(txt)}catch(e){svg='<p class="alerte">Liste trop longue pour un seul QR.</p>'}
  return {svg,cj};
}
async function montrerQR(c){
  const {svg,cj}=await qrClasse(c);
  fen(`<h2>Classe ${esc(c)} · musculation</h2><p>Appli élève : <b>📷 QR de la classe</b>.</p>${SQR.html('mup',c,SEANCES.map(s=>({v:s.id,n:s.id+' · '+s.titre,c:s.id})))}<div class="qrbox">${svg}</div><button type="button" class="bt" data-fermer>Fermer</button>`,true);
}
async function affiche(c){
  const {svg}=await qrClasse(c),a=document.createElement('div');a.id='affiche';
  a.innerHTML=`<h1>Musculation · premier cours · ${esc(c)}</h1><div class="aff2">
   <div><h2>① Installer l'appli</h2>${svgQR(URL_APP)}<ol><li>Scannez ce QR avec <b>l'appareil photo</b>.</li><li>Ajoutez l'appli à l'<b>écran d'accueil</b> (iPhone : Partager → « Sur l'écran d'accueil » ; Android : ⋮ → « Installer »).</li><li>Ouvrez l'appli avec son icône.</li></ol></div>
   <div><h2>② Entrer dans la classe</h2>${svg}<ol><li>Dans l'appli : « 📷 QR de la classe ».</li><li>« Nouveau binôme » : touchez vos deux noms dans la liste.</li><li>Choisissez un code secret à 4 chiffres (notez-le !).</li></ol></div></div>
   <p class="pied">Imprimée le ${new Date().toLocaleDateString('fr-FR')}. Le QR ② donne la liste de la classe.</p><p class="noprint"><button type="button" class="bt act" onclick="print()">Imprimer</button> <button type="button" class="bt" onclick="document.body.classList.remove('impr-affiche');this.closest('#affiche').remove()">Fermer</button></p>`;
  document.body.appendChild(a);document.body.classList.add('impr-affiche');
}
/* =====================================================================
   v7.0 — CARNET DU PROFESSEUR (modèle de l'outil prof demi-fond)
   Un dossier par ÉLÈVE (jamais par binôme) : DB.eleves['classe|nom'].
   Chaque séance arrive par le QR de séance du binôme (appli élève v6.4, t:'G')
   ou par le fichier du carnet (Nuage, secours) ; le binôme du jour est gardé
   avec la séance. Une nouvelle réception n'efface jamais les autres séances.
   AFL2 / AFL3 : seulement les saisies des élèves de S4 à S8 (règle du prof).
   ===================================================================== */
DB.eleves=DB.eleves||{};DB.journal=DB.journal||[];DB.recus=DB.recus||{};DB.notes=DB.notes||{};DB.tirages=DB.tirages||{};
DB.cfg=Object.assign({prod:6,anal:6},DB.cfg||{});
const SIDS=SEANCES.map(s=>s.id),MOB_J={S4:'tonif',S5:'volume',S6:'puiss'},S_AFL=['S4','S5','S6','S7','S8'];
const nomA=at=>(ATELIERS.find(a=>a.id===at)||{}).nom||at;
const fKg=v=>v==null||v===''?'—':String(Math.round(v*10)/10).replace('.',',')+' kg';
const pre=n=>{const p=partsNom(n);return p.pre||n};
const cleE=(c,n)=>norm(c)+'|'+norm(n);
function journal(t,err){DB.journal.unshift({t,err:!!err,d:new Date().toISOString()});DB.journal=DB.journal.slice(0,300)}
function eleveDe(classe,nom){const k=cleE(classe,nom);let E=DB.eleves[k];
  if(!E)E=DB.eleves[k]={classe:classe||'',nom,seances:{},recu:{},rm:{},abs:{},ajust:[],maj:0};return [k,E]}
/* charges de référence : format abrégé du QR → objet */
function rmLong(a){if(!Array.isArray(a))return a;return {cm:a[0],dix:a[1]||null,mode:a[2]||'',S:a[3]||'',date:a[4]||'',hist:(a[5]||[]).map(h=>({cm:h[0],S:h[1]||'',date:h[2]||'',mode:h[3]||''}))}}
const binCle=l=>(l||[]).map(norm).sort().join('+');
/* x = {e:nom, D:séance, rm, ab, pr, ch, af, aj, ti} ; meta = {ts, src, date, bin:[noms], liste, id} */
function integrer(classe,x,S,meta){
  if(!x||!x.e)throw new Error('élève sans nom');if(!SIDS.includes(S))throw new Error('séance inconnue');
  const [k,E]=eleveDe(classe,x.e),old=E.recu[S];
  if(old&&(old.ts||0)>=(meta.ts||0))return [k,'doublon'];
  if(old&&old.bin&&meta.bin&&binCle(old.bin)!==binCle(meta.bin)){E.conflit=E.conflit||{};E.conflit[S]={a:old.bin,b:meta.bin};
    journal('⚠ '+x.e+' : '+S+' reçue depuis deux binômes ('+old.bin.join(' & ')+' / '+meta.bin.join(' & ')+'). La plus récente est gardée.',true)}
  E.seances[S]=x.D||{};E.recu[S]={ts:meta.ts||0,src:meta.src,date:meta.date||'',bin:meta.bin||[],liste:meta.liste||null,id:meta.id||''};
  if(x.ab)E.abs[S]=meta.date||1;else delete E.abs[S];
  if((meta.ts||0)>=(E.maj||0)){
    Object.entries(x.rm||{}).forEach(([at,r])=>{r=rmLong(r);const o=E.rm[at];if(!o||(r.hist||[]).length>=(o.hist||[]).length)E.rm[at]=r});
    if(x.pr)E.projet=x.pr;if(x.ch)E.choix=x.ch;if(x.af)E.afl=x.af;if(x.te)E.tests=x.te;E.maj=meta.ts||0}
  if(x.ti)E.tirage=x.ti;
  if(x.aj)E.ajust=(E.ajust||[]).filter(a=>a.S!==S).concat(x.aj);
  return [k,old?'remplacé':'nouveau'];
}
function horsListe(classe,nom){const L=(DB.classes[classe]||{}).eleves;return L&&L.length&&!L.some(n=>cleNomL(n)===cleNomL(nom))}
/* QR de séance d'un binôme (t:'G') */
function importerGroupe(o,src){
  if(!Array.isArray(o.R)||!o.R.length)throw new Error('QR de séance vide.');
  const bin=o.R.map(r=>r.e),res=o.R.map(r=>{const [k,st]=integrer(o.c||'',r,o.s,{ts:o.ts,src,date:o.d,bin,liste:o.l,id:o.id});return {k,nom:r.e,st}});
  const tout=res.every(r=>r.st==='doublon'),hl=res.filter(r=>horsListe(o.c,r.nom)).map(r=>r.nom);
  const msg=`${o.s} · ${res.map(r=>pre(r.nom)+(r.st==='doublon'?' (déjà reçu)':r.st==='remplacé'?' (remplacé)':'')).join(' & ')}${o.c?' · '+o.c:''}`;
  journal((tout?'= ':'✓ ')+msg+(hl.length?' · ⚠ hors liste : '+hl.join(', '):''),hl.length>0);
  DB.recus[o.id||o.s+o.ts]={s:o.s,c:o.c,n:res.length,d:new Date().toISOString(),st:tout?'doublon':'ok'};
  return {msg:(tout?'Déjà reçu : rien de changé. ':'')+msg,doublon:tout,n:res.length};
}
/* fichier du carnet (Nuage) : chaque séance de chaque élève */
function importerCarnet(o,nom){
  if(!o||o.app!=='musculation-eleves'||!Array.isArray(o.e))throw new Error((nom||'Fichier')+' : ce n\'est pas un carnet de musculation.');
  const ts=Math.round((Date.parse(o.exporte)||Date.now())/1000),bin=o.e.map(e=>e.nom);let n=0,dbl=0;
  o.e.forEach(e=>{SIDS.forEach(S=>{const D=(e.seances||{})[S],ab=e.abs&&e.abs[S];if(!(D&&Object.keys(D).length)&&!ab)return;
    const x={e:e.nom,D:Object.assign({},D),rm:e.rm,ab:ab?1:0,pr:+S.slice(1)>=7?e.projet:null,ch:e.choix,af:e.afl,aj:(e.ajust||[]).filter(a=>a.S===S),ti:S==='S9'&&e.tirage?e.tirage.l:null,te:e.tests};delete x.D.seq;
    const [,st]=integrer(o.classe||'',x,S,{ts,src:'fichier',date:(o.exporte||'').slice(0,10),bin,liste:(o.listes||{})[S]});st==='doublon'?dbl++:n++});
    /* élève sans séance (seulement des tests) */
    const [,E]=eleveDe(o.classe||'',e.nom);if(ts>=(E.maj||0)){Object.entries(e.rm||{}).forEach(([at,r])=>{if(!E.rm[at]||(r.hist||[]).length>=(E.rm[at].hist||[]).length)E.rm[at]=r});if(e.tests)E.tests=e.tests;if(e.afl)E.afl=e.afl;if(e.projet)E.projet=e.projet;if(e.choix)E.choix=e.choix;E.maj=ts}});
  const m=(nom?nom+' : ':'')+bin.join(' & ')+` · ${n} séance(s)`+(dbl?`, ${dbl} déjà reçue(s)`:'');journal('📂 '+m);return m;
}
async function importerFichiers(files){
  const msgs=[];for(const f of files){try{msgs.push(importerCarnet(JSON.parse(await f.text()),f.name))}catch(e){msgs.push('⚠ '+e.message);journal('⚠ '+e.message,true)}}
  sauver();rendre();fen(`<h3>Fichiers importés</h3><ul class="small">${msgs.map(m=>`<li>${esc(m)}</li>`).join('')}</ul><button type="button" class="bt" data-fermer>Fermer</button>`);
}
/* reprise des carnets déjà reçus avec les versions précédentes (fichiers) : rien n'est perdu */
function migrer(){if(DB.migre7||DEMO)return;const L=Object.values(DB.carnets||{});L.forEach(c=>{try{importerCarnet(c,'')}catch(e){}});DB.migre7=Date.now();if(L.length){journal('Reprise de '+L.length+' carnet(s) des versions précédentes.');sauver()}}

/* ---------- lecture des QR (caméra) ---------- */
function b64urlToBytes(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
async function decoderQR(txt){
  const m=/^MUS([01]):([A-Za-z0-9_-]+)$/.exec(String(txt||'').trim());if(!m)throw new Error('Ce QR ne vient pas de l\'appli élève de musculation.');
  let b=b64urlToBytes(m[2]);
  if(m[1]==='1'){if(typeof DecompressionStream!=='function')throw new Error('Cet iPad est trop ancien pour lire ce QR : mettez-le à jour.');b=new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer())}
  const o=JSON.parse(new TextDecoder().decode(b));if(!o||o.a!=='MUS')throw new Error('QR non reconnu.');return o;
}
const MORCEAUX={};
async function lireTexteQR(t){
  t=String(t||'').trim();
  const p=/^MUSP:([A-Za-z0-9]+):(\d+)\/(\d+):(.*)$/.exec(t);
  if(p){const [,id,i,n,part]=p,M=MORCEAUX[id]=MORCEAUX[id]||{n:+n,p:{}};M.p[+i]=part;const nb=Object.keys(M.p).length;
    if(nb<M.n)return {msg:`QR ${nb} sur ${M.n} lu : montrez le suivant.`,partiel:true};
    t=Array.from({length:M.n},(_,k)=>M.p[k+1]).join('');delete MORCEAUX[id]}
  const o=await decoderQR(t);
  if(o.t==='G')return importerGroupe(o,'qr');
  if(o.t==='mots')throw new Error('C\'est le QR des mots et du défi (écran de cours), pas une séance.');
  if(o.t==='C'||o.t==='T')throw new Error('C\'est un QR de l\'outil prof (classe ou tirage).');
  throw new Error('QR non reconnu.');
}
/* scanner caméra (repris de l'outil prof demi-fond, scan.js) */
function scanner(onCode,opts){
  opts=opts||{};const v=document.createElement('div');v.className='scan-voile';
  v.innerHTML=`<div class="scan-fen" role="dialog" aria-modal="true"><h3>${opts.titre||'Scanner un QR code'}</h3><div class="scan-cadre"><video playsinline muted></video><div class="scan-viseur"></div></div>
    <p class="scan-msg">${opts.aide||'Placez le QR code dans le cadre.'}</p><div class="scan-bas"><span class="scan-compte"></span><button type="button" class="bt noir scan-fin">Terminé</button></div></div>`;
  document.body.appendChild(v);
  const video=v.querySelector('video'),msg=v.querySelector('.scan-msg'),cpt=v.querySelector('.scan-compte'),cv=document.createElement('canvas'),ctx=cv.getContext('2d',{willReadFrequently:true});
  let stream=null,fini=false,dernier='',dernierT=0,n=0,timer=null;
  function fermer(){fini=true;clearTimeout(timer);if(stream)stream.getTracks().forEach(t=>t.stop());v.remove();if(opts.onClose)opts.onClose(n)}
  v.querySelector('.scan-fin').onclick=fermer;
  const message=(t,ok)=>{msg.textContent=t;msg.className='scan-msg'+(ok===true?' ok':ok===false?' err':'')};
  async function tic(){if(fini)return;
    if(video.readyState>=2&&video.videoWidth){const w=video.videoWidth,h=video.videoHeight,k=Math.min(1,720/Math.max(w,h));cv.width=Math.round(w*k);cv.height=Math.round(h*k);ctx.drawImage(video,0,0,cv.width,cv.height);
      const r=window.jsQR(ctx.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height,{inversionAttempts:'dontInvert'});
      if(r&&r.data&&(r.data!==dernier||Date.now()-dernierT>4000)){dernier=r.data;dernierT=Date.now();
        try{const res=await onCode(r.data);if(!res.partiel)n++;cpt.textContent=n+' binôme'+(n>1?'s':'');message(res.msg,res.doublon?null:true);try{navigator.vibrate&&navigator.vibrate(80)}catch(e){}}catch(e){message(e.message||String(e),false)}}}
    timer=setTimeout(tic,160)}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){message('La caméra n\'est pas disponible sur cet appareil.',false);return fermer}
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false}).then(s=>{if(fini){s.getTracks().forEach(t=>t.stop());return}stream=s;video.srcObject=s;video.play().catch(()=>{});tic()}).catch(()=>message('Autorisez l\'accès à la caméra (réglages), puis réessayez.',false));
  return fermer;
}

/* ---------- lecture pédagogique des saisies ---------- */
function elevesClasse(c){const L=Object.entries(DB.eleves).filter(([,E])=>E.classe===c).map(([k])=>k);
  ((DB.classes[c]||{}).eleves||[]).forEach(n=>{const k=cleE(c,n);if(!L.includes(k)&&!Object.keys(DB.eleves).some(x=>x===k))L.push(k)});
  return L.sort((a,b)=>triNom(nomDeK(a),nomDeK(b)))}
function nomDeK(k){const E=DB.eleves[k];if(E)return E.nom;const [c,n]=k.split('|');const L=((DB.classes[Object.keys(DB.classes).find(x=>norm(x)===c)]||{}).eleves||[]);return L.find(x=>norm(x)===n)||n}
const recuS=E=>SIDS.filter(S=>E&&E.recu[S]);
const mobDe=(E,S)=>{const n=+S.slice(1);return n>=4&&n<=6?MOB_J[S]:n>=7?(E.projet||{}).mob:null};
function partenaires(E,S){return ((E.recu[S]||{}).bin||[]).filter(n=>norm(n)!==norm(E.nom)).map(n=>DB.eleves[cleE(E.classe,n)]).filter(Boolean)}
const exosReal=d=>Object.entries((d&&d.exos)||{}).filter(([,x])=>x&&x.real);
function suivant(E,S,at){const mob=mobDe(E,S);for(let j=+S.slice(1)+1;j<=9;j++){const S2='S'+j,y=((E.seances[S2]||{}).exos||{})[at];if(y&&y.real&&mobDe(E,S2)===mob)return [S2,y]}return null}
function verifReg(c,r,r2){if(!r2)return null;const n=v=>+v||0;
  switch(c){case 'chargeP':return n(r2.charge)>n(r.charge);case 'chargeM':return n(r2.charge)<n(r.charge);case 'serie':return n(r2.series)>n(r.series);case 'reps':return n(r2.reps)>n(r.reps);
    case 'garde':return Math.abs(n(r2.charge)-n(r.charge))<=1&&n(r2.series)===n(r.series)&&n(r2.reps)===n(r.reps);default:return null}}
const bilanOk=b=>!!(b&&b.obj&&b.cons&&b.vecu&&b.reg);
const ratio=(a,b)=>b>=2?a/b:null;
const degreDe=s=>s==null?null:s<.4?1:s<.6?2:s<.8?3:4;
function indicAFL2(E){
  let ex=0,an=0,jus=0,jusN=0,reg=0,regN=0,bil=0,bilN=0,aBil=false;
  S_AFL.forEach(S=>{if(E.abs[S])return;const d=E.seances[S];if(!d||!Object.keys(d).length)return;const mob=mobDe(E,S);
    bilN++;if(d.bilan)aBil=true;if(bilanOk(d.bilan))bil++;
    exosReal(d).forEach(([at,x])=>{ex++;const nx=x.next||{};if(!(x.rir&&nx.c))return;an++;
      const s=typeof sensSuite==='function'&&mob?sensSuite(mob,x):null,q=NEXT_Q.find(q=>q[0]===nx.c);
      if(s!=null&&q){jusN++;if(nx.c==='posture'||q[2]===s)jus++}
      const y=suivant(E,S,at),v=y?verifReg(nx.c,x.real,y[1].real):null;if(v!=null){regN++;if(v)reg++}})});
  const parts=[ratio(an,ex),ratio(jus,jusN),ratio(reg,regN),aBil?ratio(bil,bilN):null].filter(v=>v!=null);
  const score=ex>=3&&parts.length?parts.reduce((a,b)=>a+b,0)/parts.length:null;
  const faits=[`${an}/${ex} exercices analysés (ressenti, réserve, choix)`,jusN?`analyse juste ${jus}/${jusN}`:'',regN?`régulations appliquées la séance suivante ${reg}/${regN}`:'',aBil?`bilans complets ${bil}/${bilN}`:''].filter(Boolean);
  return {ex,an,jus,jusN,reg,regN,bil,bilN,score,deg:degreDe(score),faits:ex>=3?faits.join(' · '):'pas assez de saisies (moins de 3 exercices de S4 à S8)'};
}
function conseilsDe(E){const L=[];S_AFL.forEach(S=>partenaires(E,S).forEach(P=>exosReal(P.seances[S]).forEach(([at,x])=>{const av=x.avis;if(av&&norm(av.par)===norm(E.nom))L.push({S,at,P,x,av})})));return L}
function indicAFL3(E){
  let poss=0;S_AFL.forEach(S=>{if(E.abs[S])return;partenaires(E,S).forEach(P=>{if(!P.abs[S])poss+=exosReal(P.seances[S]).length})});
  const L=conseilsDe(E);let fi=0,con=0,ut=0,utN=0,ten=0,tenN=0,niv=0;
  L.forEach(({S,at,P,x,av})=>{const plein=av.conseil||av.cle||(av.signes||[]).length;if(!plein)return;fi++;
    niv=Math.max(niv,av.obj&&av.obj.k&&av.obj.v!==''&&av.obj.v!=null?3:av.propres!=null?2:1);
    if(av.conseil){con++;const y=suivant(P,S,at);if(y&&y[1].aide){utN++;if(y[1].aide==='1')ut++}}
    if(av.obj&&av.obj.k&&av.obj.v!==''&&av.obj.v!=null){const y=suivant(P,S,at);if(y){tenN++;if(objTenuM(av.obj,y[1].real))ten++}}});
  const parts=[poss>=2?Math.min(1,fi/poss):null,ratio(ut,utN),ratio(ten,tenN)].filter(v=>v!=null);
  const score=fi?(parts.length?parts.reduce((a,b)=>a+b,0)/parts.length:null):0;
  const faits=[`${fi} observation(s) sur ${poss} exercice(s) du partenaire`,`${con} conseil(s) écrit(s)`,utN?`conseils jugés utiles ${ut}/${utN}`:'',tenN?`objectifs fixés tenus ${ten}/${tenN}`:'',niv?`niveau de coaching ${niv}/3`:''].filter(Boolean);
  return {poss,fi,con,ut,utN,ten,tenN,niv,score,deg:fi?degreDe(score):(poss?1:null),faits:poss?faits.join(' · '):'pas de partenaire observé de S4 à S8'};
}
const repDe=k=>{const N=DB.notes[k]||{},E=DB.eleves[k];return N.rep||(E&&E.afl&&E.afl.rep)||''};
const maxRep=rep=>{const m=/^(\d)\/(\d)$/.exec(rep||'');return m?[+m[1],+m[2]]:null};
const ptsDeg=(deg,max)=>deg==null||!max?null:Math.round(max*deg/4*2)/2;
/* charges de référence : historique par exercice (séance, valeur, origine) + alerte si saut > 15 % */
const MODE_TXT={test:'test',direct:'saisie directe',seance:'en séance'};
function histRM(r){return (r.hist||[]).concat([{cm:r.cm,S:r.S,date:r.date,mode:r.mode}]).filter(h=>h&&h.cm)}
function sautsRM(E){const L=[];Object.entries(E.rm||{}).forEach(([at,r])=>{const h=histRM(r);for(let i=1;i<h.length;i++){const p=h[i].cm/h[i-1].cm-1;if(p>.15)L.push({at,de:h[i-1],a:h[i],p})}});return L}
function progRM(E){const L=Object.values(E.rm||{}).map(histRM).filter(h=>h.length>1).map(h=>h[h.length-1].cm/h[0].cm-1);return L.length?{n:L.length,moy:Math.round(100*L.reduce((a,b)=>a+b,0)/L.length)}:null}
function svgRM(h){if(h.length<2)return '';const W=220,H=60,P=8,v=h.map(x=>x.cm),mn=Math.min(...v)*.95,mx=Math.max(...v)*1.05||1,X=i=>P+i*(W-2*P)/(h.length-1),Y=c=>H-P-(c-mn)/(mx-mn||1)*(H-2*P);
  return `<svg viewBox="0 0 ${W} ${H}" class="mini" role="img" aria-label="évolution"><polyline fill="none" stroke="#4d7c0f" stroke-width="3" points="${h.map((x,i)=>X(i)+','+Y(x.cm)).join(' ')}"/>${h.map((x,i)=>`<circle cx="${X(i)}" cy="${Y(x.cm)}" r="4" fill="#4d7c0f"/>`).join('')}</svg>`}
const tonnage=r=>r&&r.charge&&r.series&&r.reps?(+r.series)*(+r.reps)*(+r.charge):null;
const reelTxt=r=>r?`${r.series||'?'} × ${r.reps||'?'}${r.charge?' · '+fKg(r.charge):''}`:'—';

/* ---------- alertes (Pilotage + tableau de bord) ---------- */
function alertes(c){
  const K=elevesClasse(c),out=[];const recusPar=S=>K.filter(k=>DB.eleves[k]&&(DB.eleves[k].recu[S])).length;
  const actives=SIDS.filter(S=>recusPar(S)>=Math.max(2,K.length/3));
  K.forEach(k=>{const E=DB.eleves[k],nom=nomDeK(k);
    if(!E){out.push({k,nom,t:'aucune séance reçue',g:2});return}
    const manque=actives.filter(S=>!E.recu[S]);if(manque.length)out.push({k,nom,t:'pas de QR reçu en '+manque.join(', '),g:2});
    const ab=Object.keys(E.abs||{});if(ab.length>=2)out.push({k,nom,t:ab.length+' absences ('+ab.join(', ')+')',g:1});
    if(actives.some(S=>+S.slice(1)>=6)&&!repDe(k))out.push({k,nom,t:'répartition AFL2/AFL3 pas encore choisie',g:2});
    const pj=((E.projet||{}).exos||[]).filter(x=>!E.rm[x.at]);if(pj.length)out.push({k,nom,t:'pas de charge de référence sur '+pj.map(x=>nomA(x.at)).join(', ')+' (projet)',g:2});
    sautsRM(E).forEach(s=>out.push({k,nom,t:`charge max de ${nomA(s.at)} : ${fKg(s.de.cm)} → ${fKg(s.a.cm)} (+${Math.round(s.p*100)} %) ${s.a.S||''} : erreur ou surestimation ?`,g:2}));
    Object.entries(E.conflit||{}).forEach(([S,x])=>out.push({k,nom,t:S+' reçue depuis deux binômes ('+x.a.join(' & ')+' / '+x.b.join(' & ')+')',g:1}));
    if(horsListe(c,E.nom))out.push({k,nom,t:'n\'est pas dans la liste de la classe (nom écrit autrement ?)',g:1});
  });
  return out;
}

/* ---------- Vues ---------- */
const VUES=[['accueil','🏠 Accueil'],['classes','👥 Classes'],['recevoir','📲 Recevoir'],['seance','📅 Séances'],['eleves','🧑 Élèves'],['note','📝 Note'],['pilotage','⚠️ Pilotage'],['export','📤 Exporter'],['sauvegarde','💾 Sauvegarde']];
function classeCourante(){const C=classesConnues();if(!C.includes(DB.classe))DB.classe=C[0]||'';return DB.classe}
function classesConnues(){return [...new Set(Object.keys(DB.classes).concat(Object.values(DB.eleves).map(E=>E.classe)).filter(Boolean))].sort()}
function choixClasse(){const C=classesConnues(),c=classeCourante();return C.length>1?`<div class="puces">${C.map(x=>`<button type="button" class="${x===c?'ici':''}" data-classe="${esc(x)}">${esc(x)}</button>`).join('')}</div>`:''}
function rendre(){
  if(DB.vue==='carnets')DB.vue='recevoir';
  $('#nav').innerHTML=VUES.map(([k,t])=>`<button type="button" class="${DB.vue===k||(DB.vue==='fiche'&&k==='eleves')?'ici':''}" data-vue="${k}">${t}</button>`).join('');
  const V={accueil:vAccueil,classes:vClasses,recevoir:vRecevoir,seance:vSeance,eleves:vEleves,fiche:vFiche,note:vNote,pilotage:vPilotage,export:vExport,sauvegarde:vSauvegarde};
  $('#main').innerHTML=(DEMO?`<p class="demo demo-bandeau">👀 Mode démo : classe fictive de 30 élèves, rien n'est enregistré. <a href="./">Quitter</a></p>`:'')+(V[DB.vue]||vAccueil)();
}
function tuile(n,t,vue,alerte){return `<button type="button" class="tuile${alerte?' al':''}" data-vue="${vue}"><b>${n}</b><span>${t}</span></button>`}
function vAccueil(){
  const c=classeCourante();if(!c)return `<h2>Bienvenue</h2><section class="carte act"><p>Commencez par importer la liste Pronote de la classe.</p><button type="button" class="bt act" data-vue="classes">👥 Classes</button></section>`;
  const K=elevesClasse(c),E=K.map(k=>DB.eleves[k]).filter(Boolean),tr=E.filter(x=>recuS(x).length).length;
  let der=null;E.forEach(x=>recuS(x).forEach(S=>{const r=x.recu[S];if(!der||r.ts>der.ts)der={S,ts:r.ts,date:r.date}}));
  const parS=SIDS.map(S=>[S,E.filter(x=>x.recu[S]).length]),av=parS.filter(([,n])=>n>=Math.max(2,K.length/3)).map(([S])=>S).pop()||'—';
  const al=alertes(c),inc=new Set(al.filter(a=>a.g===2).map(a=>a.k)).size;
  const notes=K.filter(k=>{const N=DB.notes[k]||{};return N.prod==null||N.anal==null||N.a2==null||N.a3==null}).length;
  const pr=E.map(progRM).filter(Boolean).map(p=>p.moy).sort((a,b)=>a-b),med=pr.length?pr[Math.floor(pr.length/2)]:null;
  return `<h2>Tableau de bord</h2>${choixClasse()}<p class="muted">${esc(c)} · cycle de 9 séances</p>
   <div class="tuiles">${tuile(K.length,'élèves','eleves')}${tuile(tr+' / '+K.length,'ont transmis au moins une séance','recevoir',tr<K.length)}
    ${tuile(der?der.S:'—',der?'dernière séance reçue · '+esc(der.date||''):'aucune séance reçue','recevoir')}${tuile(av,'avancement du cycle (séance reçue par la classe)','seance')}
    ${tuile(inc,'élève(s) au suivi incomplet','pilotage',inc>0)}${tuile(notes,'évaluation(s) à renseigner','note',notes>0)}
    ${tuile(med==null?'—':'+'+med+' %','progression médiane des charges max','eleves')}</div>
   <section class="carte"><h3>Séances reçues</h3><div class="barres">${parS.map(([S,n])=>`<div><span style="height:${K.length?Math.round(100*n/K.length):0}%"></span><b>${S}</b><small>${n}</small></div>`).join('')}</div></section>
   <div class="rangee"><button type="button" class="bt act" data-act="scanner">📷 Scanner les QR</button><button type="button" class="bt" data-vue="seance">📅 Séances</button><button type="button" class="bt" data-vue="eleves">🧑 Élèves</button><button type="button" class="bt" data-vue="note">📝 Note</button><button type="button" class="bt" data-vue="export">📤 Exporter</button></div>`;
}
function vRecevoir(){
  const n=Object.keys(DB.recus).length;
  return `<h2>Recevoir les séances</h2><section class="carte act"><h3>📲 QR des binômes</h3><p class="small">En fin de séance, chaque binôme montre le QR de la séance (appli élève, onglet « Au prof »). La caméra reste ouverte : scannez-les à la suite. Un QR en plusieurs morceaux se scanne morceau par morceau, dans n'importe quel ordre.</p>
    <button type="button" class="bt act" data-act="scanner">📷 Scanner les QR</button></section>
   <section class="carte"><h3>📂 Fichiers des carnets (Nuage, secours)</h3><p class="small">Les fichiers .json déposés par les binômes. Chaque séance est rangée dans la fiche de chaque élève ; une séance déjà reçue plus récemment n'est pas remplacée.</p><label class="bt">📂 Choisir des fichiers<input id="carnetsFic" type="file" accept=".json,application/json" multiple hidden></label></section>
   <section class="carte"><h3>Journal des réceptions</h3><p class="small muted">${n} transmission(s) reçue(s) par QR. « = » : déjà reçu, rien de changé. ⚠ : à vérifier.</p>
    ${DB.journal.length?`<ul class="journal">${DB.journal.slice(0,80).map(j=>`<li class="${j.err?'err':''}"><span>${esc(new Date(j.d).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))}</span> ${esc(j.t)}</li>`).join('')}</ul>`:'<p class="muted">Rien reçu pour l\'instant.</p>'}</section>`;
}
function vSeance(){
  const c=classeCourante();if(!c)return '<h2>Séances</h2><p class="muted">Aucune classe.</p>';
  const S=SIDS.includes(DB.seance)?DB.seance:'S4';DB.seance=S;const s=SEANCES.find(x=>x.id===S),K=elevesClasse(c);
  const lignes=K.map(k=>{const E=DB.eleves[k],nom=nomDeK(k);if(!E||(!E.recu[S]&&!E.abs[S]))return `<tr class="pasrecu"><td>${E?`<button type="button" class="lien" data-fiche="${esc(k)}">${esc(nom)}</button>`:esc(nom)}</td><td colspan="4" class="muted">— pas reçu</td></tr>`;
    if(E.abs[S])return `<tr><td><button type="button" class="lien" data-fiche="${esc(k)}">${esc(nom)}</button></td><td><span class="tag ab">absent</span></td><td colspan="3" class="small muted">${esc(((E.recu[S]||{}).bin||[]).filter(n=>norm(n)!==norm(E.nom)).map(pre).join(', '))}</td></tr>`;
    const d=E.seances[S]||{},ex=exosReal(d),b=d.bilan;
    return `<tr><td><button type="button" class="lien" data-fiche="${esc(k)}">${esc(nom)}</button></td><td class="small">${esc(((E.recu[S]||{}).bin||[]).filter(n=>norm(n)!==norm(E.nom)).map(pre).join(', ')||'seul')}</td>
     <td class="small">${ex.length?ex.map(([at,x])=>`<b>${esc(nomA(at))}</b> ${esc(reelTxt(x.real))}${x.ressenti&&x.ressenti.note?' · '+x.ressenti.note+'/10':''}${x.rir?' · réserve '+esc((RIR_Q.find(q=>q[0]===x.rir)||[])[1]||''):''}`).join('<br>'):S==='S2'||S==='S3'?Object.entries(E.rm).filter(([,r])=>r.S===S).map(([at,r])=>esc(nomA(at))+' '+fKg(r.dix||r.cm)).join(' · ')||'—':S==='S1'?Object.keys(d.circuit||{}).length+' ateliers':'—'}</td>
     <td class="small">${b?esc([bilanLibP('vecu',b.vecu),bilanLibP('reg',b.reg)].filter(Boolean).join(' · ')):'—'}</td><td class="small">${(d.ech&&d.ech.wc||[]).length?'échauf. ✓':''}</td></tr>`}).join('');
  const nR=K.filter(k=>DB.eleves[k]&&DB.eleves[k].recu[S]&&!DB.eleves[k].abs[S]).length,nA=K.filter(k=>DB.eleves[k]&&DB.eleves[k].abs[S]).length;
  return `<h2>Séances</h2>${choixClasse()}<div class="puces">${SIDS.map(x=>`<button type="button" class="${x===S?'ici':''}" data-seance="${x}">${x}</button>`).join('')}</div>${S==='S1'?PLAN_S1:''}
   <section class="carte"><h3>${S} · ${esc(s.titre)}</h3><p class="small muted">${esc(s.obj||'')}</p><p class="small"><b>${nR}</b> présent(s) reçu(s) · <b>${nA}</b> absent(s) · <b>${K.length-nR-nA}</b> sans QR · date : ${esc([...new Set(K.map(k=>DB.eleves[k]&&(DB.eleves[k].recu[S]||{}).date).filter(Boolean))].join(', ')||'—')}</p>
   <div class="tbw"><table class="tb"><tr><th>Élève</th><th>Binôme du jour</th><th>Exercices (réalisé · ressenti · réserve)</th><th>Bilan</th><th></th></tr>${lignes}</table></div></section>`;
}
/* S1 : plan de mise en place du circuit (PDF gardé hors ligne) : 4 colonnes × 4 ateliers, 15-16 au poids du corps si plus de 14 binômes */
const PLAN_S1=`<section class="carte"><h3>📄 Mise en place du circuit</h3><p class="small">Plan du dojo en <b>4 colonnes de 4 ateliers</b> : photo, muscles et matériel de chaque atelier, puis la liste du matériel à sortir. Ateliers <b>15 et 16</b> au poids du corps (squat, gainage) : seulement s’il y a plus de 14 binômes.</p>
  <div class="rangee"><a class="bt act" href="s1-plan-16-ateliers.pdf" target="_blank" rel="noopener">📄 Plan du dojo (PDF)</a><a class="bt act" href="s1-fiches-16-ateliers.pdf" target="_blank" rel="noopener">🖨️ Fiches des 16 ateliers (A4)</a></div>
  <p class="small muted">Fiches recto-verso (imprimer en recto-verso) : au recto le numéro en grand, la photo et le matériel ; au verso les consignes, la respiration, les muscles sollicités, l’étirement et la sécurité.</p></section>`;
function bilanLibP(k,v){const L={obj:{oui:'objectif atteint',partiel:'objectif en partie',non:'objectif non atteint'},vecu:{facile:'trop facile',adapte:'adapté',dur:'difficile',trop:'trop difficile'},reg:{garder:'garde tout',plus:'augmente',moins:'diminue',tech:'technique d\'abord'},cons:{oui:'consignes respectées',partiel:'consignes en partie',non:'consignes non respectées'},sur:{charge:'la charge',reps:'les répétitions',series:'les séries',recup:'la récupération'},role:{pareur:'pareur',obs:'observateur',coach:'coach'}};return (L[k]||{})[v]||''}
function vEleves(){
  const c=classeCourante();if(!c)return '<h2>Élèves</h2><p class="muted">Aucune classe.</p>';const K=elevesClasse(c);
  return `<h2>Élèves</h2>${choixClasse()}<div class="tbw"><table class="tb"><tr><th>Élève</th><th>Partenaires successifs</th><th>Séances</th><th>Abs.</th><th>Mobile</th><th>Charges réf.</th><th>AFL2</th><th>AFL3</th></tr>
   ${K.map(k=>{const E=DB.eleves[k],nom=nomDeK(k);if(!E)return `<tr class="pasrecu"><td>${esc(nom)}</td><td colspan="7" class="muted">aucune séance reçue</td></tr>`;
     const pa=[...new Set(SIDS.flatMap(S=>((E.recu[S]||{}).bin||[]).filter(n=>norm(n)!==norm(E.nom))))],a2=indicAFL2(E),a3=indicAFL3(E),pr=progRM(E);
     return `<tr><td><button type="button" class="lien" data-fiche="${esc(k)}"><b>${esc(nom)}</b></button></td><td class="small">${esc(pa.map(pre).join(', ')||'—')}</td><td class="small">${recuS(E).join(' ')}</td><td>${Object.keys(E.abs).length||''}</td>
      <td class="small">${E.projet&&E.projet.mob?esc(MOBILES[E.projet.mob].nom):'—'}</td><td class="small">${Object.keys(E.rm).length}${pr?' · +'+pr.moy+' %':''}</td><td>${degTxt(a2.deg)}</td><td>${degTxt(a3.deg)}</td></tr>`}).join('')}</table></div>
   <p class="small muted">AFL2 et AFL3 : degré proposé (1 à 4) d'après les saisies des élèves de S4 à S8. Vous décidez dans l'onglet Note.</p>`;
}
const degTxt=d=>d?`<span class="deg d${d}">${d}</span>`:'<span class="muted">—</span>';
function vFiche(){
  const k=DB.eleve,E=DB.eleves[k];if(!E){DB.vue='eleves';return vEleves()}
  const a2=indicAFL2(E),a3=indicAFL3(E),pa=SIDS.filter(S=>E.recu[S]).map(S=>[S,((E.recu[S]||{}).bin||[]).filter(n=>norm(n)!==norm(E.nom)).map(pre).join(', ')||'seul']);
  const rm=Object.entries(E.rm).sort((a,b)=>nomA(a[0]).localeCompare(nomA(b[0]))),sauts=sautsRM(E);
  const pj=E.projet||{},rep=repDe(k),N=DB.notes[k]||{};
  const sea=SIDS.filter(S=>E.recu[S]||E.abs[S]).map(S=>{const d=E.seances[S]||{},b=d.bilan;
    if(E.abs[S])return `<details><summary>${S} · absent(e)</summary></details>`;
    return `<details${S===DB.ficheS?' open':''}><summary>${S} · ${esc(SEANCES.find(x=>x.id===S).titre)} <span class="muted small">· avec ${esc(pa.find(p=>p[0]===S)[1])} · ${esc((E.recu[S]||{}).date||'')}</span></summary>
     ${exosReal(d).map(([at,x])=>{const nx=x.next||{},av=x.avis;return `<div class="exf"><b>${esc(nomA(at))}</b> : ${esc(reelTxt(x.real))}${tonnage(x.real)?` <span class="muted small">(${Math.round(tonnage(x.real))} kg soulevés)</span>`:''}<br>
       <span class="small">Ressenti ${x.ressenti&&x.ressenti.note?x.ressenti.note+'/10':'—'}${x.ressenti&&x.ressenti.mot?' « '+esc(x.ressenti.mot)+' »':''} · réserve ${esc((RIR_Q.find(q=>q[0]===x.rir)||[])[1]||'—')} · la prochaine fois : ${esc((NEXT_Q.find(q=>q[0]===nx.c)||[])[1]||'—')}${nx.pq?' (« '+esc(nx.pq)+' »)':''}</span>
       ${av?`<br><span class="small">Coach ${esc(pre(av.par||''))} : point clé ${av.cle==='1'?'tenu':av.cle==='0'?'à revoir':'—'}${(av.signes||[]).length?' · '+esc(av.signes.join(', ')):''}${av.conseil?' · « '+esc(av.conseil)+' »':''}${x.aide?` · conseil jugé ${x.aide==='1'?'utile':'pas utile'}`:''}</span>`:''}</div>`}).join('')}
     ${S==='S2'||S==='S3'?`<p class="small">Charges de référence : ${Object.entries(E.rm).filter(([,r])=>r.S===S).map(([at,r])=>esc(nomA(at))+' '+fKg(r.dix||r.cm)).join(' · ')||'—'}</p>`:''}
     ${b?`<p class="small"><b>Bilan</b> : ${esc(['obj','cons','vecu','reg','sur','role'].map(q=>bilanLibP(q,b[q])).filter(Boolean).join(' · '))}${b.reussi?' · réussi : « '+esc(b.reussi)+' »':''}${b.ameliorer?' · à améliorer : « '+esc(b.ameliorer)+' »':''}</p>`:''}
     ${d.analyse?`<p class="small"><b>Analyse</b> : ${esc(d.analyse)}</p>`:''}</details>`}).join('');
  return `<p class="noprint"><button type="button" class="lien" data-vue="eleves">← Élèves</button> <button type="button" class="lien" onclick="print()">🖨 Imprimer la fiche</button></p>
   <h2>${esc(E.nom)}</h2><p class="muted">${esc(E.classe)} · identifiant ${esc(k)}</p>
   <section class="carte"><h3>Partenaires et présence</h3><p class="small">${pa.map(([S,n])=>`<b>${S}</b> ${esc(n)}`).join(' · ')||'—'}${Object.keys(E.abs).length?` · <span class="tag ab">absent(e) ${Object.keys(E.abs).join(', ')}</span>`:''}</p></section>
   <section class="carte"><h3>Projet d'entraînement</h3>${pj.mob?`<p><b>${esc(MOBILES[pj.mob].nom)}</b> (${esc(MOBILES[pj.mob].theme)})${E.choix&&E.choix.pourquoi?` · « ${esc(E.choix.pourquoi)} »`:''}</p>
     <div class="tbw"><table class="tb small"><tr><th>Exercice</th><th>Séries × rép.</th><th>%</th><th>Charge prévue</th></tr>${(pj.exos||[]).map(x=>{const r=E.rm[x.at],a=ATELIERS.find(z=>z.id===x.at),ch=r&&x.pct&&a?chargeReelle(a.support,r.cm*x.pct/100):null;return `<tr><td>${esc(nomA(x.at))}</td><td>${x.series} × ${x.reps}</td><td>${x.pct||'—'}</td><td>${ch?fKg(ch.charge):'—'}</td></tr>`}).join('')}</table></div>
     ${(E.ajust||[]).length?`<p class="small"><b>Ajustements</b> : ${E.ajust.map(a=>`${a.S} ${esc(nomA(a.at))} : ${esc(a.txt||'')}${a.pourquoi?' (« '+esc(a.pourquoi)+' »)':''}`).join(' · ')}</p>`:''}`:'<p class="muted small">Pas encore de projet (S7).</p>'}
     <p class="small">Répartition AFL2/AFL3 : <b>${esc(rep||'pas encore choisie')}</b>${N.rep?' (figée le jour de l\'épreuve)':''}</p></section>
   <section class="carte"><h3>Charges de référence</h3>${sauts.length?`<p class="alerte small">⚠️ ${sauts.map(s=>`${esc(nomA(s.at))} +${Math.round(s.p*100)} % en ${esc(s.a.S||s.a.date||'')}`).join(' · ')} : erreur de saisie ou surestimation ?</p>`:''}
     ${rm.length?`<div class="tbw"><table class="tb small"><tr><th>Exercice</th><th>Évolution (séance · charge max · origine)</th><th></th></tr>${rm.map(([at,r])=>{const h=histRM(r);return `<tr><td>${esc(nomA(at))}${r.dix?`<br><span class="muted">10 RM ${fKg(r.dix)}</span>`:''}</td><td>${h.map(x=>`${esc(x.S||x.date||'')} ${fKg(x.cm)} <span class="muted">(${esc(MODE_TXT[x.mode]||x.mode||'')})</span>`).join(' → ')}${h.length>1?` · <b>${h[h.length-1].cm>=h[0].cm?'+':''}${Math.round(100*(h[h.length-1].cm/h[0].cm-1))} %</b>`:''}</td><td>${svgRM(h)}</td></tr>`}).join('')}</table></div>`:'<p class="muted small">Aucune.</p>'}</section>
   <section class="carte"><h3>Ce que montrent ses saisies (S4 à S8)</h3><p><b>AFL2 · s'entraîner</b> ${degTxt(a2.deg)}<br><span class="small">${esc(a2.faits)}</span></p><p><b>AFL3 · coopérer</b> ${degTxt(a3.deg)}<br><span class="small">${esc(a3.faits)}</span></p>
     ${conseilsDe(E).filter(x=>x.av.conseil).length?`<details><summary>Ses conseils au partenaire</summary><ul class="small">${conseilsDe(E).filter(x=>x.av.conseil).map(x=>`<li>${x.S} · ${esc(pre(x.P.nom))} · ${esc(nomA(x.at))} : « ${esc(x.av.conseil)} »${x.x.aide?` (${x.x.aide==='1'?'utile':'pas utile'})`:''}</li>`).join('')}</ul></details>`:''}</section>
   <section class="carte"><h3>Séances</h3>${sea||'<p class="muted">Aucune séance reçue.</p>'}</section>
   <section class="carte"><h3>Évaluation</h3><p class="small">${noteTxt(k)}</p>${N.appr?`<p class="small"><b>Appréciation</b> : ${esc(N.appr)}</p>`:''}<div class="rangee noprint"><button type="button" class="bt" data-epreuve="${esc(k)}">🏁 Fiche d'épreuve S9</button><button type="button" class="bt" data-bilan8="${esc(k)}">📝 Bilan S8 et appréciation</button></div></section>`;
}
/* ---------- Note : AFL1 /12 (épreuve S9), AFL2 + AFL3 /8 (au fil du cycle) ---------- */
const num=v=>v===''||v==null||isNaN(+v)?null:+v;
function totalDe(k){const N=DB.notes[k]||{},m=maxRep(repDe(k)),v=[num(N.prod),num(N.anal),num(N.a2),num(N.a3)];
  if(v.some(x=>x==null))return {tot:null,err:''};
  let err='',bloq=false;if(v[0]>DB.cfg.prod||v[1]>DB.cfg.anal){err='AFL1 au-dessus du maximum';bloq=true}else if(m&&(v[2]>m[0]||v[3]>m[1])){err='AFL2/AFL3 au-dessus de la répartition '+repDe(k);bloq=true}else if(!m)err='répartition inconnue';
  return {tot:bloq?null:Math.round((v[0]+v[1]+v[2]+v[3])*2)/2,err}}
const fN=v=>v==null||v===''?'—':String(v).replace('.',',');
function noteTxt(k){const N=DB.notes[k]||{},t=totalDe(k);return `AFL1 Produire ${fN(N.prod)}/${DB.cfg.prod} · Analyser ${fN(N.anal)}/${DB.cfg.anal} · AFL2 ${fN(N.a2)} · AFL3 ${fN(N.a3)} (${esc(repDe(k)||'répartition ?')}) · <b>Total ${t.tot==null?'—':String(t.tot).replace('.',',')+' / 20'}</b>${t.err?' <span class="alerte">'+esc(t.err)+'</span>':''}`}
function vNote(){
  const c=classeCourante();if(!c)return '<h2>Note</h2><p class="muted">Aucune classe.</p>';const K=elevesClasse(c),ok12=DB.cfg.prod+DB.cfg.anal===12;
  return `<h2>Note · CCF</h2>${choixClasse()}
   <section class="carte"><h3>Réglages de l'AFL1 (épreuve S9, 12 points)</h3><div class="rangee"><label>Produire <input type="number" id="cfgProd" min="0" max="12" step="1" value="${DB.cfg.prod}" class="petitnb"></label><label>Analyser <input type="number" id="cfgAnal" min="0" max="12" step="1" value="${DB.cfg.anal}" class="petitnb"></label>${ok12?'<span class="ok small">= 12 ✓</span>':'<span class="alerte small">La somme doit faire 12.</span>'}</div>
    <p class="small muted">AFL2 + AFL3 = 8 points répartis selon le choix de l'élève (6/2, 4/4 ou 2/6, annoncé avant l'épreuve). Les propositions viennent des saisies de S4 à S8 ; c'est vous qui décidez.</p>
    <div class="rangee"><button type="button" class="bt" data-act="reprendre">↧ Reprendre les propositions AFL2/AFL3 (cases vides seulement)</button><button type="button" class="bt act" data-tirage="${esc(c)}">🎲 Tirage au sort S9</button></div></section>
   <div class="tbw"><table class="tb note"><tr><th>Élève</th><th>Rép.</th><th>Produire /${DB.cfg.prod}</th><th>Analyser /${DB.cfg.anal}</th><th>AFL2</th><th>AFL3</th><th>Total /20</th><th></th></tr>
   ${K.map(k=>{const E=DB.eleves[k],N=DB.notes[k]||{},m=maxRep(repDe(k)),a2=E?indicAFL2(E):{},a3=E?indicAFL3(E):{},p2=m?ptsDeg(a2.deg,m[0]):null,p3=m?ptsDeg(a3.deg,m[1]):null,t=totalDe(k);
     const inp=(f,v,max,ph)=>`<input type="number" inputmode="decimal" step="0.5" min="0" max="${max||20}" class="petitnb" data-note="${esc(k)}" data-f="${f}" value="${v??''}" placeholder="${ph??''}">`;
     return `<tr><td><button type="button" class="lien" data-fiche="${esc(k)}">${esc(nomDeK(k))}</button></td><td class="small">${esc(repDe(k)||'?')}</td>
      <td>${inp('prod',N.prod,DB.cfg.prod)}</td><td>${inp('anal',N.anal,DB.cfg.anal)}</td>
      <td>${inp('a2',N.a2,m&&m[0],p2)}<br><span class="small muted" title="${esc(a2.faits||'')}">prop. ${p2??'—'}${m?' /'+m[0]:''}</span></td><td>${inp('a3',N.a3,m&&m[1],p3)}<br><span class="small muted" title="${esc(a3.faits||'')}">prop. ${p3??'—'}${m?' /'+m[1]:''}</span></td>
      <td><b>${t.tot==null?'—':String(t.tot).replace('.',',')}</b>${t.err?`<br><span class="alerte small">${esc(t.err)}</span>`:''}</td>
      <td><button type="button" class="bt mini" data-epreuve="${esc(k)}">🏁 Épreuve</button> <button type="button" class="bt mini" data-bilan8="${esc(k)}">📝 S8</button></td></tr>`}).join('')}</table></div>
   <p class="small muted">Propositions : degré 1 → ¼ des points, 2 → ½, 3 → ¾, 4 → tous. Survolez « prop. » pour voir les faits qui la justifient (ils sont aussi dans la fiche de l'élève et dans l'export).</p>`;
}
/* fiche d'épreuve S9 : sur un seul écran, ce qu'il faut pour noter l'AFL1 en direct */
function ficheEpreuve(k){
  const E=DB.eleves[k],N=DB.notes[k]=DB.notes[k]||{};if(!E)return toast('Aucune donnée reçue pour cet élève.');
  if(!N.rep&&E.afl&&E.afl.rep){N.rep=E.afl.rep;N.repDate=new Date().toISOString().slice(0,10);sauver()}   // répartition figée au début de l'épreuve
  const t=(DB.tirages[E.classe]||{})[E.nom],tir=(t&&t.l)||E.tirage||[],pj=E.projet||{},d9=E.seances.S9||{};
  const crit=EVAL.afl1;const bloc=(f,i,max)=>{const deg=N[f+'D'];return `<div class="blocafl"><h4>${esc(crit[i][0])} · /${max}</h4><ul class="small">${crit[i][2].map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    <div class="degs">${[1,2,3,4].map(d=>`<button type="button" class="${deg===d?'ici':''}" data-deg="${esc(k)}" data-f="${f}" data-d="${d}">${d}</button>`).join('')}</div>
    <label class="small">Points <input type="number" step="0.5" min="0" max="${max}" class="petitnb" data-note="${esc(k)}" data-f="${f}" value="${N[f]??''}"></label></div>`};
  fen(`<h3>🏁 Épreuve S9 · ${esc(E.nom)}</h3><p class="small">Mobile <b>${pj.mob?esc(MOBILES[pj.mob].nom):'—'}</b> · répartition AFL2/AFL3 <b>${esc(N.rep||'non choisie')}</b>${N.rep?' (figée)':''}</p>
   <div class="tbw"><table class="tb small"><tr><th>Exercice tiré</th><th>Projet</th><th>Charge prévue</th><th>Réalisé S9</th></tr>${tir.length?tir.map(at=>{const x=(pj.exos||[]).find(z=>z.at===at)||{},r=E.rm[at],a=ATELIERS.find(z=>z.id===at),ch=r&&x.pct&&a?chargeReelle(a.support,r.cm*x.pct/100):null,y=(d9.exos||{})[at];
     return `<tr><td><b>${esc(nomA(at))}</b></td><td>${x.series?x.series+' × '+x.reps+' à '+x.pct+' %':'—'}</td><td>${ch?fKg(ch.charge):'—'}</td><td>${y&&y.real?esc(reelTxt(y.real))+(y.ressenti&&y.ressenti.note?' · '+y.ressenti.note+'/10':''):'—'}</td></tr>`}).join(''):'<tr><td colspan="4" class="muted">Pas de tirage : bouton « Tirage au sort S9 » dans l\'onglet Note.</td></tr>'}</table></div>
   <div class="afl1">${bloc('prod',0,DB.cfg.prod)}${bloc('anal',1,DB.cfg.anal)}</div>
   <p class="small" id="totEp">${noteTxt(k)}</p><button type="button" class="bt act" data-fermer data-rendre>✓ Fermer</button>`,true);
}
function brouillonAppr(k){const E=DB.eleves[k];if(!E)return '';const a2=indicAFL2(E),a3=indicAFL3(E),pr=progRM(E),pj=E.projet||{};
  const f=[],dif=[];
  if(pj.mob)f.push(`projet ${MOBILES[pj.mob].nom.toLowerCase()} construit`);if(pr&&pr.moy>0)f.push(`charges max en progrès (+${pr.moy} % en moyenne)`);
  if(a2.regN&&a2.reg/a2.regN>=.7)f.push('applique les régulations annoncées');else if(a2.regN)dif.push('appliquer d\'une séance à l\'autre ce qu\'il/elle annonce');
  if(a2.jusN&&a2.jus/a2.jusN>=.7)f.push('analyse juste de ses ressentis');else if(a2.jusN)dif.push('relier ses ressentis aux attendus du mobile');
  if(a3.con>=3)f.push(`coach investi (${a3.con} conseils${a3.utN?', '+a3.ut+' jugés utiles':''})`);else dif.push('conseiller davantage son partenaire');
  const ab=Object.keys(E.abs).length;
  return `${f.length?'Points forts : '+f.join(', ')+'. ':''}${dif.length?'À travailler : '+dif.join(', ')+'. ':''}${ab?ab+' absence(s). ':''}`.trim()}
function bilanS8(k){const E=DB.eleves[k],N=DB.notes[k]=DB.notes[k]||{};const a2=E?indicAFL2(E):{},a3=E?indicAFL3(E):{};
  fen(`<h3>📝 Bilan S8 · ${esc(nomDeK(k))}</h3><p class="small"><b>AFL2</b> ${degTxt(a2.deg)} ${esc(a2.faits||'')}<br><b>AFL3</b> ${degTxt(a3.deg)} ${esc(a3.faits||'')}</p>
   <label class="ch" for="appr">Appréciation (modifiable, exportée)</label><textarea id="appr" rows="5" data-appr="${esc(k)}">${esc(N.appr||'')}</textarea>
   <div class="rangee"><button type="button" class="bt" data-brouillon="${esc(k)}">✎ Proposer un brouillon</button><button type="button" class="bt act" data-fermer>✓ Fermer</button></div>
   <p class="small muted">Le bilan de S8 ne donne pas de note : la note se fait en S9 (CCF).</p>`,true)}
function vPilotage(){const c=classeCourante();if(!c)return '<h2>Pilotage</h2>';const A=alertes(c);
  return `<h2>Pilotage · ${esc(c)}</h2>${choixClasse()}<p class="small muted">À régler avant la S9 : QR manquants, répartition non choisie, charges de référence manquantes, sauts de charge suspects, absences.</p>
   ${A.length?`<div class="tbw"><table class="tb"><tr><th>Élève</th><th>À vérifier</th></tr>${A.sort((a,b)=>b.g-a.g||triNom(a.nom,b.nom)).map(a=>`<tr><td>${DB.eleves[a.k]?`<button type="button" class="lien" data-fiche="${esc(a.k)}">${esc(a.nom)}</button>`:esc(a.nom)}</td><td class="${a.g===2?'':'muted'}">${a.g===2?'⚠️ ':''}${esc(a.t)}</td></tr>`).join('')}</table></div>`:'<p class="ok">Rien à signaler.</p>'}`}
/* ---------- Exports ---------- */
function csv(L){return '﻿'+L.map(l=>l.map(v=>{v=v==null?'':String(v);if(typeof v==='string'&&/^\d+\.\d+$/.test(v))v=v.replace('.',',');return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(';')).join('\r\n')}
function exporter(type){const c=classeCourante();if(!c)return toast('Choisissez une classe.');const K=elevesClasse(c),j=EPSCode.jour(),f=c.replace(/[^\w-]+/g,'');
  if(type==='notes'){const L=[['Classe','Élève','Répartition AFL2/AFL3','AFL1 Produire','AFL1 Analyser','AFL1 /12','AFL2','AFL3','Total /20','Contrôle','Justification AFL2','Justification AFL3','Appréciation']];
    K.forEach(k=>{const N=DB.notes[k]||{},E=DB.eleves[k],t=totalDe(k);L.push([c,nomDeK(k),repDe(k),N.prod,N.anal,num(N.prod)!=null&&num(N.anal)!=null?+N.prod+ +N.anal:'',N.a2,N.a3,t.tot,t.err,E?indicAFL2(E).faits:'',E?indicAFL3(E).faits:'',N.appr||''])});
    return telecharger('muscu_notes_'+f+'_'+j+'.csv',csv(L),'text/csv')}
  if(type==='saisies'){const L=[['Classe','Élève','Séance','Date','Binôme','Absent','Exercice','Séries','Répétitions','Charge','Ressenti /10','Mot','Réserve','La prochaine fois','Pourquoi','Coach','Conseil reçu','Bilan']];
    K.forEach(k=>{const E=DB.eleves[k];if(!E)return;SIDS.forEach(S=>{if(!E.recu[S]&&!E.abs[S])return;const d=E.seances[S]||{},b=d.bilan,bin=((E.recu[S]||{}).bin||[]).filter(n=>norm(n)!==norm(E.nom)).join(', '),bt=b?['obj','cons','vecu','reg','sur','role'].map(q=>bilanLibP(q,b[q])).filter(Boolean).join(' · '):'';
      const ex=exosReal(d);if(!ex.length)L.push([c,E.nom,S,(E.recu[S]||{}).date,bin,E.abs[S]?'oui':'','','','','','','','','','','','',bt]);
      ex.forEach(([at,x])=>{const nx=x.next||{},av=x.avis||{};L.push([c,E.nom,S,(E.recu[S]||{}).date,bin,'',nomA(at),x.real.series,x.real.reps,x.real.charge,x.ressenti&&x.ressenti.note,x.ressenti&&x.ressenti.mot,(RIR_Q.find(q=>q[0]===x.rir)||[])[1],(NEXT_Q.find(q=>q[0]===nx.c)||[])[1],nx.pq,av.par,av.conseil,bt])})})});
    return telecharger('muscu_saisies_'+f+'_'+j+'.csv',csv(L),'text/csv')}
  if(type==='json'){const o={app:'musculation-prof',v:7,classe:c,exporte:new Date().toISOString(),cfg:DB.cfg,eleves:Object.fromEntries(K.filter(k=>DB.eleves[k]).map(k=>[k,DB.eleves[k]])),notes:Object.fromEntries(K.filter(k=>DB.notes[k]).map(k=>[k,DB.notes[k]]))};
    return telecharger('muscu_classe_'+f+'_'+j+'.json',JSON.stringify(o,null,1))}
}
function vExport(){const c=classeCourante();return `<h2>Exporter · ${esc(c||'—')}</h2>${choixClasse()}<section class="carte"><div class="rangee"><button type="button" class="bt act" data-exp="notes">📊 Notes et appréciations (CSV, Pronote)</button><button type="button" class="bt" data-exp="saisies">📋 Saisies des élèves par séance (CSV)</button><button type="button" class="bt" data-exp="json">🗂 Classe complète (JSON)</button></div>
  <p class="small muted">Fiche individuelle : ouvrez la fiche de l'élève puis « 🖨 Imprimer la fiche » (ou enregistrer en PDF). Le CSV s'ouvre dans Excel ou LibreOffice ; colonnes séparées par des points-virgules.</p></section>`}
/* ---------- Sauvegarde et archivage annuel ---------- */
const anneeSco=t=>{const d=new Date(t);return d.getMonth()>=7?d.getFullYear():d.getFullYear()-1};
function vieux(){if(DEMO)return [];const y=anneeSco(Date.now());return Object.entries(DB.eleves).filter(([,E])=>{const ts=Math.max(0,...Object.values(E.recu||{}).map(r=>r.ts||0));return ts&&anneeSco(ts*1000)<y}).map(([k])=>k)}
function vSauvegarde(){const V=vieux();
  return `<h2>Sauvegarde</h2><section class="carte act"><p><b>Gardez une sauvegarde à jour</b> : elle contient vos classes, toutes les séances reçues, les notes et la <b>clé du code du cours</b> de chaque classe.</p>
   <div class="rangee"><button type="button" class="bt act" data-act="sauver">💾 Enregistrer la sauvegarde</button><label class="bt">📂 Restaurer une sauvegarde<input id="restFic" type="file" accept=".json" hidden></label></div>
   <p class="small muted">${DB.sauve?'Dernière sauvegarde : '+new Date(DB.sauve).toLocaleString('fr-FR'):'Pas encore de sauvegarde.'}</p></section>
   ${V.length?`<section class="carte"><h3>📦 Archiver l'année passée</h3><p class="small">${V.length} élève(s) n'ont reçu aucune séance cette année scolaire. Téléchargez l'archive, puis retirez-les de l'iPad pour garder de la place.</p><button type="button" class="bt" data-act="archiver">📦 Télécharger l'archive et retirer</button></section>`:''}
   <p class="small muted">Ancienne version de l'outil (avant la v7) : <a href="index-old.html">index-old.html</a>.</p>`}

/* v5.0 : tirage au sort de l'évaluation (S9) : 3 exercices parmi ceux réalisés en S7 et S8, au moins un du haut et un du bas */
function realises(e){return [...new Set(['S7','S8'].flatMap(S=>Object.entries(((e.seances||{})[S]||{}).exos||{}).filter(([,x])=>x&&x.real).map(([at])=>at)))]}
function tirer(pool){
  const m=a=>a.slice().sort(()=>Math.random()-.5),z=at=>(ATELIERS.find(a=>a.id===at)||{}).zone;
  const h=m(pool.filter(at=>z(at)==='haut')),b=m(pool.filter(at=>z(at)==='bas')),r=[];
  if(h.length)r.push(h[0]);if(b.length)r.push(b[0]);
  m(pool).forEach(at=>{if(r.length<3&&!r.includes(at))r.push(at)});
  return {l:r,ok:r.length===3&&!!h.length&&!!b.length};
}
async function vueTirage(c,refaire){
  DB.tirages=DB.tirages||{};const T=DB.tirages[c]=DB.tirages[c]||{};
  const L=elevesClasse(c).map(k=>DB.eleves[k]).filter(Boolean);   // v7.0 : fiches élèves
  L.forEach(e=>{if(!T[e.nom]||refaire===true||refaire===e.nom){const p=realises(e);T[e.nom]=Object.assign(tirer(p),{pool:p.length,date:new Date().toISOString().slice(0,10)})}});sauver();
  const nomA=at=>(ATELIERS.find(a=>a.id===at)||{}).nom||at;
  const r={};L.forEach(e=>{if(T[e.nom].l.length)r[e.nom]=T[e.nom].l});
  let svg='';try{svg=svgQR(await encoderQR({a:'MUS',v:1,t:'T',c,r}))}catch(x){svg='<p class="alerte">Trop d\'élèves pour un seul QR : faites deux groupes.</p>'}
  fen(`<h3>🎲 Tirage au sort S9 · ${esc(c)}</h3><p class="small">3 exercices par élève parmi ceux réalisés en S7 et S8 (séances reçues), au moins un du haut et un du bas du corps.</p>
   <div class="tbw"><table class="tb small"><tr><th>Élève</th><th>Exercices tirés</th><th></th></tr>${L.sort((a,b)=>norm(a.nom).localeCompare(norm(b.nom))).map(e=>{const t=T[e.nom];return `<tr><td><b>${esc(e.nom)}</b></td><td>${t.l.length?t.l.map(nomA).map(esc).join(' · '):'<span class="alerte">aucun exercice réalisé en S7-S8</span>'}${t.l.length&&!t.ok?` <span class="alerte">⚠️ ${t.pool<3?'moins de 3 exercices réalisés':'pas de haut et de bas'}</span>`:''}</td><td><button type="button" class="bt mini" data-retirer-t="${esc(c)}" data-nom="${esc(e.nom)}">↻</button></td></tr>`}).join('')}</table></div>
   <p class="small"><b>Les élèves scannent ce QR</b> (bouton « QR de la classe », séance S9) : chaque binôme reçoit ses exercices.</p><div class="qr">${svg}</div>
   <div class="rangee"><button type="button" class="bt" data-tirage-tout="${esc(c)}">↻ Tout retirer au sort</button><button type="button" class="bt" data-fermer>Fermer</button></div>`,true);
}

function telecharger(nom,txt,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:type||'application/json'}));a.download=nom;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}

/* ---------- Démo : classe fictive de 30 élèves, binômes qui changent, absences, S1 à S8 ---------- */
function demoGenerer(){
  let g=7;const rnd=()=>(g=(g*16807)%2147483647)/2147483647,pick=l=>l[Math.floor(rnd()*l.length)];
  const P=['Inès','Lucas','Chloé','Yanis','Léa','Hugo','Sarah','Noah','Emma','Adam','Jade','Nathan','Lina','Enzo','Manon','Rayan','Zoé','Tom','Camille','Ilyes','Louise','Mathis','Anaïs','Sacha','Maëlys','Axel','Clara','Bilal','Eva','Théo'];
  const N=['AMRANI','BERNARD','DUBOIS','FERRAND','MARTIN','MOREAU','PETIT','ROUX','GARCIA','LEROY','FAURE','GIRARD','BLANC','GUERIN','MULLER','HENRY','ROUSSEL','NICOLAS','PERRIN','MOREL','MATHIEU','CLEMENT','GAUTHIER','DUMONT','LOPEZ','FONTAINE','CHEVALIER','ROBIN','MASSON','SANCHEZ'];
  const c='Tle DÉMO',L=P.map((p,i)=>p+' '+N[i]);DB={classes:{[c]:{eleves:L.slice().sort(triNom),lien:'',cc:'ZGVtb2RlbW9kZW1v'}},carnets:{},eleves:{},journal:[],recus:{},notes:{},tirages:{},cfg:{prod:6,anal:6},classe:c,vue:'accueil',migre7:1};
  const niv=L.map(()=>.6+rnd()*.8),ATS=ATELIERS_TEST,base=Date.parse('2026-09-07');
  const rmDe={},hist={};L.forEach((n,i)=>{rmDe[n]={};ATS.forEach(at=>{const a=ATELIERS.find(z=>z.id===at),b={dc:30,dch:12,rowh:12,curlb:18,extri:14,dm:8,fentes:10,squath:16,hip:30,rowb:24,sdtj:24,tirage:16,pullover:8,oiseau:5}[at]||12;rmDe[n][at]={cm:Math.round(b*niv[i]*2)/2,mode:'test',S:rnd()<.5?'S2':'S3',date:'2026-09-1'+(rnd()<.5?'4':'8')}})});
  const prof=L.map((n,i)=>({mob:pick(['tonif','volume','volume','puiss']),qual:.3+rnd()*.7,coach:.2+rnd()*.8}));
  let bin=[];for(let i=0;i<30;i+=2)bin.push([i,i+1]);
  const abs={S3:[4,17],S5:[9],S6:[22,23],S8:[11]};
  const rep=['6/2','4/4','2/6'];
  SIDS.forEach((S,j)=>{const n=j+1;if(n===9)return;
    if(n===5){/* deux binômes s'échangent leurs partenaires */bin=bin.map(b=>b.slice());const t=bin[2][1];bin[2][1]=bin[3][1];bin[3][1]=t}
    const ts=Math.round((base+j*7*864e5)/1000)+3600,date=new Date((ts)*1000).toISOString().slice(0,10);
    bin.forEach(([a,b])=>{
      const R=[a,b].map(i=>{const nom=L[i],D={},ab=(abs[S]||[]).includes(i);const pr=prof[i],q=pr.qual;
        if(!ab){D.ech={wc:['P1','P2','P3','gainage','act_scap','act_y','act_pont','P5'].filter(()=>rnd()<.9)};
          if(n===1)D.circuit=Object.fromEntries(CIRCUIT_S1.slice(0,8+Math.floor(rnd()*6)).map(x=>[x,true]));
          if(n>=4){const mob=n<=6?MOB_J[S]:pr.mob,M=MOBILES[mob],l=n<=6?LISTES_DEFAUT[S]:['dc','squath','rowb','hip'].slice(n===7?0:1,n===7?3:4);D.exos={};
            l.forEach(at=>{const r=rmDe[nom][at]||{cm:10},pct=(M.pct?M.pct[0]:60),ch=Math.round(r.cm*pct/100),reps=mob==='tonif'?15:mob==='volume'?10:5;
              const sens=rnd()<q?0:pick([1,-1]),rir=mob==='volume'?(sens===0?'12':sens>0?'5':'0'):(sens===0?'34':sens>0?'5':'12');
              const nc=rnd()<q?(sens>0?pick(['chargeP','reps']):sens<0?'chargeM':'garde'):pick(['garde','serie','posture']);
              const x={real:{series:3+(rnd()<.3?1:0),reps,charge:ch+(n>=7&&n===8&&q>.5?2:0)},ressenti:{note:4+Math.floor(rnd()*5),mot:pick(['ça brûle','léger','ça gonfle','chaud','dur'])},rir,next:{c:nc,pq:rnd()<q?pick(['trop facile en fin de série','je compense avec le dos','je finis avec 1 rép. en réserve']):''}};
              const p=L[i===a?b:a],pi=i===a?b:a;if(!(abs[S]||[]).includes(pi)&&rnd()<prof[pi].coach)x.avis={par:p,cle:rnd()<.6?'1':'0',signes:rnd()<.3?['Dos qui s\'arrondit ou se creuse']:[],conseil:rnd()<prof[pi].coach?pick(['Ralentis la descente','Garde le dos plat','Monte la charge la prochaine fois','Souffle à la poussée']):'',propres:n>=6?Math.floor(8+rnd()*5):null,obj:n>=7&&rnd()<.5?{k:'reps',v:12}:null};
              if(n>4&&rnd()<.7)x.aide=rnd()<.7?'1':'0';D.exos[at]=x});
            D.bilan={obj:pick(['oui','oui','partiel','non']),cons:pick(['oui','partiel']),vecu:pick(['adapte','adapte','dur','facile']),reg:pick(['garder','plus','moins','tech']),role:pick(['coach','obs','pareur'])};if(['plus','moins'].includes(D.bilan.reg))D.bilan.sur=pick(['charge','reps','recup'])}}
        const rm={};Object.entries(rmDe[nom]).forEach(([at,r])=>{if(+r.S.slice(1)<=n)rm[at]=r});
        if(n===5&&!ab&&(i===6||rnd()<.4)){const at='dc',r=rmDe[nom][at];r.hist=[{cm:r.cm,S:r.S,date:r.date,mode:r.mode}];r.cm=Math.round(r.cm*(i===6?1.25:1.08)*2)/2;r.mode='seance';r.S='S5';r.date=date}
        const o={e:nom,D,rm:JSON.parse(JSON.stringify(rm))};if(ab)o.ab=1;
        if(n>=7)o.pr={mob:pr.mob,exos:['dc','squath','rowb','hip'].map(at=>({at,series:4,reps:pr.mob==='tonif'?15:pr.mob==='volume'?10:5,pct:(MOBILES[pr.mob].pct||[60])[0]}))};
        if(n>=6&&i!==13)o.af={rep:rep[i%3],role:'coach'};return o});
      if(S==='S6'&&a===20)return;   /* un binôme oublie son QR en S6 (alerte de pilotage) */
      importerGroupe({a:'MUS',v:1,t:'G',c,s:S,d:date,ts,id:'demo'+S+a,R},'qr')})});
  journal('Démo : 30 élèves, séances S1 à S8 reçues par QR.');
}

/* ---------- Événements ---------- */
document.addEventListener('click',async ev=>{
  const t=ev.target.closest('button');if(!t)return;const d=t.dataset;
  if(d.vue){DB.vue=d.vue;sauver();rendre();window.scrollTo(0,0);return}
  if(d.fiche){DB.eleve=d.fiche;DB.ficheS=DB.vue==='seance'?DB.seance:'';DB.vue='fiche';rendre();window.scrollTo(0,0);return}
  if(d.seance){DB.seance=d.seance;sauver();rendre();return}
  if(d.epreuve){document.querySelector('.voile')?.remove();ficheEpreuve(d.epreuve);return}
  if(d.bilan8){document.querySelector('.voile')?.remove();bilanS8(d.bilan8);return}
  if(d.brouillon){const a=$('#appr');if(a.value.trim()&&!confirm('Remplacer le texte actuel par un brouillon ?'))return;a.value=brouillonAppr(d.brouillon);(DB.notes[d.brouillon]=DB.notes[d.brouillon]||{}).appr=a.value;sauver();return}
  if(d.deg){const N=DB.notes[d.deg]=DB.notes[d.deg]||{},max=DB.cfg[d.f];N[d.f+'D']=+d.d;N[d.f]=ptsDeg(+d.d,max);sauver();document.querySelector('.voile')?.remove();ficheEpreuve(d.deg);return}
  if(d.exp){exporter(d.exp);return}
  if(d.tirage!=null){vueTirage(d.tirage);return}
  if(d.tirageTout!=null){if(!confirm('Refaire le tirage de toute la classe ?'))return;document.querySelector('.voile')?.remove();vueTirage(d.tirageTout,true);return}
  if(d.retirerT!=null){document.querySelector('.voile')?.remove();vueTirage(d.retirerT,d.nom);return}
  if(d.classe){DB.classe=d.classe;sauver();rendre();return}
  if(t.hasAttribute('data-rendre')){setTimeout(rendre,0);return}
  const c=DB.classe;
  switch(d.act){
    case 'coller': await importerListe([], $('#impTxt').value, $('#impNom').value.trim()||prompt('Nom de la classe ou du groupe :')||'');break;
    case 'qr': montrerQR(c);break;
    case 'code': {const L=DB.classes[c];if(!L.cc){L.cc=EPSCode.nouvelleCle();sauver()}EPSCode.prof({app:'mup',classe:c,cle:L.cc,seances:SEANCES.map(s=>({v:s.id,n:s.id+' · '+s.titre}))});break}
    case 'affiche': affiche(c);break;
    case 'supprClasse': if(confirm('Supprimer la classe '+c+' ? Les séances reçues restent dans les fiches.')){delete DB.classes[c];DB.classe='';sauver();rendre()}break;
    case 'scanner': {let n0=0;scanner(async txt=>{const r=await lireTexteQR(txt);if(!r.partiel&&!r.doublon){n0++;sauver()}return r},{titre:'QR de séance des binômes',aide:'Montrez les QR un par un devant la caméra.',onClose:()=>{sauver();rendre();if(n0)toast(n0+' binôme(s) reçu(s)')}});break}
    case 'reprendre': {let n=0;elevesClasse(c).forEach(k=>{const E=DB.eleves[k],m=maxRep(repDe(k));if(!E||!m)return;const N=DB.notes[k]=DB.notes[k]||{};
      if(N.a2==null||N.a2===''){const p=ptsDeg(indicAFL2(E).deg,m[0]);if(p!=null){N.a2=p;n++}}if(N.a3==null||N.a3===''){const p=ptsDeg(indicAFL3(E).deg,m[1]);if(p!=null){N.a3=p;n++}}});
      sauver();rendre();toast(n+' case(s) remplie(s) ; vos notes déjà saisies n\'ont pas bougé.');break}
    case 'sauver': DB.sauve=Date.now();sauver();telecharger('musculation-prof_sauvegarde_'+EPSCode.jour()+'.json',JSON.stringify(Object.assign({app:'musculation-prof',v:7},DB)));rendre();break;
    case 'archiver': {const V=vieux();if(!V.length)break;if(!confirm(V.length+' élève(s) de l\'an dernier : télécharger l\'archive puis les retirer de cet iPad ?'))break;
      telecharger('musculation-prof_archive_'+EPSCode.jour()+'.json',JSON.stringify({app:'musculation-prof',v:7,archive:true,eleves:Object.fromEntries(V.map(k=>[k,DB.eleves[k]])),notes:Object.fromEntries(V.filter(k=>DB.notes[k]).map(k=>[k,DB.notes[k]]))}));
      setTimeout(()=>{if(confirm('L\'archive est-elle bien téléchargée ? Retirer ces '+V.length+' élève(s) de l\'iPad ?')){V.forEach(k=>{delete DB.eleves[k];delete DB.notes[k]});sauver();rendre();toast('Archive faite.')}},800);break}
  }
});
document.addEventListener('change',async ev=>{
  const t=ev.target;
  if(t.dataset.note){const N=DB.notes[t.dataset.note]=DB.notes[t.dataset.note]||{},f=t.dataset.f,v=num(t.value);if(v==null)delete N[f];else N[f]=v;
    if(f==='prod'||f==='anal')delete N[f+'D'];sauver();const x=$('#totEp');if(x)x.innerHTML=noteTxt(t.dataset.note);else rendre();return}
  if(t.dataset.appr){(DB.notes[t.dataset.appr]=DB.notes[t.dataset.appr]||{}).appr=t.value.trim();sauver();return}
  if(t.id==='cfgProd'||t.id==='cfgAnal'){DB.cfg[t.id==='cfgProd'?'prod':'anal']=Math.max(0,Math.min(12,parseInt(t.value,10)||0));sauver();rendre();return}
  if(t.id==='impFic'&&t.files.length){await importerListe([...t.files],'',$('#impNom').value.trim());t.value='';return}
  if(t.id==='lien'){DB.classes[DB.classe].lien=t.value.trim();sauver();toast('Lien enregistré : il partira avec le QR de la classe.');return}
  if(t.id==='carnetsFic'&&t.files.length){await importerFichiers([...t.files]);t.value='';return}
  if(t.id==='restFic'&&t.files.length){try{const o=JSON.parse(await (window.EPSCoffre?EPSCoffre.lireFichier(t.files[0]):t.files[0].text()));if(o.app!=='musculation-prof'||o.archive)throw new Error('Ce n\'est pas une sauvegarde de l\'outil prof musculation.');
    if(!confirm('Remplacer toutes les données de cet iPad par la sauvegarde ?'))return;DB=Object.assign({classes:{},carnets:{},eleves:{},journal:[],recus:{},notes:{},tirages:{}},o);DB.cfg=Object.assign({prod:6,anal:6},DB.cfg||{});migrer();sauver();rendre();toast('Sauvegarde restaurée.')}catch(e){alert(e.message)}t.value='';}
});
document.addEventListener('input',ev=>{const t=ev.target;if(t.dataset.appr){(DB.notes[t.dataset.appr]=DB.notes[t.dataset.appr]||{}).appr=t.value;clearTimeout(t._h);t._h=setTimeout(sauver,600)}});
if(DEMO)demoGenerer();else migrer();
if(!DB.vue||DB.vue==='carnets')DB.vue='accueil';
rendre();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
