import {Box, CircularProgress, Container, List, ListItem, Stack, Toolbar, Typography} from '@mui/material'
import {useContext, useReducer} from 'react'
import {Done, Error} from '@mui/icons-material'
import {filterUncommonExpansions, globToRegex, termBounds} from '../../utils'
import {FixedTerm, FuzzyTerm, Term} from './term'
import {ResourceContext} from './resources'
import {Nav} from './nav'
import {BuildContext, BuildEditContext} from './building'

export type SetActions =
  | {key: 'add'; value: string}
  | {key: 'remove'; index: number}
  | {key: 'update'; index: number; value: string}

export default function Processor({
  loading,
}: {
  loading: {terms: boolean; termAssociations: boolean; synsets: boolean; synsetInfo: boolean}
}) {
  const Data = useContext(ResourceContext)
  const Dict = useContext(BuildContext)
  const editDictionary = useContext(BuildEditContext)

  const processTerm = (term: string) => {
    const processed = globToRegex(term)
    if (processed === term) {
      return {
        type: 'fixed',
        term: term,
        categories: {},
        recognized: Data.terms && Data.terms.includes(term),
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
  const setAction = (state: (FuzzyTerm | FixedTerm)[], action: SetActions) => {
    const newState = [...state] as (FuzzyTerm | FixedTerm)[]
    if (action.key === 'remove') {
      newState.splice(action.index, 1)
    } else {
      newState[action.key === 'update' ? action.index : state.length] = processTerm(action.value)
    }
    return newState
  }

  const isInDict = (term: string) => term in Dict

  const [termSet, dispatchSetAction] = useReducer(setAction, [] as (FuzzyTerm | FixedTerm)[])

  return (
    <Box>
      {!Data.termAssociations || !Data.synsetInfo ? (
        <Stack sx={{margin: 'auto', marginTop: 10, maxWidth: 350}}>
          <Typography>Loading Resources...</Typography>
          <List>
            {(
              [
                {key: 'terms', label: 'Terms'},
                {key: 'termAssociations', label: 'Term Associations'},
                {key: 'synsets', label: 'Synsets'},
                {key: 'synsetInfo', label: 'Synset Info'},
              ] as {key: keyof typeof loading; label: string}[]
            ).map(({key, label}) => (
              <ListItem key={key}>
                <Typography>
                  {Data[key] ? (
                    <Done color="success" />
                  ) : loading[key] ? (
                    <CircularProgress size="1.5rem" />
                  ) : (
                    <Error color="error" sx={{marginBottom: -0.8}} />
                  )}
                  {!Data[key] && !loading[key] ? 'Failed to load ' : ''}
                  {label}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Stack>
      ) : (
        <Container>
          <Nav
            all_terms={Data.terms}
            exists={isInDict}
            add={(term: string) => {
              editDictionary({type: 'add', term: term})
              dispatchSetAction({key: 'add', value: term})
            }}
          />
          <Box component="main">
            <Toolbar />
            {termSet.map((term, index) => (
              <Term
                key={index}
                term={term}
                onRemove={() => {
                  editDictionary({type: 'remove', term: term.term})
                  dispatchSetAction({key: 'remove', index})
                }}
                onUpdate={(value: string) => {
                  if (value && !isInDict(term.term)) {
                    editDictionary({type: 'update', term: term.term})
                    dispatchSetAction({key: 'update', index, value})
                  }
                }}
              />
            ))}
          </Box>
        </Container>
      )}
    </Box>
  )
}
