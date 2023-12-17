import {ReactNode, createContext, useReducer} from 'react'

function editDictionary(state: Dict, action: DictionaryActions) {
  const newState = {...state} as Dict
  if (action.type === 'remove') {
    delete newState[action.term]
  } else {
    newState[action.term] = {categories: action.categories || {}, sense: action.sense || ''}
  }
  return newState
}

type Dict = {[index: string]: {categories: {[index: string]: number}; sense: string}}
type DictionaryActions =
  | {type: 'remove'; term: string}
  | {type: 'update' | 'add'; term: string; categories?: {[index: string]: number}; sense?: string}
export const BuildContext = createContext<Dict>({})
export const BuildEditContext = createContext((action: DictionaryActions) => {})

export function Building({children}: {children: ReactNode}) {
  const [dictionary, dictionaryAction] = useReducer(editDictionary, {})
  return (
    <BuildContext.Provider value={dictionary}>
      <BuildEditContext.Provider value={dictionaryAction}>{children}</BuildEditContext.Provider>
    </BuildContext.Provider>
  )
}
