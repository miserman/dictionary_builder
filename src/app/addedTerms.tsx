import {Box, CircularProgress, Container, List, ListItem, Stack, Toolbar, Typography} from '@mui/material'
import {useContext} from 'react'
import {Done, Error} from '@mui/icons-material'
import {Term} from './term'
import {ResourceContext} from './resources'
import {Nav} from './nav'
import {BuildContext, BuildEditContext, Processed} from './building'

const resources = [
  {key: 'terms', label: 'Terms'},
  {key: 'termAssociations', label: 'Term Associations'},
  {key: 'synsets', label: 'Synsets'},
  {key: 'synsetInfo', label: 'Synset Info'},
] as const

export default function AddedTerms({
  loading,
  drawerOpen,
}: {
  loading: {terms: boolean; termAssociations: boolean; synsets: boolean; synsetInfo: boolean}
  drawerOpen: boolean
}) {
  const Data = useContext(ResourceContext)
  const Dict = useContext(BuildContext)
  const termSet = useContext(Processed)
  const editDictionary = useContext(BuildEditContext)
  const isInDict = (term: string) => term in Dict

  return (
    <Box>
      {!Data.termAssociations || !Data.synsetInfo ? (
        <Stack sx={{margin: 'auto', marginTop: 10, maxWidth: 350}}>
          <Typography>Loading Resources...</Typography>
          <List>
            {resources.map(({key, label}) => (
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
            terms={Data.terms}
            exists={isInDict}
            add={(term: string) => {
              editDictionary({type: 'add', term: term})
            }}
          />
          <Box component="main" sx={{mb: drawerOpen ? '46vh' : 0}}>
            <Toolbar />
            {Object.keys(Dict)
              .sort()
              .map(term => {
                return (
                  <Term
                    key={term}
                    processed={termSet[term]}
                    onRemove={() => {
                      editDictionary({type: 'remove', term: term})
                    }}
                    onUpdate={(value: string) => {
                      if (value && !isInDict(value)) {
                        editDictionary({type: 'update', term: value, originalTerm: term})
                      }
                    }}
                  />
                )
              })}
          </Box>
        </Container>
      )}
    </Box>
  )
}
