import {
  Box,
  CircularProgress,
  Container,
  List,
  ListItem,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {SyntheticEvent, useContext, useMemo, useState} from 'react'
import {Done, Error} from '@mui/icons-material'
import {TermCard, TermRow} from './term'
import {ResourceContext} from './resources'
import {Nav} from './nav'
import {AllCategoies, BuildContext, BuildEditContext, Processed, processTerm} from './building'
import {loadSettings} from './settingsMenu'

const resources = [
  {key: 'terms', label: 'Terms'},
  {key: 'termAssociations', label: 'Term Associations'},
  {key: 'sense_keys', label: 'Sense Keys'},
  {key: 'synsetInfo', label: 'Synset Info'},
] as const
export type SortOptions = 'term' | 'time'

export default function AddedTerms({
  loading,
  drawerOpen,
}: {
  loading: {terms: boolean; termAssociations: boolean; sense_keys: boolean; synsetInfo: boolean}
  drawerOpen: boolean
}) {
  const Data = useContext(ResourceContext)
  const Dict = useContext(BuildContext)
  const Cats = useContext(AllCategoies)
  const termSet = useContext(Processed)
  const editDictionary = useContext(BuildEditContext)
  const settings = useMemo(loadSettings, [])
  const [asTable, setAsTable] = useState('asTable' in settings ? (settings.asTable as boolean) : true)
  const [sortBy, setSortBy] = useState<SortOptions>(settings.sortBy || 'time')
  const isInDict = (term: string) => term in Dict
  const addedTerms = Object.keys(Dict).sort(sortBy === 'time' ? (a, b) => Dict[a].added - Dict[b].added : undefined)
  const getProcessed = (term: string) => {
    if (Data.termAssociations) {
      if (!(term in termSet)) {
        termSet[term] = processTerm(Dict[term].type === 'regex' ? new RegExp(term) : term, Data)
      }
      return termSet[term]
    }
  }
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
            add={(term: string | RegExp, type: string) => {
              editDictionary({type: 'add', term: term, term_type: type})
            }}
            asTable={asTable}
            displayToggle={(e: SyntheticEvent, checked: boolean) => {
              settings.asTable = checked
              localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
              setAsTable(checked)
            }}
            sortBy={sortBy}
            setSortBy={(e: SelectChangeEvent<HTMLSelectElement>) => {
              settings.sortBy = e.target.value as SortOptions
              localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
              setSortBy(settings.sortBy)
            }}
          />
          <Box
            component="main"
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              overflowY: 'auto',
              mt: '3.5em',
              mb: drawerOpen ? '45vh' : 0,
              pr: 1,
              pb: 1,
              pl: 1,
            }}
          >
            {!addedTerms.length ? (
              <Typography align="center">Add terms, or import an existing dictionary.</Typography>
            ) : asTable ? (
              <Table
                stickyHeader
                sx={{
                  '& .MuiTableCell-root': {p: 0.5, textAlign: 'right'},
                  '& th.MuiTableCell-root:first-of-type': {textAlign: 'left'},
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell component="th">Term</TableCell>
                    <TableCell component="th">Sense</TableCell>
                    <TableCell component="th">Frequency</TableCell>
                    <TableCell component="th">Matches</TableCell>
                    <TableCell component="th">Senses</TableCell>
                    <TableCell component="th">Related</TableCell>
                    {Cats.map(cat => (
                      <TableCell key={'category_' + cat} component="th">
                        {cat}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {addedTerms.map(term => {
                    const processed = getProcessed(term)
                    return processed ? <TermRow key={term} processed={processed} edit={editDictionary} /> : <></>
                  })}
                </TableBody>
              </Table>
            ) : (
              addedTerms.map(term => {
                const processed = getProcessed(term)
                return processed ? (
                  <TermCard
                    key={term}
                    processed={processed}
                    onRemove={() => {
                      editDictionary({type: 'remove', term: term})
                    }}
                    onUpdate={(value: string) => {
                      if (value && !isInDict(value)) {
                        editDictionary({
                          type: 'replace',
                          term: value,
                          term_type: processed.term_type,
                          originalTerm: term,
                        })
                      }
                    }}
                    edit={editDictionary}
                  />
                ) : (
                  <></>
                )
              })
            )}
          </Box>
        </Container>
      )}
    </Box>
  )
}
