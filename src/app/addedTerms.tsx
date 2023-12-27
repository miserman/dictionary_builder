import {Box, CircularProgress, Container, List, ListItem, Stack, Typography} from '@mui/material'
import {useContext, useMemo} from 'react'
import {Done, Error} from '@mui/icons-material'
import {TermLink, TermSenseEdit} from './term'
import {ResourceContext} from './resources'
import {Nav} from './nav'
import {AllCategories, BuildContext, BuildEditContext, Processed, processTerm} from './building'
import {DataGrid, GridColDef, GridRenderEditCellParams, GridCellParams} from '@mui/x-data-grid'
import {relativeFrequency} from './utils'

const resources = [
  {key: 'terms', label: 'Terms'},
  {key: 'termAssociations', label: 'Term Associations'},
  {key: 'sense_keys', label: 'Sense Keys'},
  {key: 'synsetInfo', label: 'Synset Info'},
] as const
export type SortOptions = 'term' | 'time'

const categoryPrefix = /^category_/
export default function AddedTerms({
  loading,
  drawerOpen,
}: {
  loading: {terms: boolean; termAssociations: boolean; sense_keys: boolean; synsetInfo: boolean}
  drawerOpen: boolean
}) {
  const Data = useContext(ResourceContext)
  const Dict = useContext(BuildContext)
  const Cats = useContext(AllCategories)
  const termSet = useContext(Processed)
  const editDictionary = useContext(BuildEditContext)
  const isInDict = (term: string) => term in Dict
  const addedTerms = Object.keys(Dict).reverse()
  const cols: GridColDef[] = useMemo(() => {
    const cols: GridColDef[] = [
      {
        field: 'id',
        headerName: 'Term',
        renderCell: (params: GridRenderEditCellParams) => {
          return <TermLink term={params.value} />
        },
      },
      {
        field: 'sense',
        headerName: 'Sense',
        editable: true,
        renderEditCell: (params: GridRenderEditCellParams) => {
          return <TermSenseEdit id={params.id as string} field={params.field} processed={params.row.processed} />
        },
      },
      {field: 'frequency', headerName: 'Frequency'},
      {field: 'matches', headerName: 'Matches'},
      {field: 'senses', headerName: 'Senses'},
      {field: 'related', headerName: 'Related'},
    ]
    Cats.forEach(cat =>
      cols.push({
        field: 'category_' + cat,
        headerName: cat,
        editable: true,
        valueParser: (value: any, params?: GridCellParams) => {
          const parsed = +value || ''
          if (params && parsed) {
            const {field, row} = params
            const {processed, dictEntry} = row
            if (field.startsWith('category_')) {
              const cats = dictEntry.categories
              cats[field.replace(categoryPrefix, '')] = +value
              editDictionary({
                type: 'update',
                term: processed.term,
                term_type: processed.term_type,
                categories: cats,
              })
            }
          }
          return parsed
        },
      })
    )
    return cols
  }, [Cats, editDictionary])
  const rows = useMemo(() => {
    return Data.termAssociations
      ? addedTerms.map(term => {
          if (!(term in termSet)) {
            termSet[term] = processTerm(Dict[term].type === 'regex' ? new RegExp(term) : term, Data)
          }
          const processed = termSet[term]
          const dictEntry = Dict[term]
          const row: {[index: string]: typeof processed | typeof dictEntry | string | number} = processed
            ? processed.type === 'fixed'
              ? {
                  processed,
                  dictEntry,
                  id: term,
                  sense: dictEntry.sense,
                  frequency: relativeFrequency(processed.index, Data.terms && Data.terms.length),
                  matches: processed.recognized ? 1 : 0,
                  senses: processed.synsets.length,
                  related: processed.related.length,
                }
              : {
                  processed,
                  dictEntry,
                  id: term,
                  sense: dictEntry.sense,
                  matches: processed.matches.length,
                }
            : {
                processed,
                dictEntry,
                id: term,
                matches: 0,
              }
          if (dictEntry.categories) {
            const cats = dictEntry.categories
            Object.keys(cats).forEach(cat => {
              row['category_' + cat] = cats[cat]
            })
          }
          return row
        })
      : []
  }, [addedTerms, Data, Dict, termSet])
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
              mt: '3em',
              mb: drawerOpen ? '45vh' : 0,
            }}
          >
            {!addedTerms.length ? (
              <Typography align="center">Add terms, or import an existing dictionary.</Typography>
            ) : (
              <DataGrid
                rows={rows}
                columns={cols}
                disableRowSelectionOnClick
                showCellVerticalBorder
                density="compact"
              />
            )}
          </Box>
        </Container>
      )}
    </Box>
  )
}
