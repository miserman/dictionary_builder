import {type ReactNode, createContext, useEffect, useReducer, useState, useContext} from 'react'
import {type Settings, loadSettings} from './settingsMenu'
import {moveInHistory} from './history'
import {
  type Dict,
  type DictEntry,
  loadDictionary,
  loadHistory,
  removeStorage,
  setStorage,
  deleteDictionary,
  loadSenseMap,
  saveDictionary,
} from './storage'
import {SenseMapSetter} from './resources'

export type NumberObject = {[index: string]: number}
export type TermTypes = 'fixed' | 'glob' | 'regex'
export type DictionaryStorageAction =
  | {type: 'set'; name: string}
  | {type: 'add' | 'save'; name: string; dict: Dict; password?: string}
  | {type: 'delete'; name: string}
export type DictionaryActions =
  | {type: 'change_dict'; name: string; dict: Dict}
  | {type: 'history_bulk'; dict: Dict}
  | {type: 'remove'; term_id: string}
  | {type: 'remove_category'; name: string}
  | {type: 'rename_category'; name: string; newName: string}
  | {type: 'add_category'; name: string; weights: NumberObject}
  | {type: 'reweight_category'; name: string; weights: NumberObject}
  | {
      type: 'add' | 'update'
      term_id?: string
      term: string | RegExp
      term_type: TermTypes
      categories?: NumberObject
      sense?: string
      added?: number
    }
  | {
      type: 'replace'
      term_id: string
      term: string | RegExp
      term_type: TermTypes
      originalTerm: string | RegExp
      categories?: NumberObject
      sense?: string
      added?: number
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
export const SettingsContext = createContext<Settings>({
  selected: 'default',
  dictionary_names: ['default'],
  info_drawer_height: 30,
  term_editor_width: 200,
  use_db: true,
})
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
  Object.keys(dict).forEach(id => {
    const entry = dict[id]
    categories.forEach(category => {
      if (category in entry.categories) terms[id] = entry
    })
  })
  return terms
}
let termMap: {[index: string]: Set<string>} = {}
function mapTerms(dict: Dict) {
  termMap = {}
  Object.keys(dict).forEach(id => {
    const entry = dict[id]
    const term = entry.term || id
    entry.term = term
    if (term in termMap) {
      if (id !== term) termMap[term].add(id)
    } else {
      termMap[term] = new Set()
    }
  })
}
export function isInDict(term: string) {
  return term in termMap
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
  const senseMapSetter = useContext(SenseMapSetter)
  useEffect(() => {
    loadSenseMap(senseMapSetter, passwordRequester)
  }, [])
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
      removeStorage(action.name, 'dict_')
      removeStorage(action.name, 'dict_history_')
      deleteDictionary(action.name)
      changeDictionary('default')
    } else {
      if (!settings.dictionary_names.includes(action.name)) settings.dictionary_names.push(action.name)
      settings.selected = action.name
      if (action.type === 'set') {
        changeDictionary(action.name)
      } else {
        if (!settings.disable_storage) saveDictionary(action.name, action.dict, use_db, action.password)
        if (action.type === 'add') {
          dictionaryAction({type: 'change_dict', name: action.name, dict: action.dict})
        }
      }
    }
    localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
  }
  const editCategories = (state: string[], action: CategoryActions) => {
    let newState = state
    if (action.type === 'collect') {
      const cats: Set<string> = new Set(action.reset ? [] : state)
      Object.keys(action.dictionary).forEach(id => {
        const entry = action.dictionary[id]
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
      mapTerms(action.dict)
      loadHistory(action.name, history => editHistory({type: 'replace', history}), passwordRequester, use_db)
      categoryAction({type: 'collect', dictionary: action.dict, reset: true})
      return action.dict
    }
    const newState = {...state} as Dict
    if (action.type === 'rename_category') {
      let nTerms = 0
      Object.keys(newState).forEach(id => {
        const entry = newState[id]
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
      Object.keys(newState).forEach(id => {
        const entry = newState[id]
        if (action.name in entry.categories) {
          nTerms++
          if (entry.categories[action.name]) edited_terms[id] = entry.categories[action.name]
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
      Object.keys(action.weights).forEach(id => {
        if (id in newState) {
          if (action.weights[id]) {
            newState[id].categories[action.name] = action.weights[id]
          } else {
            delete newState[id].categories[action.name]
          }
        }
      })
      editHistory({type: 'add', entry: action})
    } else if (action.type === 'reweight_category') {
      const originalWeights: NumberObject = {}
      let nChanged = 0
      Object.keys(newState).forEach(id => {
        const entry = newState[id]
        if (entry.categories[action.name] !== action.weights[id]) {
          nChanged++
          originalWeights[id] = entry.categories[action.name] || 0
          if (action.weights[id]) {
            entry.categories[action.name] = action.weights[id]
          } else {
            delete entry.categories[action.name]
          }
        }
      })
      if (nChanged) editHistory({type: 'add', entry: {...action, originalWeights}})
    } else {
      // single term actions
      if (action.type === 'remove') {
        delete newState[action.term_id]
        editHistory({type: 'add', entry: {type: 'remove_term', name: action.term_id, value: state[action.term_id]}})
      } else {
        const term = 'string' === typeof action.term ? action.term : action.term.source
        if (!action.term_id) {
          if (action.type === 'add') {
            if (term in termMap) {
              action.term_id = term + (termMap[term].size + 1)
              termMap[term].add(action.term_id)
            } else {
              termMap[term] = new Set()
            }
          } else {
            action.term_id = term
          }
        }
        const id = action.term_id || term
        const existing = newState[id] || {}
        newState[id] = {
          term,
          added: existing.added || action.added || Date.now(),
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
              name: id,
              value: newState[id],
              originalName: original,
              originalValue: state[original],
            },
          })
        } else {
          if (id in state) {
            let change: HistoryTermEdit | undefined
            const original = state[id]
            const newEntry = newState[id]
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
                entry: {type: 'edit_term', name: id, value: change},
              })
            }
          } else {
            editHistory({type: 'add', entry: {type: 'add_term', name: id, value: newState[id]}})
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
      if (!settings.disable_storage) setStorage(settings.selected, 'dict_history_', newHistory, use_db)
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
