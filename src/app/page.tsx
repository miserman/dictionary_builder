'use client'
import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'
import {StrictMode, useState} from 'react'
import {Resources} from './resources'
import Processor from './processor'
import {Building} from './building'

const theme = createTheme({palette: {mode: 'dark'}})

export default function Home() {
  const [loadingTerms, setLoadingTerms] = useState(true)
  const [loadingTermAssociations, setLoadingTermAssociations] = useState(true)
  const [loadingSynsets, setLoadingSynsets] = useState(true)
  const [loadingSynsetInfo, setLoadingSynsetInfo] = useState(true)

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
            <Processor
              loading={{
                terms: loadingTerms,
                termAssociations: loadingTermAssociations,
                synsets: loadingSynsets,
                synsetInfo: loadingSynsetInfo,
              }}
            />
          </Building>
        </Resources>
      </ThemeProvider>
    </StrictMode>
  )
}
