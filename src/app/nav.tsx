import {SavedSearch, SearchOff} from '@mui/icons-material'
import {AppBar, Autocomplete, Button, IconButton, Stack, TextField, Toolbar, Tooltip} from '@mui/material'
import {type SyntheticEvent, useContext, useState} from 'react'
import {InfoDrawerSetter} from './infoDrawer'
import {globToRegex, prepareRegex, special, wildcards} from './lib/utils'
import {ResourceContext} from './resources'
import {SettingsMenu} from './settingsMenu'
import {DictionaryMenu} from './dictionaryMenu'
import {extractMatches} from './processTerms'
import {isInDict, type TermTypes} from './building'
import {showTableTerm} from './table'

export function Nav({
  terms,
  asTable,
  setAsTable,
  add,
}: {
  terms?: readonly string[]
  asTable: boolean
  setAsTable: (asTable: boolean) => void
  add: (term: string | RegExp, type: TermTypes) => void
}) {
  const [inputTerm, setInputTerm] = useState('')
  const [highlightedTerm, setHighlightedTerm] = useState('')
  const [alreadyAdded, setAlreadyAdded] = useState(false)
  const [termSuggestions, setTermSuggestions] = useState<string[]>([])
  const [asRegEx, setAsRegEx] = useState(false)
  const updateInfoDrawerState = useContext(InfoDrawerSetter)
  const {collapsedTerms} = useContext(ResourceContext)

  const addTerm = (newTerm?: SyntheticEvent | string) => {
    const toAdd = newTerm
      ? 'string' === typeof newTerm
        ? newTerm
        : 'innerText' in newTerm.target
        ? (newTerm.target.innerText as string)
        : inputTerm
      : inputTerm
    if (toAdd) {
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
    if (input && 'value' in input && 'innerText' in input) {
      const term = (input['string' === typeof input.value ? 'value' : 'innerText'] as string).toLowerCase()
      setAlreadyAdded(isInDict(term))
      setInputTerm(term)
    } else {
      setInputTerm('')
    }
  }
  return (
    <AppBar component="nav">
      <Toolbar variant="dense" sx={{justifyContent: 'space-between'}} disableGutters>
        <DictionaryMenu />
        <Stack direction="row" sx={{width: {sm: 'calc(min(500px, 50%))', xs: '100%'}}} spacing={{md: 1, sm: 0}}>
          <Autocomplete
            options={termSuggestions}
            value={inputTerm}
            onHighlightChange={(_, option) => setHighlightedTerm(option || '')}
            onKeyUp={e => {
              if (
                (e.code === 'Enter' || e.code === 'NumpadEnter') &&
                (!highlightedTerm || highlightedTerm === inputTerm)
              )
                return addTerm(inputTerm)
              if (highlightedTerm !== inputTerm) updateTerm(e)
            }}
            onChange={updateTerm}
            renderInput={params => (
              <TextField
                {...params}
                size="small"
                placeholder="Term Search"
                value={inputTerm}
                onChange={e => {
                  updateTerm(e)
                  const value = e.target.value
                  if (terms) {
                    const suggestions: string[] = []
                    if (value && collapsedTerms) {
                      let ex: RegExp | undefined
                      try {
                        ex = new RegExp(
                          asRegEx
                            ? prepareRegex(value)
                            : wildcards.test(value)
                            ? globToRegex(value)
                            : ';' + value.replace(special, '\\$&') + '[^;]*;',
                          'g'
                        )
                      } catch {
                        ex = new RegExp(';' + value.replace(special, '\\$&') + ';', 'g')
                      }
                      extractMatches('', ex, collapsedTerms, suggestions, 100)
                    }
                    setTermSuggestions(suggestions)
                  }
                }}
                color={alreadyAdded ? 'warning' : 'primary'}
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
            sx={{width: '6.7em', display: {sm: 'block', xs: 'none'}}}
            variant="outlined"
            disabled={!inputTerm}
            onClick={() => {
              if (inputTerm) {
                updateInfoDrawerState({type: 'add', state: {type: 'term', value: inputTerm}})
                if (alreadyAdded) showTableTerm(inputTerm)
              }
            }}
          >
            View
          </Button>
          <Button variant="contained" onClick={() => addTerm()} disabled={!inputTerm}>
            Add
          </Button>
        </Stack>
        <Stack direction="row">
          <Button
            variant="outlined"
            sx={{width: {md: 100, sm: 70}, p: {md: 1, sm: 0}, display: {sm: 'block', xs: 'none'}}}
            onClick={() => setAsTable(!asTable)}
          >
            {asTable ? 'Analyze' : 'Edit'}
          </Button>
          <SettingsMenu />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
