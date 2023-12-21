import {ReactNode, createContext, useContext, useMemo, useReducer} from 'react'
import {FixedTerm, FuzzyTerm} from './term'
import {ResourceContext, TermResources} from './resources'
import {globToRegex, termBounds} from './utils'

type NumberObject = {[index: string]: number}
type Dict = {[index: string]: {categories: NumberObject; sense: string}}
type DictionaryActions =
  | {type: 'remove'; term: string}
  | {type: 'add' | 'update'; term: string; categories?: NumberObject; sense?: string}
  | {type: 'replace'; term: string; originalTerm: string; categories?: NumberObject; sense?: string}
type CategoryActions = {type: 'collect'; dictionary: Dict; reset?: boolean} | {type: 'add' | 'remove'; cat: string}
export type DictionaryEditor = (action: DictionaryActions) => void
export const BuildContext = createContext<Dict>({})
export const BuildEditContext = createContext((action: DictionaryActions) => {})
export const AllCategoies = createContext<string[]>([])
export const CategoryEditContext = createContext((action: CategoryActions) => {})

type ProcessedTerms = {[index: string]: FuzzyTerm | FixedTerm}
export const Processed = createContext<ProcessedTerms>({})

const makeFixedTerm = (term: string, {terms, termLookup, termAssociations, synsetInfo}: TermResources) => {
  const processed = {
    type: 'fixed',
    term: term,
    categories: {},
    recognized: false,
    index: terms && termLookup ? termLookup[term] || -1 : -1,
    related: [],
    synsets: [],
  } as FixedTerm
  if (termAssociations && synsetInfo && terms && -1 !== processed.index) {
    processed.recognized = true
    const associated = termAssociations[processed.index]
    processed.related = associated[0]
      ? (Array.isArray(associated[0]) ? associated[0] : [associated[0]]).map(index => terms[index - 1])
      : []
    processed.synsets = associated[1]
      ? (Array.isArray(associated[1]) ? associated[1] : [associated[1]]).map(index => synsetInfo[index - 1])
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
    } as FuzzyTerm
    if (data.collapsedTerms) {
      for (let match: RegExpExecArray | null; (match = container.regex.exec(data.collapsedTerms)); ) {
        container.matches.push(match[0].replace(termBounds, ''))
      }
    }
    container.recognized = !!container.matches.length
    return container
  }
}

export function Building({children}: {children: ReactNode}) {
  const data = useContext(ResourceContext)
  const processedTerms = useMemo(() => {
    return {} as ProcessedTerms
  }, [])
  const editCategories = (state: string[], action: CategoryActions) => {
    switch (action.type) {
      case 'collect':
        const cats: Set<string> = new Set(action.reset ? [] : state)
        Object.keys(action.dictionary).forEach(term => {
          const {categories} = action.dictionary[term]
          Object.keys(categories).forEach(cat => cats.add(cat))
        })
        return Array.from(cats).sort()
      case 'add':
        return state.includes(action.cat) ? [...state] : [...state, action.cat].sort()
      default:
        return state.filter(cat => cat !== action.cat)
    }
  }
  const editDictionary = (state: Dict, action: DictionaryActions) => {
    const newState = {...state} as Dict
    if (action.type === 'remove') {
      delete newState[action.term]
    } else {
      if (action.type === 'replace') delete newState[action.originalTerm]
      if (!(action.term in processedTerms)) processedTerms[action.term] = processTerm(action.term, data)
      if (!action.sense) {
        const processed = processedTerms[action.term]
        if (processed.type === 'fixed' && processed.synsets.length === 1) {
          action.sense = processed.synsets[0].key
        }
      }
      newState[action.term] = {categories: action.categories || {}, sense: action.sense || ''}
    }
    categoryAction({type: 'collect', dictionary: newState})
    return newState
  }
  const [categories, categoryAction] = useReducer(editCategories, [])
  const [dictionary, dictionaryAction] = useReducer(editDictionary, {})
  return (
    <BuildContext.Provider value={dictionary}>
      <AllCategoies.Provider value={categories}>
        <BuildEditContext.Provider value={dictionaryAction}>
          <CategoryEditContext.Provider value={categoryAction}>
            <Processed.Provider value={processedTerms}>{children}</Processed.Provider>
          </CategoryEditContext.Provider>
        </BuildEditContext.Provider>
      </AllCategoies.Provider>
    </BuildContext.Provider>
  )
}
