import {ReactNode, createContext, useContext, useEffect, useMemo, useReducer, useState} from 'react'
import {FixedTerm, FuzzyTerm} from './term'
import {ResourceContext, TermResources} from './resources'
import {extractMatches, globToRegex, prepareRegex, wildcard} from './utils'
import {loadSettings} from './settingsMenu'

export type NumberObject = {[index: string]: number}
export type DictEntry = {added: number; type: 'fixed' | 'glob' | 'regex'; categories: NumberObject; sense: string}
export type Dict = {[index: string]: DictEntry}
export type DictionaryStorageAction =
  | {type: 'set' | 'add' | 'save'; name: string; dict: Dict}
  | {type: 'delete'; name: string}
type DictionaryActions =
  | {type: 'change_dict'; dict: Dict}
  | {type: 'remove'; term: string | RegExp}
  | {type: 'add' | 'update'; term: string | RegExp; term_type: string; categories?: NumberObject; sense?: string}
  | {
      type: 'replace'
      term: string | RegExp
      term_type: string
      originalTerm: string | RegExp
      categories?: NumberObject
      sense?: string
    }
type CategoryActions = {type: 'collect'; dictionary: Dict; reset?: boolean} | {type: 'add' | 'remove'; cat: string}
export type DictionaryEditor = (action: DictionaryActions) => void
export const DictionaryName = createContext('default')
export const DictionaryNameSetter = createContext((name: string) => {})
export const Dictionaries = createContext<{[index: string]: Dict}>({})
export const ManageDictionaries = createContext((action: DictionaryStorageAction) => {})
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
    processed.related = associated[0]
      ? (Array.isArray(associated[0]) ? associated[0] : [associated[0]]).map(index => terms[index - 1])
      : []
    processed.synsets = associated[1]
      ? (Array.isArray(associated[1]) ? associated[1] : [associated[1]]).map(index => synsetInfo[index - 1])
      : []
  }
  return processed
}

export const processTerm = (term: string | RegExp, data: TermResources) => {
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

export function Building({children}: {children: ReactNode}) {
  const data = useContext(ResourceContext)
  const processedTerms = useMemo(() => {
    return {} as ProcessedTerms
  }, [])
  const settings = useMemo(loadSettings, [])
  const dictionaries = useMemo(() => {
    const stored = {default: {}} as {[index: string]: Dict}
    if ('undefined' !== typeof window) {
      const names = settings.dictionary_names || []
      names.forEach(name => {
        stored[name] = JSON.parse(localStorage.getItem('dict_' + name) || '{}') as Dict
      })
    }
    return stored
  }, [settings])
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
  const manageDictionaries = (action: DictionaryStorageAction) => {
    if (action.type === 'delete') {
      delete dictionaries[action.name]
      localStorage.removeItem('dict_' + action.name)
      if (action.name === 'default') dictionaries.default = {}
      if (name === action.name) {
        setCurrent('default')
        dictionaryAction({type: 'change_dict', dict: dictionaries.default})
      }
    } else {
      if (action.type !== 'set') dictionaries[action.name] = action.dict
      if (name) localStorage.setItem('dict_' + action.name, JSON.stringify(dictionaries[name]))
      if (action.type !== 'save') {
        setCurrent(action.name)
        dictionaryAction({type: 'change_dict', dict: dictionaries[action.name]})
      }
      localStorage.setItem('dict_' + action.name, JSON.stringify(dictionaries[action.name]))
    }
    settings.dictionary_names = Object.keys(dictionaries)
    localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
  }
  const editDictionary = (state: Dict, action: DictionaryActions) => {
    if (action.type === 'change_dict') {
      categoryAction({type: 'collect', dictionary: action.dict, reset: true})
      return action.dict
    }
    const newState = {...state} as Dict
    const term = 'string' === typeof action.term ? action.term : action.term.source
    if (action.type === 'remove') {
      delete newState[term]
    } else {
      if (action.type === 'replace')
        delete newState['string' === typeof action.originalTerm ? action.originalTerm : action.originalTerm.source]
      const processed = processedTerms[term]
      if (!processed || action.term_type !== processed.term_type) {
        processedTerms[term] = processTerm(action.term, data)
      }
      if (!action.sense) {
        const processed = processedTerms[term]
        if (processed.type === 'fixed' && processed.synsets.length === 1 && data.sense_keys) {
          action.sense = data.sense_keys[processed.synsets[0].index]
        }
      }
      const existing = newState[term] || {}
      newState[term] = {
        added: existing.added || Date.now(),
        type: existing.type || (processed && processed.term_type) || 'fixed',
        categories: action.categories || existing.categories || {},
        sense: action.sense || existing.sense || '',
      }
    }
    categoryAction({type: 'collect', dictionary: newState})
    manageDictionaries({type: 'save', name, dict: newState})
    return newState
  }
  const [name, setName] = useState(settings.selected || 'default')
  const setCurrent = (name: string) => {
    const current = name in dictionaries ? name : 'default'
    setName(current)
    settings.selected = current
    localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
  }
  const [categories, categoryAction] = useReducer(editCategories, [])
  const [dictionary, dictionaryAction] = useReducer(editDictionary, dictionaries.default)
  useEffect(() => {
    if (!settings.selected || !(settings.selected in dictionaries)) settings.selected = 'default'
    dictionaryAction({
      type: 'change_dict',
      dict: dictionaries[settings.selected],
    })
  }, [settings, dictionaries])
  return (
    <Dictionaries.Provider value={dictionaries}>
      <ManageDictionaries.Provider value={manageDictionaries}>
        <DictionaryName.Provider value={name}>
          <BuildContext.Provider value={dictionary}>
            <AllCategoies.Provider value={categories}>
              <DictionaryNameSetter.Provider
                value={(name: string) => {
                  setCurrent(name)
                }}
              >
                <BuildEditContext.Provider value={dictionaryAction}>
                  <CategoryEditContext.Provider value={categoryAction}>
                    <Processed.Provider value={processedTerms}>{children}</Processed.Provider>
                  </CategoryEditContext.Provider>
                </BuildEditContext.Provider>
              </DictionaryNameSetter.Provider>
            </AllCategoies.Provider>
          </BuildContext.Provider>
        </DictionaryName.Provider>
      </ManageDictionaries.Provider>
    </Dictionaries.Provider>
  )
}
