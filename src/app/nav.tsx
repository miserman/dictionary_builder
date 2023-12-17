import {AppBar, Autocomplete, Button, TextField, Toolbar} from '@mui/material'
import {SyntheticEvent, useState} from 'react'

export function Nav({
  all_terms,
  exists,
  add,
}: {
  all_terms?: string[]
  exists: (term: string) => boolean
  add: (term: string) => void
}) {
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

  return (
    <AppBar component="nav">
      <Toolbar variant="dense" disableGutters>
        <Autocomplete
          options={termSuggestions}
          value={inputTerm}
          onKeyUp={(e: SyntheticEvent) => {
            if ('code' in e && e.code === 'Enter') {
              addTerm()
            } else if (all_terms) {
              setTermSuggestions(inputTerm.length > 2 ? all_terms.filter(term => term.startsWith(inputTerm)) : [])
            }
          }}
          onChange={(e: SyntheticEvent) => {
            const input = e.target
            if (input && 'value' in input) {
              setAlreadyAdded(exists(input.value as string))
              setInputTerm(input.value as string)
            }
          }}
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
              onChange={(e: SyntheticEvent) => {
                const input = e.target
                if (input && 'value' in input) {
                  setAlreadyAdded(exists(input.value as string))
                  setInputTerm(input.value as string)
                }
              }}
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
