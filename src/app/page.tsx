'use client'
import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'
import {StrictMode, useReducer, useState} from 'react'
import {Resources} from './resources'
import {Building} from './building'
import {InfoDrawer, InfoDrawerActions, InfoDrawerContext, InfoDrawerState} from './infoDrawer'
import AddedTerms from './addedTerms'

const theme = createTheme({palette: {mode: 'dark', primary: {main: '#b393d3'}, success: {main: '#4986cb'}}})

const manageInfoDrawerState = (state: InfoDrawerState[], action: InfoDrawerActions) => {
  switch (action.type) {
    case 'add':
      return state.length && state[0].value === action.state.value ? [...state] : [action.state, ...state]
    case 'back':
      return [...state].splice(1, state.length)
    default:
      return []
  }
}

export default function Home() {
  const [loadingTerms, setLoadingTerms] = useState(true)
  const [loadingTermAssociations, setLoadingTermAssociations] = useState(true)
  const [loadingSenseKeys, setLoadingSenseKeys] = useState(true)
  const [loadingSynsetInfo, setLoadingSynsetInfo] = useState(true)

  const [infoDrawerState, updateInfoDrawerState] = useReducer(manageInfoDrawerState, [])
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
              <InfoDrawer state={infoDrawerState} edit={updateInfoDrawerState}></InfoDrawer>
            </InfoDrawerContext.Provider>
          </Building>
        </Resources>
      </ThemeProvider>
    </StrictMode>
  )
}
