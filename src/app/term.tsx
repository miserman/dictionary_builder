import {
  Box,
  Link,
  List,
  ListItem,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {relativeFrequency, sortByLength} from './utils'
import {type ChangeEvent, useContext, useState} from 'react'
import {ResourceContext, type Synset} from './resources'
import {BuildContext, BuildEditContext} from './building'
import {InfoDrawerContext} from './infoDrawer'
import {SynsetLink} from './synset'
import {extractExpanded} from './wordParts'
import {getProcessedTerm} from './processTerms'

export type FixedTerm = {
  type: 'fixed'
  term_type: 'fixed'
  term: string
  categories: {[index: string]: number}
  recognized: boolean
  index: number
  forms?: string[]
  related: string[]
  synsets: Synset[]
}
export type FuzzyTerm = {
  type: 'fuzzy'
  term_type: 'glob' | 'regex'
  term: string
  categories: {[index: string]: number}
  recognized: boolean
  regex: RegExp
  matches: string[]
  common_matches?: string[]
}

export function TermSenseEdit({
  id,
  field,
  processed,
  label,
  gridApi,
}: {
  processed: FixedTerm | FuzzyTerm
  id: string
  field: string
  label?: string
  gridApi?: {current: {setEditCellValue: (params: any) => void}}
}) {
  const Dict = useContext(BuildContext)
  const edit = useContext(BuildEditContext)
  const currentSense = Dict[processed.term].sense
  const {sense_keys} = useContext(ResourceContext)
  return processed.type === 'fixed' && processed.synsets.length ? (
    <Select
      fullWidth
      size="small"
      aria-label="assign synset"
      value={currentSense}
      onChange={(e: SelectChangeEvent) => {
        gridApi && gridApi.current.setEditCellValue({id, field, value: e.target.value})
        edit({type: 'update', term: processed.term, term_type: processed.term_type, sense: e.target.value})
      }}
      label={label}
    >
      {sense_keys &&
        processed.synsets.map(synset => {
          const {index} = synset
          return (
            <MenuItem key={index} value={sense_keys[index]}>
              <Tooltip title={synset.definition} placement="right">
                <Typography sx={{width: '100%'}}>{sense_keys[index]}</Typography>
              </Tooltip>
            </MenuItem>
          )
        })}
    </Select>
  ) : (
    <TextField
      size="small"
      value={currentSense}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        gridApi && gridApi.current.setEditCellValue({id, field, value: e.target.value})
        edit({type: 'update', term: processed.term, term_type: processed.term_type, sense: e.target.value})
      }}
      label={label}
    ></TextField>
  )
}

function TermFuzzy({processed}: {processed: FuzzyTerm}) {
  const data = useContext(ResourceContext)

  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(5)

  const nMatches = processed.matches.length
  const pageMatches = []
  if (nMatches) {
    for (let i = page * perPage, n = Math.min(processed.matches.length, i + perPage); i < n; i++) {
      pageMatches.push(processed.matches[i])
    }
  }

  if (!processed.common_matches) {
    let root = ''
    processed.matches.forEach(match => {
      if (!root || match.length < root.length) root = match
    })
    processed.common_matches = extractExpanded(root, ';;' + processed.matches.join(';;') + ';;')
  }
  return (
    <Box sx={{height: '100%', overflowY: 'auto'}}>
      {nMatches ? (
        <TableContainer sx={{height: '100%'}}>
          <Table
            stickyHeader
            size="small"
            sx={{
              width: '100%',
              '& .MuiTableCell-root:first-of-type': {pl: 0.5},
              '& .MuiTableCell-root:last-of-type': {pr: 0.5},
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell width="999">Match</TableCell>
                <TableCell align="right">Frequency</TableCell>
                <TableCell align="right">Senses</TableCell>
                <TableCell align="right">Related</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageMatches.map((match, index) => {
                const processedMatch = getProcessedTerm(match, data) as FixedTerm
                return (
                  <TableRow key={match + index} sx={{height: 33}} hover>
                    <TableCell>{<TermLink term={match}></TermLink>}</TableCell>
                    <TableCell align="right">
                      {relativeFrequency(processedMatch.index, data.terms && data.terms.length)}
                    </TableCell>
                    <TableCell align="right">{processedMatch.synsets.length}</TableCell>
                    <TableCell align="right">{processedMatch.related.length}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 50, 100, 1000]}
            count={nMatches}
            rowsPerPage={perPage}
            page={page}
            onPageChange={(e: unknown, page: number) => {
              setPage(page)
            }}
            onRowsPerPageChange={(e: ChangeEvent<HTMLInputElement>) => {
              setPerPage(parseInt(e.target.value))
              setPage(0)
            }}
          />
        </TableContainer>
      ) : (
        <Typography>No matches</Typography>
      )}
    </Box>
  )
}

function TermFixed({processed}: {processed: FixedTerm}) {
  const containerStyle = {p: 1, maxHeight: '100%', overflowY: 'auto', overflowX: 'hidden'}
  const {terms, collapsedTerms, sense_keys} = useContext(ResourceContext)
  if (!processed.forms) {
    processed.forms = extractExpanded(processed.term, collapsedTerms ? collapsedTerms.all : '')
    processed.forms.sort(sortByLength)
  }
  return (
    <Stack direction="row" spacing={4} sx={{height: '100%'}}>
      <Stack>
        <Tooltip title="100 - index / n terms * 100; terms are losely sorted by frequency and space coverage">
          <Typography>Relative Frequency</Typography>
        </Tooltip>
        <Box sx={{p: 1}}>
          <span className="number">{relativeFrequency(processed.index, terms && terms.length)}</span>
        </Box>
      </Stack>
      {processed.forms.length ? (
        <Stack>
          <Typography>Expanded Forms</Typography>
          <Box sx={containerStyle}>
            <List sx={{p: 0}}>
              {processed.forms.map(term => (
                <ListItem key={term} sx={{p: 0}}>
                  {<TermLink term={term}></TermLink>}
                </ListItem>
              ))}
            </List>
          </Box>
        </Stack>
      ) : (
        <></>
      )}
      {processed.related.length ? (
        <Stack>
          <Typography>Related Terms</Typography>
          <Box sx={containerStyle}>
            <List sx={{p: 0}}>
              {processed.related.map(term => (
                <ListItem key={term} sx={{p: 0}}>
                  {<TermLink term={term}></TermLink>}
                </ListItem>
              ))}
            </List>
          </Box>
        </Stack>
      ) : (
        <></>
      )}
      {sense_keys && processed.synsets.length ? (
        <Stack>
          <Typography>Senses</Typography>
          <Box sx={containerStyle}>
            <List sx={{p: 0}}>
              {processed.synsets.map(info => (
                <ListItem key={info.index} sx={{p: 0}}>
                  <SynsetLink senseKey={sense_keys[info.index]} info={info} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Stack>
      ) : (
        <></>
      )}
    </Stack>
  )
}

export function TermLink({term}: {term: string}) {
  const updateInfoDrawerState = useContext(InfoDrawerContext)
  return (
    <Link
      underline="none"
      sx={{p: 0, justifyContent: 'flex-start', cursor: 'pointer', display: 'block'}}
      onClick={() => updateInfoDrawerState({type: 'add', state: {type: 'term', value: term}})}
    >
      {term}
    </Link>
  )
}

export function TermDisplay({term}: {term: string}) {
  const data = useContext(ResourceContext)
  const processed = getProcessedTerm(term, data)
  return processed.type === 'fixed' ? <TermFixed processed={processed} /> : <TermFuzzy processed={processed} />
}
