'use client'

import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'

const theme = createTheme({
  palette: {mode: 'dark', primary: {main: '#b393d3'}, success: {main: '#4986cb'}, error: {main: '#e0561c'}},
})

export default function Theme({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  )
}
