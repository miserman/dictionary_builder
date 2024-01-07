import {special, termBounds} from './utils'

const commonPrefixes = [
  'anti',
  'de',
  'dis',
  'central',
  'en',
  'ex',
  'faux',
  'hyper',
  'il',
  'ill',
  'in',
  'intra',
  'inter',
  'ir',
  'meso',
  'mal',
  'mid',
  'middle',
  'mis',
  'miss',
  'non',
  'over',
  'pan',
  'post',
  'pre',
  'pro',
  're',
  'retro',
  'sudo',
  'sub',
  'super',
  'un',
  'uber',
  'under',
  'ultra',
  'trans',
] as const
const commonSuffixes = [
  "'",
  'ac',
  'age',
  'al',
  'alize',
  'ance',
  'ancy',
  'ant',
  'ary',
  'at',
  'ate',
  'ation',
  'cracy',
  'cy',
  'cycle',
  'd',
  'dom',
  'ed',
  'ence',
  'ency',
  'ent',
  'er',
  'es',
  'esque',
  'est',
  'ette',
  'ey',
  'ful',
  'hood',
  'ial',
  'ic',
  'ie',
  'ies',
  'ify',
  'in',
  'ing',
  'ion',
  'ionate',
  'isation',
  'ish',
  'ise',
  'ism',
  'ist',
  'ive',
  'ize',
  'ization',
  'let',
  'lets',
  'lette',
  'like',
  'ling',
  'lings',
  'log',
  'ly',
  'ley',
  'ment',
  'n',
  'nce',
  'ness',
  'ng',
  'nt',
  'or',
  'on',
  'ous',
  'r',
  's',
  'ship',
  'st',
  't',
  'th',
  'ties',
  'ty',
  'ur',
  'ward',
  'wise',
  'y',
  'z',
] as const
const addableSuffixes = [
  "'",
  'al',
  'alize',
  'alization',
  'ate',
  'ation',
  'ble',
  'd',
  'ed',
  'er',
  'es',
  'ility',
  'in',
  'ing',
  'ion',
  'ise',
  'isation',
  'ish',
  'ize',
  'ization',
  'ly',
  'ness',
  'ous',
  's',
  'y',
  'z',
]
const collapsedPrefixes = ';(?:' + commonPrefixes.join('|') + ')?-?'
const collapsedSuffixes = '-?(?:' + commonSuffixes.join('|') + ')?(?:' + addableSuffixes.join('|') + ')?;'

const shortPrefixes = ';(?:de|un|re)?-?'
const shortSuffixes = "-?(?:'|d|ed|er|en|ing|s|y)?;"

const terminalVowels = /[aeiouy]$/
export function extractExpanded(term: string, collapsed: string) {
  const forms: Set<string> = new Set()
  term = term.replace(special, '\\$&')
  const termLength = term.length
  let termPattern: RegExp | undefined
  try {
    if (termLength > 3) {
      termPattern = new RegExp(
        collapsedPrefixes + term + (terminalVowels.test(term) ? '*' : '+') + collapsedSuffixes,
        'g'
      )
    } else {
      termPattern = new RegExp(
        shortPrefixes + (termLength > 2 ? term.replace(terminalVowels, '[aeiouy]') : term) + '+' + shortSuffixes,
        'g'
      )
    }
  } catch {}
  if (termPattern) {
    for (let match: RegExpExecArray | null; (match = termPattern.exec(collapsed)); ) {
      const matchedTerm = match[0]
      if (matchedTerm && matchedTerm.length - 1 > termLength && ';' + term + ';' !== matchedTerm)
        forms.add(matchedTerm.replace(termBounds, ''))
    }
  }
  return Array.from(forms) as string[]
}
