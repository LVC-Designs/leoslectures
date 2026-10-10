// Rule-based Italian conjugator with an irregular-verb dictionary.
// conjugate(spec) → { inf, n, unit, aux, group, reflexive, irregular, tenses: { key: {label, group, persons, forms} } }
// Compound tenses with essere produce {m, f} variants (participle agreement); the UI renders them for the chosen protagonist.

export const PERSONS = ['io', 'tu', 'lui / lei', 'noi', 'voi', 'loro'];
const REFL = ['mi', 'ti', 'si', 'ci', 'vi', 'si'];

// Irregular dictionary. Fields:
//   pres [6], fut (future/conditional stem), imperf [6], pp (participle), pr [6] | prStem (1-3-6 pattern),
//   subj [6], subjImp [6], ger, imp {tu, voi}, base + conj (stem + conjugation class for infinitive-based tenses), aux
export const IRREGULARS = {
  essere: { aux: 'essere', pres: ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'], fut: 'sar', imperf: ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'], pp: 'stato', pr: ['fui', 'fosti', 'fu', 'fummo', 'foste', 'furono'], subj: ['sia', 'sia', 'sia', 'siamo', 'siate', 'siano'], subjImp: ['fossi', 'fossi', 'fosse', 'fossimo', 'foste', 'fossero'], ger: 'essendo', imp: { tu: 'sii', voi: 'siate' } },
  avere: { pres: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'], fut: 'avr', pp: 'avuto', prStem: 'ebb', subj: ['abbia', 'abbia', 'abbia', 'abbiamo', 'abbiate', 'abbiano'], imp: { tu: 'abbi', voi: 'abbiate' } },
  andare: { aux: 'essere', pres: ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'], fut: 'andr', imp: { tu: "va' / vai" } },
  venire: { aux: 'essere', pres: ['vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono'], fut: 'verr', pp: 'venuto', prStem: 'venn' },
  fare: { base: 'fac', conj: 'ere', pres: ['faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno'], fut: 'far', pp: 'fatto', prStem: 'fec', subj: ['faccia', 'faccia', 'faccia', 'facciamo', 'facciate', 'facciano'], imp: { tu: "fa' / fai" } },
  dare: { pres: ['do', 'dai', 'dà', 'diamo', 'date', 'danno'], fut: 'dar', pr: ['diedi', 'desti', 'diede', 'demmo', 'deste', 'diedero'], subj: ['dia', 'dia', 'dia', 'diamo', 'diate', 'diano'], subjImp: ['dessi', 'dessi', 'desse', 'dessimo', 'deste', 'dessero'], imp: { tu: "da' / dai" } },
  dire: { base: 'dic', conj: 'ere', pres: ['dico', 'dici', 'dice', 'diciamo', 'dite', 'dicono'], fut: 'dir', pp: 'detto', prStem: 'diss', imp: { tu: "di'" } },
  stare: { aux: 'essere', pres: ['sto', 'stai', 'sta', 'stiamo', 'state', 'stanno'], fut: 'star', pr: ['stetti', 'stesti', 'stette', 'stemmo', 'steste', 'stettero'], subj: ['stia', 'stia', 'stia', 'stiamo', 'stiate', 'stiano'], subjImp: ['stessi', 'stessi', 'stesse', 'stessimo', 'steste', 'stessero'], imp: { tu: "sta' / stai" } },
  bere: { base: 'bev', conj: 'ere', pres: ['bevo', 'bevi', 'beve', 'beviamo', 'bevete', 'bevono'], fut: 'berr', pp: 'bevuto', prStem: 'bevv' },
  uscire: { aux: 'essere', pres: ['esco', 'esci', 'esce', 'usciamo', 'uscite', 'escono'] },
  sapere: { pres: ['so', 'sai', 'sa', 'sappiamo', 'sapete', 'sanno'], fut: 'sapr', prStem: 'sepp', subj: ['sappia', 'sappia', 'sappia', 'sappiamo', 'sappiate', 'sappiano'], imp: { tu: 'sappi', voi: 'sappiate' } },
  conoscere: { pp: 'conosciuto', prStem: 'conobb' },
  dovere: { pres: ['devo', 'devi', 'deve', 'dobbiamo', 'dovete', 'devono'], fut: 'dovr', subj: ['debba', 'debba', 'debba', 'dobbiamo', 'dobbiate', 'debbano'] },
  potere: { pres: ['posso', 'puoi', 'può', 'possiamo', 'potete', 'possono'], fut: 'potr' },
  volere: { pres: ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono'], fut: 'vorr', prStem: 'voll' },
  rimanere: { aux: 'essere', pres: ['rimango', 'rimani', 'rimane', 'rimaniamo', 'rimanete', 'rimangono'], fut: 'rimarr', pp: 'rimasto', prStem: 'rimas' },
  tenere: { pres: ['tengo', 'tieni', 'tiene', 'teniamo', 'tenete', 'tengono'], fut: 'terr', prStem: 'tenn' },
  scegliere: { pres: ['scelgo', 'scegli', 'sceglie', 'scegliamo', 'scegliete', 'scelgono'], pp: 'scelto', prStem: 'scels' },
  porre: { base: 'pon', conj: 'ere', pres: ['pongo', 'poni', 'pone', 'poniamo', 'ponete', 'pongono'], fut: 'porr', pp: 'posto', prStem: 'pos' },
  tradurre: { base: 'traduc', conj: 'ere', pres: ['traduco', 'traduci', 'traduce', 'traduciamo', 'traducete', 'traducono'], fut: 'tradurr', pp: 'tradotto', prStem: 'traduss' },
  produrre: { base: 'produc', conj: 'ere', pres: ['produco', 'produci', 'produce', 'produciamo', 'producete', 'producono'], fut: 'produrr', pp: 'prodotto', prStem: 'produss' },
  piacere: { aux: 'essere', pres: ['piaccio', 'piaci', 'piace', 'piacciamo', 'piacete', 'piacciono'], pp: 'piaciuto', prStem: 'piacqu' },
  morire: { aux: 'essere', pres: ['muoio', 'muori', 'muore', 'moriamo', 'morite', 'muoiono'], fut: 'morir', pp: 'morto' },
  nascere: { aux: 'essere', pp: 'nato', prStem: 'nacqu' },
  vivere: { fut: 'vivr', pp: 'vissuto', prStem: 'viss' },
  vedere: { fut: 'vedr', pp: 'visto', prStem: 'vid' },
  mettere: { pp: 'messo', prStem: 'mis' },
  prendere: { pp: 'preso', prStem: 'pres' },
  leggere: { pp: 'letto', prStem: 'less' },
  scrivere: { pp: 'scritto', prStem: 'scriss' },
  aprire: { pp: 'aperto' },
  offrire: { pp: 'offerto' },
  soffrire: { pp: 'sofferto' },
  scoprire: { pp: 'scoperto' },
  chiudere: { pp: 'chiuso', prStem: 'chius' },
  decidere: { pp: 'deciso', prStem: 'decis' },
  chiedere: { pp: 'chiesto', prStem: 'chies' },
  rispondere: { pp: 'risposto', prStem: 'rispos' },
  perdere: { pp: 'perso', prStem: 'pers' },
  correre: { aux: 'both', pp: 'corso', prStem: 'cors' },
  salire: { aux: 'both', pres: ['salgo', 'sali', 'sale', 'saliamo', 'salite', 'salgono'] },
  scendere: { aux: 'both', pp: 'sceso', prStem: 'sces' },
  spendere: { pp: 'speso', prStem: 'spes' },
  accendere: { pp: 'acceso', prStem: 'acces' },
  succedere: { aux: 'essere', pp: 'successo', prStem: 'success' },
  discutere: { pp: 'discusso', prStem: 'discuss' },
  ridere: { pp: 'riso', prStem: 'ris' },
  piangere: { pp: 'pianto', prStem: 'pians' },
  nascondere: { pp: 'nascosto', prStem: 'nascos' },
  crescere: { aux: 'essere', pp: 'cresciuto', prStem: 'crebb' },
  rompere: { pp: 'rotto', prStem: 'rupp' },
  muovere: { pp: 'mosso', prStem: 'moss' },
  cadere: { aux: 'essere', fut: 'cadr', prStem: 'cadd' },
  vincere: { pp: 'vinto', prStem: 'vins' },
  convincere: { pp: 'convinto', prStem: 'convins' },
  dipingere: { pp: 'dipinto', prStem: 'dipins' },
  spingere: { pp: 'spinto', prStem: 'spins' },
  giungere: { aux: 'essere', pp: 'giunto', prStem: 'giuns' },
  raggiungere: { pp: 'raggiunto', prStem: 'raggiuns' },
  stringere: { pp: 'stretto', prStem: 'strins' },
  risolvere: { pp: 'risolto', prStem: 'risols' },
  dirigere: { pp: 'diretto', prStem: 'diress' },
  proteggere: { pp: 'protetto', prStem: 'protess' },
  cuocere: { pres: ['cuocio', 'cuoci', 'cuoce', 'cuociamo', 'cuocete', 'cuociono'], pp: 'cotto', prStem: 'coss' },
  togliere: { pres: ['tolgo', 'togli', 'toglie', 'togliamo', 'togliete', 'tolgono'], pp: 'tolto', prStem: 'tols' },
  cogliere: { pres: ['colgo', 'cogli', 'coglie', 'cogliamo', 'cogliete', 'colgono'], pp: 'colto', prStem: 'cols' },
  spegnere: { pres: ['spengo', 'spegni', 'spegne', 'spegniamo', 'spegnete', 'spengono'], pp: 'spento', prStem: 'spens' },
  valere: { aux: 'essere', pres: ['valgo', 'vali', 'vale', 'valiamo', 'valete', 'valgono'], fut: 'varr', pp: 'valso', prStem: 'vals' },
  sedere: { pres: ['siedo', 'siedi', 'siede', 'sediamo', 'sedete', 'siedono'] },
  parere: { aux: 'essere', pres: ['paio', 'pari', 'pare', 'paiamo', 'parete', 'paiono'], fut: 'parr', pp: 'parso', prStem: 'parv' },
  esistere: { aux: 'essere', pp: 'esistito' },
  esprimere: { pp: 'espresso', prStem: 'espress' },
  permettere: { pp: 'permesso', prStem: 'permis' },
  promettere: { pp: 'promesso', prStem: 'promis' },
  smettere: { pp: 'smesso', prStem: 'smis' },
  ammettere: { pp: 'ammesso', prStem: 'ammis' },
  riprendere: { pp: 'ripreso', prStem: 'ripres' },
  sorprendere: { pp: 'sorpreso', prStem: 'sorpres' },
  comprendere: { pp: 'compreso', prStem: 'compres' },
  iscrivere: { pp: 'iscritto', prStem: 'iscriss' },
  descrivere: { pp: 'descritto', prStem: 'descriss' },
  trascorrere: { aux: 'both', pp: 'trascorso', prStem: 'trascors' },
  rivedere: { fut: 'rivedr', pp: 'rivisto', prStem: 'rivid' },
  ottenere: { pres: ['ottengo', 'ottieni', 'ottiene', 'otteniamo', 'ottenete', 'ottengono'], fut: 'otterr', prStem: 'ottenn' },
  appartenere: { pres: ['appartengo', 'appartieni', 'appartiene', 'apparteniamo', 'appartenete', 'appartengono'], fut: 'apparterr', prStem: 'appartenn' },
  divenire: { aux: 'essere', pres: ['divengo', 'divieni', 'diviene', 'diveniamo', 'divenite', 'divengono'], fut: 'diverr', pp: 'divenuto', prStem: 'divenn' },
  intervenire: { aux: 'essere', pres: ['intervengo', 'intervieni', 'interviene', 'interveniamo', 'intervenite', 'intervengono'], fut: 'interverr', pp: 'intervenuto', prStem: 'intervenn' },
  rifare: { base: 'rifac', conj: 'ere', pres: ['rifaccio', 'rifai', 'rifà', 'rifacciamo', 'rifate', 'rifanno'], fut: 'rifar', pp: 'rifatto', prStem: 'rifec', subj: ['rifaccia', 'rifaccia', 'rifaccia', 'rifacciamo', 'rifacciate', 'rifacciano'] },
  soddisfare: { base: 'soddisfac', conj: 'ere', pres: ['soddisfo', 'soddisfi', 'soddisfa', 'soddisfiamo', 'soddisfate', 'soddisfano'], fut: 'soddisfar', pp: 'soddisfatto', prStem: 'soddisfec' },
  udire: { pres: ['odo', 'odi', 'ode', 'udiamo', 'udite', 'odono'] },
  apparire: { aux: 'essere', pres: ['appaio', 'appari', 'appare', 'appariamo', 'apparite', 'appaiono'], pp: 'apparso', prStem: 'apparv' },
  distinguere: { pp: 'distinto', prStem: 'distins' },
  assumere: { pp: 'assunto', prStem: 'assuns' },
  concludere: { pp: 'concluso', prStem: 'conclus' },
  condividere: { pp: 'condiviso', prStem: 'condivis' },
  dividere: { pp: 'diviso', prStem: 'divis' },
  uccidere: { pp: 'ucciso', prStem: 'uccis' },
  difendere: { pp: 'difeso', prStem: 'difes' },
  offendere: { pp: 'offeso', prStem: 'offes' },
  attendere: { pp: 'atteso', prStem: 'attes' },
  stendere: { pp: 'steso', prStem: 'stes' },
  tendere: { pp: 'teso', prStem: 'tes' },
  scuotere: { pp: 'scosso', prStem: 'scoss' },
  percuotere: { pp: 'percosso', prStem: 'percoss' },
  volgere: { pp: 'volto', prStem: 'vols' },
  rivolgere: { pp: 'rivolto', prStem: 'rivols' },
  sorgere: { aux: 'essere', pp: 'sorto', prStem: 'sors' },
  porgere: { pp: 'porto', prStem: 'pors' },
  accorgersi: { aux: 'essere', pp: 'accorto', prStem: 'accors' },
  fingere: { pp: 'finto', prStem: 'fins' },
  tingere: { pp: 'tinto', prStem: 'tins' },
  piovere: { aux: 'both', prStem: 'piovv' },
  compiere: { pres: ['compio', 'compi', 'compie', 'compiamo', 'compite', 'compiono'], pp: 'compiuto' },
  venire_meno: null,
};
delete IRREGULARS.venire_meno;

// -iare verbs that keep the double i in tu (stressed i)
const STRESSED_I = new Set(['sciare', 'inviare', 'spiare', 'avviare', 'rinviare', 'obliare']);

const E = {
  pres: { are: ['o', 'i', 'a', 'iamo', 'ate', 'ano'], ere: ['o', 'i', 'e', 'iamo', 'ete', 'ono'], ire: ['o', 'i', 'e', 'iamo', 'ite', 'ono'], isc: ['isco', 'isci', 'isce', 'iamo', 'ite', 'iscono'] },
  imperf: { are: ['avo', 'avi', 'ava', 'avamo', 'avate', 'avano'], ere: ['evo', 'evi', 'eva', 'evamo', 'evate', 'evano'], ire: ['ivo', 'ivi', 'iva', 'ivamo', 'ivate', 'ivano'] },
  fut: ['ò', 'ai', 'à', 'emo', 'ete', 'anno'],
  cond: ['ei', 'esti', 'ebbe', 'emmo', 'este', 'ebbero'],
  pr: { are: ['ai', 'asti', 'ò', 'ammo', 'aste', 'arono'], ere: ['ei', 'esti', 'é', 'emmo', 'este', 'erono'], ire: ['ii', 'isti', 'ì', 'immo', 'iste', 'irono'] },
  subj: { are: ['i', 'i', 'i', 'iamo', 'iate', 'ino'], ere: ['a', 'a', 'a', 'iamo', 'iate', 'ano'], ire: ['a', 'a', 'a', 'iamo', 'iate', 'ano'], isc: ['isca', 'isca', 'isca', 'iamo', 'iate', 'iscano'] },
  subjImp: { are: ['assi', 'assi', 'asse', 'assimo', 'aste', 'assero'], ere: ['essi', 'essi', 'esse', 'essimo', 'este', 'essero'], ire: ['issi', 'issi', 'isse', 'issimo', 'iste', 'issero'] },
};

function join(stem, ending, inf) {
  // spelling adjustments for -care/-gare (add h before e/i) and -ciare/-giare/-sciare/-iare (drop i before i/e)
  if (/^[ei]/.test(ending)) {
    if (/[cg]are$/.test(inf) && /[cg]$/.test(stem)) return stem + 'h' + ending;
    if (/[cg]iare$|sciare$/.test(inf) && !STRESSED_I.has(inf) && /i$/.test(stem)) return stem.slice(0, -1) + ending;
    if (/iare$/.test(inf) && !STRESSED_I.has(inf) && /i$/.test(stem) && /^i/.test(ending)) return stem.slice(0, -1) + ending;
  }
  return stem + ending;
}

export const TENSES = [
  ['presente', 'Presente', 'indicativo'], ['passato_prossimo', 'Passato prossimo', 'indicativo'], ['imperfetto', 'Imperfetto', 'indicativo'], ['trapassato_prossimo', 'Trapassato prossimo', 'indicativo'],
  ['futuro', 'Futuro semplice', 'indicativo'], ['futuro_anteriore', 'Futuro anteriore', 'indicativo'], ['passato_remoto', 'Passato remoto', 'indicativo'],
  ['condizionale', 'Condizionale presente', 'condizionale'], ['condizionale_passato', 'Condizionale passato', 'condizionale'],
  ['imperativo', 'Imperativo', 'imperativo'],
  ['congiuntivo_presente', 'Congiuntivo presente', 'congiuntivo'], ['congiuntivo_passato', 'Congiuntivo passato', 'congiuntivo'], ['congiuntivo_imperfetto', 'Congiuntivo imperfetto', 'congiuntivo'], ['congiuntivo_trapassato', 'Congiuntivo trapassato', 'congiuntivo'],
  ['forme', 'Infinito · gerundio · participio', 'forme'],
];

export function conjugate(spec, { noCompound = false } = {}) {
  const infFull = spec.inf;
  const reflexive = /rsi$/.test(infFull);
  const inf = reflexive ? infFull.replace(/rsi$/, 're') : infFull;
  const irr = IRREGULARS[infFull] || IRREGULARS[inf] || {};
  const group = inf.endsWith('are') ? 'are' : inf.endsWith('ire') ? 'ire' : 'ere';
  const stem = inf.slice(0, -3);
  const base = irr.base || stem;
  const bconj = irr.conj || group;
  const isc = !!spec.isc;
  const aux = reflexive ? 'essere' : (spec.aux || irr.aux || 'avere');
  const auxVerb = aux === 'essere' ? 'essere' : 'avere';

  const pres = irr.pres || E.pres[isc ? 'isc' : group].map(e => join(stem, e, inf));
  const imperf = irr.imperf || E.imperf[bconj].map(e => base + e);
  const futStem = irr.fut || (group === 'are' ? join(stem, 'er', inf) : group === 'ere' ? stem + 'er' : stem + 'ir');
  const fut = E.fut.map(e => futStem + e);
  const cond = E.cond.map(e => futStem + e);
  const pp = irr.pp || base + (bconj === 'are' ? 'ato' : bconj === 'ere' ? 'uto' : 'ito');
  const ger = irr.ger || base + (bconj === 'are' ? 'ando' : 'endo');
  let pr;
  if (irr.pr) pr = irr.pr;
  else { const reg = E.pr[bconj].map(e => base + e); pr = irr.prStem ? [irr.prStem + 'i', reg[1], irr.prStem + 'e', reg[3], reg[4], irr.prStem + 'ero'] : reg; }
  let subj;
  if (irr.subj) subj = irr.subj;
  else if (irr.pres) { const s = pres[0].replace(/o$/, ''); subj = [s + 'a', s + 'a', s + 'a', pres[3], pres[3].replace(/iamo$/, 'iate'), s + 'ano']; }
  else subj = E.subj[isc ? 'isc' : group].map(e => join(stem, e, inf));
  const subjImp = irr.subjImp || E.subjImp[bconj].map(e => base + e);
  // imperative: tu, Lei, noi, voi, Loro, tu negative
  const impTu = irr.imp?.tu || (group === 'are' ? pres[2] : pres[1]);
  const impVoi = irr.imp?.voi || pres[4];
  const imp = [impTu, subj[2], pres[3], impVoi, subj[5]];

  const R = (forms) => reflexive ? forms.map((f, i) => `${REFL[i]} ${f}`) : forms;
  const auxC = noCompound ? null : conjugateAux(auxVerb);
  const agree = aux === 'essere';
  const ppForm = (i) => {
    if (!agree) return pp;
    const plural = i >= 3;
    const m = plural ? pp.replace(/o$/, 'i') : pp, f = plural ? pp.replace(/o$/, 'e') : pp.replace(/o$/, 'a');
    return { m, f };
  };
  const compound = (auxForms) => auxForms.map((a, i) => {
    const p = ppForm(i);
    const pre = reflexive ? `${REFL[i]} ` : '';
    return typeof p === 'string' ? `${pre}${a} ${p}` : { m: `${pre}${a} ${p.m}`, f: `${pre}${a} ${p.f}` };
  });
  const impRefl = reflexive ? [
    `${impTu.split(' / ')[0]}ti`, `si ${subj[2]}`, `${pres[3]}ci`, `${impVoi}vi`, `si ${subj[5]}`,
  ] : imp;
  const negTu = reflexive ? `non ${infFull.replace(/rsi$/, 'rti')}` : `non ${inf}`;

  const tenses = {};
  const put = (key, forms, persons = PERSONS) => { const [, label, grp] = TENSES.find(t => t[0] === key); tenses[key] = { label, group: grp, persons, forms }; };
  put('presente', R(pres));
  if (!noCompound) put('passato_prossimo', compound(auxC.presente));
  put('imperfetto', R(imperf));
  if (!noCompound) put('trapassato_prossimo', compound(auxC.imperfetto));
  put('futuro', R(fut));
  if (!noCompound) put('futuro_anteriore', compound(auxC.futuro));
  put('passato_remoto', R(pr));
  put('condizionale', R(cond));
  if (!noCompound) put('condizionale_passato', compound(auxC.condizionale));
  put('imperativo', [...impRefl, negTu], ['tu', 'Lei', 'noi', 'voi', 'Loro', 'tu (negativo)']);
  put('congiuntivo_presente', R(subj).map(f => `che ${f}`));
  if (!noCompound) put('congiuntivo_passato', compound(auxC.congiuntivo_presente).map(f => typeof f === 'string' ? `che ${f}` : { m: `che ${f.m}`, f: `che ${f.f}` }));
  put('congiuntivo_imperfetto', R(subjImp).map(f => `che ${f}`));
  if (!noCompound) put('congiuntivo_trapassato', compound(auxC.congiuntivo_imperfetto).map(f => typeof f === 'string' ? `che ${f}` : { m: `che ${f.m}`, f: `che ${f.f}` }));
  put('forme', [infFull, reflexive ? ger + 'si' : ger, pp], ['infinito', 'gerundio', 'participio passato']);

  return { inf: infFull, n: spec.n, unit: spec.unit, aux, group, reflexive, isc, irregular: Object.keys(irr).length > 0, tenses };
}

const auxCache = {};
function conjugateAux(v) {
  if (!auxCache[v]) {
    const c = conjugate({ inf: v }, { noCompound: true });
    auxCache[v] = { presente: c.tenses.presente.forms, imperfetto: c.tenses.imperfetto.forms, futuro: c.tenses.futuro.forms, condizionale: c.tenses.condizionale.forms, congiuntivo_presente: c.tenses.congiuntivo_presente.forms.map(f => f.replace(/^che /, '')), congiuntivo_imperfetto: c.tenses.congiuntivo_imperfetto.forms.map(f => f.replace(/^che /, '')) };
  }
  return auxCache[v];
}

export function conjugateAll(list) {
  const map = new Map();
  for (const spec of list) map.set(spec.inf, conjugate(spec));
  return map;
}
