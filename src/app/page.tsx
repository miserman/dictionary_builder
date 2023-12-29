'use client'
import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'
import {StrictMode, useReducer} from 'react'
import {Resources} from './resources'
import {Building} from './building'
import {InfoDrawer, InfoDrawerActions, InfoDrawerContext, InfoDrawerState} from './infoDrawer'
import AddedTerms from './addedTerms'

const theme = createTheme({
  palette: {mode: 'dark', primary: {main: '#b393d3'}, success: {main: '#4986cb'}, error: {main: '#e0561c'}},
})

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
  const [infoDrawerState, updateInfoDrawerState] = useReducer(manageInfoDrawerState, [])
  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Resources>
          <Building>
            <InfoDrawerContext.Provider value={updateInfoDrawerState}>
              <AddedTerms drawerOpen={!!infoDrawerState.length} />
              <InfoDrawer state={infoDrawerState} edit={updateInfoDrawerState}></InfoDrawer>
            </InfoDrawerContext.Provider>
          </Building>
        </Resources>
      </ThemeProvider>
    </StrictMode>
  )
}
