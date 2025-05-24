import {timers} from './addedTerms'
import type {Dict} from './storage'
import type {TermResources} from './resources'
import {unpackSynsetMembers} from './synset'
import type {FixedTerm, FuzzyTerm} from './term'
import {globToRegex, prepareRegex, relativeFrequency, termBounds, wildcard} from './lib/utils'
import type {GridRow} from './table'

const Processed: {[index: string]: FuzzyTerm | FixedTerm} = {}
const PartialMatchMap: {[index: string]: string} = {}

export async function extractMatches(
  term: string,
  ex: RegExp,
  from: {[index: string]: string},
  out: string[] = [],
  limit = Infinity
) {
  const collapsed = from[ex.source[1] in from ? ex.source[1] : 'all']
  for (let match: RegExpExecArray | null, cleaned = ''; out.length < limit && (match = ex.exec(collapsed)); ) {
    cleaned = match[0].replace(termBounds, '')
    if (cleaned) {
      out.push(cleaned)
      if (term && !(cleaned in PartialMatchMap)) {
        PartialMatchMap[cleaned] = term
      }
    }
  }
}

export function getFuzzyParent(term: string) {
  return term in PartialMatchMap ? PartialMatchMap[term] : ''
}
function makeLookups({lemma, related, synset_terms, lookup}: FixedTerm) {
  lemma.forEach(term => {
    lookup.any[term] = true
    lookup.lemma[term] = true
    lookup.lemma_map.set(term, true)
  })
  related.forEach(term => {
    lookup.any[term] = true
    lookup.related[term] = true
    lookup.related_map.set(term, true)
  })
  synset_terms.forEach(term => {
    lookup.any[term] = true
    lookup.synset[term] = true
    lookup.synset_map.set(term, true)
  })
}
type LogicalObject = {[index: string]: boolean}
async function objectAppend(any: LogicalObject, to: LogicalObject, from: Map<string, boolean>) {
  from.forEach((_, k) => {
    any[k] = true
    to[k] = true
  })
}
async function makeExpandedLookups(processed: FixedTerm, data: TermResources) {
  const lookup = processed.lookup
  const any = lookup.any
  processed.lemma.forEach(term => {
    const relatedLookup = (getProcessedTerm(term, data) as FixedTerm).lookup
    objectAppend(any, lookup.lemma_related, relatedLookup.related_map)
    objectAppend(any, lookup.lemma_synset, relatedLookup.synset_map)
  })
  processed.related.forEach(term => {
    const relatedLookup = (getProcessedTerm(term, data) as FixedTerm).lookup
    objectAppend(any, lookup.related_lemma, relatedLookup.lemma_map)
    objectAppend(any, lookup.related_related, relatedLookup.related_map)
    objectAppend(any, lookup.related_synset, relatedLookup.synset_map)
  })
  processed.synset_terms.forEach(term => {
    const relatedLookup = (getProcessedTerm(term, data) as FixedTerm).lookup
    objectAppend(any, lookup.synset_lemma, relatedLookup.lemma_map)
    objectAppend(any, lookup.synset_related, relatedLookup.related_map)
    objectAppend(any, lookup.synset_synset, relatedLookup.synset_map)
  })
  lookup.expanded = true
  lookup.map = new Map(Object.keys(any).map(term => [term, true]))
}

function makeFixedTerm(term: string, data: TermResources) {
  const {terms, lemmas, termLookup, termAssociations, synsetInfo} = data
  const processed = {
    type: 'fixed',
    term: term,
    term_type: 'fixed',
    categories: {},
    recognized: false,
    index: terms && termLookup ? termLookup[term] || -1 : -1,
    lemma: [],
    related: [],
    synsets: [],
    synset_terms: [],
    lookup: {
      expanded: false,
      map: new Map(),
      any: {},
      lemma: {},
      lemma_map: new Map(),
      lemma_related: {},
      lemma_synset: {},
      related: {},
      related_map: new Map(),
      related_lemma: {},
      related_related: {},
      related_synset: {},
      synset: {},
      synset_map: new Map(),
      synset_lemma: {},
      synset_related: {},
      synset_synset: {},
    },
  } as FixedTerm
  if (termAssociations && synsetInfo && lemmas && terms && -1 !== processed.index) {
    processed.recognized = true
    const associated = termAssociations[processed.index]
    processed.related =
      associated && associated[0] && Array.isArray(associated[0])
        ? associated[0].filter((_, i) => !!i).map(index => terms[index - 1])
        : []
    processed.synsets =
      associated && associated[1]
        ? (Array.isArray(associated[1]) ? associated[1] : [associated[1]]).map(index => synsetInfo[index - 1])
        : []
    const senseRelated: Set<string> = new Set()
    processed.synsets.forEach(synset => {
      unpackSynsetMembers(synset, terms, synsetInfo).forEach(member => {
        if (member !== processed.term) senseRelated.add(member)
      })
    })
    processed.synset_terms = Array.from(senseRelated)
    const lemma =
      terms && lemmas && term in lemmas
        ? lemmas['number' === typeof lemmas[term] ? terms[lemmas[term] as number] : term]
        : []
    processed.lemma = 'number' === typeof lemma ? [terms[lemma]] : lemma.map(index => terms[index])
    makeLookups(processed)
  }
  return processed
}

function attemptRegex(term: string, flags?: string) {
  try {
    return new RegExp(term, flags)
  } catch {
    return term
  }
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
      regex: attemptRegex(isString ? processed : prepareRegex(processed), 'g'),
      matches: [],
    } as FuzzyTerm
    if (data.collapsedTerms) {
      extractMatches(container.term, container.regex, data.collapsedTerms, container.matches)
    }
    container.recognized = !!container.matches.length
    return container
  }
}

export function getProcessedTerm(id: string | RegExp, data: TermResources, dict?: Dict, expand?: boolean) {
  const registered = 'string' === typeof id && dict && id in dict
  const term = registered && dict[id].term ? dict[id].term : id
  const type = registered && dict[id].type === 'regex' ? 'regex' : 'fixed'
  const key = term + '_' + type
  if (!(key in Processed)) {
    Processed[key] = processTerm(type === 'regex' ? attemptRegex(term as string) : (term as RegExp), data)
  }
  const processed = Processed[key]
  if (expand && processed.type === 'fixed' && !processed.lookup.expanded) {
    makeExpandedLookups(processed, data)
  }
  return processed
}

export async function makeRow(rows: GridRow[], index: number, id: string, dict: Dict, data: TermResources) {
  const processed = getProcessedTerm(id, data, dict)
  const dictEntry = dict[id]
  const row: GridRow =
    processed.type === 'fixed'
      ? {
          processed,
          dictEntry,
          id,
          term: dictEntry.term || id,
          sense: dictEntry.sense,
          matches: processed.recognized ? 1 : 0,
          ncats: Object.keys(dictEntry.categories).length,
          frequency: relativeFrequency(processed.index, data.terms && data.terms.length).toFixed(2),
          senses: processed.synsets.length,
          related: processed.related.length,
        }
      : {
          processed,
          dictEntry,
          id,
          term: dictEntry.term || id,
          sense: dictEntry.sense,
          matches: processed.matches.length,
          ncats: Object.keys(dictEntry.categories).length,
        }
  if (dictEntry.categories) {
    const cats = dictEntry.categories
    Object.keys(cats).forEach(cat => {
      row['category_' + cat] = cats[cat]
    })
  }
  rows[index] = row
}

export async function makeRows(dict: Dict, data: TermResources, progress?: (perc: number) => void) {
  clearTimeout(timers.dictionary)
  return new Promise<GridRow[]>(resolve => {
    const ids = Object.freeze(Object.keys(dict))
    const n_ids = ids.length
    const limit = 1000
    const rows: GridRow[] = new Array(n_ids)
    let i = 0
    let batch_i = 0
    const runBatch = () => {
      clearTimeout(timers.dictionary)
      for (; i < n_ids && batch_i < limit; i++, batch_i++) {
        makeRow(rows, i, ids[i], dict, data)
      }
      if (i !== n_ids) {
        batch_i = 0
        if (progress) progress(i / n_ids)
        timers.dictionary = setTimeout(runBatch, 0)
      } else {
        if (progress) progress(1)
        resolve(rows)
      }
    }
    timers.dictionary = setTimeout(runBatch, 0)
  })
}
