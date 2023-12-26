export const wildcard = /\*/
export const wildcards = /\*/g
export const special = /([\[\]\(\)*?^$.+])/g
export const termBounds = /^;|;$/g
export type CommonExpansions = {[index: string]: {root: string; part: string}}

const special_limited = /([\[\]\(\)?^$.+])/g
export function globToRegex(term: string) {
  return ';' + term.replace(special_limited, '\\$&').replace(wildcards, '[^;]*') + ';'
}

export function sortByLength(a: string, b: string) {
  return a.length - b.length
}

export function relativeFrequency(index: number, n?: number) {
  return n && -1 !== index ? ((1 - index / n) * 100).toFixed(2) : '0'
}

export function extractMatches(ex: RegExp, from: string, out: string[] = [], limit = Infinity) {
  for (let match: RegExpExecArray | null, cleaned = ''; out.length < limit && (match = ex.exec(from)); ) {
    cleaned = match[0].replace(termBounds, '')
    if (cleaned) out.push(cleaned)
  }
  return out
}

const regexDots = /\./g
export function prepareRegex(term: string) {
  return ';' + term.replace(regexDots, '[^;]') + ';'
}

const filePath = /^.*[/\\]/
export function fileBaseName(file: string) {
  return file.replace(filePath, '')
}
