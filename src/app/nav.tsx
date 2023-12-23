import {Close, Menu, SavedSearch, SearchOff} from '@mui/icons-material'
import {
  AppBar,
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  ListItem,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import {SyntheticEvent, useContext, useState} from 'react'
import {SortOptions} from './addedTerms'
import {CategoryMenuToggler, DictionaryName} from './building'
import {InfoDrawerContext} from './infoDrawer'
import {extractMatches, globToRegex, prepareRegex, special, wildcards} from './utils'
import {ResourceContext} from './resources'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const [asRegEx, setAsRegEx] = useState(false)
  const currentDictionary = useContext(DictionaryName)
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
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const setCategoryMenuOpen = useContext(CategoryMenuToggler)

  return (
    <>
      <AppBar component="nav">
        <Toolbar variant="dense" sx={{justifyContent: 'space-between'}} disableGutters>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={() => setCategoryMenuOpen(true)}>
              Categories
            </Button>
          </Stack>
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
              onClick={() => {
                if (inputTerm) updateInfoDrawerState({type: 'add', state: {type: 'term', value: inputTerm}})
              }}
            >
              View
            </Button>
            <Button variant="contained" onClick={() => addTerm()} disabled={alreadyAdded}>
              Add
            </Button>
          </Stack>
          <IconButton onClick={toggleMenu}>
            <Menu />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer anchor="right" open={menuOpen} onClose={toggleMenu}>
        <Card sx={{height: '100%', width: '12em'}}>
          <CardHeader
            title={<Typography>Settings</Typography>}
            action={
              <IconButton onClick={toggleMenu}>
                <Close />
              </IconButton>
            }
          />
          <CardContent sx={{alignContent: 'left'}}>
            <Stack spacing={3}>
              <FormControlLabel
                sx={{width: '100%'}}
                label="As Table"
                control={<Switch checked={asTable} onChange={displayToggle} />}
              />
              <FormControl>
                <InputLabel>Sort By</InputLabel>
                <Select
                  label="Sort By"
                  value={sortBy as ''}
                  onChange={(e: SelectChangeEvent<HTMLSelectElement>) => {
                    setSortBy(e.target.value as SortOptions)
                  }}
                >
                  <MenuItem value="time">Order Added</MenuItem>
                  <MenuItem value="term">Term</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>
      </Drawer>
    </>
  )
}
