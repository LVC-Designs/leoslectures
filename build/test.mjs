// Unit tests for the pure modules: conjugators, grading, variants. Run: npm test
import assert from 'node:assert/strict';
import { conjugate as it } from '../src/js/conj-it.js';
import { conjugate as en, ing, ed, third } from '../src/js/conj-en.js';
import { glossForms, parseGloss } from '../src/js/conj-gloss.js';
import { compare, compareVariant, normalize } from '../src/js/grade.js';
import { resolve, flatten, diffWords } from '../src/js/variants.js';

let n = 0;
const T = (name, fn) => { try { fn(); n++; } catch (e) { console.error('FAIL', name, '\n ', e.message); process.exitCode = 1; } };
const F = (v, tense) => v.tenses[tense].forms;

T('essere presente', () => assert.deepEqual(F(it({ inf: 'essere' }), 'presente'), ['sono', 'sei', 'è', 'siamo', 'siete', 'sono']));
T('essere passato prossimo agrees', () => assert.deepEqual(F(it({ inf: 'essere' }), 'passato_prossimo')[0], { m: 'sono stato', f: 'sono stata' }));
T('avere futuro', () => assert.deepEqual(F(it({ inf: 'avere' }), 'futuro'), ['avrò', 'avrai', 'avrà', 'avremo', 'avrete', 'avranno']));
T('parlare presente', () => assert.deepEqual(F(it({ inf: 'parlare' }), 'presente'), ['parlo', 'parli', 'parla', 'parliamo', 'parlate', 'parlano']));
T('cercare spelling', () => { const v = it({ inf: 'cercare' }); assert.deepEqual(F(v, 'presente'), ['cerco', 'cerchi', 'cerca', 'cerchiamo', 'cercate', 'cercano']); assert.equal(F(v, 'futuro')[0], 'cercherò'); assert.equal(F(v, 'congiuntivo_presente')[0], 'che cerchi'); });
T('cominciare spelling', () => { const v = it({ inf: 'cominciare' }); assert.deepEqual(F(v, 'presente'), ['comincio', 'cominci', 'comincia', 'cominciamo', 'cominciate', 'cominciano']); assert.equal(F(v, 'futuro')[2], 'comincerà'); });
T('studiare tu', () => assert.equal(F(it({ inf: 'studiare' }), 'presente')[1], 'studi'));
T('sciare tu keeps ii', () => assert.equal(F(it({ inf: 'sciare' }), 'presente')[1], 'scii'));
T('finire isc', () => assert.deepEqual(F(it({ inf: 'finire', isc: true }), 'presente'), ['finisco', 'finisci', 'finisce', 'finiamo', 'finite', 'finiscono']));
T('finire congiuntivo', () => assert.equal(F(it({ inf: 'finire', isc: true }), 'congiuntivo_presente')[5], 'che finiscano'));
T('dormire regular -ire', () => assert.deepEqual(F(it({ inf: 'dormire' }), 'presente'), ['dormo', 'dormi', 'dorme', 'dormiamo', 'dormite', 'dormono']));
T('fare imperfetto / pr / ger', () => { const v = it({ inf: 'fare' }); assert.equal(F(v, 'imperfetto')[0], 'facevo'); assert.deepEqual(F(v, 'passato_remoto'), ['feci', 'facesti', 'fece', 'facemmo', 'faceste', 'fecero']); assert.equal(F(v, 'forme')[1], 'facendo'); assert.equal(F(v, 'congiuntivo_imperfetto')[0], 'che facessi'); });
T('andare subj derived', () => assert.deepEqual(F(it({ inf: 'andare' }), 'congiuntivo_presente'), ['che vada', 'che vada', 'che vada', 'che andiamo', 'che andiate', 'che vadano']));
T('andare passato prossimo', () => assert.deepEqual(F(it({ inf: 'andare' }), 'passato_prossimo')[3], { m: 'siamo andati', f: 'siamo andate' }));
T('dovere subj', () => assert.equal(F(it({ inf: 'dovere' }), 'congiuntivo_presente')[0], 'che debba'));
T('alzarsi reflexive', () => { const v = it({ inf: 'alzarsi' }); assert.equal(F(v, 'presente')[0], 'mi alzo'); assert.deepEqual(F(v, 'passato_prossimo')[0], { m: 'mi sono alzato', f: 'mi sono alzata' }); assert.deepEqual(F(v, 'imperativo'), ['alzati', 'si alzi', 'alziamoci', 'alzatevi', 'si alzino', 'non alzarti']); assert.equal(F(v, 'forme')[1], 'alzandosi'); });
T('venire condizionale', () => assert.equal(F(it({ inf: 'venire' }), 'condizionale')[0], 'verrei'));
T('tradurre', () => { const v = it({ inf: 'tradurre' }); assert.equal(F(v, 'imperfetto')[0], 'traducevo'); assert.equal(F(v, 'futuro')[0], 'tradurrò'); assert.equal(F(v, 'forme')[2], 'tradotto'); });
T('imperativo essere', () => assert.deepEqual(F(it({ inf: 'essere' }), 'imperativo'), ['sii', 'sia', 'siamo', 'siate', 'siano', 'non essere']));
T('imperativo prendere', () => assert.deepEqual(F(it({ inf: 'prendere' }), 'imperativo').slice(0, 4), ['prendi', 'prenda', 'prendiamo', 'prendete']));
T('passato remoto regular -are', () => assert.deepEqual(F(it({ inf: 'parlare' }), 'passato_remoto'), ['parlai', 'parlasti', 'parlò', 'parlammo', 'parlaste', 'parlarono']));
T('congiuntivo passato', () => assert.deepEqual(F(it({ inf: 'parlare' }), 'congiuntivo_passato')[0], 'che abbia parlato'));
T('trapassato', () => assert.equal(F(it({ inf: 'mangiare' }), 'trapassato_prossimo')[2], 'aveva mangiato'));

T('en third', () => { assert.equal(third('go'), 'goes'); assert.equal(third('study'), 'studies'); assert.equal(third('play'), 'plays'); assert.equal(third('watch'), 'watches'); assert.equal(third('have'), 'has'); });
T('en ing', () => { assert.equal(ing('make'), 'making'); assert.equal(ing('see'), 'seeing'); assert.equal(ing('stop'), 'stopping'); assert.equal(ing('open'), 'opening'); assert.equal(ing('begin'), 'beginning'); assert.equal(ing('travel'), 'travelling'); assert.equal(ing('lie'), 'lying'); assert.equal(ing('fix'), 'fixing'); assert.equal(ing('play'), 'playing'); assert.equal(ing('panic'), 'panicking'); assert.equal(ing('visit'), 'visiting'); });
T('en ed', () => { assert.equal(ed('stop'), 'stopped'); assert.equal(ed('study'), 'studied'); assert.equal(ed('play'), 'played'); assert.equal(ed('cancel'), 'cancelled'); assert.equal(ed('live'), 'lived'); assert.equal(ed('visit'), 'visited'); });
T('en work present', () => { const v = en({ base: 'work' }); assert.equal(F(v, 'present_simple')[2], 'he works'); assert.equal(v.tenses.present_simple.neg[2], 'he does not work'); assert.equal(v.tenses.present_simple.q[0], 'Do I work?'); });
T('en be', () => { const v = en({ base: 'be' }); assert.deepEqual(F(v, 'present_simple'), ['I am', 'you are', 'he is', 'we are', 'you are', 'they are']); assert.equal(F(v, 'past_simple')[1], 'you were'); assert.equal(F(v, 'present_perfect')[2], 'he has been'); });
T('en go perfect', () => { const v = en({ base: 'go' }); assert.equal(F(v, 'present_perfect')[2], 'he has gone'); assert.equal(F(v, 'past_simple')[0], 'I went'); assert.equal(v.forms.s, 'goes'); });
T('en get pp alternatives', () => assert.equal(en({ base: 'get' }).forms.pp, 'got / gotten'));

T('grade exact', () => assert.equal(compare('Sono canadese', 'sono canadese.').status, 'ok'));
T('grade accents → almost', () => { const r = compare('perche', 'perché', { lang: 'it' }); assert.equal(r.status, 'almost'); assert.equal(r.reason, 'accents'); });
T('grade apostrophe spacing', () => assert.equal(compare("l' uomo", "l’uomo").status, 'ok'));
T('grade wrong', () => assert.equal(compare('sei', 'sono').status, 'wrong'));
T('grade en contractions', () => { assert.equal(compare("I'm from Italy", 'I am from Italy', { lang: 'en' }).status, 'ok'); assert.equal(compare("she doesn't work", 'she does not work', { lang: 'en' }).status, 'ok'); });
T('grade array', () => assert.equal(compare('Io sono di Toronto', ['Sono di Toronto', 'Io sono di Toronto']).status, 'ok'));
T('grade variant other', () => { const r = compareVariant('sono arrivato', { m: 'sono arrivato', f: 'sono arrivata', same: false }, { gender: 'f' }); assert.equal(r.status, 'almost'); assert.equal(r.reason, 'variant'); });
T('grade variant both', () => assert.equal(compareVariant('sono arrivata', { m: 'sono arrivato', f: 'sono arrivata', same: false }, { gender: 'both' }).status, 'ok'));
T('normalize', () => assert.equal(normalize('  Ciao , come stai ?  '), 'ciao, come stai'));

T('variants hero', () => { const v = resolve('Ciao, sono {hero}.'); assert.equal(v.m, 'Ciao, sono Luca.'); assert.equal(v.f, 'Ciao, sono Lucia.'); assert.equal(v.same, false); });
T('variants inline', () => assert.equal(resolve('Sono {{stanco|stanca}}').f, 'Sono stanca'));
T('variants object', () => { const v = resolve({ m: 'arrivato', f: 'arrivata', note: 'x', who: 'self' }); assert.equal(v.who, 'self'); assert.equal(v.note, 'x'); });
T('variants flatten', () => assert.deepEqual(flatten({ q: '{hero} è {{stanco|stanca}}', answers: [[{ m: 'stanco', f: 'stanca' }]] }, 'f'), { q: 'Lucia è stanca', answers: [['stanca']] }));
T('diffWords positional', () => { const d = diffWords('Il nipote di Cosimo! Lei è americano?', 'La nipote di Cosimo! Lei è americana?'); assert.deepEqual(d.f.filter(x => x.diff).map(x => x.t), ['La', 'americana?']); });
T('diffWords', () => { const d = diffWords('sono arrivato ieri', 'sono arrivata ieri'); assert.deepEqual(d.m.filter(x => x.diff).map(x => x.t), ['arrivato']); });

// conj-gloss: every conjugated form carries its meaning
T('parseGloss', () => { assert.deepEqual(parseGloss('to be able to, can', 'it'), { head: 'be', tail: 'able to' }); assert.deepEqual(parseGloss('to live (in a place)', 'it'), { head: 'live', tail: '' }); assert.deepEqual(parseGloss('vivere, abitare', 'en'), { head: 'vivere', tail: '' }); assert.deepEqual(parseGloss('avere bisogno di', 'en'), { head: 'avere', tail: 'bisogno di' }); });
T('gloss it→en presente', () => assert.deepEqual(glossForms('it', 'to speak', 'presente', it({ inf: 'parlare' }).tenses.presente.forms), ['I speak', 'you speak', 'he / she speaks', 'we speak', 'you speak', 'they speak']));
T('gloss it→en passato prossimo / essere', () => { const g = glossForms('it', 'to be', 'passato_prossimo', it({ inf: 'essere' }).tenses.passato_prossimo.forms); assert.equal(g[0], 'I was · I have been'); assert.equal(g[2], 'he / she was · he / she has been'); });
T('gloss it→en imperfetto stative vs action', () => { assert.equal(glossForms('it', 'to have', 'imperfetto', it({ inf: 'avere' }).tenses.imperfetto.forms)[0], 'I had'); assert.equal(glossForms('it', 'to work', 'imperfetto', it({ inf: 'lavorare' }).tenses.imperfetto.forms)[0], 'I was working · used to work'); });
T('gloss it→en tail carried', () => assert.equal(glossForms('it', 'to be able to, can', 'futuro', it({ inf: 'potere' }).tenses.futuro.forms)[1], 'you will be able to'));
T('gloss it→en imperativo and forme', () => { assert.deepEqual(glossForms('it', 'to get up', 'imperativo', it({ inf: 'alzarsi' }).tenses.imperativo.forms), ['get up! (informal)', 'get up! (formal)', "let's get up", 'get up! (plural)', 'get up! (formal plural)', "don't get up"]); assert.deepEqual(glossForms('it', 'to write', 'forme', it({ inf: 'scrivere' }).tenses.forme.forms), ['to write', 'writing', 'written']); });
T('gloss en→it past simple with gender', () => { const f = en({ base: 'go' }).tenses.past_simple.forms; assert.equal(glossForms('en', 'andare', 'past_simple', f, 'm')[0], 'sono andato'); assert.equal(glossForms('en', 'andare', 'past_simple', f, 'f')[0], 'sono andata'); });
T('gloss en→it continuous and going to', () => { const c = en({ base: 'get' }); assert.equal(glossForms('en', 'alzarsi', 'present_continuous', c.tenses.present_continuous.forms)[0], 'mi sto alzando'); assert.equal(glossForms('en', 'alzarsi', 'future_going_to', c.tenses.future_going_to.forms)[1], 'stai per alzarti'); assert.equal(glossForms('en', 'avere bisogno di', 'present_simple', c.tenses.present_simple.forms)[2], 'ha bisogno di'); });
T('gloss en→it imperative and forms', () => { const c = en({ base: 'sign' }); assert.deepEqual(glossForms('en', 'firmare', 'imperative', c.tenses.imperative.forms), ['firma (tu) · firmi (Lei)', 'non firmare', 'firmiamo']); assert.deepEqual(glossForms('en', 'firmare', 'forms', c.tenses.forms.forms), ['firmare', 'firma', 'firmando', 'ho firmato', 'firmato']); });
T('gloss returns null for non-verb gloss', () => assert.equal(glossForms('en', 'ok', 'present_simple', ['x']), null));

console.log(`${n} tests passed${process.exitCode ? ', some FAILED' : ''}`);
