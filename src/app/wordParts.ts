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
  'nce',
  'ness',
  'or',
  'ous',
  'r',
  's',
  'ship',
  'st',
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
  'ate',
  'ation',
  'd',
  'ed',
  'er',
  'es',
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
const collapsedSuffixes = '-?(?:' + commonSuffixes.join('|') + ')?(?:' + addableSuffixes.join('|') + ')?\\;'

const terminalVowels = /[aeiouy]$/
export function extractExpanded(term: string, collapsedTerms: {[index: string]: string}) {
  const forms = new Set()
  term = term.replace(special, '\\$&')
  let termPattern: RegExp | undefined
  try {
    termPattern = new RegExp(
      collapsedPrefixes +
        '(?:' +
        term +
        (term.length > (terminalVowels.test(term) ? 3 : 2) ? '|' + term.replace(terminalVowels, '[aeiouy]') : '') +
        '|' +
        term +
        term.substring(term.length - 1) +
        ')' +
        collapsedSuffixes,
      'g'
    )
  } catch {}
  if (termPattern) {
    const collapsed = collapsedTerms[term[0] in collapsedTerms ? term[0] : 'all']
    for (let match: RegExpExecArray | null; (match = termPattern.exec(collapsed)); ) {
      if (match[0] && ';' + term + ';' !== match[0]) forms.add(match[0].replace(termBounds, ''))
    }
  }
  return Array.from(forms) as string[]
}
