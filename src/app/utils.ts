import {commonSuffixes} from './suffixes'

const wildcard = /\*/g
export const termBounds = /^;|;$/g
export type CommonExpansions = {[index: string]: {root: string; part: string}}
export function filterUncommonExpansions(matches: string[]) {
  const common: CommonExpansions = {}
  let root = ''
  matches.forEach(term => {
    if (!root || term.length < root.length) root = term
  })
  if (root) {
    const rootPattern = new RegExp(root + '*')
    matches.forEach(term => {
      if (term === root) {
        common[term] = {root: root, part: ''}
      } else {
        const terminal = term.replace(rootPattern, '')
        if (-1 !== commonSuffixes.indexOf(terminal)) common[term] = {root: root, part: term.replace(root, '')}
      }
    })
  }
  return common
}

export function globToRegex(term: string) {
  return wildcard.test(term) ? ';' + term.replace(wildcard, '[^;]*') + ';' : term
}

export function sortByLength(a: string, b: string) {
  return a.length - b.length
}
