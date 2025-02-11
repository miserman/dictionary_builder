import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListSubheader,
  MenuItem,
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
import {relativeFrequency, sortByLength} from './lib/utils'
import {type ChangeEvent, useContext, useState, useMemo, useCallback, useEffect, Fragment} from 'react'
import {ResourceContext, type Synset} from './resources'
import {BuildContext, BuildEditContext, type DictionaryActions, termsByCategory, type NumberObject} from './building'
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
  const {terms, senseMap, sense_keys, synsetInfo} = data
  const getCoarseSense = (key: string, synset: Synset) => {
    const labels = key in senseMap ? senseMap[key] : synset.csi_labels
    return 'string' === typeof labels ? labels : labels[0]
  }
  const [open, setOpen] = useState(false)
  const [rankedSynsets, setRankedSynsets] = useState<{key: string; score: number; synset: Synset}[]>([])
  const loading = open && !rankedSynsets.length
  useEffect(() => {
    if (open && terms && sense_keys && synsetInfo && processed.type === 'fixed' && processed.synsets.length) {
      const getRanked = async () => {
        const siblings = termsByCategory(Object.keys(dictEntry.categories), Dict)
        const siblingsExtended: {[index: string]: boolean} = {}
        Object.keys(siblings).forEach(id => {
          const processed = getProcessedTerm(id, data, Dict, true) as FixedTerm
          if (processed.lookup) processed.lookup.map.forEach((_, ext) => (siblingsExtended[ext] = true))
        })
        const clusterRanks: NumberObject = {}
        const out = processed.synsets.map(synset => {
          let score = 0
          unpackSynsetMembers(synset, terms, synsetInfo).forEach(term => {
            if (term in siblings) score++
            if (term in siblingsExtended) score += 0.01
          })
          if (synset.count) score += synset.count * 0.001
          if (!synset.csi_labels) synset.csi_labels = 'no category'
          const key = sense_keys[synset.index]
          const cluster = getCoarseSense(key, synset)
          if (!(cluster in clusterRanks) || clusterRanks[cluster] < score) {
            clusterRanks[cluster] = score
          }
          return {key, score, synset}
        })
        const synsetCategories = out.map(({key, synset}) => getCoarseSense(key, synset)).sort()
        synsetCategories
        setRankedSynsets(
          out.sort((a, b) => {
            const clusterA = getCoarseSense(a.key, a.synset)
            const clusterRankA = clusterRanks[clusterA]
            const clusterNameA = -synsetCategories.indexOf(clusterA)
            const clusterB = getCoarseSense(b.key, b.synset)
            const clusterRankB = clusterRanks[clusterB]
            const clusterNameB = -synsetCategories.indexOf(clusterB)
            return (
              clusterRankB * 100 +
              clusterNameB * 0.1 +
              b.score * 0.01 -
              (clusterRankA * 100 + clusterNameA * 0.1 + a.score * 0.01)
            )
          })
        )
      }
      setTimeout(getRanked, 150)
    } else {
      setRankedSynsets([])
    }
  }, [open, terms, senseMap, sense_keys, synsetInfo, processed, Dict, data, dictEntry])
  if (terms && sense_keys && synsetInfo && processed.type === 'fixed' && processed.synsets.length) {
    return (
      <Autocomplete
        size="small"
        componentsProps={{popper: {className: 'synset-select'}}}
        options={rankedSynsets}
        loading={loading}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={dictEntry.sense}
        groupBy={rank => getCoarseSense(rank.key, rank.synset)}
        getOptionLabel={option => ('string' === typeof option ? option : option.key)}
        renderOption={(props, rank) => {
          const {key, synset, score} = rank
          delete (props as unknown as any).key
          return (
            <MenuItem {...props} key={key} value={key}>
              <Tooltip title={synset.definition} placement="right">
                <Typography sx={{width: '100%'}}>
                  <span className="number-annotation">{'(' + score.toFixed(2) + ') '}</span>
                  {sense_keys[synset.index]}
                  {synset.count && <span className="number-annotation">{' ' + synset.count}</span>}
                </Typography>
              </Tooltip>
            </MenuItem>
          )
        }}
        renderInput={params => (
          <TextField
            label={label}
            {...params}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <Fragment>
                  {loading && <CircularProgress size={20} />}
                  {params.InputProps.endAdornment}
                </Fragment>
              ),
            }}
          ></TextField>
        )}
        ListboxProps={{
          style: {cursor: 'pointer'},
          onClick: e => {
            const target = e.target
            if ('tagName' in target && 'innerText' in target && target.tagName === 'DIV') {
              const newValue = target.innerText as string
              editCell && editCell({id, field, value: newValue})
              edit({
                type: 'update',
                term_id: id,
                term: processed.term,
                term_type: processed.term_type,
                sense: newValue,
              })
            }
          },
        }}
        onChange={(_, value) => {
          const newValue = (value && 'object' === typeof value && value.key) || ''
          editCell && editCell({id, field, value: newValue})
          edit({
            type: 'update',
            term_id: id,
            term: processed.term,
            term_type: processed.term_type,
            sense: newValue,
          })
        }}
        autoSelect
        blurOnSelect
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
  const [perPage, setPerPage] = useState(10)
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
  return nMatches ? (
    <TableContainer sx={{height: '100%', position: 'relative'}}>
      <Table stickyHeader size="small">
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
        sx={{width: '100%', bottom: '-1px', position: 'sticky', backgroundColor: '#1e1e1e'}}
        component="div"
        rowsPerPageOptions={[10, 20, 50, 100, 1000]}
        count={nMatches}
        rowsPerPage={perPage}
        page={page}
        onPageChange={(_, page: number) => {
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
function formatLink(id: string) {
  switch (id.substring(0, 1)) {
    case 'd':
      return 'https://wikidata.org/wiki/' + id.substring(2)
    case 'p':
      return 'https://dbpedia.org/resource/' + id.substring(2)
    case 'w':
      return 'https://en.wiktionary.org/wiki/' + id.substring(2)
  }
}
const linkNames = {d: 'Wikidata', p: 'DBpedia', w: 'Wiktionary'}
function formatLinkName(id: string) {
  return linkNames[id.substring(0, 1) as 'd' | 'p' | 'w'] + ': ' + id.substring(2)
}
const capitalLetter = /([A-Z])/g
function TermFixed({processed}: {processed: FixedTerm}) {
  const containerStyle = {p: 1, pl: 0, maxHeight: '100%', overflowY: 'auto', overflowX: 'hidden', whiteSpace: 'nowrap'}
  const dict = useContext(BuildContext)
  const editDictionary = useContext(BuildEditContext)
  const updateInfoDrawerState = useContext(InfoDrawerSetter)
  const {terms, senseMap, conceptNet, termLookup, collapsedTerms, sense_keys} = useContext(ResourceContext)
  const byIndex = useCallback(termLookup ? (a: string, b: string) => termLookup[a] - termLookup[b] : () => 0, [
    termLookup,
  ])
  if (!processed.forms) {
    processed.forms = extractExpanded(processed.term, collapsedTerms ? collapsedTerms.all : '')
    processed.forms.sort(sortByLength)
  }
  const synset_clusters: {[index: string]: Synset[]} = {}
  const clusterMax: {[index: string]: number} = {}
  if (processed.synsets) {
    processed.synsets.map(synset => {
      const key = sense_keys ? sense_keys[synset.index] : ''
      const labels = key in senseMap ? senseMap[key] : synset.csi_labels || 'no category'
      const label = 'string' === typeof labels ? labels : labels[0]
      const count = synset.count || 0
      if (label in synset_clusters) {
        synset_clusters[label].push(synset)
        if (count > clusterMax[label]) clusterMax[label] = count
      } else {
        synset_clusters[label] = [synset]
        clusterMax[label] = count
      }
    })
  }
  const concept = conceptNet && conceptNet.terms['' + (processed.index + 1)]
  const links = conceptNet && conceptNet.links['' + (processed.index + 1)]
  return (
    <Stack direction="row" spacing={2} sx={{height: '100%', pb: 1}}>
      <Stack>
        <Tooltip title="100 - index / n terms * 100; terms are loosely sorted by frequency and space coverage">
          <Typography>Frequency</Typography>
        </Tooltip>
        <Box sx={{p: 1}}>
          <span className="number">{relativeFrequency(processed.index, terms && terms.length).toFixed(2)}</span>
        </Box>
        {(!!concept || !!processed.synsets.length || !!links) && (
          <>
            <Typography>Sources</Typography>
            <Box sx={{p: 1}}>
              <List sx={{p: 0, fontSize: '.8em', whiteSpace: 'nowrap', '& a': {cursor: 'pointer'}}}>
                {!!concept && (
                  <ListItem disableGutters disablePadding>
                    <Link
                      href={'https://conceptnet.io/c/en/' + processed.term.replace(' ', '_')}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ConceptNet
                    </Link>
                  </ListItem>
                )}
                {!!processed.synsets.length && (
                  <ListItem disableGutters disablePadding>
                    <Link href={'https://en-word.net/lemma/' + processed.term} target="_blank" rel="noreferrer">
                      OEWordNet
                    </Link>
                  </ListItem>
                )}
                {links &&
                  ('string' === typeof links ? [links] : links).map(link => (
                    <ListItem key={link} disableGutters disablePadding>
                      <Link href={formatLink(link)} target="_blank" rel="noreferrer">
                        {formatLinkName(link)}
                      </Link>
                    </ListItem>
                  ))}
              </List>
            </Box>
          </>
        )}
      </Stack>
      {terms && !!processed.lemma.length && (
        <Stack>
          <Tooltip title="Term forms produced by lemmatizing original terms with the RNNTagger, the grouping by root.">
            <Typography>Lemmatizer</Typography>
          </Tooltip>
          <Box sx={containerStyle}>
            <List disablePadding sx={{p: 0}}>
              {processed.lemma
                .filter(term => term !== processed.term)
                .map(term => termListItem(term, dict, editDictionary, updateInfoDrawerState))}
            </List>
          </Box>
        </Stack>
      )}
      {!!processed.forms.length && (
        <Stack>
          <Tooltip title="Term forms produced by rule-based matches (e.g., with added or removed common affixes) to other terms.">
            <Typography>Expansion</Typography>
          </Tooltip>
          <Box sx={containerStyle}>
            <List disablePadding sx={{p: 0}}>
              {processed.forms.map(term => termListItem(term, dict, editDictionary, updateInfoDrawerState))}
            </List>
          </Box>
        </Stack>
      )}
      {!!processed.related.length && (
        <Stack>
          <Tooltip title="Similar terms within latent semantic spaces (embeddings); based on top 100 terms across a proportion of different spaces.">
            <Typography>Related Terms</Typography>
          </Tooltip>
          <Box sx={containerStyle}>
            <List disablePadding sx={{p: 0}}>
              {processed.related.map(term => termListItem(term, dict, editDictionary, updateInfoDrawerState))}
            </List>
          </Box>
        </Stack>
      )}
      {sense_keys && !!processed.synsets.length && (
        <>
          <Stack>
            <Typography>Senses</Typography>
            <Box sx={{...containerStyle, p: 0}}>
              <List subheader={<li />} className="term-sense-list">
                {Object.keys(synset_clusters)
                  .sort((a, b) => {
                    return clusterMax[b] - clusterMax[a]
                  })
                  .map(cluster => {
                    const infos = synset_clusters[cluster]
                    return (
                      <li key={cluster}>
                        <ul>
                          <ListSubheader>{cluster}</ListSubheader>
                          {infos
                            .sort((a, b) => {
                              return (b.count || 0) - (a.count || 0)
                            })
                            .map(info => (
                              <ListItem key={info.index} disablePadding>
                                <SynsetLink senseKey={sense_keys[info.index]} info={info} />
                              </ListItem>
                            ))}
                        </ul>
                      </li>
                    )
                  })}
              </List>
            </Box>
          </Stack>
          {!!processed.synset_terms.length && (
            <Stack>
              <Typography sx={{whiteSpace: 'nowrap'}}>Extended Synset Members</Typography>
              <Box sx={containerStyle}>
                <List disablePadding sx={{p: 0}}>
                  {processed.synset_terms
                    .sort(byIndex)
                    .map(term => termListItem(term, dict, editDictionary, updateInfoDrawerState))}
                </List>
              </Box>
            </Stack>
          )}
        </>
      )}
      {concept && terms && (
        <Stack direction="row" spacing={2}>
          {Object.keys(concept)
            .sort((a, b) => {
              const ca = concept[a]
              const cb = concept[b]
              return ('number' === typeof cb ? 1 : cb.length) - ('number' === typeof ca ? 1 : ca.length)
            })
            .map(k => {
              const entry = concept[k]
              const conceptTerms = 'number' === typeof entry ? [entry] : entry
              return (
                <Stack key={k}>
                  <Typography sx={{whiteSpace: 'nowrap'}}>{k.replace(capitalLetter, ' $&').trimStart()}</Typography>
                  <Box sx={containerStyle}>
                    <List disablePadding sx={{p: 0}}>
                      {conceptTerms.map(index =>
                        termListItem(terms[index - 1], dict, editDictionary, updateInfoDrawerState)
                      )}
                    </List>
                  </Box>
                </Stack>
              )
            })}
        </Stack>
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
      sx={{p: 0, justifyContent: 'flex-start', textTransform: 'none', whiteSpace: 'nowrap'}}
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
