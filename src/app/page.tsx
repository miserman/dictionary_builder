'use client'
import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'
import {StrictMode, useReducer, useState} from 'react'
import {Resources} from './resources'
import {Building} from './building'
import {type InfoDrawerActions, InfoDrawerContext, InfoDrawerSetter, InfoDrawerState} from './infoDrawer'
import {EditorTerm, EditorTermSetter} from './termEditor'
import {Content} from './content'
import {showTableTerm} from './table'

const theme = createTheme({
  palette: {mode: 'dark', primary: {main: '#b393d3'}, success: {main: '#4986cb'}, error: {main: '#e0561c'}},
})

let resizeAnimationFrame = -1
function dispatchResize() {
  window.dispatchEvent(new Event('resize'))
}
const manageInfoDrawerState = (state: InfoDrawerState[], action: InfoDrawerActions) => {
  if (action.type === 'reset' || !state.length) {
    cancelAnimationFrame(resizeAnimationFrame)
    resizeAnimationFrame = requestAnimationFrame(dispatchResize)
  }
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
  const updateEditorTerm = (term: string, fromGraph?: boolean) => {
    requestAnimationFrame(() => {
      if ((!editorTerm && !fromGraph) || !term) {
        cancelAnimationFrame(resizeAnimationFrame)
        resizeAnimationFrame = requestAnimationFrame(dispatchResize)
      }
      showTableTerm(term)
      setEditorTerm(term)
    })
  }
  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Resources>
          <Building>
            <InfoDrawerContext.Provider value={infoDrawerState}>
              <InfoDrawerSetter.Provider
                value={(action: InfoDrawerActions) => requestAnimationFrame(() => updateInfoDrawerState(action))}
              >
                <EditorTerm.Provider value={editorTerm}>
                  <EditorTermSetter.Provider value={updateEditorTerm}>
                    <Content />
                  </EditorTermSetter.Provider>
                </EditorTerm.Provider>
              </InfoDrawerSetter.Provider>
            </InfoDrawerContext.Provider>
          </Building>
        </Resources>
      </ThemeProvider>
    </StrictMode>
  )
}
