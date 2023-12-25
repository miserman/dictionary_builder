import {SavedSearch, SearchOff} from '@mui/icons-material'
import {AppBar, Autocomplete, Button, IconButton, ListItem, Stack, TextField, Toolbar, Tooltip} from '@mui/material'
import {SyntheticEvent, useContext, useState} from 'react'
import {SortOptions} from './addedTerms'
import {InfoDrawerContext} from './infoDrawer'
import {extractMatches, globToRegex, prepareRegex, special, wildcards} from './utils'
import {ResourceContext} from './resources'
import {SettingsMenu} from './settingsMenu'
import {DictionaryMenu} from './dictionaryMenu'

export function Nav({
  terms,
  exists,
  add,
  asTable,
  displayToggle,
  sortBy,
  setSortBy,
}: {
  terms?: readonly string[]
  exists: (term: string) => boolean
  add: (term: string | RegExp, type: string) => void
  asTable: boolean
  displayToggle: (e: SyntheticEvent, checked: boolean) => void
  sortBy: SortOptions
  setSortBy: (by: SortOptions) => void
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
            onKeyUp={(e: SyntheticEvent) => {
              if ('code' in e && e.code === 'Enter') {
                const newValue = 'value' in e.target ? (e.target.value as string) : ''
                if (newValue === inputTerm) addTerm(newValue)
              } else if (terms) {
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
                  extractMatches(ex, collapsedTerms, suggestions, 100)
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
                placeholder="term to add"
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
        <SettingsMenu asTable={asTable} displayToggle={displayToggle} sortBy={sortBy} setSortBy={setSortBy} />
      </Toolbar>
    </AppBar>
  )
}
