/* Données du cycle de musculation CA5 Terminale (Lycée G. Pompidou) : ateliers, mobiles, échelle de ressentis,
   séances, sécurité. FICHIER COMMUN : le même fichier est dans cycle-musculation (écran de cours + outils)
   et dans musculation-eleves (appli élève). Le modifier dans cycle-musculation puis le recopier tel quel.
   Démarche « pratique auto-référencée et auto-régulée par les ressentis » d'après Laurent Lecomte
   (lycée A.-Daudet, Nîmes, avec son accord) et les travaux d'Aline Paintendre (STAPS Reims).
   Paramètres des mobiles : cahier des charges du 13/11/2026 (force maximale retirée).
   v2.0 (20/11/2026) : menu de 14 ateliers, uniquement avec charges (menu:true) ; les ateliers au poids du corps
   servent à l'échauffement et restent décrits ici pour les anciens carnets. S1 circuit, S2-S3 tests (4 à 5 charges
   max par séance), S4 tonification, S5 volume, S6 puissance (6 ateliers, puissPct) et choix, S7 projet, S8-S9 évaluation. */
const MUSCU_VERSION = 'v3.0';
const DUREE_PRATIQUE = 70;

/* ---------- Matériel (salle de judo, tatami) ---------- */
const SUPPORTS = {
 hreg:  {nom:"Haltère réglable", vide:2, disques:true, unite:"par haltère", note:"barre de 2 kg + disques"},
 hfix:  {nom:"Haltère fixe", fixes:[2,3,4,5,8,10,15], unite:"par haltère"},
 curl:  {nom:"Barre curl", vide:6, disques:true, unite:"barre chargée"},
 z:     {nom:"Barre EZ (barre Z)", vide:6.5, disques:true, unite:"barre chargée"},
 tri:   {nom:"Barre triceps", vide:8, disques:true, unite:"barre chargée"},
 b120:  {nom:"Barre droite 120 cm", vide:6, disques:true, unite:"barre chargée"},
 b160:  {nom:"Barre droite 160 cm", vide:8, disques:true, unite:"barre chargée"},
 b180:  {nom:"Barre droite 180 cm", vide:9, disques:true, unite:"barre chargée"},
 pdc:   {nom:"Poids du corps", unite:"variante"},
 mb:    {nom:"Medecine ball", unite:"variante"},
 box:   {nom:"Box de pliométrie en bois (40 / 50 cm)", unite:"variante"}
};
const DISQUES = [10, 5, 2, 1, 0.5];   // disques disponibles (paires, alésage 28 mm)

/* ---------- Ateliers ----------
   n : numéro du circuit d'origine (fiche « Musculation : suivi du travail des élèves ») ; 0 = atelier ajouté.
   type : "charge" (calcul en % de la charge max) ou "variante" (niveau de difficulté + ressenti).
   test : atelier du test 10 RM (S2). places : binômes en même temps au maximum (vide = pas de limite).
   zone : haut / bas / tronc (développement harmonieux). video : nom de la vidéo PeerTube, à relier plus tard. */
const ATELIERS = [
 {id:"dc", n:4, nom:"Développé couché", zone:"haut", groupe:"Pectoraux", muscles:"Grands pectoraux, triceps, deltoïdes avant", support:"b160", type:"charge", menu:true, puissance:true, puissPct:[30,45], test:true, places:2, depart:12,
  crit:["Allongé, pieds au sol, fesses et omoplates collées au banc.","Mains un peu plus écartées que les épaules.","La barre descend sur la poitrine, au niveau des tétons, coudes à 45° du corps.","Pousser à la verticale sans décoller les fesses."],
  resp:"Inspirer en descendant, souffler en poussant.", secu:"Toujours un pareur debout derrière la tête, mains prêtes sous la barre. 2e poste : au sol sur un banc bas, ou développé couché haltères.",
  moins:"Développé couché haltères, ou pompes sur les genoux.", plus:"Descente en 3 s.", video:"P4_DÉVELOPPÉ-COUCHÉ HALTÈRES"},
 {id:"dch", n:0, nom:"Développé couché haltères sur steps", zone:"haut", groupe:"Pectoraux", muscles:"Grands pectoraux, triceps", support:"hreg", type:"charge", menu:true, puissance:true, puissPct:[30,45], depart:6,
  crit:["Allongé sur les steps recouverts du tapis en mousse, genoux fléchis, pieds à plat.","Haltères au-dessus des épaules, coudes à 45°.","Descendre jusqu'à ce que les coudes arrivent à hauteur du tapis, pas plus bas, puis pousser à la verticale."],
  resp:"Inspirer en descendant, souffler en poussant.", secu:"Poser les haltères sur les cuisses avant de s'asseoir ; ne jamais les lâcher au-dessus du visage. Steps calés, tapis bien centré.", moins:"Haltères plus légers.", plus:"Descente en 3 s.", video:"P4_DÉVELOPPÉ-COUCHÉ HALTÈRES"},
 {id:"pompes", n:0, nom:"Pompes", zone:"haut", groupe:"Pectoraux", muscles:"Grands pectoraux, triceps, gainage", support:"pdc", type:"variante",
  niveaux:["Pompes contre le mur","Pompes sur les genoux","Pompes","Pompes pieds surélevés sur le banc"],
  crit:["Mains sous les épaules, corps aligné de la tête aux pieds (ou aux genoux).","La poitrine descend à un poing du sol.","Le bassin ne s'affaisse pas."],
  resp:"Inspirer en descendant, souffler en poussant.", secu:"Gainage tenu : si le dos se creuse, passer à la variante plus facile.", video:"P2B_Pompe"},
 {id:"ecarte", n:0, nom:"Écarté couché", zone:"haut", groupe:"Pectoraux", muscles:"Grands pectoraux", support:"hreg", type:"charge", depart:4,
  crit:["Allongé, haltères au-dessus de la poitrine, coudes légèrement fléchis et fixes.","Ouvrir les bras jusqu'à l'horizontale, revenir en « serrant un arbre »."],
  resp:"Inspirer en ouvrant, souffler en fermant.", secu:"Charges légères : l'épaule est très étirée en bas.", video:"P5_ÉCARTÉ COUCHÉ PECS"},
 {id:"rowh", n:12, nom:"Rowing haltère un bras", zone:"haut", groupe:"Dos", muscles:"Grand dorsal, rhomboïdes, biceps", support:"hreg", type:"charge", menu:true, puissance:true, puissPct:[40,50], test:true, depart:8,
  crit:["Une main et un genou sur le banc (ou les steps recouverts du tapis), dos plat, regard vers le sol.","Tirer le coude vers la hanche, haltère le long du corps.","Redescendre bras tendu sans tourner le buste."],
  resp:"Souffler en tirant, inspirer en descendant.", secu:"Dos plat du début à la fin de la série.", moins:"Haltère plus léger.", plus:"Pause de 1 s en haut."},
 {id:"rowb", n:14, nom:"Rowing barre buste penché", zone:"haut", groupe:"Dos", muscles:"Grand dorsal, trapèzes, rhomboïdes", support:"b160", type:"charge", menu:true, depart:14,
  crit:["Pieds largeur de bassin, genoux fléchis, buste penché à 45°, dos plat.","Tirer la barre vers le nombril, coudes près du corps.","Le buste ne se relève pas pendant la série."],
  resp:"Souffler en tirant.", secu:"Dos rond = arrêt de la série. Charges modérées.", moins:"Rowing haltère un bras.", plus:"Pause de 1 s barre au ventre."},
 {id:"tirage", n:3, nom:"Tirage menton (barre EZ)", zone:"haut", groupe:"Épaules", muscles:"Deltoïdes, trapèzes", support:"z", type:"charge", menu:true, depart:10,
  crit:["Debout, mains sur les prises larges de la barre EZ, écartées largeur d'épaules, poignets droits.","Monter la barre le long du corps jusqu'à la poitrine, coudes vers l'extérieur.","Coudes à hauteur des épaules au maximum, jamais au-dessus."],
  resp:"Souffler en montant.", secu:"Poignets droits, mains écartées et coudes jamais au-dessus des épaules : sinon l'épaule s'irrite.", moins:"Barre seule.", plus:"Descente en 3 s."},
 {id:"dm", n:0, nom:"Développé militaire haltères assis", zone:"haut", groupe:"Épaules", muscles:"Deltoïdes, triceps", support:"hreg", type:"charge", menu:true, puissance:true, puissPct:[30,40], test:true, depart:6,
  crit:["Assis sur le banc, dos droit, abdominaux serrés.","Haltères à hauteur des oreilles, paumes vers l'avant.","Pousser à la verticale sans cambrer."],
  resp:"Souffler en poussant.", secu:"Le dos reste collé au dossier ou droit : pas de cambrure.", moins:"Haltères plus légers.", plus:"Descente en 3 s.", video:"DL4_developpe_militaire_haltere"},
 {id:"elev", n:7, nom:"Élévations latérales", zone:"haut", groupe:"Épaules", muscles:"Deltoïdes moyens", support:"hfix", type:"charge", depart:3,
  crit:["Debout, haltères le long du corps, coudes légèrement fléchis.","Monter les bras sur le côté jusqu'à l'horizontale, pas plus haut."],
  resp:"Souffler en montant.", secu:"Charges légères ; pas d'élan avec le dos."},
 {id:"curlb", n:1, nom:"Curl barre", zone:"haut", groupe:"Bras", muscles:"Biceps", support:"curl", type:"charge", menu:true, test:true, places:6, depart:10,
  crit:["Dos contre le mur, coudes collés au corps.","Fléchir les bras sans avancer les coudes.","Redescendre jusqu'aux bras presque tendus, sans à-coup."],
  resp:"Souffler en montant.", secu:"Le dos ne quitte pas le mur : pas de balancier."},
 {id:"curlh", n:16, nom:"Curl haltères", zone:"haut", groupe:"Bras", muscles:"Biceps", support:"hreg", type:"charge", depart:5,
  crit:["Debout, coudes collés au corps.","Monter en tournant la paume vers le plafond.","Alterner ou monter les deux bras ensemble."],
  resp:"Souffler en montant.", secu:"Pas de balancier du buste."},
 {id:"extri", n:10, nom:"Extension triceps barre", zone:"haut", groupe:"Bras", muscles:"Triceps", support:"tri", type:"charge", menu:true, test:true, places:2, depart:10,
  crit:["Allongé au sol sur le tatami, genoux fléchis, barre au-dessus du front, bras verticaux.","Fléchir seulement les coudes : la barre descend vers le front, les coudes s'arrêtent quand ils touchent le tatami.","Tendre les bras sans écarter les coudes."],
  resp:"Souffler en tendant.", secu:"Au sol, le tatami arrête la descente. Un pareur près de la tête."},
 {id:"dips", n:15, nom:"Dips", zone:"haut", groupe:"Bras", muscles:"Triceps, pectoraux", support:"pdc", type:"variante",
  niveaux:["Dips au banc, pieds au sol genoux fléchis","Dips au banc, jambes tendues","Dips au banc, pieds surélevés","Dips aux barres parallèles"],
  crit:["Mains au bord du banc, doigts vers l'avant.","Descendre jusqu'à coudes à 90°, pas plus bas.","Remonter bras tendus, épaules basses."],
  resp:"Souffler en remontant.", secu:"Jamais plus bas que 90° au coude : l'épaule souffre.", video:"P3A_DIPS"},
 {id:"squat", n:6, nom:"Squat", zone:"bas", groupe:"Cuisses et fessiers", muscles:"Quadriceps, fessiers", support:"pdc", type:"variante", horsTest:true,
  niveaux:["Squat au poids du corps","Squat barre 10 kg (protection sur la nuque)","Goblet squat haltère 15 kg","Squat bulgare (pied arrière sur le banc)"],
  crit:["Pieds largeur d'épaules, pointes légèrement ouvertes.","Descendre jusqu'aux cuisses parallèles au sol, pas plus bas.","Genoux dans l'axe des pieds, dos plat, talons au sol."],
  resp:"Inspirer en descendant, souffler en remontant.", secu:"Hors test 10 RM : sans cage à squat, on ne monte pas de barre lourde sur les épaules. Talons qui décollent : cale sous les talons."},
 {id:"fentes", n:8, nom:"Fentes avant haltères", zone:"bas", groupe:"Cuisses et fessiers", muscles:"Quadriceps, fessiers", support:"hreg", type:"charge", menu:true, test:true, depart:6,
  crit:["Debout, un haltère dans chaque main.","Grand pas en avant, descendre jusqu'à genou arrière près du sol.","Genou avant au-dessus de la cheville, buste droit."],
  resp:"Inspirer en descendant, souffler en remontant.", secu:"Le genou avant ne dépasse pas la pointe du pied."},
 {id:"montee", n:13, nom:"Montée sur banc", zone:"bas", groupe:"Cuisses et fessiers", muscles:"Quadriceps, fessiers", support:"hreg", type:"charge", depart:4,
  crit:["Pied entier posé sur le banc.","Monter en poussant sur la jambe du dessus, sans élan de la jambe du bas.","Redescendre en contrôlant."],
  resp:"Souffler en montant.", secu:"Banc stable, pas de saut pour descendre."},
 {id:"mollets", n:9, nom:"Mollets debout", zone:"bas", groupe:"Mollets", muscles:"Triceps suraux", support:"hreg", type:"charge", depart:8,
  crit:["Pointes de pieds sur un disque, talons dans le vide.","Monter sur la pointe des pieds, redescendre talons bas."], resp:"Souffler en montant.", secu:"Se tenir au mur pour l'équilibre."},
 {id:"crunch", n:2, nom:"Crunch", zone:"tronc", groupe:"Abdominaux", muscles:"Grand droit de l'abdomen", support:"pdc", type:"variante",
  niveaux:["Crunch bras le long du corps","Crunch mains aux tempes","Crunch pieds décollés","Crunch avec disque sur la poitrine"],
  crit:["Allongé, pieds au sol, bas du dos collé au tatami.","Enrouler le haut du dos, regard vers les genoux.","Ne pas tirer sur la nuque."],
  resp:"Souffler pendant toute la montée (exception : on expire tout au long du mouvement).", secu:"Le bas du dos reste au sol."},
 {id:"twist", n:11, nom:"Russian twist", zone:"tronc", groupe:"Abdominaux", muscles:"Obliques", support:"mb", type:"variante",
  niveaux:["Pieds au sol, sans ballon","Pieds au sol, medecine ball","Pieds décollés, medecine ball"],
  crit:["Assis, buste incliné en arrière, dos droit.","Tourner les épaules d'un côté puis de l'autre, le ballon touche le sol à côté de la hanche."],
  resp:"Souffler à chaque rotation.", secu:"Dos droit ; pas de rotation brusque."},
 {id:"gainage", n:0, nom:"Gainage ventral", zone:"tronc", groupe:"Abdominaux", muscles:"Transverse, grand droit, fessiers", support:"pdc", type:"variante", temps:true,
  niveaux:["Planche sur les genoux","Planche sur les avant-bras","Planche avec une jambe levée","Planche bras et jambe opposés levés"],
  crit:["Avant-bras sous les épaules, corps aligné.","Fesses serrées, ventre rentré, regard vers le sol."],
  resp:"Respirer calmement, ne jamais bloquer.", secu:"Bas du dos qui se creuse = arrêt."},
 {id:"gainlat", n:0, nom:"Gainage latéral", zone:"tronc", groupe:"Abdominaux", muscles:"Obliques, moyen fessier", support:"pdc", type:"variante", temps:true,
  niveaux:["Sur le genou","Sur le pied","Jambe du dessus levée"],
  crit:["Coude sous l'épaule, corps aligné de profil.","Bassin haut, il ne s'affaisse pas."], resp:"Respirer calmement.", secu:"Changer de côté à chaque série."},
 /* v2.0 : nouveaux ateliers du menu (dessins : schémas provisoires en SVG) */
 {id:"pullover", n:0, nom:"Pull-over barre triceps sur steps", zone:"haut", groupe:"Dos", muscles:"Grand dorsal, grand rond, grand pectoral, triceps", support:"tri", type:"charge", menu:true, depart:8,
  crit:["Allongé sur deux steps recouverts du tapis en mousse, tête au bord, genoux fléchis, pieds à plat, bas du dos plaqué ; barre triceps tenue à deux mains par les poignées parallèles, au-dessus de la poitrine.","Coudes légèrement fléchis et fixes : descendre la barre derrière la tête en arc de cercle, jusqu'aux bras dans le prolongement du corps, pas plus bas.","Ramener la barre au-dessus de la poitrine en tirant avec les bras, sans décoller le bas du dos."],
  resp:"Inspirer en descendant, souffler en remontant.", secu:"Vérifier le serrage des disques avant chaque série. Ne pas descendre plus bas que les bras dans le prolongement du corps (épaules). Rien derrière la tête : la barre ne doit pas toucher le step. Barre triceps partagée avec l'extension triceps : 1 binôme par barre.", moins:"Barre à vide, amplitude réduite.", plus:"Descente en 3 s."},
 {id:"oiseau", n:0, nom:"Oiseau haltères", zone:"haut", groupe:"Épaules", muscles:"Deltoïdes postérieurs, rhomboïdes, trapèzes", support:"hreg", type:"charge", menu:true, depart:3,
  crit:["Buste penché en avant, dos plat, genoux fléchis, haltères sous les épaules.","Ouvrir les bras sur le côté, coudes légèrement fléchis, jusqu'à l'horizontale.","Redescendre en contrôlant."],
  resp:"Souffler en ouvrant.", secu:"Charges très légères ; dos plat (ou assis, buste posé sur les cuisses).", moins:"Assis, buste sur les cuisses.", plus:"Pause de 1 s en haut."},
 {id:"squath", n:0, nom:"Squat haltères (goblet)", zone:"bas", groupe:"Cuisses et fessiers", muscles:"Quadriceps, fessiers", support:"hreg", type:"charge", menu:true, puissance:true, puissPct:[40,60], depart:8,
  crit:["Pieds largeur d'épaules, un haltère tenu vertical contre la poitrine (ou deux haltères le long du corps).","Descendre jusqu'aux cuisses parallèles au sol, dos droit, talons au sol.","Genoux dans l'axe des pieds ; en Puissance, remonter vite jusqu'à la pointe des pieds sans quitter le sol."],
  resp:"Inspirer en descendant, souffler en remontant.", secu:"Pas de barre sur les épaules : il n'y a pas de cage à squat. Talons qui décollent : cale sous les talons.", moins:"Haltère plus léger.", plus:"Pause de 2 s en bas."},
 /* v2.5 : saut sur box, réservé au mobile Puissance (2 box en bois, arête avant protégée par de la mousse) */
 {id:"sbox", n:0, nom:"Saut sur box", zone:"bas", groupe:"Cuisses et fessiers", muscles:"Quadriceps, fessiers, mollets", support:"box", type:"variante", menu:false, plio:true, puissance:true, places:2,
  niveaux:["Saut sur un step à deux hauteurs","Saut sur la box côté 40 cm","Saut sur la box côté 50 cm"],
  crit:["Debout à un pas de la box, pieds largeur de hanches ; flexion rapide des jambes, bras en arrière.","Sauter en lançant les bras, se réceptionner les deux pieds entiers sur la box, genoux souples dans l'axe des pieds, sans bruit.","Se redresser debout sur la box, puis redescendre en marchant, un pied après l'autre, par l'arrière."],
  resp:"Souffler à l'impulsion.", secu:"Jamais la hauteur de 60 cm. Arête avant protégée par la mousse, box posée sur le sol dur, jamais sur le tatami. Redescendre en marchant, jamais en sautant. 3 à 5 sauts par série ; une réception lourde ou un pied qui accroche = arrêt de la série. On ne passe au niveau suivant qu'après une série entière de réceptions silencieuses.", moins:"Niveau inférieur (step).", plus:"Niveau supérieur, sans dépasser 50 cm."},
 {id:"sdtj", n:0, nom:"Soulevé de terre jambes semi-tendues", zone:"bas", groupe:"Ischio-jambiers", muscles:"Ischio-jambiers, fessiers, lombaires", support:"b120", type:"charge", menu:true, depart:16,
  crit:["Barre posée sur deux piles de steps à hauteur des genoux : la prendre debout, mains largeur d'épaules, paumes vers soi, genoux légèrement fléchis et fixes.","Pencher le buste en poussant les fesses vers l'arrière, dos plat, la barre glisse le long des cuisses.","Descendre jusqu'à mi-tibias, ou dès que le dos veut s'arrondir, puis remonter en serrant les fesses."],
  resp:"Inspirer en descendant, souffler en remontant.", secu:"Dos plat obligatoire : dos rond = arrêt de la série. Barre prise et reposée sur les steps, jamais au sol. Démonstration en S1, charges modérées.", moins:"Deux haltères le long des jambes, ou descente jusqu'aux genoux.", plus:"Descente en 3 s."},
 {id:"hip", n:0, nom:"Hip thrust au sol (pont fessier) haltère", zone:"bas", groupe:"Fessiers", muscles:"Grands fessiers, ischio-jambiers", support:"hreg", type:"charge", menu:true, puissance:true, puissPct:[40,60], depart:8,
  crit:["Allongé sur le dos sur un tapis, pieds à plat près des fesses, écartés largeur de hanches.","Un haltère posé en travers du bassin sur une mousse ou un tapis plié, tenu à deux mains.","Monter le bassin jusqu'à l'alignement épaules-hanches-genoux, serrer les fesses 1 s, redescendre."],
  resp:"Souffler en montant.", secu:"Haltère toujours calé sur la mousse ; pas de cambrure en haut (regard vers les genoux).", moins:"Haltère plus léger.", plus:"Pause de 2 s en haut."},
 /* Anciens ateliers de puissance au poids du corps : échauffement seulement depuis la v2.0 */
 {id:"sjump", n:0, nom:"Squat jump", zone:"bas", groupe:"Cuisses et fessiers", muscles:"Quadriceps, fessiers, mollets", support:"pdc", type:"variante", sautLancer:true,
  niveaux:["Saut extension depuis demi-squat, réception 2 s","Squat jump enchaîné","Squat jump avec haltères de 2 kg"],
  crit:["Descendre en demi-squat, mains aux hanches ou bras en arrière.","Sauter le plus haut possible, se réceptionner pieds à plat, genoux souples, dans l'axe."],
  resp:"Souffler à l'impulsion.", secu:"Réception silencieuse, genoux jamais vers l'intérieur. Sur le tatami uniquement."},
 {id:"fsaut", n:0, nom:"Fentes sautées", zone:"bas", groupe:"Cuisses et fessiers", muscles:"Quadriceps, fessiers", support:"pdc", type:"variante", sautLancer:true,
  niveaux:["Fentes alternées sans saut, rapides","Fentes sautées avec pause","Fentes sautées enchaînées"],
  crit:["Partir en fente, changer de jambe en l'air.","Réception amortie, genou avant au-dessus de la cheville."], resp:"Souffler à l'impulsion.", secu:"Arrêt dès que la réception devient lourde."},
 {id:"lancer", n:0, nom:"Lancer poitrine medecine ball", zone:"haut", groupe:"Pectoraux", muscles:"Pectoraux, triceps", support:"mb", type:"variante", sautLancer:true,
  niveaux:["Lancer à 2 m du partenaire, debout","Lancer à 4 m","Pompes explosives sur les genoux"],
  crit:["Ballon contre la poitrine, coudes ouverts.","Pousser le plus vite possible vers le partenaire, bras tendus à la fin."], resp:"Souffler en lançant.", secu:"Le partenaire est prêt avant chaque lancer."}
];
const atelier = id => ATELIERS.find(a => a.id === id);
/* Illustrations des ateliers. v2.6 (21/11/2026) : dessins tirés des fiches d'exercice d'Y. Dartois (générées par IA) ;
   restent © Espace-musculation.com (ateliers hors circuit) : mollets, montee, elev, twist, ecarte. */
const IMAGES_AT = ["curlb", "mollets", "montee", "crunch", "squat", "extri", "rowb", "tirage", "elev", "twist", "dc", "fentes", "rowh", "curlh", "gainage", "pompes", "gainlat", "dips", "dch", "ecarte", "dm", "oiseau", "squath", "sdtj", "hip", "sbox", "sjump", "pullover"];
const IMAGES_SVG = [];   // dessin libre de droit (Claude, 20/11/2026), en attendant la fiche
/* Fiches d'exercice complètes (onglet « Fiches ») */
const FICHES = {dc:"Développé couché barre", dm:"Développé militaire assis", rowh:"Rowing haltère un bras", rowb:"Rowing barre buste penché", tirage:"Tirage menton barre EZ", curlb:"Curl barre", extri:"Extension triceps allongé", squath:"Squat goblet", fentes:"Fentes avant", sdtj:"Soulevé de terre jambes semi-tendues", hip:"Hip thrust au sol", sbox:"Saut sur box", dch:"Développé couché haltères sur steps", oiseau:"Oiseau", pullover:"Pull-over barre triceps sur steps", curlh:"Variante : curl alterné avec rotation"};
const ficheImg = id => FICHES[id] ? 'img/fiches/' + id + '.jpg' : null;
/* Répertoire illustré de l'échauffement (onglet « Fiches ») : [id, nom, consigne] ; image img/echauf/<id>.jpg, ou img/ateliers/<id>.jpg pour les ateliers */
const ECHAUF_LIB = [
 {t:"1. Mise en route cardio", i:"Course, corde à sauter ou cross training : jusqu'à la sensation de chaleur et un léger essoufflement.", l:[
  ["corde","Corde à sauter","Sur l'avant des pieds, coudes près du corps : ce sont les poignets qui tournent. 1 à 2 min."],
  ["jjack","Jumping jack","Sauts en écartant les jambes et en levant les bras au-dessus de la tête, puis retour pieds joints. 30 s."],
  ["genoux","Montées de genoux","Course sur place sur l'avant des pieds, genou à hauteur de hanche, bras comme un sprinteur. 20 s."],
  ["talons","Talons-fesses","Course sur place, le talon vient toucher la fesse, buste droit. 20 s."],
  ["chasses","Pas chassés","Fléchi, dos droit, déplacement sur le côté sans croiser les pieds. Aller-retour sur 5 m."],
  ["squatjack","Squat jack","Saut pieds joints vers un squat large, mains jointes devant la poitrine, puis retour. 10."],
  ["burpee","Burpee","Accroupi mains au sol, planche, retour accroupi, saut bras en l'air. 5 à 10."],
  ["fente_m","Fentes marchées","Grand pas, genou arrière qui frôle le sol, buste droit. 10 pas."],
  ["chenille","La chenille","Jambes presque tendues, marchez avec les mains jusqu'à la planche, puis ramenez les pieds. 5 fois."],
  ["ours","Marche de l'ours","Mains et pieds au sol, genoux à 2 cm du sol, dos plat : avancez main et pied opposés. 10 m."],
  ["crabe","Marche du crabe","Mains derrière, bassin levé dans l'axe des cuisses : avancez à reculons. 10 m."]]},
 {t:"2. Mobilisation articulaire", i:"10 cercles dans chaque sens, sans forcer.", l:[
  ["mob_cheville","Chevilles","Sur un pied, la pointe de l'autre pied dessine des cercles."],
  ["mob_genou","Genoux","Pieds joints, mains sur les genoux : petits cercles."],
  ["mob_hanche","Hanches","Mains sur les hanches : grands cercles du bassin."],
  ["mob_epaule","Épaules","Bras tendus : grands cercles vers l'arrière puis vers l'avant."],
  ["mob_poignet","Poignets","Doigts croisés : cercles des poignets."],
  ["mob_buste","Rotation du buste","Bassin face à l'avant, tournez le haut du corps d'un côté puis de l'autre."]]},
 {t:"3. Activation avant la musculation", i:"Le placement des ateliers, sans charge : 10 répétitions lentes.", l:[
  ["act_scap","Pompes scapulaires","Bras tendus en planche : la poitrine descend entre les épaules en serrant les omoplates, puis repousse. Prépare développé couché et rowing."],
  ["act_y","Y allongé","À plat ventre, bras tendus en Y, pouces vers le haut : décollez les bras 2 s. Prépare oiseau, tirage menton, développé militaire."],
  ["act_pont","Pont fessier","Sur le dos, pieds près des fesses : montez le bassin jusqu'à l'alignement épaules-hanches-genoux, serrez 2 s. Prépare le hip thrust."],
  ["act_gm","Good morning","Mains derrière la tête, genoux légèrement fléchis : penchez le buste en poussant les fesses en arrière, dos plat. Prépare soulevé de terre et rowing barre."],
  ["act_fente","Fente avec rotation","Grande fente, main au sol à l'intérieur du pied avant, l'autre bras s'ouvre vers le plafond. 5 par côté. Prépare fentes et squat."],
  ["act_squat","Squat profond tenu","Talons au sol, mains jointes, coudes qui écartent les genoux. Tenez 20 à 30 s. Prépare le squat goblet."]]},
 {t:"4. Renforcement au poids du corps", i:"Le réveil musculaire : choisis ton niveau.", l:[
  ["squat","Squat","Cuisses parallèles au sol, talons au sol, dos droit. 10."],
  ["dips","Dips au banc","Mains au bord du banc, coudes vers l'arrière jusqu'à 90°. 10."],
  ["crunch","Crunch","Bas du dos au sol, décollez seulement les épaules. 10."],
  ["gainage","Gainage ventral","Sur les avant-bras, corps aligné de la tête aux talons. 20 s."],
  ["gainlat","Gainage latéral","Sur un avant-bras, bassin levé, corps aligné. 15 s par côté."],
  ["sjump","Squat jump","Demi-squat puis saut bras en l'air, réception souple. 5 à 8 (mise en route de la séance Puissance)."]]},
 {t:"Pompes : choisis ton niveau", i:"Corps aligné, poitrine près de l'appui, coudes à 45° du corps. 10 bien faites valent mieux que 20 mal faites.", l:[
  ["pompes_mur","1. Contre le mur","Mains au mur à hauteur d'épaules, un pas en arrière."],
  ["pompes_step","2. Mains sur un step","Mains sur le step, pieds au sol."],
  ["pompes_genoux","3. Sur les genoux","Genoux au sol, corps aligné des épaules aux genoux."],
  ["pompes","4. Classiques","Mains sous les épaules, corps aligné de la tête aux talons."]]},
 {t:"Abdominaux et gainage", i:"Le bas du dos ne se creuse jamais. 10 répétitions ou 20 s.", l:[
  ["crunch_inv","Crunch inversé","Genoux au-dessus des hanches : enroulez le bassin vers la poitrine."],
  ["deadbug","Dead bug","Dos plaqué : tendez un bras et la jambe opposée, puis changez."],
  ["birddog","Bird dog","À quatre pattes, dos plat : tendez un bras et la jambe opposée, 2 s."],
  ["mclimb","Mountain climber","En planche, ramenez les genoux vers la poitrine l'un après l'autre, bassin bas."],
  ["taps","Planche, épaules touchées","En planche, une main touche l'épaule opposée, le bassin ne bouge pas."],
  ["rtwist","Russian twist sans charge","Assis, buste penché en arrière dos droit : tournez d'un côté puis de l'autre."]]}
];
/* listes d'exercices par défaut des séances de mobiles (déplacées ici en v3.0 pour l'outil prof) */
const LISTES_DEFAUT = {S4:['dch','rowh','dm','squath','fentes','hip'], S5:['dch','rowb','squath','sdtj'], S6:['dch','rowh','squath','hip']};
/* v3.0 : bilan de l'échauffement guidé (parties faites), partagé par l'appli élève et l'outil prof */
const ECH_PARTS = {P1:[['corde','jjack','genoux','talons','chasses','squatjack','burpee','fente_m','chenille','ours','crabe'], 4],
 P2:[['mob_cheville','mob_genou','mob_hanche','mob_buste','mob_epaule','mob_poignet'], 6],
 P3:[['act_scap','act_y','act_pont','act_gm','act_fente','act_squat'], 4],
 P4:[['sjump','squat','pompes_mur','pompes_step','pompes_genoux','pompes','dips','gainage','gainlat','crunch','crunch_inv','deadbug','birddog','mclimb','taps','rtwist'], 4]};
function echBilan(wc, n, jour){
  wc = wc || [];const h = k => wc.includes(k);let f = 0, t = 0;
  Object.entries(ECH_PARTS).forEach(([k, [l, m]]) => {t++;if(h(k) || l.filter(h).length >= m)f++});
  if(n >= 4 && jour && jour.length){t++;if(h('P5') || jour.every(at => h('sp:' + at)))f++}
  else if(n === 2 || n === 3){t++;if(h('P5'))f++}
  return [f, t];
}
const imgEchauf = id => (IMAGES_AT.includes(id) ? 'img/ateliers/' : 'img/echauf/') + id + '.jpg';
const imgAtelier = id => IMAGES_AT.includes(id) ? 'img/ateliers/' + id + '.jpg' : IMAGES_SVG.includes(id) ? 'img/ateliers/' + id + '.svg' : null;
/* v2.0 : le menu = 14 ateliers avec charges. Circuit de S1 sur les 14 (4 min par atelier), en alternant haut et bas du corps. */
const MENU = ATELIERS.filter(a => a.menu).map(a => a.id);
const CIRCUIT_S1 = ["dc","squath","rowh","fentes","dm","sdtj","curlb","hip","extri","rowb","tirage","dch","pullover","oiseau"];
const ATELIERS_TEST = MENU.slice();   // S2-S3 : chaque élève en teste 4 à 5 par séance (objectif 8 à 10)
const OBJ_TESTS = [8, 10];

/* ---------- Mobiles ---------- */
const MOBILES = {
 tonif:{nom:"Tonification", theme:"Santé", court:"Tonif.", coul:"#15803d", deg:"linear-gradient(120deg,#3cc176 0%,#1f6e46 45%,#033327 100%)",
   pct:[50,60], series:[2,4], reps:[15,20], recup:"30 s à 1 min", recupS:45, tempsSerie:45,
   exec:"Régulière, respiration continue, pas de vitesse", ressenti:[5,7], sensation:"locale",
   attendu:"Fatigue d'une zone du corps (la région travaillée), sans brûlure forte.",
   ordre:["reps","series","charge"], ordreTxt:"Répétitions, puis séries, puis charge", nbEx:[6,6],
   forme:"En circuit possible : on enchaîne les ateliers, 1 à 2 min entre les tours."},
 volume:{nom:"Volume", theme:"Esthétique", court:"Volume", coul:"#c2410c", deg:"linear-gradient(120deg,#f0a050 0%,#c2410c 45%,#5a1a0c 100%)",
   pct:[65,80], series:[3,5], reps:[8,12], recup:"1 min 30 à 2 min", recupS:105, tempsSerie:50,
   exec:"Lente : 2-3 s à la descente, 1-2 s à la montée ; finir à 1-2 répétitions de l'échec", ressenti:[7,9], sensation:"brulure",
   attendu:"Brûlure, congestion locale : « ça gonfle ».",
   ordre:["series","charge","reps"], ordreTxt:"Séries, puis charge, puis répétitions", nbEx:[4,5],
   forme:"Les séries d'un exercice à la suite, le partenaire travaille pendant la récupération."},
 puiss:{nom:"Puissance", theme:"Sportif", court:"Puiss.", coul:"#1e40af", deg:"linear-gradient(120deg,#6f8fe8 0%,#2a3f9e 45%,#1b1450 100%)",
   pct:[30,60], series:[3,5], reps:[3,6], recup:"2 à 3 min", recupS:150, tempsSerie:15,
   exec:"Montée la plus rapide possible, descente contrôlée ; arrêt dès que la vitesse baisse", ressenti:[5,6], sensation:"tension",
   attendu:"Tension générale, sensation de « compacité », sans brûlure.",
   ordre:["charge","series"], ordreTxt:"Charge (tant que la vitesse reste), puis séries", nbEx:[4,5],
   forme:"6 ateliers seulement : développé couché (barre ou haltères sur steps), développé militaire, rowing haltère, squat haltères, hip thrust. Le partenaire dit STOP dès que la vitesse baisse."}
};
const MOBILES_ORDRE = ["tonif","volume","puiss"];

/* ---------- Échelle de ressentis (départ commun, d'après Laurent Lecomte et l'échelle de Borg) ----------
   La classe l'enrichit avec ses propres mots (nuage de mots S1-S2), puis chaque élève fait la sienne (S5). */
const ECHELLE = [
 [1,"Aucun effort","Pleine détente, je récupère.","#e2e8f0"],
 [2,"Extrêmement facile","Je pourrais continuer très longtemps.","#dbeafe"],
 [3,"Très facile","Zone de confort, simple gêne.","#bfdbfe"],
 [4,"Facile","Premiers picotements.","#bbf7d0"],
 [5,"Modéré","Légèrement fatigant, je respire plus vite.","#86efac"],
 [6,"Moyennement difficile","Mes muscles picotent, j'ai chaud.","#fde68a"],
 [7,"Difficile","Mes muscles commencent à brûler.","#fdba74"],
 [8,"Très difficile","Ça brûle sérieusement, je parle à peine.","#fb923c"],
 [9,"Maximal","Je tiens seulement quelques secondes de plus.","#f87171"],
 [10,"Supra-maximal","Je bloque, je ne peux plus finir le geste.","#dc2626"]
];
const MOTS_DEPART = ["chaud","léger","ça picote","ça brûle","ça gonfle","lourd","dur","tendu","ça tremble","essoufflé","ça tape","compact","je bloque","facile","fatigué","rien"];
const SENSATIONS = [
 ["locale","Fatigue d'une zone","La région travaillée est fatiguée, sans brûlure forte."],
 ["brulure","Brûlure, ça gonfle","Brûlure ou congestion dans le muscle."],
 ["tension","Tension générale","Tout le corps est tendu, compact, sans brûlure."],
 ["rien","Pas grand-chose","Je ne sens presque rien."],
 ["douleur","Douleur articulaire","Douleur dans une articulation : STOP, je préviens le professeur."]
];
const SIGNES = ["Visage crispé","Tremblements","Amplitude réduite","Charge qui n'est plus freinée","Dos qui s'arrondit ou se creuse","Respiration bloquée"];
const CONSEILS = ["Souffle sur l'effort","Amplitude complète","Ralentis la descente","Plus vite à la montée","Dos plat","Coudes fixes","Baisse la charge","Tu peux monter la charge"];

/* ---------- Évaluation (protocole CA5 réécrit, session 2026) ---------- */
const EVAL = {
 afl1:[["Réalisation",6,["Charges adaptées","Respiration placée","Posture et trajet moteur","Vitesse d'exécution"]],["Analyse et régulation",6,["Ressentis précis","Cohérence avec le mobile","Ajustements justifiés"]]],
 repartitions:[["6/2","AFL2 6 pts · AFL3 2 pts"],["4/4","AFL2 4 pts · AFL3 4 pts"],["2/6","AFL2 2 pts · AFL3 6 pts"]],
 roles:[["coach","Coach-sécurité","Pare, regarde le point clé, compte les répétitions propres, conseille et fixe un objectif à son partenaire."]],
 roleAncien:{juge:"Juge-observateur (ancien choix)"}
};

/* ---------- Sécurité (règles de Laurent Lecomte reprises) ---------- */
const SECU = {
 regles:["Jamais d'effort à 100 %, jamais de série à moins de 3 répétitions.","La technique passe avant la charge : amplitude complète, trajet précis, vitesse respectée.","Charger et décharger barres et haltères des deux côtés, disques serrés, puis ranger sur les portants.","Développé couché et extension triceps allongé : toujours un pareur derrière la tête.","Ne jamais bloquer la respiration sur plusieurs répétitions (risque de malaise).","Douleur dans une articulation : arrêt immédiat, on prévient le professeur. Ce n'est pas un ressenti d'entraînement."],
 angles:[["Genou","Descente jusqu'aux cuisses parallèles au sol, genoux dans l'axe des pieds. Talons qui décollent : cale sous les talons."],["Coude","Pas d'hyper-extension ; amplitude complète mais contrôlée. Dips : 90° au maximum."],["Épaule","Coudes sous les épaules ; tirage menton : coudes à hauteur des épaules au maximum."],["Dos","Jamais arrondi sous charge ; gainage tenu jusqu'à la fin de la série."]],
 respiration:"Souffler pendant l'effort (la poussée ou la traction), inspirer pendant le retour. Exception : les abdominaux, on souffle tout au long de la montée.",
 devise:"« Je ne vise jamais l'exploit : la précision avant la charge. »"
};

/* ---------- Échauffements ---------- */
const ECH_BASE = "P1 · Course ou corde à sauter à allure modérée (zone blanche) jusqu'à la sensation de chaleur et un léger essoufflement. Prendre son pouls : au-dessus de 140, repartir 2 min à cette allure (zone bleue). Mobiliser chevilles, genoux, hanches, épaules, poignets. P2 · Réveil musculaire au poids du corps (ateliers du circuit d'échauffement) : 10 squats, 10 pompes adaptées, 10 dips au banc, 10 crunchs, 20 s de gainage ventral et 15 s de gainage latéral par côté. P3 · Activation (pompes scapulaires, Y allongé, pont fessier, good morning, fente avec rotation, squat profond tenu), puis chaque exercice du jour, sans charge ou très léger, 1 série de 10 en soignant le placement. Tous ces exercices sont illustrés dans l'onglet Fiches.";

/* ---------- Séances ----------
   tl : [libellé, durée en min, type] ; types : "inst" (accueil, installation : bloc d'information) ; tous les autres
   consomment une fiche, dans l'ordre. Durées : environ 70 min de pratique, installation comprise à part. */
const fiche = (titre, cat, duree, dispo, roles, deroul, crit, reussite, moins, plus, schema) => ({titre, cat, duree, dispo, roles, deroul, crit, reussite, moins, plus, schema});

const SEANCES = [
 {id:"S1", titre:"Se situer, découvrir les ateliers", obj:"Connaître les règles de sécurité et les rôles du binôme ; découvrir les 14 ateliers du cycle (tous avec charges) ; commencer à mettre des mots sur ses ressentis.",
  install:"Binômes formés pour tout le cycle. Les 14 ateliers du circuit sont installés en boucle sur le tatami, numérotés (2 bancs, steps empilés recouverts d'un tapis pour le rowing haltère et le pull-over, tapis et mousse pour le hip thrust au sol, deux piles de steps à hauteur des genoux pour poser la barre du soulevé de terre). Les élèves ouvrent l'appli élève et créent leur binôme.",
  bilan:"Quel mot as-tu choisi en fin d'échauffement ? Quel atelier t'a le plus fait travailler ?",
  prepare:["Le questionnaire « Je me situe » qui suggère un mobile.","Les premiers mots du nuage de la classe.","Le test 10 RM de la séance 2."],
  tl:[["Accueil, binômes, appli",10,"inst"],["Échauffement + premiers mots",8,"ech"],["Règles et rôles du binôme",3,"ex"],["Circuit : ateliers 1 à 7",28,"ex"],["Circuit : ateliers 8 à 14",28,"ex"],["Je me situe, envoi, rangement",5,"bil"]],
  fiches:[
   fiche("Échauffement et premiers mots","Échauffement",8,"Toute la classe sur le tatami. Échauffement en 3 parties, avec 2 arrêts pour noter son ressenti dans l'appli (1 min chacun).","Chacun pour soi ; le partenaire tient le téléphone.",
    ["2-3 min de course légère : ARRÊT. Dans l'appli, note sur 10 et un mot pour ce que tu ressens (muscles, respiration).","Fin de la course et des mobilisations (5-6 min) : ARRÊT. Même chose : une note et un mot.","Le professeur affiche le nuage de mots (2 min) : « Qu'est-ce qui a changé entre les deux moments ? »","Réveil musculaire : 10 squats, 10 pompes adaptées, 20 s de gainage."],
    "On remplace « mal » par une sensation précise : chaud, picote, lourd, essoufflé…","Chaque élève a noté deux ressentis.",null,null,"echelle"),
   fiche("Règles et rôles du binôme","Sécurité",3,"Regroupement devant le professeur. Démonstration au développé couché : placement, pareur, respiration.","Un pratiquant, un partenaire. Le partenaire compte, observe, pare et conseille ; on change à chaque série.",
    ["Les 6 règles de sécurité (outil Sécurité).","Montrer le pareur au développé couché.","Montrer « souffler sur l'effort ».","Montrer comment charger une barre : disques des deux côtés, serrés."],
    "Jamais d'effort à 100 %, jamais moins de 3 répétitions.","Chacun sait dire qui pare au développé couché.",null,null,"regles"),
   fiche("Circuit : ateliers 1 à 7","Circuit",28,"Un binôme par atelier au départ. 4 min par atelier, puis on tourne au signal dans l'ordre des numéros.","Chacun fait 2 × 10 répétitions à charge légère pendant que l'autre observe, puis on change. Le partenaire coche « fait » dans l'appli.",
    ["Lire la fiche de l'atelier dans l'appli (placement, respiration, sécurité).","Charge légère : on apprend le geste, on ne cherche pas à forcer.","2 × 10 répétitions chacun, en alternance.","Au signal : ranger les disques de l'atelier et passer au suivant."],
    "Précision du geste avant la charge.","Les 7 ateliers faits avec une technique correcte.","Barre seule, haltères plus légers.","Descente lente (3 s).","circuit:1"),
   fiche("Circuit : ateliers 8 à 14","Circuit",28,"Même fonctionnement : 4 min par atelier, on tourne au signal.","Le partenaire observe : amplitude, dos, respiration. Il le dit tout de suite.",
    ["Suite du circuit dans l'ordre des numéros.","Chacun 2 × 10 répétitions, charge légère.","Un conseil du partenaire à chaque atelier.","Soulevé de terre jambes semi-tendues : le professeur vérifie le dos plat de chacun."],
    "Précision du geste avant la charge.","Les 14 ateliers découverts.","Barre seule.","Descente lente (3 s).","circuit:2"),
   fiche("Je me situe, envoi, rangement","Fin de séance",5,"Disques rangés sur les portants, barres et haltères rangés. Chaque élève remplit « Je me situe » dans l'appli.","Un élève du binôme envoie le carnet (QR ou fichier).",
    ["3 min : questionnaire « Je me situe » ; l'appli suggère un mobile.","2 min : rangement complet.","1 min : envoi du carnet, puis bilan : quel mot as-tu choisi en fin d'échauffement ?"],
    "Rangement complet avant de partir.","Questionnaire rempli, carnet envoyé.",null,null,null)
  ]},
 {id:"S2", titre:"Test 10 RM (1), défi par équipes", obj:"Trouver sa charge maximale sur 4 à 5 ateliers par une montée progressive ; tenir les rôles de juge et de coach ; construire l'échelle de ressentis de la classe.",
  install:"Les 14 ateliers sont installés. Chaque élève choisit 4 à 5 ateliers à tester aujourd'hui, en couvrant des groupes musculaires différents (au moins un du bas du corps sur les deux séances). Rappel : jamais d'effort à 100 %.",
  bilan:"Entre ta première série et ta dernière, qu'est-ce qui a changé dans tes muscles ? Quel mot l'a dit ?",
  prepare:["4 à 5 charges max par élève (calculées par l'appli).","L'échelle de ressentis commune à la classe.","La 2e séance de test."],
  tl:[["Accueil, équipes, installation",8,"inst"],["Échauffement + mots",12,"ech"],["Règles du test et No REP",5,"ex"],["Tests : 1er bloc",22,"ex"],["Tests : 2e bloc",22,"ex"],["Nuage, échelle commune, défi, rangement",9,"bil"]],
  fiches:[
   fiche("Échauffement + mots","Échauffement",12,ECH_BASE,"Chacun pour soi.",
    ["Échauffement en 3 parties, prise de pouls à la fin de P1.","P3 : 1 série de 10 à vide sur chaque atelier que tu vas tester."],
    "Le pouls est pris honnêtement.","Pouls noté dans l'appli.",null,null,null),
   fiche("Règles du test et No REP","Consignes",5,"Démonstration par le professeur avec un binôme.","Le juge compte « + 1 » ou « No REP » sur le téléphone ; le coach pare et conseille.",
    ["Choisir ses ateliers dans l'appli (onglet Séance) : 4 à 5 aujourd'hui.","Commencer léger (l'appli propose la charge de départ).","10 répétitions valides : on monte (+ 2 kg haltère, + 4 kg barre), 2 min de récupération.","Une série qui s'arrête avant 10 : fin du test sur cet atelier. 5 séries d'essai au maximum."],
    "Pas de No REP : la précision avant la charge.","Chacun sait ce qu'est un No REP.",null,null,"test"),
   fiche("Tests : 1er bloc","Test 10 RM",22,"2 à 3 ateliers par élève. Pendant que l'un soulève, l'autre juge sur le téléphone ; on alterne à chaque série. Environ 7 min par atelier pour le binôme.","Le juge compte, le coach pare (développé couché, extension triceps).",
    ["Montée progressive, 2 min de récupération entre les séries (le partenaire fait la sienne).","Ressenti à la première et à la dernière série.","Le partenaire valide la charge max dans l'appli."],
    "Montée progressive.","2 à 3 charges max validées.","Partir plus léger.",null,"ateliers:dc,dch,rowh,rowb,pullover,dm,tirage"),
   fiche("Tests : 2e bloc","Test 10 RM",22,"2 ateliers de plus par élève, dans d'autres groupes musculaires.","Même fonctionnement.",
    ["Même méthode.","Viser au moins un atelier du bas du corps sur les deux séances de test."],
    "Montée progressive.","4 à 5 charges max en fin de séance.","Partir plus léger.",null,"ateliers:oiseau,curlb,extri,squath,fentes,sdtj,hip"),
   fiche("Nuage, échelle commune, défi, rangement","Fin de séance",9,"Rangement d'abord. Chaque binôme montre son QR « mots et défi » au professeur.","Un élève du binôme montre le QR.",
    ["3 min : rangement.","2 min : nuage de mots (1re série / dernière série) ; on range les mots de léger à maximal : c'est l'échelle de la classe.","2 min : résultat du défi par équipes (kilos + points de qualité).","Envoi du carnet."],
    "Rangement complet.","Échelle commune affichée, défi proclamé.",null,null,"echelle")
  ]},
 {id:"S3", titre:"Test 10 RM (2), compléter ses charges max", obj:"Trouver 4 à 5 charges max de plus, sur d'autres groupes musculaires : 8 à 10 au total en fin de séance.",
  install:"Les 14 ateliers sont installés. Chaque élève choisit 4 à 5 ateliers à tester aujourd'hui, en couvrant des groupes musculaires différents (au moins un du bas du corps sur les deux séances). Rappel : jamais d'effort à 100 %.",
  bilan:"Entre ta première série et ta dernière, qu'est-ce qui a changé dans tes muscles ? Quel mot l'a dit ?",
  prepare:["8 à 10 charges max par élève : les charges des 3 mobiles sont calculées.","Le premier mobile éprouvé en S4."],
  tl:[["Accueil, équipes, installation",8,"inst"],["Échauffement + mots",12,"ech"],["Rappel du test et choix des ateliers",3,"ex"],["Tests : 1er bloc",22,"ex"],["Tests : 2e bloc",22,"ex"],["Bilan des charges max, défi, rangement",10,"bil"]],
  fiches:[
   fiche("Échauffement + mots","Échauffement",12,ECH_BASE,"Chacun pour soi.",
    ["Échauffement en 3 parties, prise de pouls à la fin de P1.","P3 : 1 série de 10 à vide sur chaque atelier que tu vas tester."],
    "Le pouls est pris honnêtement.","Pouls noté dans l'appli.",null,null,null),
   fiche("Rappel du test et choix des ateliers","Consignes",3,"Rappel rapide devant le tableau.","Le juge compte « + 1 » ou « No REP » sur le téléphone ; le coach pare et conseille.",
    ["Choisir ses ateliers dans l'appli (onglet Séance) : 4 à 5 aujourd'hui.","Commencer léger (l'appli propose la charge de départ).","10 répétitions valides : on monte (+ 2 kg haltère, + 4 kg barre), 2 min de récupération.","Une série qui s'arrête avant 10 : fin du test sur cet atelier. 5 séries d'essai au maximum."],
    "Pas de No REP : la précision avant la charge.","Chacun sait ce qu'est un No REP.",null,null,"test"),
   fiche("Tests : 1er bloc","Test 10 RM",22,"2 à 3 ateliers par élève. Pendant que l'un soulève, l'autre juge sur le téléphone ; on alterne à chaque série. Environ 7 min par atelier pour le binôme.","Le juge compte, le coach pare (développé couché, extension triceps).",
    ["Montée progressive, 2 min de récupération entre les séries (le partenaire fait la sienne).","Ressenti à la première et à la dernière série.","Le partenaire valide la charge max dans l'appli."],
    "Montée progressive.","2 à 3 charges max validées.","Partir plus léger.",null,"ateliers:dc,dch,rowh,rowb,pullover,dm,tirage"),
   fiche("Tests : 2e bloc","Test 10 RM",22,"2 ateliers de plus par élève, dans d'autres groupes musculaires.","Même fonctionnement.",
    ["Même méthode.","À la fin de la S3, chacun a 8 à 10 charges max."],
    "Montée progressive.","8 à 10 charges max en fin de séance.","Partir plus léger.",null,"ateliers:oiseau,curlb,extri,squath,fentes,sdtj,hip"),
   fiche("Bilan des charges max, défi, rangement","Fin de séance",10,"Rangement d'abord. Chaque binôme montre son QR « mots et défi » au professeur.","Un élève du binôme montre le QR.",
    ["3 min : rangement.","2 min : onglet Charges : chacun vérifie ses 8 à 10 charges max ; un atelier manquant se teste en saisie directe en S4.","2 min : résultat du défi par équipes (cumul S2 + S3).","Envoi du carnet."],
    "Rangement complet.","Charges max vérifiées, défi proclamé.",null,null,"test")
  ]},
 {id:"S4", titre:"Mobile Tonification", obj:"Éprouver l'endurance de force : 15 à 20 répétitions à 50-60 %, récupération courte, en circuit ; vérifier que ses sensations correspondent au mobile.",
  install:"6 ateliers en circuit (3 du haut du corps, 3 du bas du corps), parmi les ateliers où le binôme a une charge max. Les charges sont calculées par l'appli (50-60 % de la charge max).",
  bilan:"Ta sensation était-elle « fatigue d'une zone » ? Sinon, qu'as-tu changé ?",
  prepare:["Le premier des 3 mobiles éprouvés.","Les ressentis comparés en S6 pour choisir son mobile.","L'évaluation AFL2 et AFL3 : analyse et coaching notés après chaque exercice, de la S4 à la S7."],
  tl:[["Accueil, installation",8,"inst"],["Échauffement",10,"ech"],["Le mobile Tonification",4,"ex"],["Circuit, tour 1",12,"ex"],["Circuit, tour 2",12,"ex"],["Circuit, tour 3",12,"ex"],["Ressentis, envoi, rangement",8,"bil"]],
  fiches:[
   fiche("Échauffement","Échauffement",10,ECH_BASE,"Chacun pour soi.",["Échauffement en 3 parties.","P3 : les 6 ateliers du circuit, à vide."],"Pouls pris.","Prêt pour le circuit.",null,null,null),
   fiche("Le mobile Tonification","Consignes",4,"Regroupement. Le professeur montre le tableau du mobile.","Le partenaire vérifie le rythme et la respiration.",
    ["50-60 % de la charge max, 15 à 20 répétitions, 30 s à 1 min de récupération.","Rythme régulier, respiration continue : pas de vitesse.","Sensation attendue : fatigue d'une zone du corps, sans brûlure forte.","Après chaque exercice, pendant les séries, le partenaire coache (point clé, signes) ; à la fin de l'exercice, chacun note son ressenti, ses répétitions en réserve et ce qu'il fera la prochaine fois.","Dès cette séance, l'analyse et le coaching comptent pour l'AFL2 et l'AFL3 : chacun choisit sa répartition AFL2/AFL3 dans l'appli (rôle AFL3 : coach)."],
    null,"Chacun connaît sa charge sur chaque atelier.",null,null,"mobile:tonif"),
   fiche("Circuit, tour 1","Circuit",12,"6 ateliers, 2 min par atelier pour le binôme : chacun fait sa série (environ 45 s) pendant que l'autre récupère.","Le partenaire compte et regarde le rythme.",
    ["Charge prévue par l'appli : on ne note que si on change.","15 à 20 répétitions régulières.","Ressenti noté après la série.","Au signal : atelier suivant."],
    "Rythme régulier du début à la fin.","Ressentis notés sur les 6 ateliers.","Moins de répétitions (15).","Plus de répétitions (20).","mobile:tonif"),
   fiche("Circuit, tour 2","Circuit",12,"Même circuit. 1 à 2 min entre les tours.","Le partenaire coche les signes qu'il voit.",
    ["Même charge, ou ajustée d'après le ressenti du tour 1 (l'appli le propose).","Ressenti noté."],
    "Respiration continue.","Ajustements faits si le ressenti n'était pas le bon.",null,null,"mobile:tonif"),
   fiche("Circuit, tour 3","Circuit",12,"Même circuit.","Le partenaire donne un conseil à chaque atelier.",
    ["Dernier tour : la fatigue d'une zone doit être nette.","Ressenti noté."],
    null,"3 tours faits, ressentis notés.",null,null,"mobile:tonif"),
   fiche("Ressentis, envoi, rangement","Fin de séance",8,"Rangement puis bilan rapide.","Un élève du binôme envoie le carnet.",
    ["L'appli montre la cohérence de tes ressentis avec le mobile.","Rangement.","Envoi du carnet."],null,"Carnet envoyé.",null,null,null)
  ]},
 {id:"S5", titre:"Mobile Volume", obj:"Éprouver le volume : 8 à 12 répétitions à 65-80 %, mouvement lent, 1 min 30 à 2 min de récupération ; reconnaître la brûlure.",
  install:"Les binômes choisissent 4 exercices : 2 du haut du corps, 2 du bas. Charges à 65-80 % calculées par l'appli.",
  bilan:"As-tu senti « ça brûle, ça gonfle » ? À quelle série ?",
  prepare:["Le deuxième mobile éprouvé.","L'évaluation AFL2 et AFL3 : analyse et coaching notés après chaque exercice, de la S4 à la S7."],
  tl:[["Accueil, installation",8,"inst"],["Échauffement",10,"ech"],["Le mobile Volume",4,"ex"],["Bloc haut du corps",22,"ex"],["Bloc bas du corps",22,"ex"],["Ressentis, envoi, rangement",8,"bil"]],
  fiches:[
   fiche("Échauffement","Échauffement",10,ECH_BASE,"Chacun pour soi.",["Échauffement en 3 parties.","P3 : 1 série légère de 10 sur chaque exercice choisi."],null,"Prêt.",null,null,null),
   fiche("Le mobile Volume","Consignes",4,"Regroupement : démonstration du tempo lent (2-3 s à la descente).","Le partenaire compte le tempo à voix haute.",
    ["65-80 % de la charge max, 8 à 12 répétitions, 3 à 5 séries.","Descente en 2-3 s, montée en 1-2 s.","Finir à 1-2 répétitions de l'échec : la dernière est dure mais propre.","Sensation attendue : brûlure, « ça gonfle »."],
    null,"Chacun connaît ses charges.",null,null,"mobile:volume"),
   fiche("Bloc haut du corps","Volume",22,"2 exercices du haut du corps, 4 séries chacun. Pendant la récupération de l'un, l'autre fait sa série.","Le partenaire compte le tempo et coche les signes.",
    ["Séance préremplie dans l'appli : on ne note que les différences.","Ressenti après chaque exercice.","Brûlure trop tôt ou pas du tout : l'appli propose un ajustement."],
    "Tempo lent tenu jusqu'à la dernière répétition.","2 exercices faits, ressentis notés.","Moins de séries (3).","Une série de plus (5).","mobile:volume"),
   fiche("Bloc bas du corps","Volume",22,"2 exercices du bas du corps, 4 séries chacun.","Même fonctionnement.",
    ["Par exemple squat haltères et hip thrust, ou fentes et soulevé de terre jambes semi-tendues.","Ressenti après chaque exercice."],
    "Tempo lent tenu.","4 exercices faits, ressentis notés.",null,null,"mobile:volume"),
   fiche("Ressentis, envoi, rangement","Fin de séance",8,"Rangement puis bilan.","Un élève envoie le carnet.",["Cohérence des ressentis avec le mobile.","Rangement, envoi."],null,"Carnet envoyé.",null,null,null)
  ]},
 {id:"S6", titre:"Mobile Puissance, choisir son mobile", obj:"Éprouver la puissance : 3 à 6 répétitions à 30-60 %, le plus vite possible, récupération complète ; comparer les 3 mobiles, choisir le sien et construire son échelle personnelle.",
  install:"Les ateliers de puissance : développé couché (barre ou haltères sur steps), développé militaire, rowing haltère, squat haltères, saut sur box (2 box en bois sur le sol dur, arête avant protégée par de la mousse, côté 40 ou 50 cm), hip thrust. Chaque binôme en fait 4, dont au moins un du bas du corps.",
  bilan:"Quel mobile choisis-tu, et pourquoi ? Quelle sensation te le dit ?",
  prepare:["Le choix du mobile pour le projet (S7 à S9).","L'échelle de ressentis personnelle.","L'évaluation AFL2 et AFL3 : analyse et coaching notés après chaque exercice, de la S4 à la S7."],
  tl:[["Accueil, installation",8,"inst"],["Échauffement progressif",12,"ech"],["Le mobile Puissance",3,"ex"],["Bas du corps : vitesse maximale",15,"ex"],["Haut du corps : vitesse maximale",17,"ex"],["Comparer, choisir, mon échelle",10,"ex"],["Envoi, rangement",5,"bil"]],
  fiches:[
   fiche("Échauffement progressif","Échauffement",12,ECH_BASE+" P4 · Mise en route nerveuse : 2 × 5 squats sautés et 2 × 5 pompes rapides, au poids du corps, réception silencieuse.","Chacun pour soi.",["Échauffement en 4 parties, mise en route nerveuse à la fin."],"Réceptions silencieuses.","Prêt.",null,null,null),
   fiche("Le mobile Puissance","Consignes",3,"Regroupement.","Le partenaire regarde la vitesse : dès qu'elle baisse, il dit STOP.",
    ["Charge selon l'atelier : 30-45 % aux développés couchés, 30-40 % au militaire, 40-50 % au rowing haltère, 40-60 % au squat haltères et au hip thrust.","3 à 6 répétitions, 4 séries, 2 à 3 min de récupération complète.","Montée la plus rapide possible, descente contrôlée en 1 à 2 s, pas de rebond.","Arrêt dès que la vitesse baisse : le partenaire touche « la vitesse a baissé ».","Sensation attendue : tension générale, sans brûlure."],
    null,"Chacun sait quand s'arrêter.",null,null,"mobile:puiss"),
   fiche("Bas du corps : vitesse maximale","Puissance",15,"Squat haltères (remontée explosive jusqu'à la pointe des pieds, sans quitter le sol), saut sur box juste après (3 à 5 sauts) ou hip thrust (poussée explosive des hanches, 1 s en haut). 4 séries de 4 à 6.","Le partenaire juge la vitesse et dit STOP dès qu'elle baisse.",
    ["Charge à 40-60 % (l'appli la calcule).","Le plus vite possible à la montée, descente contrôlée.","Vitesse qui baisse : la série s'arrête, même avant 4 répétitions.","Saut sur box : 3 à 5 sauts, réception silencieuse, redescente en marchant ; box à 40 cm puis 50 cm, jamais 60."],
    "Vitesse maximale à chaque répétition.","1 à 2 exercices, ressentis notés.","Charge à 40 %.","Charge à 60 %.","mobile:puiss"),
   fiche("Haut du corps : vitesse maximale","Puissance",17,"Développé couché (barre avec pareur, ou haltères sur steps), développé militaire assis, rowing haltère. 4 séries de 4 à 6.","Le partenaire juge la vitesse ; il pare au développé couché barre.",
    ["Pousser ou tirer le plus vite possible, redescendre en contrôlant.","Vitesse qui baisse : la série s'arrête.","Ressenti après chaque exercice : tension générale ?"],
    "Vitesse maximale à chaque répétition.","2 à 3 exercices, ressentis notés.","Charge au bas de la fourchette.","Charge au haut de la fourchette.","mobile:puiss"),
   fiche("Comparer, choisir, mon échelle","Choix",10,"Chacun avec son téléphone, assis sur le tatami.","Le partenaire aide à relire les ressentis.",
    ["L'appli montre tes ressentis en Tonification, Volume et Puissance côte à côte.","Choisis ton mobile pour le projet (S7 à S9).","Construis ton échelle : pour chaque niveau, ton mot à toi."],
    "Choix justifié par une sensation.","Mobile choisi, échelle faite.",null,null,"echelle"),
   fiche("Envoi, rangement","Fin de séance",5,"Rangement puis envoi.","Un élève envoie le carnet.",["Rangement.","Envoi du carnet.","Bilan : quel mobile, pourquoi ?"],null,"Carnet envoyé.",null,null,null)
  ]},
 {id:"S7", titre:"Mon projet", obj:"Construire un projet cohérent avec son mobile (haut et bas du corps, 4 à 6 exercices) et le réaliser ; ajuster pour l'évaluation (l'AFL2 et l'AFL3 sont observées depuis la S4).",
  install:"Les 14 ateliers sont accessibles. Banc de développé couché : 1 binôme ; barres triceps : 2 ; steps recouverts du tapis pour le rowing haltère et le pull-over ; tapis et mousse pour le hip thrust au sol ; deux piles de steps à hauteur des genoux pour la barre du soulevé de terre.",
  bilan:"Ton projet tient-il dans la séance ? Qu'as-tu ajusté ?",
  prepare:["Le projet réalisé en S8 et S9.","L'évaluation AFL2 et AFL3."],
  tl:[["Accueil, installation",8,"inst"],["Échauffement personnalisé",10,"ech"],["Construire mon projet",12,"ex"],["Réaliser mon projet",38,"ex"],["Ajustements, envoi, rangement",8,"bil"]],
  fiches:[
   fiche("Échauffement personnalisé","Échauffement",10,"Chaque élève s'échauffe pour SON projet : P1 course et pouls, P2 réveil musculaire, P3 les exercices de son projet à vide.","Le partenaire vérifie.",["Échauffement adapté à ses exercices."],"Échauffement en lien avec le projet.","Fait.",null,null,null),
   fiche("Construire mon projet","Projet",12,"Dans l'appli, onglet Projet.","Le partenaire relit le projet.",
    ["Mobile choisi en S6 (on peut encore changer).","Haut et bas du corps, 4 à 6 exercices (Tonification : 6 ; Puissance : parmi les 6 ateliers de puissance).","L'appli vérifie l'équilibre, la durée (60 min au plus) et les places (banc de développé couché : 1).","Répartition AFL2/AFL3 choisie en S4 : dernière chance de la changer (verrouillée en S8). Rôle AFL3 : coach pour tous."],
    "Projet équilibré qui tient dans la séance.","Projet validé dans l'appli.",null,null,"mobile:projet"),
   fiche("Réaliser mon projet","Projet",38,"Le binôme enchaîne les exercices de ses deux projets. Le professeur observe et évalue AFL2 et AFL3.","Le partenaire coache (rôle évalué AFL3) : point clé, signes, conseil, objectif.",
    ["Séance préremplie : on ne note que les différences.","Ressenti après chaque exercice.","Ajustement immédiat si la sensation n'est pas la bonne."],
    "Paramètres du mobile respectés.","Projet réalisé, ressentis notés.",null,null,null),
   fiche("Ajustements, envoi, rangement","Fin de séance",8,"Le choix « La prochaine fois, je… » de chaque exercice règle le projet de la S8.","Un élève envoie le carnet.",["Choix différent de la proposition de l'appli : une phrase pour dire pourquoi.","Rangement, envoi."],null,"Ajustements justifiés, carnet envoyé.",null,null,null)
  ]},
 {id:"S8", titre:"Évaluation AFL1 · moitié A", obj:"Moitié A : réaliser son projet devant le professeur (AFL1 sur 12). Moitié B : partenaire (AFL3).",
  install:"Les élèves évalués sont répartis pour que le professeur voie chacun sur au moins 2 exercices.", bilan:"Ce qui était conforme à ton mobile, ce que tu changerais.",
  prepare:["La note d'AFL1 de la moitié A."],
  tl:[["Accueil, installation",6,"inst"],["Échauffement personnalisé",10,"ech"],["Consignes de l'épreuve",3,"ex"],["Épreuve : projet de la moitié A",45,"ex"],["Analyse, envoi, rangement",6,"bil"]],
  fiches:[
   fiche("Échauffement personnalisé","Échauffement",10,"Chaque élève évalué s'échauffe pour son projet.","Le partenaire vérifie.",["Échauffement personnalisé (il compte dans l'AFL2)."],null,"Fait.",null,null,null),
   fiche("Consignes de l'épreuve","Évaluation",3,"Regroupement.",null,
    ["Réalisation sur 6 points : charges, respiration, posture et trajet, vitesse.","Analyse et régulation sur 6 points : ressentis, cohérence, ajustements (lus dans le carnet).","Le partenaire est évalué dans son rôle AFL3."],
    null,"Chacun connaît les critères.",null,null,"eval"),
   fiche("Épreuve : projet de la moitié A","Évaluation",45,"La moitié A réalise son projet ; la moitié B est partenaire.","Partenaire : coach (AFL3).",
    ["Séance préremplie, ressentis après chaque exercice.","Le professeur observe chaque élève sur au moins 2 exercices."],
    "Paramètres du mobile respectés, ressentis cohérents.","Projet réalisé.",null,null,"eval"),
   fiche("Analyse, envoi, rangement","Fin de séance",6,"Analyse écrite dans l'appli (2 phrases).","Un élève envoie le carnet.",["Ce qui était conforme, ce que je changerais.","Rangement, envoi."],null,"Analyse écrite, carnet envoyé.",null,null,null)
  ]},
 {id:"S9", titre:"Évaluation AFL1 · moitié B", obj:"Moitié B : réaliser son projet devant le professeur (AFL1 sur 12). Moitié A : partenaire (AFL3).",
  install:"Comme en S8, rôles inversés.", bilan:"Ce que ce cycle t'a appris sur ton corps.",
  prepare:["La note d'AFL1 de la moitié B, la note finale sur 20."],
  tl:[["Accueil, installation",6,"inst"],["Échauffement personnalisé",10,"ech"],["Consignes de l'épreuve",3,"ex"],["Épreuve : projet de la moitié B",45,"ex"],["Analyse, envoi, rangement",6,"bil"]],
  fiches:[
   fiche("Échauffement personnalisé","Échauffement",10,"Chaque élève évalué s'échauffe pour son projet.","Le partenaire vérifie.",["Échauffement personnalisé."],null,"Fait.",null,null,null),
   fiche("Consignes de l'épreuve","Évaluation",3,"Regroupement.",null,["Mêmes critères qu'en S8."],null,"Chacun connaît les critères.",null,null,"eval"),
   fiche("Épreuve : projet de la moitié B","Évaluation",45,"La moitié B réalise son projet ; la moitié A est partenaire.","Partenaire : coach (AFL3).",
    ["Séance préremplie, ressentis après chaque exercice.","Le professeur observe chaque élève sur au moins 2 exercices."],
    "Paramètres du mobile respectés, ressentis cohérents.","Projet réalisé.",null,null,"eval"),
   fiche("Analyse, envoi, rangement","Fin de séance",6,"Analyse écrite dans l'appli.","Un élève envoie le carnet.",["Analyse finale.","Rangement, dernier envoi."],null,"Carnet envoyé.",null,null,null)
  ]}
];
const seanceById = id => SEANCES.find(s => s.id === id);

const SOURCES = [
 ["Laurent Lecomte, lycée A.-Daudet (Nîmes)","Démarche « pratique auto-référencée et auto-régulée », échelle de ressentis, test 10 RM, rôles athlète-coach-juge, règles de sécurité. Repris avec son accord."],
 ["Aline Paintendre, UFR STAPS Reims","Démarche d'enseignement autour des ressentis : contraster, séquencer, trouver des correspondances, construire une grille."],
 ["Brzycki (1993)","Estimation de la charge maximale : charge × 36 / (37 − répétitions), fiable jusqu'à 10 répétitions."],
 ["Référentiel national CCF, BO n° 9 du 26 février 2026","AFL1 sur 12 points, AFL2 + AFL3 sur 8 points (répartition 6/2, 4/4, 2/6 au choix de l'élève), un rôle AFL3 parmi deux."],
 ["Espace-musculation.com","Dessins des ateliers, repris de la fiche « Musculation : suivi du travail des élèves » de l'équipe EPS."],
 ["Équipe EPS, lycée G. Pompidou","Circuit de la séance 1 (fiche « Musculation : suivi du travail des élèves »), protocole CA5 réécrit pour 2026."]
];

/* ================== Calculs (communs aux deux applis) ================== */
const arrondi = (x, p) => Math.round(x / p) * p;
/* Charge maximale estimée (Brzycki), valable de 3 à 10 répétitions */
function brzycki(charge, reps){ if(!(charge > 0) || !(reps >= 3) || reps > 10) return null; return Math.round(charge * 36 / (37 - reps) * 2) / 2; }
/* Charges réalisables avec un support : liste triée */
function chargesPossibles(supId){
  const s = SUPPORTS[supId]; if(!s) return [];
  if(s.fixes) return s.fixes.slice();
  if(!s.disques) return [];
  const out = new Set();
  for(let cote = 0; cote <= 30; cote += 0.5) out.add(+(s.vide + 2 * cote).toFixed(1));
  return [...out].sort((a, b) => a - b);
}
/* Disques à mettre de CHAQUE côté pour un total donné (gourmand) */
function disquesCote(supId, total){
  const s = SUPPORTS[supId]; if(!s || !s.disques) return [];
  let r = +((total - s.vide) / 2).toFixed(2); const l = [];
  for(const d of DISQUES){ while(r >= d - 1e-9){ l.push(d); r = +(r - d).toFixed(2); } }
  return l;
}
/* La charge réalisable la plus proche de la cible, et sa composition en mots */
function chargeReelle(supId, cible){
  const p = chargesPossibles(supId); if(!p.length || !(cible > 0)) return null;
  let best = p[0]; for(const c of p) if(Math.abs(c - cible) < Math.abs(best - cible)) best = c;
  const s = SUPPORTS[supId], d = disquesCote(supId, best);
  const compo = s.fixes ? `haltère fixe de ${fmtKg(best)}` : (d.length ? `${s.nom.toLowerCase()} ${fmtKg(s.vide)} + ${d.map(fmtKg).join(' + ')} de chaque côté` : `${s.nom.toLowerCase()} à vide (${fmtKg(s.vide)})`);
  return {charge:best, compo, unite:s.unite};
}
function fmtKg(x){ return String(+(+x).toFixed(1)).replace('.', ',') + ' kg'; }
/* Pas de montée au test 10 RM : + 2 kg sur un haltère, + 4 kg sur une barre */
function pasMontee(supId){ const s = SUPPORTS[supId]; return s && s.fixes ? 1 : (s && s.vide <= 2 ? 2 : 4); }
/* Cohérence d'un ressenti avec le mobile : renvoie {ok, sens, msg} ; sens = +1 (trop facile), -1 (trop dur), 0 */
function coherence(mob, note, sensation){
  const m = MOBILES[mob]; if(!m || !note) return null;
  if(sensation === 'douleur') return {ok:false, sens:-1, stop:true, msg:"Douleur articulaire : arrête cet exercice et préviens le professeur."};
  const [lo, hi] = m.ressenti;
  if(note < lo) return {ok:false, sens:+1, msg:`Trop facile pour le mobile ${m.nom} (visé : ${lo} à ${hi}). La prochaine fois : ${m.ordreTxt.split(',')[0].toLowerCase()} en plus.`};
  if(note > hi) return {ok:false, sens:-1, msg:`Trop dur pour le mobile ${m.nom} (visé : ${lo} à ${hi}). Baisse la charge d'un cran.`};
  if(sensation && sensation !== m.sensation && sensation !== 'rien'){
    if(mob === 'puiss' && sensation === 'brulure') return {ok:false, sens:-1, msg:"La brûlure dit que la série est trop longue pour la Puissance : moins de répétitions, garde la vitesse."};
    if(mob === 'tonif' && sensation === 'brulure') return {ok:false, sens:-1, msg:"Brûlure forte : la charge est un peu lourde pour la Tonification."};
    if(mob === 'volume' && sensation === 'locale') return {ok:false, sens:+1, msg:"Pas encore de brûlure : rapproche-toi de l'échec (une série ou un cran de charge en plus)."};
    return {ok:false, sens:0, msg:`Note juste, mais la sensation attendue est : ${m.attendu}`};
  }
  if(sensation === 'rien') return {ok:false, sens:+1, msg:"Tu ne sens presque rien : augmente le travail."};
  return {ok:true, sens:0, msg:`Cohérent avec le mobile ${m.nom} : ${m.attendu}`};
}
/* Ajustement proposé pour la séance suivante, dans l'ordre de progression du mobile */
function ajuster(mob, p, sens){
  const m = MOBILES[mob]; const n = Object.assign({}, p); if(!m || !sens) return {p:n, txt:"On garde les mêmes paramètres."};
  if(sens > 0){
    for(const k of m.ordre){
      if(k === 'reps' && n.reps < m.reps[1]){ n.reps = Math.min(m.reps[1], n.reps + 2); return {p:n, txt:`+ 2 répétitions (${n.reps})`}; }
      if(k === 'series' && n.series < m.series[1]){ n.series++; return {p:n, txt:`+ 1 série (${n.series})`}; }
      if(k === 'charge' && n.pct < m.pct[1]){ n.pct = Math.min(m.pct[1], n.pct + 5); return {p:n, txt:`charge à ${n.pct} %`}; }
    }
    return {p:n, txt:"Tu es au maximum des paramètres du mobile : garde-les, soigne la qualité."};
  }
  if(n.pct > m.pct[0]){ n.pct = Math.max(m.pct[0], n.pct - 5); return {p:n, txt:`charge à ${n.pct} %`}; }
  if(n.reps > m.reps[0]){ n.reps = Math.max(m.reps[0], n.reps - 2); return {p:n, txt:`− 2 répétitions (${n.reps})`}; }
  return {p:n, txt:"Variante plus facile de l'exercice."};
}
/* Durée d'un exercice pour un binôme qui alterne (en min) */
function dureeExo(mob, series){ const m = MOBILES[mob]; if(!m) return 0; const cycle = Math.max(2 * m.tempsSerie, m.tempsSerie + m.recupS); return (series * cycle + 60) / 60; }
function dureeProjet(mob, exos){ return Math.round(exos.reduce((a, e) => a + dureeExo(mob, e.series || 3), 0)); }

/* ================== v2.1 · Analyse après chaque exercice (S4 à S9) ==================
   Deux moments, pour le téléphone :
   · pendant les séries, le coach regarde UN point clé, coche les signes, compte les répétitions propres (exercice clé) ;
   · à la fin de l'exercice, l'élève écrit : ressenti (curseur), répétitions en réserve, la prochaine fois je… (+ pourquoi).
   Coach : niveau 1 je constate (S4-S5), niveau 2 je compte (S6), niveau 3 je fixe un objectif (S7-S9) ;
   comptage et objectif seulement sur l'exercice clé de la séance (le premier par défaut). Un seul rôle AFL3 : coach. */
const POINT_CLE = {dc:"Fesses collées au banc, barre sur la poitrine", dch:"Coudes à 45°, ni collés ni écartés", rowh:"Dos plat, le coude monte le long du corps",
 rowb:"Dos plat, barre tirée vers le nombril", tirage:"Coudes pas plus haut que les épaules, poignets droits", dm:"Dos collé au dossier, pas de cambrure",
 curlb:"Coudes fixes, pas d'élan du buste", extri:"Coudes fixes, pointés vers le plafond", fentes:"Genou avant au-dessus de la cheville, buste droit",
 pullover:"Bras presque tendus, bas du dos plaqué", oiseau:"Dos plat, les bras montent sur le côté", squath:"Dos droit, genoux dans l'axe des pieds",
 sdtj:"Dos plat, la barre frôle les cuisses", sbox:"Réception silencieuse sur les deux pieds, genoux dans l'axe", hip:"Bassin aligné en haut, haltère calé sur la mousse"};
/* répétitions en réserve (RIR) : « Combien aurais-tu pu en faire encore, propres ? » */
const RIR_Q = [["0","0"],["12","1 ou 2"],["34","3 ou 4"],["5","5 et +"]];
const RIR_CIBLE = {tonif:[2,2], volume:[1,1], puiss:[2,3]};   // index dans RIR_Q
const NEXT_Q = [["garde","Je garde",0],["serie","+ 1 série",1],["reps","+ des répétitions",1],["chargeP","+ de charge",1],["chargeM","− de charge",-1],["posture","Je corrige ma posture",0]];
const NIV_COACH_M = {S4:1, S5:1, S6:2, S7:3, S8:3, S9:3};
const OBJ_M = [["charge","Charge (kg)"],["reps","Répétitions"],["series","Séries"]];
/* sens de la régulation : +1 trop facile, −1 trop dur, 0 juste. Douleur et vitesse d'abord, puis la réserve, sinon le ressenti. */
function sensSuite(mob, x){
  const c = x.coh;if(c && c.stop)return -1;if(mob === 'puiss' && x.vit)return -1;
  const i = RIR_Q.findIndex(q => q[0] === x.rir);if(i < 0 || !RIR_CIBLE[mob])return c ? c.sens : null;
  const [lo, hi] = RIR_CIBLE[mob];return i < lo ? -1 : i > hi ? 1 : 0;
}
function msgReserve(mob, rir){const i = RIR_Q.findIndex(q => q[0] === rir), t = RIR_CIBLE[mob];if(i < 0 || !t)return '';
  const vise = t[0] === t[1] ? RIR_Q[t[0]][1] : RIR_Q[t[0]][1] + ' à ' + RIR_Q[t[1]][1];
  return i < t[0] ? `Trop près de l'échec pour le mobile ${MOBILES[mob].nom} (visé : ${vise} en réserve).` : i > t[1] ? `Trop loin de l'échec pour le mobile ${MOBILES[mob].nom} (visé : ${vise} en réserve).` : `Réserve juste pour le mobile ${MOBILES[mob].nom}.`}
/* le choix de l'élève va-t-il dans le sens attendu ? */
function choixCoherent(sens, c){const q = NEXT_Q.find(x => x[0] === c);if(!q || sens == null)return null;
  if(c === 'posture')return true;if(sens > 0)return q[2] > 0;if(sens < 0)return q[2] < 0;return q[2] === 0}
/* conseils proposés au coach, les plus utiles d'abord */
function conseilsPour(ex){
  const av = ex.avis || {}, L = [];
  if(av.cle === '0' || (av.signes || []).length)L.push("Corrige d'abord la posture", "Ralentis la descente");
  if(ex.rir === '0')L.push("Baisse la charge");if(ex.rir === '5')L.push("Tu peux monter la charge");if(ex.vit)L.push("Plus vite à la montée");
  return [...new Set(L.concat(CONSEILS))].slice(0, 5);
}
/* objectif du coach tenu ? obj = {k, v} ; real = réalisé de la séance suivante */
function objTenuM(obj, real){if(!obj || !obj.k || obj.v == null || obj.v === '' || !real)return null;const v = +obj.v, r = obj.k === 'charge' ? +real.charge : obj.k === 'reps' ? +real.reps : +real.series;
  if(!isFinite(r))return null;return obj.k === 'charge' ? Math.abs(r - v) <= 0.5 || r >= v : r >= v}

/* ================== Schémas de l'écran de cours (HTML) ================== */
const escM = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* v3.2 : affiches des mobiles (images d'Y. Dartois, générées par IA) */
const MOB_IMG = {tonif:'img/mobiles/tonif.jpg', volume:'img/mobiles/volume.jpg', puiss:'img/mobiles/puiss.jpg'};
function mobileHTML(k){
  const m = MOBILES[k]; if(!m) return '';
  const l = [["% de la charge max", `${m.pct[0]}-${m.pct[1]} %`],["Séries", `${m.series[0]}-${m.series[1]}`],["Répétitions", `${m.reps[0]}-${m.reps[1]}`],["Récupération", m.recup],["Exécution", m.exec],["Ressenti visé", `${m.ressenti[0]} à ${m.ressenti[1]} sur 10`],["Sensation attendue", m.attendu],["Progression", m.ordreTxt]];
  return `<div class="mob" style="--mc:${m.coul};--mg:${m.deg || m.coul}"><div class="mob-tete"><img src="${MOB_IMG[k]}" alt="Affiche du mobile ${escM(m.nom)}" loading="lazy"><div><h3>${escM(m.nom)}</h3><small>${escM(m.theme)}</small><p>${escM(m.pct[0])}-${escM(m.pct[1])} % · ${escM(m.reps[0])}-${escM(m.reps[1])} rép. · récup ${escM(m.recup)}</p></div></div><table>${l.map(([a, b]) => `<tr><th>${escM(a)}</th><td>${escM(b)}</td></tr>`).join('')}</table><p class="cap">${escM(m.forme)}</p></div>`;
}
function echelleHTML(){ return `<div class="ech">${ECHELLE.map(([n, t, d, c]) => `<div style="background:${c}"><b>${n}</b><span><b>${escM(t)}</b> ${escM(d)}</span></div>`).join('')}</div>`; }
function ateliersHTML(ids){ return `<ul class="ats">${ids.map(id => { const a = atelier(id); const im = imgAtelier(id);return a ? `<li>${im ? `<img class="vign" src="${im}" alt="" loading="lazy">` : ''}<b>${a.n ? a.n + '. ' : ''}${escM(a.nom)}</b> <span>${escM(a.groupe)} · ${escM(SUPPORTS[a.support].nom)}${a.places ? ` · ${a.places} binômes max` : ''}</span></li>` : ''; }).join('')}</ul>`; }
function schema(spec){
  if(!spec) return '';
  if(spec.includes('+')) return spec.split('+').map(schema).join('');
  if(spec === 'echelle') return echelleHTML();
  if(spec === 'regles') return `<ul class="ats">${SECU.regles.map(r => `<li>${escM(r)}</li>`).join('')}</ul>`;
  if(spec === 'test') return `<ol class="ats"><li>Charge de départ légère</li><li>10 valides → on monte, 2 min de récup</li><li>Moins de 10 → fin du test</li><li>5 séries d'essai au maximum</li><li>Charge max = charge × 36 / (37 − rép.)</li></ol>`;
  if(spec === 'eval') return `<table class="evt">${EVAL.afl1.map(([t, p, c]) => `<tr><th>${escM(t)} <small>${p} pts</small></th><td>${c.map(escM).join(' · ')}</td></tr>`).join('')}<tr><th>AFL2 + AFL3 <small>8 pts</small></th><td>${EVAL.repartitions.map(r => r[1]).join(' ; ')}</td></tr></table>`;
  if(spec.startsWith('mobile:')){ const k = spec.slice(7); return k === 'projet' ? MOBILES_ORDRE.map(mobileHTML).join('') : mobileHTML(k); }
  if(spec.startsWith('circuit:')){ const h = spec.slice(8) === '1' ? CIRCUIT_S1.slice(0, 7) : CIRCUIT_S1.slice(7); return ateliersHTML(h); }
  if(spec.startsWith('ateliers:')) return ateliersHTML(spec.slice(9).split(','));
  return '';
}
if(typeof module !== 'undefined') module.exports = {SUPPORTS, ATELIERS, MOBILES, SEANCES, ECHELLE, RIR_Q, NEXT_Q, POINT_CLE, sensSuite, choixCoherent, objTenuM, brzycki, chargeReelle, disquesCote, coherence, ajuster, dureeProjet, pasMontee, EVAL, CIRCUIT_S1, ATELIERS_TEST};
