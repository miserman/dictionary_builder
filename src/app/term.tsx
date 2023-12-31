import {
  Box,
  Link,
  List,
  ListItem,
  ListItemIcon,
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
import {type ChangeEvent, useContext, useState, useMemo} from 'react'
import {ResourceContext, type Synset} from './resources'
import {BuildContext, BuildEditContext, type Dict} from './building'
import {InfoDrawerContext} from './infoDrawer'
import {SynsetLink} from './synset'
import {extractExpanded} from './wordParts'
import {getFuzzyParent, getProcessedTerm} from './processTerms'
import {ArrowDownward, ArrowUpward, Check, LensBlur} from '@mui/icons-material'

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
  frequency?: number
  in_dict?: boolean
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

const columns = ['Match', 'Frequency', 'Senses', 'Related', 'In Dictionary'] as const
const arrowStyle = {position: 'absolute', fontSize: '1.5em', height: '1.2em', opacity: 0.4}
function sortByField({column, asc}: {column: string; asc: boolean}) {
  switch (column) {
    case 'Match':
      return asc
        ? (a: FixedTerm, b: FixedTerm) => {
            return a.term > b.term ? -1 : 1
          }
        : (a: FixedTerm, b: FixedTerm) => {
            return b.term > a.term ? -1 : 1
          }
    case 'Frequency':
      return asc
        ? (a: FixedTerm, b: FixedTerm) => {
            return (a.frequency || 0) - (b.frequency || 0)
          }
        : (a: FixedTerm, b: FixedTerm) => {
            return (b.frequency || 0) - (a.frequency || 0)
          }
    case 'Senses':
      return asc
        ? (a: FixedTerm, b: FixedTerm) => {
            return a.synsets.length - b.synsets.length
          }
        : (a: FixedTerm, b: FixedTerm) => {
            return b.synsets.length - a.synsets.length
          }
    case 'Related':
      return asc
        ? (a: FixedTerm, b: FixedTerm) => {
            return a.related.length - b.related.length
          }
        : (a: FixedTerm, b: FixedTerm) => {
            return b.related.length - a.related.length
          }
    case 'In Dictionary':
      return asc
        ? (a: FixedTerm, b: FixedTerm) => {
            return (a.in_dict || 0) > (b.in_dict || 0) ? -1 : 1
          }
        : (a: FixedTerm, b: FixedTerm) => {
            return (b.in_dict || 0) > (a.in_dict || 0) ? -1 : 1
          }
  }
}
function TermFuzzy({processed}: {processed: FuzzyTerm}) {
  const dict = useContext(BuildContext)
  const data = useContext(ResourceContext)

  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(5)
  const [sortCol, setSortCol] = useState({column: 'Frequency', asc: false})
  const cols = useMemo(
    () =>
      columns.map(col => (
        <TableCell
          key={col}
          width={col === 'Match' ? 999 : 1}
          component="th"
          align={col === 'Match' ? 'left' : 'right'}
          sx={{cursor: 'pointer', pr: 3}}
          onClick={() => {
            const alreadySorting = sortCol.column === col
            setSortCol(
              alreadySorting && sortCol.asc
                ? {column: 'Frequency', asc: false}
                : {column: col, asc: sortCol.column === col}
            )
          }}
        >
          {col}
          {sortCol.column === col ? (
            sortCol.asc ? (
              <ArrowUpward sx={arrowStyle} />
            ) : (
              <ArrowDownward sx={arrowStyle} />
            )
          ) : (
            <></>
          )}
        </TableCell>
      )),
    [setSortCol, sortCol]
  )
  const nMatches = processed.matches.length
  const processedMatches = useMemo(() => {
    return processed.matches.map(term => {
      const p = getProcessedTerm(term, data) as FixedTerm
      p.frequency = relativeFrequency(p.index, data.terms && data.terms.length)
      p.in_dict = p.term in dict
      return p
    })
  }, [processed, data, dict])
  if (page > nMatches / perPage) {
    setPage(0)
    return <></>
  }
  processedMatches.sort(sortByField(sortCol))
  const pageMatches: FixedTerm[] = []
  if (nMatches) {
    for (let i = page * perPage, n = Math.min(processedMatches.length, i + perPage); i < n; i++) {
      pageMatches.push(processedMatches[i])
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
              '& .MuiTableCell-root:first-of-type': {pl: 1},
            }}
          >
            <TableHead>
              <TableRow>{cols}</TableRow>
            </TableHead>
            <TableBody>
              {pageMatches.map((processedMatch, index) => {
                const match = processedMatch.term
                return (
                  <TableRow key={match + index} sx={{height: 33}} hover>
                    <TableCell>{<TermLink term={match}></TermLink>}</TableCell>
                    <TableCell align="right">
                      {(processedMatch.frequency && processedMatch.frequency.toFixed(2)) || '0.00'}
                    </TableCell>
                    <TableCell align="right">{processedMatch.synsets.length}</TableCell>
                    <TableCell align="right">{processedMatch.related.length}</TableCell>
                    <TableCell align="right">{processedMatch.in_dict ? 'yes' : 'no'}</TableCell>
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

export function termListItem(term: string, dict: Dict) {
  const capturedBy = getFuzzyParent(term)
  return (
    <ListItem key={term} sx={{p: 0}}>
      <ListItemIcon sx={iconStyle}>
        {term in dict ? (
          <Tooltip title="in current dictionary" placement="left">
            <Check color="success" />
          </Tooltip>
        ) : capturedBy && capturedBy in dict ? (
          <Tooltip title={'captured by ' + capturedBy + ' in current dictionary'} placement="left">
            <LensBlur color="secondary" />
          </Tooltip>
        ) : (
          <></>
        )}
      </ListItemIcon>
      <TermLink term={term}></TermLink>
    </ListItem>
  )
}
const iconStyle = {minWidth: '20px', '& .MuiSvgIcon-root': {fontSize: '1em'}}
function TermFixed({processed}: {processed: FixedTerm}) {
  const containerStyle = {p: 1, pl: 0, maxHeight: '100%', overflowY: 'auto', overflowX: 'hidden'}
  const dict = useContext(BuildContext)
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
          <span className="number">{relativeFrequency(processed.index, terms && terms.length).toFixed(2)}</span>
        </Box>
      </Stack>
      {processed.forms.length ? (
        <Stack>
          <Typography>Expanded Forms</Typography>
          <Box sx={containerStyle}>
            <List disablePadding sx={{p: 0}}>
              {processed.forms.map(term => termListItem(term, dict))}
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
            <List disablePadding sx={{p: 0}}>
              {processed.related.map(term => termListItem(term, dict))}
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
