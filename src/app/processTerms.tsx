import type {GridRow} from './addedTerms'
import type {Dict} from './building'
import type {TermResources} from './resources'
import {FixedTerm, FuzzyTerm} from './term'
import {globToRegex, prepareRegex, relativeFrequency, termBounds, wildcard} from './utils'

const Processed: {[index: string]: FuzzyTerm | FixedTerm} = {}

export async function extractMatches(
  ex: RegExp,
  from: {[index: string]: string},
  out: string[] = [],
  limit = Infinity
) {
  const collapsed = from[ex.source[1] in from ? ex.source[1] : 'all']
  for (let match: RegExpExecArray | null, cleaned = ''; out.length < limit && (match = ex.exec(collapsed)); ) {
    cleaned = match[0].replace(termBounds, '')
    if (cleaned) out.push(cleaned)
  }
}

function makeFixedTerm(term: string, {terms, termLookup, termAssociations, synsetInfo}: TermResources) {
  const processed = {
    type: 'fixed',
    term: term,
    term_type: 'fixed',
    categories: {},
    recognized: false,
    index: terms && termLookup ? termLookup[term] || -1 : -1,
    related: [],
    synsets: [],
  } as FixedTerm
  if (termAssociations && synsetInfo && terms && -1 !== processed.index) {
    processed.recognized = true
    const associated = termAssociations[processed.index]
    if (!associated) {
      const a = 1
    }
    processed.related =
      associated && associated[0]
        ? (Array.isArray(associated[0]) ? associated[0] : [associated[0]]).map(index => terms[index - 1])
        : []
    processed.synsets =
      associated && associated[1]
        ? (Array.isArray(associated[1]) ? associated[1] : [associated[1]]).map(index => synsetInfo[index - 1])
        : []
  }
  return processed
}

function processTerm(term: string | RegExp, data: TermResources) {
  const isString = 'string' === typeof term
  if (isString && !wildcard.test(term)) {
    return makeFixedTerm(term, data)
  } else {
    const processed = isString ? globToRegex(term) : term.source
    const container = {
      type: 'fuzzy',
      term_type: isString ? 'glob' : 'regex',
      term: isString ? term : term.source,
      categories: {},
      recognized: false,
      regex: new RegExp(isString ? processed : prepareRegex(processed), 'g'),
      matches: [],
    } as FuzzyTerm
    if (data.collapsedTerms) {
      extractMatches(container.regex, data.collapsedTerms, container.matches)
    }
    container.recognized = !!container.matches.length
    return container
  }
}

export function getProcessedTerm(term: string, data: TermResources, dict?: Dict) {
  if (!(term in Processed)) {
    Processed[term] = processTerm(dict && term in dict && dict[term].type === 'regex' ? new RegExp(term) : term, data)
  }
  return Processed[term]
}

export async function makeRow(rows: GridRow[], index: number, term: string, dict: Dict, data: TermResources) {
  const processed = getProcessedTerm(term, data, dict)
  const dictEntry = dict[term]
  const row: GridRow =
    processed.type === 'fixed'
      ? {
          processed,
          dictEntry,
          id: term,
          sense: dictEntry.sense,
          matches: processed.recognized ? 1 : 0,
          frequency: relativeFrequency(processed.index, data.terms && data.terms.length),
          senses: processed.synsets.length,
          related: processed.related.length,
        }
      : {
          processed,
          dictEntry,
          id: term,
          sense: dictEntry.sense,
          matches: processed.matches.length,
        }
  if (dictEntry.categories) {
    const cats = dictEntry.categories
    Object.keys(cats).forEach(cat => {
      row['category_' + cat] = cats[cat]
    })
  }
  rows[index] = row
}

export async function makeRows(dict: Dict, data: TermResources) {
  return new Promise<GridRow[]>(resolve => {
    const terms = Object.freeze(Object.keys(dict))
    const n_terms = terms.length
    const limit = 1000
    const rows: GridRow[] = new Array(n_terms)
    let i = 0
    let batch_i = 0
    const runBatch = () => {
      for (; i < n_terms && batch_i < limit; i++, batch_i++) {
        makeRow(rows, i, terms[i], dict, data)
      }
      if (i !== n_terms) {
        batch_i = 0
        setTimeout(runBatch, 0)
      } else {
        resolve(rows)
      }
    }
    setTimeout(runBatch, 0)
  })
}
