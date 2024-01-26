import {type ReactNode, createContext, useEffect, useReducer, useState} from 'react'
import {type Settings, loadSettings} from './settingsMenu'
import {moveInHistory} from './history'
import {type Dict, type DictEntry, loadDictionary, loadHistory, removeStorage, setStorage} from './storage'

export type NumberObject = {[index: string]: number}
export type TermTypes = 'fixed' | 'glob' | 'regex'
export type DictionaryStorageAction =
  | {type: 'set'; name: string}
  | {type: 'add' | 'save'; name: string; dict: Dict; password?: string}
  | {type: 'delete'; name: string}
export type DictionaryActions =
  | {type: 'change_dict'; name: string; dict: Dict}
  | {type: 'history_bulk'; dict: Dict}
  | {type: 'remove'; term: string | RegExp}
  | {type: 'remove_category'; name: string}
  | {type: 'rename_category'; name: string; newName: string}
  | {type: 'add_category'; name: string; weights: NumberObject}
  | {type: 'reweight_category'; name: string; weights: NumberObject}
  | {type: 'add' | 'update'; term: string | RegExp; term_type: TermTypes; categories?: NumberObject; sense?: string}
  | {
      type: 'replace'
      term: string | RegExp
      term_type: TermTypes
      originalTerm: string | RegExp
      categories?: NumberObject
      sense?: string
    }
type CategoryActions = {type: 'collect'; dictionary: Dict; reset?: boolean} | {type: 'add' | 'remove'; cat: string}
type TermCategoryEdit = {category: string; from: number; to: number}
type HistoryTermEdit =
  | {field: 'type' | 'sense'; new: string; original: string}
  | {field: 'categories'; edits: TermCategoryEdit[]}
export type HistoryEntry = {time?: number; name: string} & (
  | {type: 'add_category' | 'remove_category'; weights: NumberObject}
  | {type: 'reweight_category'; weights: NumberObject; originalWeights: NumberObject}
  | {type: 'rename_category'; originalName: string}
  | {type: 'add_term' | 'remove_term'; value: DictEntry}
  | {type: 'replace_term'; value: DictEntry; originalName: string; originalValue: DictEntry}
  | {type: 'edit_term'; value: HistoryTermEdit}
)
export type HistoryContainer = {edits: HistoryEntry[]; position: number}
export type EditHistoryAction =
  | {type: 'add' | 'remove'; entry: HistoryEntry}
  | {type: 'replace'; history: HistoryContainer}
  | {type: 'clear'}
export type DictionaryEditor = (action: DictionaryActions) => void
export const SettingsContext = createContext<Settings>({selected: 'default', dictionary_names: ['default']})
export const SettingEditor = createContext((settings: Settings) => {})
export const ManageDictionaries = createContext((action: DictionaryStorageAction) => {})
export const BuildContext = createContext<Dict>({})
export const BuildEditContext = createContext((action: DictionaryActions) => {})
export const AllCategories = createContext<string[]>([])
export const CategoryEditContext = createContext((action: CategoryActions) => {})
export const EditHistory = createContext<HistoryContainer>({edits: [], position: -1})
export const EditHistoryEditor = createContext((action: EditHistoryAction) => {})
export const HistoryStepper = createContext((direction: number) => {})
export const PasswordEnterer = createContext('')
const defaultRequester = () => async (password: string) => {
  return
}
export type PasswordRequestCallback = typeof defaultRequester
export const PasswordPrompter = createContext((name: string, resolve?: PasswordRequestCallback) => {
  return
})
export const PasswordResolve = createContext(async (password: string) => {
  return
})

export function termsByCategory(categories: string[], dict: Dict) {
  const terms: {[index: string]: DictEntry} = {}
  Object.keys(dict).forEach(term => {
    const entry = dict[term]
    categories.forEach(category => {
      if (category in entry.categories) terms[term] = entry
    })
  })
  return terms
}

function byLowerAlphabet(a: string, b: string) {
  return a.toLowerCase() > b.toLowerCase() ? 1 : -1
}
export function Building({children}: {children: ReactNode}) {
  const [promptPassword, setPromptPassword] = useState('')
  const [requester, setRequester] = useState(defaultRequester)
  const passwordRequester = (name: string, resolve?: PasswordRequestCallback) => {
    if (resolve) {
      setPromptPassword(name)
      setRequester(resolve)
    } else {
      setPromptPassword('')
      setRequester(defaultRequester)
    }
  }
  const [settings, updateSettings] = useState(loadSettings())
  const use_db = !!settings.use_db
  const changeDictionary = (name: string) => {
    loadDictionary(
      name,
      dict => {
        dictionaryAction({type: 'change_dict', name, dict})
      },
      passwordRequester,
      use_db
    )
  }
  const editHistory = (action: EditHistoryAction) => {
    if (action.type === 'replace') {
      setHistory(action.history)
      return
    }
    const newHistory = action.type === 'clear' ? [] : [...history.edits]
    let position = action.type === 'clear' ? -1 : history.position
    if (action.type === 'remove') {
      newHistory.pop()
    } else if (action.type !== 'clear') {
      if (position > -1) {
        newHistory.splice(0, position + 1)
        position = -1
      }
      if (!action.entry.time) action.entry.time = Date.now()
      newHistory.splice(0, 0, action.entry)
    }
    if (newHistory.length > 1000) newHistory.splice(1000, newHistory.length - 999)
    if (!settings.disable_storage)
      setStorage(settings.selected, 'dict_history_', {edits: newHistory, position: position}, use_db)
    setHistory({edits: newHistory, position: position})
  }
  const [history, setHistory] = useState<{edits: HistoryEntry[]; position: number}>({edits: [], position: -1})

  const manageDictionaries = (action: DictionaryStorageAction) => {
    if (action.type === 'delete') {
      if (action.name !== 'default') settings.dictionary_names.splice(settings.dictionary_names.indexOf(action.name), 1)
      settings.selected = 'default'
      updateSettings({...settings})
      removeStorage(action.name, 'dict_', use_db)
      removeStorage(action.name, 'dict_history_', use_db)
      changeDictionary('default')
    } else {
      if (!settings.dictionary_names.includes(action.name)) settings.dictionary_names.push(action.name)
      settings.selected = action.name
      if (action.type === 'set') {
        changeDictionary(action.name)
      } else {
        if (!settings.disable_storage) setStorage(action.name, 'dict_', action.dict, use_db, action.password)
        if (action.type === 'add') {
          dictionaryAction({type: 'change_dict', name: action.name, dict: action.dict})
        }
      }
    }
    setStorage('dictionary_builder_settings', '', settings, use_db)
  }
  const editCategories = (state: string[], action: CategoryActions) => {
    let newState = state
    if (action.type === 'collect') {
      const cats: Set<string> = new Set(action.reset ? [] : state)
      Object.keys(action.dictionary).forEach(term => {
        const entry = action.dictionary[term]
        entry && entry.categories && Object.keys(entry.categories).forEach(cat => cats.add(cat))
      })
      newState = Array.from(cats).sort(byLowerAlphabet)
    } else if (action.type === 'add') {
      if (!state.includes(action.cat)) newState = [...state, action.cat].sort(byLowerAlphabet)
    } else {
      newState = state.filter(cat => cat !== action.cat)
    }
    return state.length !== newState.length || state.join('') !== newState.join('') ? newState : state
  }
  const [categories, categoryAction] = useReducer(editCategories, [])
  const editDictionary = (state: Dict, action: DictionaryActions) => {
    if (action.type === 'history_bulk') {
      categoryAction({type: 'collect', dictionary: action.dict, reset: true})
      manageDictionaries({type: 'save', name: settings.selected, dict: action.dict})
      return action.dict
    }
    if (action.type === 'change_dict') {
      loadHistory(action.name, history => editHistory({type: 'replace', history}), passwordRequester, use_db)
      categoryAction({type: 'collect', dictionary: action.dict, reset: true})
      return action.dict
    }
    const newState = {...state} as Dict
    if (action.type === 'rename_category') {
      let nTerms = 0
      Object.keys(newState).forEach(term => {
        const entry = newState[term]
        if (action.name in entry.categories) {
          nTerms++
          if (entry.categories[action.name]) entry.categories[action.newName] = entry.categories[action.name]
          delete entry.categories[action.name]
        }
      })
      categoryAction({type: 'remove', cat: action.name})
      categoryAction({type: 'add', cat: action.newName})
      if (nTerms) {
        editHistory({
          type: 'add',
          entry: {type: 'rename_category', name: action.newName, originalName: action.name},
        })
      }
    } else if (action.type === 'remove_category') {
      const edited_terms: NumberObject = {}
      let nTerms = 0
      Object.keys(newState).forEach(term => {
        const entry = newState[term]
        if (action.name in entry.categories) {
          nTerms++
          if (entry.categories[action.name]) edited_terms[term] = entry.categories[action.name]
          delete entry.categories[action.name]
        }
      })
      if (nTerms) {
        editHistory({
          type: 'add',
          entry: {type: 'remove_category', name: action.name, weights: edited_terms},
        })
      }
    } else if (action.type === 'add_category') {
      Object.keys(action.weights).forEach(term => {
        if (term in newState) {
          if (action.weights[term]) {
            newState[term].categories[action.name] = action.weights[term]
          } else {
            delete newState[term].categories[action.name]
          }
        }
      })
      editHistory({type: 'add', entry: action})
    } else if (action.type === 'reweight_category') {
      const originalWeights: NumberObject = {}
      let nChanged = 0
      Object.keys(newState).forEach(term => {
        const entry = newState[term]
        if (entry.categories[action.name] !== action.weights[term]) {
          nChanged++
          originalWeights[term] = entry.categories[action.name] || 0
          if (action.weights[term]) {
            entry.categories[action.name] = action.weights[term]
          } else {
            delete entry.categories[action.name]
          }
        }
      })
      if (nChanged) editHistory({type: 'add', entry: {...action, originalWeights}})
    } else {
      const term = 'string' === typeof action.term ? action.term : action.term.source
      if (action.type === 'remove') {
        delete newState[term]
        editHistory({type: 'add', entry: {type: 'remove_term', name: term, value: state[term]}})
      } else {
        const existing = newState[term] || {}
        newState[term] = {
          added: existing.added || Date.now(),
          type: action.term_type || existing.type || 'fixed',
          categories: {...(action.categories || existing.categories || {})},
          sense: 'sense' in action ? action.sense || '' : existing.sense || '',
        }
        if (action.type === 'replace') {
          const original = 'string' === typeof action.originalTerm ? action.originalTerm : action.originalTerm.source
          delete newState[original]
          editHistory({
            type: 'add',
            entry: {
              type: 'replace_term',
              name: term,
              value: newState[term],
              originalName: original,
              originalValue: state[original],
            },
          })
        } else {
          if (term in state) {
            let change: HistoryTermEdit | undefined
            const original = state[term]
            const newEntry = newState[term]
            if (original.sense && newEntry.sense !== original.sense) {
              change = {field: 'sense', new: newEntry.sense, original: original.sense}
            } else {
              const catChanges: TermCategoryEdit[] = []
              Object.keys(newEntry.categories).forEach(cat => {
                if (newEntry.categories[cat] !== original.categories[cat]) {
                  catChanges.push({
                    category: cat,
                    from: original.categories[cat] || 0,
                    to: newEntry.categories[cat] || 0,
                  })
                }
              })
              Object.keys(original.categories).forEach(cat => {
                if (!(cat in newEntry.categories)) {
                  catChanges.push({
                    category: cat,
                    from: original.categories[cat],
                    to: 0,
                  })
                }
              })
              if (catChanges.length) {
                change = {field: 'categories', edits: catChanges}
              } else if (newEntry.sense !== original.sense) {
                change = {field: 'sense', new: newEntry.sense, original: original.sense}
              }
            }
            if (change) {
              editHistory({
                type: 'add',
                entry: {type: 'edit_term', name: term, value: change},
              })
            }
          } else {
            editHistory({type: 'add', entry: {type: 'add_term', name: term, value: newState[term]}})
          }
        }
      }
      categoryAction({type: 'collect', dictionary: newState})
    }
    manageDictionaries({type: 'save', name: settings.selected, dict: newState})
    return newState
  }
  const [dictionary, dictionaryAction] = useReducer(editDictionary, {})
  useEffect(() => {
    if (!settings.dictionary_names.includes(settings.selected)) settings.selected = 'default'
    changeDictionary(settings.selected)
  }, [])
  const historyStep = (direction: number) => {
    const to = Math.min(Math.max(-1, history.position + direction), history.edits.length - 1)

    if (to !== history.position) {
      const newDict = {...dictionary}
      const newHistory = {...history}
      moveInHistory(to, newHistory, newDict)
      editHistory({type: 'replace', history: newHistory})
      setStorage(settings.selected, 'dict_history_', newHistory, use_db)
      dictionaryAction({type: 'history_bulk', dict: newDict})
    }
  }
  return (
    <SettingsContext.Provider value={settings}>
      <SettingEditor.Provider value={updateSettings}>
        <PasswordEnterer.Provider value={promptPassword}>
          <PasswordPrompter.Provider value={passwordRequester}>
            <PasswordResolve.Provider value={requester}>
              <EditHistory.Provider value={history}>
                <EditHistoryEditor.Provider value={editHistory}>
                  <ManageDictionaries.Provider value={manageDictionaries}>
                    <BuildContext.Provider value={dictionary}>
                      <AllCategories.Provider value={categories}>
                        <BuildEditContext.Provider value={dictionaryAction}>
                          <CategoryEditContext.Provider value={categoryAction}>
                            <HistoryStepper.Provider value={historyStep}>{children}</HistoryStepper.Provider>
                          </CategoryEditContext.Provider>
                        </BuildEditContext.Provider>
                      </AllCategories.Provider>
                    </BuildContext.Provider>
                  </ManageDictionaries.Provider>
                </EditHistoryEditor.Provider>
              </EditHistory.Provider>
            </PasswordResolve.Provider>
          </PasswordPrompter.Provider>
        </PasswordEnterer.Provider>
      </SettingEditor.Provider>
    </SettingsContext.Provider>
  )
}
