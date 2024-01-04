'use client'
import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'
import {StrictMode, useReducer, useState} from 'react'
import {Resources} from './resources'
import {Building} from './building'
import {InfoDrawer, InfoDrawerActions, InfoDrawerContext, InfoDrawerState} from './infoDrawer'
import AddedTerms from './addedTerms'
import {EditorTerm} from './termEditor'

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
  const [editorTerm, setEditorTerm] = useState('')
  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Resources>
          <Building>
            <InfoDrawerContext.Provider value={updateInfoDrawerState}>
              <EditorTerm.Provider value={editorTerm}>
                <AddedTerms drawerOpen={!!infoDrawerState.length} setEditorTerm={setEditorTerm} />
                <InfoDrawer
                  state={infoDrawerState}
                  edit={updateInfoDrawerState}
                  setEditorTerm={setEditorTerm}
                ></InfoDrawer>
              </EditorTerm.Provider>
            </InfoDrawerContext.Provider>
          </Building>
        </Resources>
      </ThemeProvider>
    </StrictMode>
  )
}
