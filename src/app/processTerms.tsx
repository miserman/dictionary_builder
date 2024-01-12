import {timers, type GridRow} from './addedTerms'
import type {Dict} from './building'
import type {TermResources} from './resources'
import {unpackSynsetMembers} from './synset'
import {FixedTerm, FuzzyTerm} from './term'
import {globToRegex, prepareRegex, relativeFrequency, termBounds, wildcard} from './utils'

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
function makeLookups(processed: FixedTerm) {
  processed.lemma.forEach(term => (processed.lookup.lemma[term] = true))
  processed.related.forEach(term => (processed.lookup.related[term] = true))
  processed.synset_terms.forEach(term => (processed.lookup.synset[term] = true))
}
function objectAppend(to: {[index: string]: boolean}, from: {[index: string]: boolean}) {
  Object.keys(from).forEach(k => (to[k] = true))
}
function makeExpandedLookups(processed: FixedTerm, data: TermResources) {
  processed.lemma.forEach(term => {
    const relatedProcessed = getProcessedTerm(term, data) as FixedTerm
    objectAppend(processed.lookup.lemma_related, relatedProcessed.lookup.related)
    objectAppend(processed.lookup.lemma_synset, relatedProcessed.lookup.synset)
  })
  processed.related.forEach(term => {
    const relatedProcessed = getProcessedTerm(term, data) as FixedTerm
    objectAppend(processed.lookup.related_lemma, relatedProcessed.lookup.lemma)
    objectAppend(processed.lookup.related_related, relatedProcessed.lookup.related)
    objectAppend(processed.lookup.related_synset, relatedProcessed.lookup.synset)
  })
  processed.synset_terms.forEach(term => {
    const relatedProcessed = getProcessedTerm(term, data) as FixedTerm
    objectAppend(processed.lookup.synset_lemma, relatedProcessed.lookup.lemma)
    objectAppend(processed.lookup.synset_related, relatedProcessed.lookup.related)
    objectAppend(processed.lookup.synset_synset, relatedProcessed.lookup.synset)
  })
  processed.lookup.expanded = true
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
      lemma: {},
      lemma_related: {},
      lemma_synset: {},
      related: {},
      related_lemma: {},
      related_related: {},
      related_synset: {},
      synset: {},
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

export function getProcessedTerm(term: string, data: TermResources, dict?: Dict, expand?: boolean) {
  const type = dict && term in dict && dict[term].type === 'regex' ? 'regex' : 'fixed'
  const key = term + '_' + type
  if (!(key in Processed)) {
    Processed[key] = processTerm(type === 'regex' ? attemptRegex(term) : term, data)
  }
  const processed = Processed[key]
  if (expand && processed.type === 'fixed' && !processed.lookup.expanded) {
    makeExpandedLookups(processed, data)
  }
  return processed
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
          ncats: Object.keys(dictEntry.categories).length,
          frequency: relativeFrequency(processed.index, data.terms && data.terms.length).toFixed(2),
          senses: processed.synsets.length,
          related: processed.related.length,
        }
      : {
          processed,
          dictEntry,
          id: term,
          sense: dictEntry.sense,
          matches: processed.matches.length,
          ncats: Object.keys(dictEntry.categories).length,
        }
  if (
    processed.type === 'fixed' &&
    !row.sense &&
    processed.synsets.length === 1 &&
    data.sense_keys &&
    data.synsetInfo
  ) {
    row.sense = data.sense_keys[processed.synsets[0].index]
  }
  if (dictEntry.categories) {
    const cats = dictEntry.categories
    Object.keys(cats).forEach(cat => {
      row['category_' + cat] = cats[cat]
    })
  }
  rows[index] = row
}

export async function makeRows(dict: Dict, data: TermResources, progress: (perc: number) => void) {
  clearTimeout(timers.dictionary)
  return new Promise<GridRow[]>(resolve => {
    const terms = Object.freeze(Object.keys(dict))
    const n_terms = terms.length
    const limit = 1000
    const rows: GridRow[] = new Array(n_terms)
    let i = 0
    let batch_i = 0
    const runBatch = () => {
      clearTimeout(timers.dictionary)
      for (; i < n_terms && batch_i < limit; i++, batch_i++) {
        makeRow(rows, i, terms[i], dict, data)
      }
      if (i !== n_terms) {
        batch_i = 0
        progress(i / n_terms)
        timers.dictionary = setTimeout(runBatch, 0)
      } else {
        progress(1)
        resolve(rows)
      }
    }
    timers.dictionary = setTimeout(runBatch, 0)
  })
}
