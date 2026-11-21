/* =====================================================================
   prof.js — outil prof de musculation CA5 Terminale (Lycée G. Pompidou)
   v1.0 : classes (import Pronote, repris de gym-prof), QR de la classe,
   code du cours (eps-code.js), carnets reçus, sauvegarde.
   La notation (AFL1, AFL2, AFL3) viendra dans une version suivante.
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
DB.classes=DB.classes||{};DB.carnets=DB.carnets||{};DB.vue=DB.vue||'classes';
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
const VUES=[['classes','👥 Classes'],['carnets','📒 Carnets'],['sauvegarde','💾 Sauvegarde']];
function rendre(){
  $('#nav').innerHTML=VUES.map(([k,t])=>`<button type="button" class="${DB.vue===k?'ici':''}" data-vue="${k}">${t}</button>`).join('');
  $('#main').innerHTML=(DEMO?`<p class="demo demo-bandeau">👀 Mode démo : rien n'est enregistré. <a href="./">Quitter</a></p>`:'')+({classes:vClasses,carnets:vCarnets,sauvegarde:vSauvegarde}[DB.vue]||vClasses)();
}
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
async function qrClasse(c){
  const L=DB.classes[c];if(!L.cc){L.cc=EPSCode.nouvelleCle();sauver()}
  const cj=await EPSCode.cjDuJour('mup',c,L.cc,null);
  const txt=await encoderQR({a:'MUS',v:1,t:'C',c,l:L.eleves,u:L.lien||'',cc:L.cc,cj,ts:Math.round(Date.now()/1000)});
  let svg;try{svg=svgQR(txt)}catch(e){svg='<p class="alerte">Liste trop longue pour un seul QR.</p>'}
  return {svg,cj};
}
async function montrerQR(c){
  const {svg,cj}=await qrClasse(c);
  fen(`<h2>Classe ${esc(c)} · musculation</h2><p>Appli élève : <b>📷 QR de la classe</b>.</p>${cj?`<p class="ok small">Ce QR ouvre aussi la séance <b>${esc(cj.s)}</b> aujourd'hui (2 h), sans code à taper.</p>`:`<p class="small muted">Pour que ce QR ouvre la séance du jour : « Code du cours », choisissez la séance, puis réaffichez ce QR.</p>`}<div class="qrbox">${svg}</div><button type="button" class="bt" data-fermer>Fermer</button>`,true);
}
async function affiche(c){
  const {svg}=await qrClasse(c),a=document.createElement('div');a.id='affiche';
  a.innerHTML=`<h1>Musculation · premier cours · ${esc(c)}</h1><div class="aff2">
   <div><h2>① Installer l'appli</h2>${svgQR(URL_APP)}<ol><li>Scannez ce QR avec <b>l'appareil photo</b>.</li><li>Ajoutez l'appli à l'<b>écran d'accueil</b> (iPhone : Partager → « Sur l'écran d'accueil » ; Android : ⋮ → « Installer »).</li><li>Ouvrez l'appli avec son icône.</li></ol></div>
   <div><h2>② Entrer dans la classe</h2>${svg}<ol><li>Dans l'appli : « 📷 QR de la classe ».</li><li>« Nouveau binôme » : touchez vos deux noms dans la liste.</li><li>Choisissez un code secret à 4 chiffres (notez-le !).</li></ol></div></div>
   <p class="pied">Imprimée le ${new Date().toLocaleDateString('fr-FR')}. Le QR ② donne la liste de la classe.</p><p class="noprint"><button type="button" class="bt act" onclick="print()">Imprimer</button> <button type="button" class="bt" onclick="document.body.classList.remove('impr-affiche');this.closest('#affiche').remove()">Fermer</button></p>`;
  document.body.appendChild(a);document.body.classList.add('impr-affiche');
}
/* ---------- Carnets reçus (fichiers JSON du Nuage) ---------- */
function importerCarnet(o,nom){
  if(!o||o.app!=='musculation-eleves'||!Array.isArray(o.e))throw new Error((nom||'Fichier')+' : ce n\'est pas un carnet de musculation.');
  const old=DB.carnets[o.id];if(old&&(old.exporte||'')>(o.exporte||''))return (nom||'')+' : déjà une version plus récente.';
  DB.carnets[o.id]=o;return o.e.map(e=>e.nom).join(' & ')+(o.classe?' ('+o.classe+')':'');
}
async function importerCarnets(files){
  const msgs=[];for(const f of files){try{msgs.push(importerCarnet(JSON.parse(await f.text()),f.name))}catch(e){msgs.push(e.message)}}
  sauver();rendre();fen(`<h3>Carnets importés</h3><ul class="small">${msgs.map(m=>`<li>${esc(m)}</li>`).join('')}</ul><button type="button" class="bt" data-fermer>Fermer</button>`);
}
/* v1.5 : AFL2 (analyse de ses exercices) et AFL3 (coaching du partenaire), S4 à S7, lus dans les carnets */
const S_AFL=['S4','S5','S6','S7'];
function exosDe(e,S){return Object.entries(((e.seances||{})[S]||{}).exos||{}).filter(([,x])=>x&&x.real)}
function statsAfl(b,e){
  const a2={ex:0,an:0,coh:0,obR:0,obP:0},a3={fi:0,niv:0,con:0,aideO:0,aideT:0,obj:0,ten:0};
  S_AFL.forEach(S=>exosDe(e,S).forEach(([,x])=>{a2.ex++;const nx=x.next||{};if(x.ressenti&&x.ressenti.note&&x.rir&&nx.c){a2.an++;if(nx.ok||(nx.pq||'').trim())a2.coh++}if(x.obp){a2.obR++;if(x.obp==='oui')a2.obP++}}));
  b.e.filter(p=>p!==e).forEach(p=>{
    const suiv=(k,at)=>{for(let j=k+1;j<=9;j++){const y=(((p.seances||{})['S'+j]||{}).exos||{})[at];if(y&&y.real)return y}return null};
    S_AFL.forEach(S=>exosDe(p,S).forEach(([at,x])=>{const av=x.avis;if(!av||av.par!==e.nom)return;
      const plein=av.conseil||av.cle||(av.signes||[]).length;if(!plein)return;a3.fi++;
      a3.niv=Math.max(a3.niv,av.obj&&av.obj.k&&av.obj.v!==''&&av.obj.v!=null?3:av.propres!=null?2:1);
      const y=suiv(+S.slice(1),at);
      if(av.conseil){a3.con++;if(y&&y.aide){a3.aideT++;if(y.aide==='1')a3.aideO++}}
      if(av.obj&&av.obj.k&&av.obj.v!==''&&av.obj.v!=null){if(y){a3.obj++;if(objTenuM(av.obj,y.real))a3.ten++}}   // compté seulement une fois vérifiable
    }))});
  return {a2,a3};
}
const pc=(a,b)=>b?Math.round(100*a/b)+' %':'—';
/* lecture qualitative : justifications de l'élève et conseils donnés au partenaire */
function lireAfl(id,i){
  const b=DB.carnets[id],e=b&&b.e[+i];if(!e)return;const NQ=Object.fromEntries(NEXT_Q.map(q=>[q[0],q[1]])),RQ=Object.fromEntries(RIR_Q.map(q=>[q[0],q[1]])),nomA=at=>(ATELIERS.find(a=>a.id===at)||{}).nom||at;
  const a2=[],a3=[];
  S_AFL.forEach(S=>{exosDe(e,S).forEach(([at,x])=>{const nx=x.next||{};if(!nx.c&&!x.rir)return;
    a2.push(`<tr><td>${S}</td><td>${esc(nomA(at))}</td><td>${x.ressenti&&x.ressenti.note||'—'} · ${esc(RQ[x.rir]||'—')}</td><td>${esc(NQ[nx.c]||'—')}${nx.ok===false?' <b style="color:#b91c1c">≠ appli</b>':''}</td><td>${esc(nx.pq||'')}</td></tr>`)});
    b.e.filter(p=>p!==e).forEach(p=>exosDe(p,S).forEach(([at,x])=>{const av=x.avis;if(!av||av.par!==e.nom)return;
      a3.push(`<tr><td>${S}</td><td>${esc(nomA(at))}</td><td>${av.cle==='1'?'tenu':av.cle==='0'?'à revoir':'—'}${(av.signes||[]).length?' · '+esc(av.signes.join(', ')):''}</td><td>${av.propres!=null?av.propres:'—'}</td><td>${esc(av.conseil||'')}${x.aide?` (${x.aide==='1'?'utile':'pas utile'})`:''}</td><td>${av.obj&&av.obj.k?esc(av.obj.k+' '+av.obj.v):''}</td></tr>`)}))});
  fen(`<h3>${esc(e.nom)} · AFL2 et AFL3</h3><h4>Ses analyses (AFL2)</h4>${a2.length?`<div class="tbw"><table class="tb small"><tr><th></th><th>Exercice</th><th>Ressenti · réserve</th><th>Choix</th><th>Pourquoi</th></tr>${a2.join('')}</table></div>`:'<p class="muted">Rien encore.</p>'}
   <h4>Son coaching (AFL3)</h4>${a3.length?`<div class="tbw"><table class="tb small"><tr><th></th><th>Exercice</th><th>Point clé · signes</th><th>Propres</th><th>Conseil</th><th>Objectif</th></tr>${a3.join('')}</table></div>`:'<p class="muted">Rien encore.</p>'}<button type="button" class="bt" data-fermer>Fermer</button>`,true);
}
/* v1.6 : progression des charges max (historique tenu par l'appli élève depuis la v2.2) */
function progRM(e){const L=Object.values(e.rm||{}).filter(r=>r&&r.hist&&r.hist.length&&r.cm>r.hist[0].cm).map(r=>r.cm/r.hist[0].cm-1);
  return L.length?{n:L.length,moy:Math.round(100*L.reduce((a,b)=>a+b,0)/L.length)}:null}
/* v1.18 : échauffement guidé (appli élève v3.0) : séances où les 5 parties sont faites */
function echDe(b,e,seances){const det=[];let comp=0,n=0;
  seances.forEach(S=>{const x=(e.seances[S]||{}).ech;if(!x||!x.wc||!x.wc.length)return;const k=+S.slice(1);
    const jour=k>=7?((e.projet&&e.projet.exos)||[]).map(z=>z.at):k>=4?((b.listes||{})[S]||LISTES_DEFAUT[S]||[]):[];
    const [f,t]=echBilan(x.wc,k,jour);n++;if(f===t)comp++;det.push(S+' '+f+'/'+t)});
  return {comp,n,det:det.join(' · ')}}
function lignesCarnets(){
  const L=[];Object.values(DB.carnets).forEach(b=>b.e.forEach(e=>{
    const seances=SEANCES.filter(s=>e.seances[s.id]&&Object.keys(e.seances[s.id]).length||(s.id==='S2'&&Object.keys(e.tests||{}).length)).map(s=>s.id);
    L.push({classe:b.classe||'',nom:e.nom,binome:b.e.filter(x=>x!==e).map(x=>x.nom).join(', '),rm:ATELIERS_TEST.filter(id=>e.rm[id]).length,prog:progRM(e),mob:e.choix&&e.choix.mob,proj:e.projet&&e.projet.exos?e.projet.exos.length:0,afl:e.afl||{},aj:(e.ajust||[]).length,seances,ech:echDe(b,e,seances),exp:b.exporte||'',st:statsAfl(b,e),id:b.id,i:b.e.indexOf(e)});
  }));return L;
}
function vCarnets(){
  const L=lignesCarnets(),C=[...new Set(L.map(x=>x.classe))].sort();
  return `<h2>Carnets reçus</h2><section class="carte"><p class="small">Déposez ici les fichiers que les binômes ont envoyés dans le Nuage (un ou plusieurs à la fois). Le plus récent de chaque binôme est gardé.</p><label class="bt act">📂 Importer des carnets<input id="carnetsFic" type="file" accept=".json,application/json" multiple hidden></label></section>
  ${L.length?C.map(c=>{const lc=L.filter(x=>x.classe===c).sort((a,b)=>norm(a.nom).localeCompare(norm(b.nom))),inscrits=(DB.classes[c]||{}).eleves||[],manque=inscrits.filter(n=>!lc.some(x=>norm(x.nom)===norm(n)));
   return `<section class="carte"><h3>${esc(c||'Sans classe')} · ${lc.length} élève(s)</h3><div class="tbw"><table class="tb"><tr><th>Élève</th><th>Binôme</th><th>Séances</th><th title="Séances où les 5 parties de l'échauffement guidé sont cochées">Échauf.</th><th>Test 10 RM</th><th>Mobile</th><th>Projet</th><th>Ajust.</th><th>AFL2/3 · rôle</th><th title="S4 à S7 : exercices analysés (ressenti, répétitions, suite), choix cohérents ou justifiés, objectifs du coach repris">AFL2 · analyse</th><th title="S4 à S7 : fiches coach remplies, niveau atteint, conseils jugés utiles par le partenaire, objectifs tenus">AFL3 · coaching</th><th>Dernier envoi</th></tr>
    ${lc.map(x=>`<tr><td><button type="button" class="lien" data-lire="${esc(x.id)}" data-i="${x.i}" title="Lire ses analyses et son coaching"><b>${esc(x.nom)}</b></button></td><td class="small">${esc(x.binome)}</td><td class="small">${x.seances.join(' ')}</td><td class="small" title="${esc(x.ech.det)}">${x.ech.n?x.ech.comp+'/'+x.ech.n+'<br><span class="muted">'+esc(x.ech.det)+'</span>':'—'}</td><td>${x.rm}/${ATELIERS_TEST.length}${x.prog?`<br><span class="small" title="ateliers dont la charge max a monté depuis le premier test">↑ ${x.prog.n} atelier${x.prog.n>1?'s':''}, +${x.prog.moy} %</span>`:''}</td><td>${x.mob?esc(MOBILES[x.mob].nom):'—'}</td><td>${x.proj?x.proj+' ex.':'—'}</td><td>${x.aj}</td><td class="small">${esc(x.afl.rep||'—')} · ${esc(x.afl.role?((EVAL.roles.find(r=>r[0]===x.afl.role)||[])[1]||(EVAL.roleAncien||{})[x.afl.role]||x.afl.role):'—')}</td><td class="small">${x.st.a2.ex?`<b>${x.st.a2.an}/${x.st.a2.ex}</b> analysés<br>cohérents ${pc(x.st.a2.coh,x.st.a2.an)}${x.st.a2.obR?`<br>objectifs repris ${x.st.a2.obP}/${x.st.a2.obR}`:''}`:'—'}</td><td class="small">${x.st.a3.fi?`<b>${x.st.a3.fi}</b> fiches · niv. ${x.st.a3.niv}<br>conseils utiles ${x.st.a3.aideT?x.st.a3.aideO+'/'+x.st.a3.aideT:'—'}${x.st.a3.obj?`<br>objectifs tenus ${x.st.a3.ten}/${x.st.a3.obj}`:''}`:'—'}</td><td class="small">${esc(x.exp.slice(0,10))}</td></tr>`).join('')}</table></div>
    ${manque.length?`<p class="small muted">Pas encore de carnet : ${manque.map(esc).join(', ')}.</p>`:''}</section>`}).join(''):'<p class="muted">Aucun carnet reçu.</p>'}
  <p class="small muted">La notation (AFL1, AFL2, AFL3) à partir des carnets viendra dans une prochaine version.</p>`;
}
/* ---------- Sauvegarde ---------- */
function vSauvegarde(){
  return `<h2>Sauvegarde</h2><section class="carte act"><p><b>Gardez une sauvegarde à jour</b> : elle contient vos classes, les carnets reçus et la <b>clé du code du cours</b> de chaque classe. Sans elle, sur un autre iPad, les codes ne correspondraient plus.</p>
   <div class="rangee"><button type="button" class="bt act" data-act="sauver">💾 Enregistrer la sauvegarde</button><label class="bt">📂 Restaurer une sauvegarde<input id="restFic" type="file" accept=".json" hidden></label></div>
   <p class="small muted">${DB.sauve?'Dernière sauvegarde : '+new Date(DB.sauve).toLocaleString('fr-FR'):'Pas encore de sauvegarde.'}</p></section>`;
}
function telecharger(nom,txt){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=nom;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}

/* ---------- Événements ---------- */
document.addEventListener('click',async ev=>{
  const t=ev.target.closest('button');if(!t)return;const d=t.dataset;
  if(d.vue){DB.vue=d.vue;sauver();rendre();return}
  if(d.lire){lireAfl(d.lire,d.i);return}
  if(d.classe){DB.classe=d.classe;sauver();rendre();return}
  const c=DB.classe;
  switch(d.act){
    case 'coller': await importerListe([], $('#impTxt').value, $('#impNom').value.trim()||prompt('Nom de la classe ou du groupe :')||'');break;
    case 'qr': montrerQR(c);break;
    case 'code': {const L=DB.classes[c];if(!L.cc){L.cc=EPSCode.nouvelleCle();sauver()}EPSCode.prof({app:'mup',classe:c,cle:L.cc,seances:SEANCES.map(s=>({v:s.id,n:s.id+' · '+s.titre}))});break}
    case 'affiche': affiche(c);break;
    case 'supprClasse': if(confirm('Supprimer la classe '+c+' ? Les carnets reçus restent.')){delete DB.classes[c];DB.classe='';sauver();rendre()}break;
    case 'sauver': DB.sauve=Date.now();sauver();telecharger('musculation-prof_sauvegarde_'+EPSCode.jour()+'.json',JSON.stringify(Object.assign({app:'musculation-prof',v:1},DB)));rendre();break;
  }
});
document.addEventListener('change',async ev=>{
  const t=ev.target;
  if(t.id==='impFic'&&t.files.length){await importerListe([...t.files],'',$('#impNom').value.trim());t.value='';return}
  if(t.id==='lien'){DB.classes[DB.classe].lien=t.value.trim();sauver();toast('Lien enregistré : il partira avec le QR de la classe.');return}
  if(t.id==='carnetsFic'&&t.files.length){await importerCarnets([...t.files]);t.value='';return}
  if(t.id==='restFic'&&t.files.length){try{const o=JSON.parse(await (window.EPSCoffre?EPSCoffre.lireFichier(t.files[0]):t.files[0].text()));if(o.app!=='musculation-prof')throw new Error('Ce n\'est pas une sauvegarde de l\'outil prof musculation.');
    if(!confirm('Remplacer toutes les données de cet iPad par la sauvegarde ?'))return;DB=Object.assign({classes:{},carnets:{}},o);sauver();rendre();toast('Sauvegarde restaurée.')}catch(e){alert(e.message)}t.value='';}
});
rendre();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
