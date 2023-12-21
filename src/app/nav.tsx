import {Close, Menu} from '@mui/icons-material'
import {
  AppBar,
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  Drawer,
  FormControlLabel,
  IconButton,
  ListItem,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import {SyntheticEvent, useMemo, useState} from 'react'

export function Nav({
  terms,
  exists,
  add,
  asTable,
  displayToggle,
}: {
  terms?: readonly string[]
  exists: (term: string) => boolean
  add: (term: string) => void
  asTable: boolean
  displayToggle: (e: SyntheticEvent, checked: boolean) => void
}) {
  const termMap = useMemo(() => {
    return terms ? new Map(terms.map(term => [term, true])) : new Map()
  }, [terms])
  const [inputTerm, setInputTerm] = useState('')
  const [alreadyAdded, setAlreadyAdded] = useState(false)
  const [termSuggestions, setTermSuggestions] = useState<string[]>([])
  const [menuOpen, setMenuOpen] = useState(false)

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
  const toggleMenu = () => setMenuOpen(!menuOpen)

  return (
    <>
      <AppBar component="nav">
        <Toolbar variant="dense" sx={{justifyContent: 'space-between'}} disableGutters>
          <Stack direction="row" sx={{width: '40%'}} spacing={1}>
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
                <ListItem {...props} key={option} onClick={addTerm}>
                  {option}
                </ListItem>
              )}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="outlined"
                  size="small"
                  placeholder="term to add"
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
            <FormControlLabel
              sx={{width: '100%'}}
              label="As Table"
              control={<Switch checked={asTable} onChange={displayToggle} />}
            />
          </CardContent>
        </Card>
      </Drawer>
    </>
  )
}
