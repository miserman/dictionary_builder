import {AppBar, Autocomplete, Button, TextField, Toolbar} from '@mui/material'
import {SyntheticEvent, useMemo, useState} from 'react'

export function Nav({
  terms,
  exists,
  add,
}: {
  terms?: readonly string[]
  exists: (term: string) => boolean
  add: (term: string) => void
}) {
  const termMap = useMemo(() => {
    return terms ? new Map(terms.map(term => [term, true])) : new Map()
  }, [terms])
  const [inputTerm, setInputTerm] = useState('')
  const [alreadyAdded, setAlreadyAdded] = useState(false)
  const [termSuggestions, setTermSuggestions] = useState<string[]>([])

  const addTerm = (newTerm?: SyntheticEvent | string) => {
    const toAdd = newTerm
      ? 'string' === typeof newTerm
        ? newTerm
        : 'innerText' in newTerm.target
        ? (newTerm.target.innerText as string)
        : inputTerm
      : inputTerm
    if (toAdd && !exists(toAdd)) {
      add(toAdd)
      setTermSuggestions([])
      setInputTerm('')
    }
  }
  const updateTerm = (e: SyntheticEvent) => {
    const input = e.target
    if (input && 'value' in input) {
      const term = (input.value as string).toLowerCase()
      setAlreadyAdded(exists(term))
      setInputTerm(term)
    }
  }

  return (
    <AppBar component="nav">
      <Toolbar variant="dense" disableGutters>
        <Autocomplete
          options={termSuggestions}
          value={inputTerm}
          onKeyUp={(e: SyntheticEvent) => {
            if ('code' in e && e.code === 'Enter') {
              addTerm()
            } else if (terms) {
              const suggestions: string[] = []
              if (inputTerm.length > 2) {
                termMap.forEach((_, term) => {
                  if (term.startsWith(inputTerm)) suggestions.push(term)
                })
              }
              setTermSuggestions(suggestions)
            }
          }}
          onChange={updateTerm}
          renderOption={(props, option) => (
            <li {...props} key={option} onClick={addTerm}>
              {option}
            </li>
          )}
          renderInput={params => (
            <TextField
              {...params}
              variant="filled"
              label="Term to add"
              value={inputTerm}
              onKeyDown={(e: SyntheticEvent) => {
                if ('code' in e && e.code === 'Enter') addTerm()
              }}
              onChange={updateTerm}
              error={alreadyAdded}
            ></TextField>
          )}
          fullWidth
          freeSolo
        ></Autocomplete>
        <Button sx={{p: 2}} variant="contained" onClick={() => addTerm()} disabled={alreadyAdded}>
          Add
        </Button>
      </Toolbar>
    </AppBar>
  )
}
