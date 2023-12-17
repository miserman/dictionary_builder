'use client'
import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'
import {StrictMode, useState} from 'react'
import {Resources} from './resources'
import Processor from './processor'

const theme = createTheme({palette: {mode: 'dark'}})

export default function Home() {
  const [loadingTerms, setLoadingTerms] = useState(true)
  const [loadingSynsets, setLoadingSynsets] = useState(true)

  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Resources setLoadingTerms={setLoadingTerms} setLoadingSynsets={setLoadingSynsets}>
          <Processor loading={{terms: loadingTerms, synsets: loadingSynsets}} />
        </Resources>
      </ThemeProvider>
    </StrictMode>
  )
}
