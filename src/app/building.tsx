import {ReactNode, createContext, useContext, useMemo, useReducer} from 'react'
import {FixedTerm, FuzzyTerm} from './term'
import {ResourceContext, TermResources} from './resources'
import {globToRegex, sortByLength, termBounds} from './utils'
import {collapsedPrefixes, collapsedSuffixes} from './wordParts'

type Dict = {[index: string]: {categories: {[index: string]: number}; sense: string}}
type DictionaryActions =
  | {type: 'remove'; term: string}
  | {type: 'add'; term: string; categories?: {[index: string]: number}; sense?: string}
  | {type: 'update'; term: string; originalTerm: string; categories?: {[index: string]: number}; sense?: string}
export const BuildContext = createContext<Dict>({})
export const BuildEditContext = createContext((action: DictionaryActions) => {})

type ProcessedTerms = {[index: string]: FuzzyTerm | FixedTerm}
export const Processed = createContext<ProcessedTerms>({})

const terminalVowels = /[aeiouy]$/
const extractExpanded = (term: string, collapsedTerms: string) => {
  const forms = new Set()
  const termPattern = new RegExp(
    collapsedPrefixes +
      '(?:' +
      term +
      '|' +
      term.replace(terminalVowels, '[aeiouy]') +
      '|' +
      term +
      term.substring(term.length - 1) +
      ')' +
      collapsedSuffixes,
    'g'
  )
  const tooNear = new RegExp('^;' + term + '?[aeiou]?;$')
  for (let match: RegExpExecArray | null; (match = termPattern.exec(collapsedTerms)); ) {
    if (!tooNear.test(match[0])) forms.add(match[0].replace(termBounds, ''))
  }
  return Array.from(forms) as string[]
}

const makeFixedTerm = (
  term: string,
  {terms, termLookup, collapsedTerms, termAssociations, synsetInfo}: TermResources
) => {
  const processed = {
    type: 'fixed',
    term: term,
    categories: {},
    recognized: false,
    index: terms && termLookup ? termLookup[term] || -1 : -1,
    forms: [],
    similar: [],
    synsets: [],
  } as FixedTerm
  if (collapsedTerms) processed.forms = extractExpanded(term, collapsedTerms)
  processed.forms.sort(sortByLength)
  if (termAssociations && synsetInfo && terms && -1 !== processed.index) {
    processed.recognized = true
    const associated = termAssociations[processed.index]
    processed.similar = associated[0]
      ? (Array.isArray(associated[0]) ? associated[0] : [associated[0]]).map(index => terms[index - 1])
      : []
    processed.synsets = associated[1]
      ? (Array.isArray(associated[1]) ? associated[1] : [associated[1]]).map(index => {
          return synsetInfo[index - 1]
        })
      : []
  }
  return processed
}
export const processTerm = (term: string, data: TermResources) => {
  const processed = globToRegex(term)
  if (processed === term) {
    return makeFixedTerm(term, data)
  } else {
    const container = {
      type: 'fuzzy',
      term: term,
      categories: {},
      recognized: false,
      regex: new RegExp(processed, 'g'),
      matches: [],
      common_matches: [],
    } as FuzzyTerm
    if (data.collapsedTerms) {
      for (let match: RegExpExecArray | null; (match = container.regex.exec(data.collapsedTerms)); ) {
        container.matches.push(match[0].replace(termBounds, ''))
      }
    }
    if (container.matches.length) {
      container.recognized = true
      let root = ''
      container.matches.forEach(match => {
        if (!root || match.length < root.length) root = match
      })
      container.common_matches = extractExpanded(root, ';;' + container.matches.join(';;') + ';;')
    }
    return container
  }
}

export function Building({children}: {children: ReactNode}) {
  const data = useContext(ResourceContext)
  const processedTerms = useMemo(() => {
    return {} as ProcessedTerms
  }, [])
  function editDictionary(state: Dict, action: DictionaryActions) {
    const newState = {...state} as Dict
    if (action.type === 'remove') {
      delete newState[action.term]
    } else {
      if (action.type === 'update') delete newState[action.originalTerm]
      if (!(action.term in processedTerms)) processedTerms[action.term] = processTerm(action.term, data)
      newState[action.term] = {categories: action.categories || {}, sense: action.sense || ''}
    }
    return newState
  }
  const [dictionary, dictionaryAction] = useReducer(editDictionary, {})
  return (
    <BuildContext.Provider value={dictionary}>
      <BuildEditContext.Provider value={dictionaryAction}>
        <Processed.Provider value={processedTerms}>{children}</Processed.Provider>
      </BuildEditContext.Provider>
    </BuildContext.Provider>
  )
}
