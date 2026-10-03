// Word problems ("zadania tekstowe") for classes 4 to 8, see
// docs/superpowers/specs/2026-10-03-text-questions-design.md. No Vue in here,
// so it runs under plain node (see wordProblems.check.js). There is no word
// problem game: each story lives in the topic it practises (HOME), and
// topics.js deals it out with that topic's own kinds.
//
// A word task is a topic task with a story where the equation would be:
//   { kind: 'number', story, unit, answer, type }   one number typed, `unit` sits after the input
//   { kind: 'pick', story, options, answer, type }  options are MathParts token lists
// `story` is { key, vars }: the numbers and words, never the sentence. The
// sentence is made only when it is shown (storyText), so the language can
// change under a task and the check can read every task in both languages.
// The answer is worked out from the same vars the story prints, never written
// by hand. Money is counted in whole grosze until it is shown.
import { randomIntFromInterval as rnd } from '../helpers/helpers.js'
import { shuffle } from './generators.js'

export const LEVELS = [1, 2, 3]

const one = (list) => list[rnd(0, list.length - 1)]
const gcd = (a, b) => (b ? gcd(b, a % b) : a)

// Polish counts in three forms: 1, then 2-4 (but not 12-14), then the rest.
// English entries carry two forms, so the index is capped by the entry.
// ponytail: a copy of form() in i18n.js, which imports the Vue settings store
// and cannot load under node. Move both into one pure helper when this ships.
export function form(n) {
  if (n === 1) return 0
  const unit = n % 10
  const teen = n % 100
  return unit >= 2 && unit <= 4 && (teen < 12 || teen > 14) ? 1 : 2
}

// Words a story counts or names. Each id is stored in the case its slot needs
// (the cases differ: "kupuje 3 zeszyty", "do 3 naleśników", "jedzie 3
// godziny"), so a word used in two cases gets two ids. Only things, never
// people or animals: for things the plural accusative is the nominative.
// A word shown without a number is its first form.
export const WORDS = {
  notebook: { pl: ['zeszyt', 'zeszyty', 'zeszytów'], en: ['notebook', 'notebooks'] },
  crayon: { pl: ['kredka', 'kredki', 'kredek'], en: ['crayon', 'crayons'] },
  roll: { pl: ['bułka', 'bułki', 'bułek'], en: ['bread roll', 'bread rolls'] },
  lolly: { pl: ['lizak', 'lizaki', 'lizaków'], en: ['lollipop', 'lollipops'] },
  pen: { pl: ['długopis', 'długopisy', 'długopisów'], en: ['pen', 'pens'] },
  ticket: { pl: ['bilet', 'bilety', 'biletów'], en: ['ticket', 'tickets'] },
  backpack: { pl: ['plecak'], en: ['backpack'] },
  boardGame: { pl: ['gra planszowa'], en: ['board game'] },
  bike: { pl: ['rower'], en: ['bike'] },
  scooter: { pl: ['hulajnoga'], en: ['scooter'] },
  jacket: { pl: ['kurtka'], en: ['jacket'] },
  cyclist: { pl: ['rowerzysta'], en: ['cyclist'] },
  bus: { pl: ['autobus'], en: ['bus'] },
  car: { pl: ['samochód'], en: ['car'] },
  train: { pl: ['pociąg'], en: ['train'] },
  hours: { pl: ['godzinę', 'godziny', 'godzin'], en: ['hour', 'hours'] }, // accusative: "jedzie 3 godziny"
  pancakes: { pl: ['naleśnika', 'naleśników', 'naleśników'], en: ['pancake', 'pancakes'] }, // genitive: "do 3 naleśników"
  redBalls: { pl: ['czerwoną kulę', 'czerwone kule', 'czerwonych kul'], en: ['red ball', 'red balls'] },
  blueBalls: { pl: ['niebieską kulę', 'niebieskie kule', 'niebieskich kul'], en: ['blue ball', 'blue balls'] },
  red: { pl: ['czerwona'], en: ['red'] },
  blue: { pl: ['niebieska'], en: ['blue'] },
  even: { pl: ['liczba parzysta'], en: ['an even number'] },
  odd: { pl: ['liczba nieparzysta'], en: ['an odd number'] },
  six: { pl: ['szóstka'], en: ['a six'] },
  over4: { pl: ['liczba większa niż 4'], en: ['a number greater than 4'] },
  under3: { pl: ['liczba mniejsza niż 3'], en: ['a number less than 3'] },
  byThree: { pl: ['liczba podzielna przez 3'], en: ['a number divisible by 3'] },
  prime: { pl: ['liczba pierwsza'], en: ['a prime number'] },
}

// Present tense only: "Ania kupuje", "Tomek kupuje". The Polish past tense
// agrees with the name's gender (kupił / kupiła); the present does not, so no
// gender table is needed. A count never stands as the subject of a verb
// either ("3 zeszyty kosztują", "5 zeszytów kosztuje"): it follows a verb or
// "za"/"do". Slots: {x} a number, name, list or word; {x zł} grosze as money;
// {x w} the count x and the word w (or the word id held in var w) in its form.
export const TEXTS = {
  cost: {
    pl: '{item} kosztuje {price zł}. {name} kupuje {count item}. Ile płaci?',
    en: 'One {item} costs {price zł}. {name} buys {count item}. How much does {name} pay?',
  },
  change: {
    pl: '{name} kupuje {count item} po {price zł} i płaci banknotem {note zł}. Ile reszty dostaje?',
    en: '{name} buys {count item} at {price zł} each and pays with a {note zł} note. How much change does {name} get?',
  },
  unitPrice: {
    pl: 'Za {count item} {name} płaci {total zł}. Ile kosztuje {item}?',
    en: '{name} pays {total zł} for {count item}. How much does one {item} cost?',
  },
  discount: {
    pl: '{item} kosztuje {price zł}. W promocji cena spada o {p}%. Ile teraz kosztuje?',
    en: 'One {item} costs {price zł}. In a sale the price drops by {p}%. How much does it cost now?',
  },
  priceBefore: {
    pl: 'Po podwyżce o {p}% {item} kosztuje {after zł}. Jaka była cena przed podwyżką?',
    en: 'After a {p}% rise one {item} costs {after zł}. What was the price before the rise?',
  },
  speedDistance: {
    pl: '{vehicle} jedzie {t hours} z prędkością {v} km/h. Jaką drogę pokonuje?',
    en: 'A {vehicle} travels for {t hours} at {v} km/h. How far does it go?',
  },
  speedSpeed: {
    pl: '{vehicle} pokonuje {d} km w {t hours}. Z jaką prędkością jedzie?',
    en: 'A {vehicle} covers {d} km in {t hours}. What is its speed?',
  },
  speedTime: {
    pl: '{vehicle} jedzie z prędkością {v} km/h. W ile godzin pokona {d} km?',
    en: 'A {vehicle} travels at {v} km/h. How many hours does it take to cover {d} km?',
  },
  proportion: {
    pl: 'Do {a pancakes} potrzeba {flour} g mąki. Ile gramów mąki potrzeba do {b pancakes}?',
    en: 'For {a pancakes} you need {flour} g of flour. How many grams do you need for {b pancakes}?',
  },
  split: {
    pl: '{name} i {other} dzielą {sum zł} w stosunku {a}:{b}. Ile dostaje {name}?',
    en: '{name} and {other} share {sum zł} in the ratio {a}:{b}. How much does {name} get?',
  },
  die: {
    pl: 'Rzucamy kostką do gry. Jakie jest prawdopodobieństwo, że wypadnie {event}?',
    en: 'We roll a die. What is the probability of rolling {event}?',
  },
  balls: {
    pl: 'Do worka wkładamy {red redBalls} i {blue blueBalls}. Losujemy jedną kulę. Jakie jest prawdopodobieństwo, że będzie {asked}?',
    en: 'We put {red redBalls} and {blue blueBalls} in a bag and draw one ball. What is the probability that it is {asked}?',
  },
  average: {
    pl: '{name} ma oceny: {marks}. Jaka jest średnia ocen?',
    en: '{name} has these marks: {marks}. What is the average mark?',
  },
}

const NAMES = ['Ania', 'Ola', 'Zosia', 'Maja', 'Kasia', 'Tomek', 'Kuba', 'Staś', 'Bartek', 'Janek']

const fmt = (n, lang) => (lang === 'pl' ? String(n).replace('.', ',') : String(n))

// 250 -> "2,50 zł", 300 -> "3 zł". Grosze always show two digits.
export function money(gr, lang) {
  const zl = Math.floor(gr / 100)
  const rest = gr % 100
  return rest ? `${zl}${lang === 'pl' ? ',' : '.'}${String(rest).padStart(2, '0')} zł` : `${zl} zł`
}

const word = (id, n, lang) => {
  const forms = WORDS[id][lang]
  return forms[Math.min(form(n), forms.length - 1)]
}

// the sentence a kid reads, in `lang`
export function storyText(task, lang) {
  const { key, vars } = task.story
  const out = TEXTS[key][lang].replace(/\{(\w+)(?: (\S+?))?\}/g, (_, name, after) => {
    const v = vars[name]
    if (after === 'zł') return money(v, lang)
    if (after) return `${fmt(v, lang)} ${word(vars[after] ?? after, v, lang)}`
    if (Array.isArray(v)) return v.map((x) => fmt(x, lang)).join(', ')
    if (WORDS[v]) return WORDS[v][lang][0]
    return typeof v === 'number' ? fmt(v, lang) : v
  })
  return out[0].toUpperCase() + out.slice(1)
}

const number = (key, vars, answer, unit) => ({ kind: 'number', story: { key, vars }, answer, unit })

// a price in grosze between lo and hi zł: whole 50 gr at level 1, 10 gr at
// level 2, any grosz at level 3 (shop prices like 4,99 zł)
function price(lo, hi, level) {
  const step = { 1: 50, 2: 10, 3: 1 }[level]
  return Math.max(step, Math.round(rnd(Math.round(lo * 100), Math.round(hi * 100)) / step) * step)
}

// small things and what one costs, in zł
const SMALL = { notebook: [2, 6], crayon: [1, 3], roll: [0.6, 1.5], lolly: [0.5, 2], pen: [1.5, 5], ticket: [3, 15] }
// big things for sales and rises, in whole zł
const BIG = { backpack: [60, 200], boardGame: [40, 150], bike: [400, 1500], scooter: [150, 500], jacket: [100, 300] }

const NOTES = [1000, 2000, 5000, 10000, 20000] // banknotes, in grosze

// how many things are bought: from 2, so the count never meets the singular
// accusative ("1 kredkę"), and a few more each year
const count = (level, year) => rnd(2, 3 + level + Math.min(year, 3))

// a percentage from the level's list and a whole-zł price in [lo, hi] whose
// p% is whole zł, so the new price is whole too
function pctPrice(pcts, lo, hi) {
  for (;;) {
    const p = one(pcts)
    const unit = 100 / gcd(p, 100)
    const k = rnd(Math.ceil(lo / unit), Math.floor(hi / unit))
    if (k > 0) return [p, unit * k]
  }
}

// [vehicle, slowest, fastest] in km/h
const VEHICLES = [['cyclist', 10, 20], ['bus', 40, 60], ['car', 50, 90], ['train', 60, 120]]

// the faces of a dice each event takes
export const EVENTS = {
  even: (n) => n % 2 === 0,
  odd: (n) => n % 2 === 1,
  six: (n) => n === 6,
  over4: (n) => n > 4,
  under3: (n) => n < 3,
  byThree: (n) => n % 3 === 0,
  prime: (n) => [2, 3, 5].includes(n),
}

// A probability as a pick of fractions, shown unreduced the way the kid
// counts it (favourable over all). The wrong ones are the usual slips: the
// complement, favourable over unfavourable, one over all, one off on top.
function probability(key, vars, fav, all) {
  const frac = (n, d) => ({ parts: [{ frac: [n, d] }], value: n / d })
  const right = frac(fav, all)
  const slips = [frac(all - fav, all), frac(1, all), frac(fav + 1, all), frac(fav - 1, all)]
  if (all - fav !== fav) slips.push(frac(fav, all - fav))
  const wrongs = []
  for (const s of shuffle(slips)) {
    if (s.value > 0 && s.value <= 1 && ![right, ...wrongs].some((o) => Math.abs(o.value - s.value) < 1e-9)) wrongs.push(s)
  }
  const options = shuffle([right, ...wrongs.slice(0, 3)])
  return { kind: 'pick', story: { key, vars }, options: options.map((o) => o.parts), answer: options.indexOf(right) }
}

// Each kind: [the class that meets it first, generator]. Classes after the
// 2017 annotations, inside the 2026 bands (4-6, 7-8). `year` is how long the
// class has had this kind.
const KINDS = {
  cost: [4, (level, year) => {
    const item = one(Object.keys(SMALL))
    const vars = { name: one(NAMES), item, count: count(level, year), price: price(...SMALL[item], level) }
    return number('cost', vars, (vars.count * vars.price) / 100, 'zł')
  }],

  // the note is one of the two smallest that cover the cost, so it is a note
  // someone would really hand over, and the change is never zero or negative
  change: [4, (level, year) => {
    const item = one(Object.keys(SMALL))
    const vars = { name: one(NAMES), item, count: count(level, year), price: price(...SMALL[item], level) }
    const cost = vars.count * vars.price
    vars.note = one(NOTES.filter((n) => n > cost).slice(0, 2))
    return number('change', vars, (vars.note - cost) / 100, 'zł')
  }],

  // built from the answer, so the total always divides
  unitPrice: [4, (level, year) => {
    const item = one(Object.keys(SMALL))
    const each = price(...SMALL[item], level)
    const vars = { name: one(NAMES), item, count: count(level, year) }
    vars.total = vars.count * each
    return number('unitPrice', vars, each / 100, 'zł')
  }],

  discount: [6, (level) => {
    const item = one(Object.keys(BIG))
    const [p, zl] = pctPrice({ 1: [10, 25, 50], 2: [10, 20, 25, 30, 40, 50], 3: [5, 15, 20, 30, 35, 45, 60] }[level], ...BIG[item])
    const vars = { item, p, price: zl * 100 }
    return number('discount', vars, (zl * (100 - p)) / 100, 'zł')
  }],

  // the price before a rise, built from that price
  priceBefore: [7, (level) => {
    const item = one(Object.keys(BIG))
    const [p, zl] = pctPrice({ 1: [10, 20, 50], 2: [5, 10, 20, 25, 30], 3: [5, 15, 25, 35, 40] }[level], ...BIG[item])
    const vars = { item, p, after: (zl * (100 + p)) }
    return number('priceBefore', vars, zl, 'zł')
  }],

  // whole hours and a speed in steps of 10 (level 1) or 5 km/h; the distance
  // is built from them, so all three stay whole whichever one is asked
  speed: [6, (level) => {
    const [vehicle, lo, hi] = one(VEHICLES)
    const step = level === 1 ? 10 : 5
    const v = step * rnd(Math.ceil(lo / step), Math.floor(hi / step))
    const t = rnd(2, 2 + level)
    // the vars hold only what the story shows, never the asked one
    const d = v * t
    return one([
      () => number('speedDistance', { vehicle, v, t }, d, 'km'),
      () => number('speedSpeed', { vehicle, d, t }, v, 'km/h'),
      () => number('speedTime', { vehicle, v, d }, t, 'h'),
    ])()
  }],

  // grams per pancake are whole; at level 1 the second batch is a multiple
  // of the first, so the kid can scale without finding one pancake
  proportion: [7, (level) => {
    const per = rnd(4, 8) * 5
    const a = rnd(2, 4 + level)
    let b
    do b = level === 1 ? a * rnd(2, 3) : rnd(2, 6 + level * 2)
    while (b === a)
    return number('proportion', { a, b, flour: per * a }, per * b, 'g')
  }],

  // the ratio in lowest terms and never 1:1; the sum is whole zł and divides
  split: [8, (level) => {
    let a, b
    do { a = rnd(1, 2 + level); b = rnd(1, 2 + level) } while (a === b || gcd(a, b) !== 1)
    const k = rnd(1, 10 * level) * (level === 1 ? 10 : 1)
    const [name, other] = shuffle(NAMES).slice(0, 2)
    return number('split', { name, other, a, b, sum: (a + b) * k * 100 }, a * k, 'zł')
  }],

  probability: [7, (level) => {
    if (rnd(0, 1)) {
      const event = one(Object.keys(EVENTS))
      const fav = [1, 2, 3, 4, 5, 6].filter(EVENTS[event]).length
      return probability('die', { event }, fav, 6)
    }
    // two of each at least: one and one leaves a coin toss of two tiles
    const red = rnd(2, 3 + level * 2)
    const blue = rnd(2, 3 + level * 2)
    const asked = one(['red', 'blue'])
    return probability('balls', { red, blue, asked }, asked === 'red' ? red : blue, red + blue)
  }],

  // Polish school marks 1-6. Level 1 averages come out whole; above it any
  // average with at most two decimal places (four or five marks always do).
  marks: [6, (level) => {
    for (;;) {
      const marks = Array.from({ length: rnd(3, 3 + level) }, () => rnd(level === 1 ? 2 : 1, 6))
      const sum = marks.reduce((s, m) => s + m, 0)
      if (level === 1 ? sum % marks.length === 0 : (sum * 100) % marks.length === 0) {
        return number('average', { name: one(NAMES), marks }, sum / marks.length, '')
      }
    }
  }],
}

// The topic each story is dealt out by. Money in grosze is decimals; speed
// and proportion are a formula to turn round, so equations; a share of a
// ratio and a probability are fractions of a whole.
const HOME = {
  cost: 'decimals',
  change: 'decimals',
  unitPrice: 'decimals',
  discount: 'percents',
  priceBefore: 'percents',
  speed: 'equations',
  proportion: 'equations',
  split: 'fractions',
  probability: 'fractions',
  marks: 'average',
}

// a topic's stories, shaped like topics.js's kinds: { name: [class, make] }
export const storiesFor = (topic) =>
  Object.fromEntries(Object.entries(KINDS).filter(([type]) => HOME[type] === topic))

// the kinds a class has, by name
export const wordKindsFor = (cls) => Object.entries(KINDS).filter(([, [from]]) => from <= cls).map(([type]) => type)

export function wordTask(level, cls) {
  if (!LEVELS.includes(level) || !(cls >= 4 && cls <= 8)) throw new Error(`no word task at level ${level} in class ${cls}`)
  const type = one(wordKindsFor(cls))
  const [from, make] = KINDS[type]
  return { ...make(level, cls - from), type }
}
