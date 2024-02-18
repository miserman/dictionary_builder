import {
  Autocomplete,
  Box,
  Button,
  IconButton,
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
import {type ChangeEvent, useContext, useState, useMemo, useCallback} from 'react'
import {ResourceContext, type Synset} from './resources'
import {BuildContext, BuildEditContext, type DictionaryActions, termsByCategory} from './building'
import {InfoDrawerActions, InfoDrawerSetter} from './infoDrawer'
import {SynsetLink, unpackSynsetMembers} from './synset'
import {extractExpanded} from './wordParts'
import {getFuzzyParent, getProcessedTerm} from './processTerms'
import {Add, ArrowDownward, ArrowUpward, Check, LensBlur, Remove} from '@mui/icons-material'
import type {Dict} from './storage'

type LogicalObject = {[index: string]: boolean}
export type NetworkLookup = {
  expanded: boolean
  map: Map<string, boolean>
  any: LogicalObject
  lemma: LogicalObject
  lemma_map: Map<string, boolean>
  lemma_related: LogicalObject
  lemma_synset: LogicalObject
  related: LogicalObject
  related_map: Map<string, boolean>
  related_lemma: LogicalObject
  related_related: LogicalObject
  related_synset: LogicalObject
  synset: LogicalObject
  synset_map: Map<string, boolean>
  synset_lemma: LogicalObject
  synset_related: LogicalObject
  synset_synset: LogicalObject
}
export type FixedTerm = {
  type: 'fixed'
  term_type: 'fixed'
  term: string
  recognized: boolean
  index: number
  lemma: string[]
  forms?: string[]
  related: string[]
  synsets: Synset[]
  synset_terms: string[]
  frequency?: number
  in_dict?: boolean
  lookup: NetworkLookup
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

function byRank(a: {score: number; synset: Synset}, b: {score: number; synset: Synset}) {
  return b.score - a.score
}
export function TermSenseEdit({
  id,
  field,
  processed,
  label,
  editCell,
}: {
  processed: FixedTerm | FuzzyTerm
  id: string
  field: string
  label?: string
  editCell?: (params: any) => void
}) {
  const Dict = useContext(BuildContext)
  const edit = useContext(BuildEditContext)
  const dictEntry = Dict[id || processed.term]
  const data = useContext(ResourceContext)
  const {terms, sense_keys, synsetInfo} = data

  const rankedSynsets = useMemo(() => {
    if (terms && sense_keys && synsetInfo && processed.type === 'fixed' && processed.synsets.length) {
      const siblings = termsByCategory(Object.keys(dictEntry.categories), Dict)
      const siblingsExtended: {[index: string]: boolean} = {}
      Object.keys(siblings).forEach(id => {
        const processed = getProcessedTerm(id, data, Dict, true) as FixedTerm
        if (processed.lookup) processed.lookup.map.forEach((_, ext) => (siblingsExtended[ext] = true))
      })
      const out = processed.synsets.map(synset => {
        let score = 0
        unpackSynsetMembers(synset, terms, synsetInfo).forEach(term => {
          if (term in siblings) score++
          if (term in siblingsExtended) score += 0.01
        })
        return {score, synset}
      })
      return out.sort(byRank)
    } else {
      return []
    }
  }, [terms, sense_keys, synsetInfo, processed, Dict, data, dictEntry])
  if (terms && sense_keys && synsetInfo && processed.type === 'fixed' && processed.synsets.length) {
    const synsetKeys = rankedSynsets.map(rank => sense_keys[rank.synset.index])
    return (
      <Autocomplete
        size="small"
        options={synsetKeys}
        value={dictEntry.sense}
        renderOption={(props, option, state) => {
          const {synset, score} = rankedSynsets[state.index]
          return (
            <MenuItem key={option} value={option} {...props}>
              <Tooltip title={synset.definition} placement="right">
                <Typography sx={{width: '100%'}}>
                  <span className="number-annotation">{'(' + score.toFixed(2) + ') '}</span>
                  {sense_keys[synset.index]}
                </Typography>
              </Tooltip>
            </MenuItem>
          )
        }}
        renderInput={params => <TextField label={label} {...params}></TextField>}
        onChange={(e, value) => {
          const newValue = value || ''
          editCell && editCell({id, field, value: newValue})
          edit({
            type: 'update',
            term_id: id,
            term: processed.term,
            term_type: processed.term_type,
            sense: newValue,
          })
        }}
        selectOnFocus
        clearOnEscape
        handleHomeEndKeys
        fullWidth
        freeSolo
      ></Autocomplete>
    )
  } else {
    return (
      <TextField
        size="small"
        value={dictEntry.sense}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          editCell && editCell({id, field, value: e.target.value})
          edit({
            type: 'update',
            term_id: id,
            term: processed.term,
            term_type: processed.term_type,
            sense: e.target.value,
          })
        }}
        label={label}
      ></TextField>
    )
  }
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
  const editDictionary = useContext(BuildEditContext)
  const data = useContext(ResourceContext)

  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(5)
  const [sortCol, setSortCol] = useState({column: 'Frequency', asc: false})
  const cols = useMemo(
    () => [
      <TableCell key="term_action" width={1}></TableCell>,
      ...columns.map(col => (
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
    ],
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
                    <TableCell sx={{p: 0}}>
                      {processedMatch.in_dict ? (
                        <IconButton
                          aria-label="remove"
                          size="small"
                          edge="start"
                          sx={{p: 0, opacity: 0.6}}
                          onClick={() => {
                            editDictionary({type: 'remove', term_id: match})
                          }}
                        >
                          <Remove />
                        </IconButton>
                      ) : (
                        <IconButton
                          aria-label="add"
                          size="small"
                          edge="start"
                          sx={{p: 0, opacity: 0.6}}
                          onClick={() => {
                            editDictionary({type: 'add', term_id: match, term: match, term_type: 'fixed'})
                          }}
                        >
                          <Add />
                        </IconButton>
                      )}
                    </TableCell>
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

const iconStyle = {minWidth: '20px', opacity: 0.9, '& .MuiSvgIcon-root': {fontSize: '1em'}}
export function termListItem(
  id: string,
  dict: Dict,
  editor: (action: DictionaryActions) => void,
  showTerm: (action: InfoDrawerActions) => void
) {
  const capturedBy = getFuzzyParent(id)
  const inCurrent = id in dict
  const term = (inCurrent && dict[id].term) || id
  return (
    <ListItem
      key={id}
      disableGutters
      disablePadding
      sx={{pr: 3}}
      secondaryAction={
        inCurrent ? (
          <IconButton
            aria-label="remove"
            size="small"
            edge="end"
            sx={iconStyle}
            onClick={() => {
              editor({type: 'remove', term_id: id})
            }}
          >
            <Remove />
          </IconButton>
        ) : (
          <IconButton
            aria-label="add"
            size="small"
            edge="end"
            sx={iconStyle}
            onClick={() => {
              editor({type: 'add', term_id: id, term, term_type: 'fixed'})
            }}
          >
            <Add />
          </IconButton>
        )
      }
    >
      <ListItemIcon sx={iconStyle}>
        {inCurrent ? (
          <Tooltip title="in current dictionary" placement="left">
            <Check color="success" />
          </Tooltip>
        ) : capturedBy && capturedBy in dict ? (
          <Tooltip title={'captured by ' + capturedBy + ' in current dictionary'} placement="left">
            <IconButton
              sx={{p: 0, '& .MuiSvgIcon-root': {fontSize: '.7em'}}}
              onClick={() => {
                showTerm({type: 'add', state: {type: 'term', value: capturedBy}})
              }}
            >
              <LensBlur color="secondary" />
            </IconButton>
          </Tooltip>
        ) : (
          <></>
        )}
      </ListItemIcon>
      <TermLink term={term}></TermLink>
    </ListItem>
  )
}
function TermFixed({processed}: {processed: FixedTerm}) {
  const containerStyle = {p: 1, pl: 0, maxHeight: '100%', overflowY: 'auto', overflowX: 'hidden'}
  const dict = useContext(BuildContext)
  const editDictionary = useContext(BuildEditContext)
  const updateInfoDrawerState = useContext(InfoDrawerSetter)
  const {terms, termLookup, collapsedTerms, sense_keys} = useContext(ResourceContext)
  const byIndex = useCallback(termLookup ? (a: string, b: string) => termLookup[a] - termLookup[b] : () => 0, [
    termLookup,
  ])
  if (!processed.forms) {
    processed.forms = extractExpanded(processed.term, collapsedTerms ? collapsedTerms.all : '')
    processed.forms.sort(sortByLength)
  }
  return (
    <Stack direction="row" spacing={4} sx={{height: '100%'}}>
      <Stack>
        <Tooltip title="100 - index / n terms * 100; terms are loosely sorted by frequency and space coverage">
          <Typography>Relative Frequency</Typography>
        </Tooltip>
        <Box sx={{p: 1}}>
          <span className="number">{relativeFrequency(processed.index, terms && terms.length).toFixed(2)}</span>
        </Box>
      </Stack>
      {terms && processed.lemma.length ? (
        <Stack>
          <Typography>Lemmatizer</Typography>
          <Box sx={containerStyle}>
            <List disablePadding sx={{p: 0}}>
              {processed.lemma
                .filter(term => term !== processed.term)
                .map(term => termListItem(term, dict, editDictionary, updateInfoDrawerState))}
            </List>
          </Box>
        </Stack>
      ) : (
        <></>
      )}
      {processed.forms.length ? (
        <Stack>
          <Typography>Expansion</Typography>
          <Box sx={containerStyle}>
            <List disablePadding sx={{p: 0}}>
              {processed.forms.map(term => termListItem(term, dict, editDictionary, updateInfoDrawerState))}
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
              {processed.related.map(term => termListItem(term, dict, editDictionary, updateInfoDrawerState))}
            </List>
          </Box>
        </Stack>
      ) : (
        <></>
      )}
      {sense_keys && processed.synsets.length ? (
        <>
          <Stack>
            <Typography>Senses</Typography>
            <Box sx={containerStyle}>
              <List sx={{p: 0}}>
                {processed.synsets.map(info => (
                  <ListItem key={info.index} disablePadding>
                    <SynsetLink senseKey={sense_keys[info.index]} info={info} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Stack>
          {processed.synset_terms.length ? (
            <Stack>
              <Typography>Extended Synset Members</Typography>
              <Box sx={containerStyle}>
                <List disablePadding sx={{p: 0}}>
                  {processed.synset_terms
                    .sort(byIndex)
                    .map(term => termListItem(term, dict, editDictionary, updateInfoDrawerState))}
                </List>
              </Box>
            </Stack>
          ) : (
            <></>
          )}
        </>
      ) : (
        <></>
      )}
    </Stack>
  )
}

export function TermLink({term}: {term: string}) {
  const updateInfoDrawerState = useContext(InfoDrawerSetter)
  return (
    <Button
      fullWidth
      variant="text"
      sx={{p: 0, justifyContent: 'flex-start', textTransform: 'none'}}
      onClick={() => updateInfoDrawerState({type: 'add', state: {type: 'term', value: term}})}
    >
      {term}
    </Button>
  )
}

export function TermDisplay({term}: {term: string}) {
  const data = useContext(ResourceContext)
  const dict = useContext(BuildContext)
  const processed = getProcessedTerm(term, data, dict)
  return processed.type === 'fixed' ? <TermFixed processed={processed} /> : <TermFuzzy processed={processed} />
}
