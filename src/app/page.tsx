'use client'
import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'
import {StrictMode, useReducer, useState} from 'react'
import {Resources} from './resources'
import {Building} from './building'
import {InfoDrawer, InfoDrawerActions, InfoDrawerContext, InfoDrawerState} from './infoDrawer'
import AddedTerms from './addedTerms'

const theme = createTheme({palette: {mode: 'dark'}})

const manageInfoDrawerState = (state: InfoDrawerState[], action: InfoDrawerActions) => {
  if (action.type === 'reset') return []
  return state.length && state[0].value === action.state.value ? [...state] : [action.state, ...state]
}

export default function Home() {
  const [loadingTerms, setLoadingTerms] = useState(true)
  const [loadingTermAssociations, setLoadingTermAssociations] = useState(true)
  const [loadingSynsets, setLoadingSynsets] = useState(true)
  const [loadingSynsetInfo, setLoadingSynsetInfo] = useState(true)

  const [infoDrawerState, updateInfoDrawerState] = useReducer(manageInfoDrawerState, [])
  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Resources
          loadingTerms={setLoadingTerms}
          loadingTermAssociations={setLoadingTermAssociations}
          loadingSynsets={setLoadingSynsets}
          loadingSynsetInfo={setLoadingSynsetInfo}
        >
          <Building>
            <InfoDrawerContext.Provider value={updateInfoDrawerState}>
              <AddedTerms
                loading={{
                  terms: loadingTerms,
                  termAssociations: loadingTermAssociations,
                  synsets: loadingSynsets,
                  synsetInfo: loadingSynsetInfo,
                }}
                drawerOpen={!!infoDrawerState.length}
              />
              <InfoDrawer state={infoDrawerState} update={updateInfoDrawerState}></InfoDrawer>
            </InfoDrawerContext.Provider>
          </Building>
        </Resources>
      </ThemeProvider>
    </StrictMode>
  )
}
