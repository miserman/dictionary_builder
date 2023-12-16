'use client'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  CssBaseline,
  IconButton,
  List,
  ListItem,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material'
import {StrictMode, SyntheticEvent, useEffect, useReducer, useState} from 'react'
import {Close, Done, Error} from '@mui/icons-material'
import {CommonExpansions, filterUncommonExpansions, globToRegex, sortByLength, termBounds} from '../../utils'

const theme = createTheme({palette: {mode: 'dark'}})

type TermMeta = {
  term: string
  synsets: string[]
  similar: string[]
}
type FuzzyTerm = {
  type: 'fuzzy'
  term: string
  categories: {[index: string]: number}
  recognized: boolean
  regex: RegExp
  matches: string[]
  common_matches: CommonExpansions
}
type FixedTerm = {
  type: 'fixed'
  term: string
  categories: {[index: string]: number}
  recognized: boolean
  synsets: string[]
  synset: string
}

export default function Home() {
  const [loadingTerms, setLoadingTerms] = useState(true)
  const [loadingSynsets, setLoadingSynsets] = useState(true)
  const [terms, setTerms] = useState<string[]>([])
  const [collapsedTerms, setCollapsedTerms] = useState('')
  const [termAssociations, setTermAssociations] = useState<{[index: string]: number | number[]} | null>(null)
  const [synsetIds, setSynsetIds] = useState<string[]>([])
  const [synsets, setSynsets] = useState<{[index: string]: any} | null>(null)

  useEffect(() => {
    fetch('/dictionary_builder/data/term_associations.json')
      .then(res => res.json())
      .then(termInfo => {
        const all_terms = Object.keys(termInfo)
        setTerms(all_terms)
        setCollapsedTerms(';;' + all_terms.join(';;') + ';;')
        setTermAssociations(termInfo)
      })
      .finally(() => setLoadingTerms(false))
  }, [])
  useEffect(() => {
    fetch('/dictionary_builder/data/synsets.json')
      .then(res => res.json())
      .then(synsetInfo => {
        setSynsetIds(Object.keys(synsetInfo))
        setSynsets(synsetInfo)
      })
      .finally(() => setLoadingSynsets(false))
  }, [])

  const processTerm = (term: string) => {
    const processed = globToRegex(term)
    if (processed === term) {
      return {
        type: 'fixed',
        term: term,
        categories: {},
        recognized: termAssociations && term in termAssociations,
        synsets: [],
        synset: '',
      } as FixedTerm
    } else {
      const container = {
        type: 'fuzzy',
        term: term,
        categories: {},
        recognized: false,
        regex: new RegExp(processed, 'g'),
        matches: [],
        common_matches: {},
      } as FuzzyTerm
      for (let match: RegExpExecArray | null; (match = container.regex.exec(collapsedTerms)); ) {
        container.matches.push(match[0].replace(termBounds, ''))
      }
      if (container.matches.length) {
        container.recognized = true
        container.common_matches = filterUncommonExpansions(container.matches)
      }
      return container
    }
  }
  const setAction = (
    state: (FuzzyTerm | FixedTerm)[],
    action: {key: 'add'; value: string} | {key: 'remove'; index: number} | {key: 'update'; index: number; value: string}
  ) => {
    const newState = [...state] as (FuzzyTerm | FixedTerm)[]
    if (action.key === 'remove') {
      newState.splice(action.index, 1)
    } else {
      newState[action.key === 'update' ? action.index : state.length] = processTerm(action.value)
    }
    return newState
  }

  const [inputTerm, setInputTerm] = useState('')
  const [addedTerms, setAddedTerms] = useState<string[]>([])
  const [termSet, dispatchSetAction] = useReducer(setAction, [] as (FuzzyTerm | FixedTerm)[])

  const addTerm = () => {
    if (inputTerm && -1 === addedTerms.indexOf(inputTerm)) {
      setAddedTerms([...addedTerms, inputTerm])
      dispatchSetAction({key: 'add', value: inputTerm})
      setInputTerm('')
    }
  }

  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {!termAssociations || !synsets ? (
          <Stack sx={{margin: 'auto', marginTop: 10, maxWidth: 350}}>
            <Typography>Loading Resources...</Typography>
            <List>
              <ListItem>
                <Typography>
                  {termAssociations ? (
                    <Done color="success" />
                  ) : loadingTerms ? (
                    <CircularProgress size="1.5rem" />
                  ) : (
                    <Error color="error" sx={{marginBottom: -0.8}} />
                  )}
                  {!termAssociations && !loadingTerms ? 'Failed to load ' : ''}Term Associations
                </Typography>
              </ListItem>
              <ListItem>
                {synsets ? (
                  <Done color="success" />
                ) : loadingSynsets ? (
                  <CircularProgress size="1.5rem" />
                ) : (
                  <Error color="error" sx={{marginBottom: -0.8}} />
                )}
                {!synsets && !loadingSynsets ? 'Failed to load ' : ''}Synset Info
              </ListItem>
            </List>
          </Stack>
        ) : (
          <Box sx={{margin: 'auto', maxWidth: 1000}}>
            <Stack sx={{margin: 1}}>
              <Stack direction="row">
                <TextField
                  value={inputTerm}
                  onKeyDown={(e: SyntheticEvent) => {
                    if ('code' in e && e.code === 'Enter') addTerm()
                  }}
                  onChange={(e: SyntheticEvent) => {
                    const input = e.target
                    if (input && 'value' in input) {
                      setInputTerm(input.value as string)
                    }
                  }}
                  variant="outlined"
                  label="Term to add"
                  helperText={
                    <Typography variant="caption">
                      Enter a fixed or glob term (e.g., <code>frog</code> or <code>frog*</code>).
                    </Typography>
                  }
                  fullWidth
                ></TextField>
                <Button onClick={addTerm}>Add</Button>
              </Stack>
              {termSet.map((term, index) => {
                return (
                  <Card key={index} sx={{m: 0.5}}>
                    {term.recognized ? (
                      <Done color="success" sx={{fontSize: '.8rem', position: 'absolute'}} aria-label="recognized" />
                    ) : (
                      <></>
                    )}
                    <CardHeader
                      title={term.term}
                      action={
                        <IconButton
                          onClick={() => {
                            const newAddedTerms = [...addedTerms]
                            newAddedTerms.splice(index, 1)
                            setAddedTerms([...newAddedTerms])
                            dispatchSetAction({key: 'remove', index})
                          }}
                        >
                          <Close />
                        </IconButton>
                      }
                    ></CardHeader>
                    <CardContent>
                      <Stack direction="row">
                        {term.type === 'fuzzy' ? (
                          <Paper>
                            <Typography>Matches{' (' + term.matches.length + ')'}</Typography>
                            {term.matches.length ? (
                              <Box sx={{maxHeight: 200, overflowY: 'auto'}}>
                                <List sx={{marginLeft: '12px'}}>
                                  {[
                                    ...term.matches.filter(t => t in term.common_matches).sort(sortByLength),
                                    ...term.matches.filter(t => !(t in term.common_matches)).sort(sortByLength),
                                  ].map((match, index) => {
                                    const common = term.common_matches[match]
                                    return (
                                      <ListItem key={index} sx={{p: 0}}>
                                        {common ? (
                                          <Typography className={common.part === '' ? 'match-root' : ''}>
                                            <span className="term-root">{common.root}</span>
                                            <span>{common.part}</span>
                                          </Typography>
                                        ) : (
                                          <Typography className="match-uncommon">{match}</Typography>
                                        )}
                                      </ListItem>
                                    )
                                  })}
                                </List>
                              </Box>
                            ) : (
                              <Typography>No matches</Typography>
                            )}
                          </Paper>
                        ) : (
                          <Paper elevation={1}>
                            <Typography>
                              Recognized:
                              <span style={{color: theme.palette[term.recognized ? 'success' : 'info'].main}}>
                                {' ' + term.recognized}
                              </span>
                            </Typography>
                          </Paper>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                )
              })}
            </Stack>
          </Box>
        )}
      </ThemeProvider>
    </StrictMode>
  )
}
