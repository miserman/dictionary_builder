const wildcard = /\*/g
export const termBounds = /^;|;$/g
export type CommonExpansions = {[index: string]: {root: string; part: string}}

export function globToRegex(term: string) {
  return wildcard.test(term) ? ';' + term.replace(wildcard, '[^;]*') + ';' : term
}

export function sortByLength(a: string, b: string) {
  return a.length - b.length
}

export function relativeFrequency(index: number, n?: number) {
  return n && -1 !== index ? ((1 - index / n) * 100).toFixed(2) : '0'
}
