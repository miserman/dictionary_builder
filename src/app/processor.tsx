import {Box, Button, CircularProgress, List, ListItem, Stack, TextField, Typography} from '@mui/material'
import {SyntheticEvent, useContext, useReducer, useState} from 'react'
import {Done, Error} from '@mui/icons-material'
import {filterUncommonExpansions, globToRegex, termBounds} from '../../utils'
import {FixedTerm, FuzzyTerm, Term} from './term'
import {ResourceContext} from './resources'

export default function Processor({loading}: {loading: {terms: boolean; synsets: boolean}}) {
  const Data = useContext(ResourceContext)

  const processTerm = (term: string) => {
    const processed = globToRegex(term)
    if (processed === term) {
      return {
        type: 'fixed',
        term: term,
        categories: {},
        recognized: Data.termAssociations && term in Data.termAssociations,
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
      if (Data.collapsedTerms) {
        for (let match: RegExpExecArray | null; (match = container.regex.exec(Data.collapsedTerms)); ) {
          container.matches.push(match[0].replace(termBounds, ''))
        }
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
    <Box>
      {!Data.termAssociations || !Data.synsetInfo ? (
        <Stack sx={{margin: 'auto', marginTop: 10, maxWidth: 350}}>
          <Typography>Loading Resources...</Typography>
          <List>
            <ListItem>
              <Typography>
                {Data.termAssociations ? (
                  <Done color="success" />
                ) : loading.terms ? (
                  <CircularProgress size="1.5rem" />
                ) : (
                  <Error color="error" sx={{marginBottom: -0.8}} />
                )}
                {!Data.termAssociations && !loading.terms ? 'Failed to load ' : ''}Term Associations
              </Typography>
            </ListItem>
            <ListItem>
              {Data.synsetInfo ? (
                <Done color="success" />
              ) : loading.synsets ? (
                <CircularProgress size="1.5rem" />
              ) : (
                <Error color="error" sx={{marginBottom: -0.8}} />
              )}
              {!Data.synsetInfo && !loading.synsets ? 'Failed to load ' : ''}Synset Info
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
            {termSet.map((term, index) => (
              <Term
                key={index}
                term={term}
                onRemove={() => {
                  const newAddedTerms = [...addedTerms]
                  newAddedTerms.splice(index, 1)
                  setAddedTerms([...newAddedTerms])
                  dispatchSetAction({key: 'remove', index})
                }}
                onUpdate={(value: string) => {
                  if (value && -1 === addedTerms.indexOf(value)) {
                    const newAddedTerms = [...addedTerms]
                    newAddedTerms[index] = value
                    setAddedTerms(newAddedTerms)
                    dispatchSetAction({key: 'update', index, value})
                  }
                }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}
