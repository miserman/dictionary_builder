'use client'
import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'
import {StrictMode, useReducer, useState} from 'react'
import {Resources} from './resources'
import {Building} from './building'
import {InfoDrawer, InfoDrawerActions, InfoDrawerContext, InfoDrawerState} from './infoDrawer'
import AddedTerms from './addedTerms'

const theme = createTheme({palette: {mode: 'dark'}})

export type InfoDrawerRequest = {type: 'reset'; direction?: 0} | {type: 'move'; direction: number}
const manageInfoDrawerState = (state: InfoDrawerState[], action: InfoDrawerActions) => {
  if (action.type === 'reset') return []
  if (action.type === 'trim') return [...action.state]
  return state.length && state[0].value === action.state.value ? [...state] : [action.state, ...state]
}

export default function Home() {
  const [loadingTerms, setLoadingTerms] = useState(true)
  const [loadingTermAssociations, setLoadingTermAssociations] = useState(true)
  const [loadingSenseKeys, setLoadingSenseKeys] = useState(true)
  const [loadingSynsetInfo, setLoadingSynsetInfo] = useState(true)

  const [infoDrawerState, updateInfoDrawerState] = useReducer(manageInfoDrawerState, [])
  const [lastStateLength, setLastStateLength] = useState(0)
  const [infoDrawerHistoryIndex, setInfoDrawerHistoryIndex] = useState(0)
  const navigateInfoDrawerHistory = ({type, direction}: InfoDrawerRequest) => {
    if (type === 'reset') {
      updateInfoDrawerState({type: 'reset'})
      setInfoDrawerHistoryIndex(0)
    } else {
      setInfoDrawerHistoryIndex(Math.max(0, Math.min(infoDrawerState.length - 1, infoDrawerHistoryIndex + direction)))
    }
    setLastStateLength(infoDrawerState.length)
  }
  if (infoDrawerHistoryIndex && lastStateLength !== infoDrawerState.length) {
    setLastStateLength(infoDrawerState.length)
    setInfoDrawerHistoryIndex(0)
  }
  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Resources
          loadingTerms={setLoadingTerms}
          loadingTermAssociations={setLoadingTermAssociations}
          loadingSenseKeys={setLoadingSenseKeys}
          loadingSynsetInfo={setLoadingSynsetInfo}
        >
          <Building>
            <InfoDrawerContext.Provider value={updateInfoDrawerState}>
              <AddedTerms
                loading={{
                  terms: loadingTerms,
                  termAssociations: loadingTermAssociations,
                  sense_keys: loadingSenseKeys,
                  synsetInfo: loadingSynsetInfo,
                }}
                drawerOpen={!!infoDrawerState.length}
              />
              <InfoDrawer
                state={infoDrawerState}
                index={infoDrawerHistoryIndex}
                request={navigateInfoDrawerHistory}
              ></InfoDrawer>
            </InfoDrawerContext.Provider>
          </Building>
        </Resources>
      </ThemeProvider>
    </StrictMode>
  )
}
