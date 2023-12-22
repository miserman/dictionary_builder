export const wildcards = /\*/g
export const special = /([\[\]\(\)*?^$.+])/g
const special_limited = /([\[\]\(\)?^$.+])/g
export const termBounds = /^;|;$/g
export type CommonExpansions = {[index: string]: {root: string; part: string}}

export function globToRegex(term: string) {
  return wildcards.test(term) ? ';' + term.replace(special_limited, '\\$&').replace(wildcards, '[^;]*') + ';' : term
}

export function sortByLength(a: string, b: string) {
  return a.length - b.length
}

export function relativeFrequency(index: number, n?: number) {
  return n && -1 !== index ? ((1 - index / n) * 100).toFixed(2) : '0'
}
