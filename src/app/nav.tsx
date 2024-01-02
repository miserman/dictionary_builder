import {SavedSearch, SearchOff} from '@mui/icons-material'
import {AppBar, Autocomplete, Button, IconButton, ListItem, Stack, TextField, Toolbar, Tooltip} from '@mui/material'
import {type KeyboardEvent, type SyntheticEvent, useContext, useState} from 'react'
import {InfoDrawerContext} from './infoDrawer'
import {globToRegex, prepareRegex, special, wildcards} from './utils'
import {ResourceContext} from './resources'
import {SettingsMenu} from './settingsMenu'
import {DictionaryMenu} from './dictionaryMenu'
import {extractMatches} from './processTerms'
import type {TermTypes} from './building'

export function Nav({
  terms,
  exists,
  add,
}: {
  terms?: readonly string[]
  exists: (term: string) => boolean
  add: (term: string | RegExp, type: TermTypes) => void
}) {
  const [inputTerm, setInputTerm] = useState('')
  const [alreadyAdded, setAlreadyAdded] = useState(false)
  const [termSuggestions, setTermSuggestions] = useState<string[]>([])
  const [asRegEx, setAsRegEx] = useState(false)
  const updateInfoDrawerState = useContext(InfoDrawerContext)
  const {collapsedTerms} = useContext(ResourceContext)

  const addTerm = (newTerm?: SyntheticEvent | string) => {
    const toAdd = newTerm
      ? 'string' === typeof newTerm
        ? newTerm
        : 'innerText' in newTerm.target
        ? (newTerm.target.innerText as string)
        : inputTerm
      : inputTerm
    if (toAdd && !exists(toAdd)) {
      if (asRegEx) {
        let termPattern: string | RegExp = toAdd
        try {
          termPattern = new RegExp(termPattern)
        } catch {}
        add(termPattern, 'regex')
      } else {
        add(toAdd, 'fixed')
      }
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
      <Toolbar variant="dense" sx={{justifyContent: 'space-between'}} disableGutters>
        <DictionaryMenu />
        <Stack direction="row" sx={{width: 'calc(min(500px, 50%))'}} spacing={1}>
          <Autocomplete
            options={termSuggestions}
            value={inputTerm}
            onKeyUp={(e: KeyboardEvent<HTMLDivElement>) => {
              const inputValue = 'value' in e.target ? (e.target.value as string) : ''
              if (e.code === 'Enter' && (!inputValue || inputValue === inputTerm)) return addTerm(inputTerm)
              if (inputValue !== inputTerm) updateTerm(e)
              if (terms) {
                const suggestions: string[] = []
                if (inputTerm && collapsedTerms) {
                  let ex: RegExp | undefined
                  try {
                    ex = new RegExp(
                      asRegEx
                        ? prepareRegex(inputTerm)
                        : wildcards.test(inputTerm)
                        ? globToRegex(inputTerm)
                        : ';' + inputTerm + '[^;]*;',
                      'g'
                    )
                  } catch {
                    ex = new RegExp(';' + inputTerm.replace(special, '\\%&') + ';', 'g')
                  }
                  extractMatches('', ex, collapsedTerms, suggestions, 100)
                }
                setTermSuggestions(suggestions)
              }
            }}
            onChange={updateTerm}
            renderOption={(props, option) => (
              <ListItem {...props} key={option} onClick={addTerm}>
                {option}
              </ListItem>
            )}
            renderInput={params => (
              <TextField
                {...params}
                size="small"
                placeholder="Term to add"
                value={inputTerm}
                onChange={updateTerm}
                error={alreadyAdded}
              ></TextField>
            )}
            filterOptions={x => x}
            selectOnFocus
            clearOnBlur
            clearOnEscape
            handleHomeEndKeys
            fullWidth
            freeSolo
          ></Autocomplete>
          <Tooltip title={'regular expression characters are ' + (asRegEx ? 'active' : 'escaped')}>
            <IconButton aria-label="toggle regular expression" onClick={() => setAsRegEx(!asRegEx)}>
              {asRegEx ? <SavedSearch /> : <SearchOff />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            disabled={!inputTerm}
            onClick={() => {
              if (inputTerm) updateInfoDrawerState({type: 'add', state: {type: 'term', value: inputTerm}})
            }}
          >
            View
          </Button>
          <Button variant="contained" onClick={() => addTerm()} disabled={!inputTerm || alreadyAdded}>
            Add
          </Button>
        </Stack>
        <SettingsMenu />
      </Toolbar>
    </AppBar>
  )
}
