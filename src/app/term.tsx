import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  FormControl,
  IconButton,
  InputLabel,
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
import {Close, Done} from '@mui/icons-material'
import {ChangeEvent, SyntheticEvent, useContext, useState} from 'react'
import {ResourceContext, Synset} from './resources'
import {AllCategoies, BuildContext, type DictionaryEditor, Processed, processTerm} from './building'
import {InfoDrawerContext} from './infoDrawer'
import {SynsetLink} from './synset'
import {extractExpanded} from './wordParts'

export type FixedTerm = {
  type: 'fixed'
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
  term: string
  categories: {[index: string]: number}
  recognized: boolean
  regex: RegExp
  matches: string[]
  common_matches?: string[]
}

function TermSenseEdit({processed, edit, label}: {processed: FixedTerm; edit: DictionaryEditor; label?: string}) {
  const inputStyle = label ? {} : {pt: 0, pb: 0}
  const Dict = useContext(BuildContext)
  const dictEntry = Dict[processed.term]
  const {sense_keys} = useContext(ResourceContext)
  return processed.synsets.length ? (
    <Select
      aria-label="assign synset"
      value={dictEntry.sense}
      onChange={(e: SelectChangeEvent) => {
        dictEntry.sense = e.target.value
        edit({type: 'update', term: processed.term, categories: dictEntry.categories, sense: dictEntry.sense})
      }}
      label={label}
      sx={{'& .MuiInputBase-input': inputStyle}}
    >
      {sense_keys &&
        processed.synsets.map(synset => {
          const {index} = synset
          return (
            <MenuItem key={index} value={sense_keys[index]}>
              <Tooltip title={synset.definition} placement="right">
                <Typography component="span">{sense_keys[index]}</Typography>
              </Tooltip>
            </MenuItem>
          )
        })}
    </Select>
  ) : (
    <TextField
      value={dictEntry.sense}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        dictEntry.sense = e.target.value
        edit({type: 'update', term: processed.term, categories: dictEntry.categories, sense: dictEntry.sense})
      }}
      label={label}
      sx={{'& .MuiInputBase-input': inputStyle}}
    ></TextField>
  )
}

export function TermCard({
  processed,
  onRemove,
  onUpdate,
  edit,
}: {
  processed: FuzzyTerm | FixedTerm
  onRemove: () => void
  onUpdate: (value: string) => void
  edit: DictionaryEditor
}) {
  const [editedTerm, setEditedTerm] = useState(processed.term)
  return (
    <Card sx={{m: 0.5}}>
      {processed.recognized ? (
        <Done color="success" sx={{fontSize: '.8rem', position: 'absolute'}} aria-label="recognized" />
      ) : (
        <></>
      )}
      <CardHeader
        title={
          <Stack direction="row">
            <TextField
              variant="standard"
              value={editedTerm}
              onChange={(e: SyntheticEvent) =>
                e.target && 'value' in e.target && setEditedTerm(e.target.value as string)
              }
              onKeyUp={(e: SyntheticEvent) => 'code' in e && e.code === 'Enter' && onUpdate(editedTerm)}
            ></TextField>
            {editedTerm !== processed.term ? (
              <Button
                onClick={() => {
                  onUpdate(editedTerm)
                }}
              >
                Update
              </Button>
            ) : (
              <></>
            )}
          </Stack>
        }
        action={
          <IconButton onClick={onRemove}>
            <Close />
          </IconButton>
        }
      ></CardHeader>
      <CardContent sx={{height: '25vh', pt: 0}}>
        <TermDisplay term={processed.term} />
      </CardContent>
      <CardActions>
        {processed.type === 'fixed' ? (
          <FormControl>
            {processed.synsets.length ? <InputLabel>Assigned Sense</InputLabel> : <></>}
            <TermSenseEdit processed={processed} edit={edit} label="Assigned Sense" />
          </FormControl>
        ) : (
          <></>
        )}
      </CardActions>
    </Card>
  )
}

export function TermRow({processed, edit}: {processed: FuzzyTerm | FixedTerm; edit: DictionaryEditor}) {
  const {terms} = useContext(ResourceContext)
  const cats = useContext(AllCategoies)
  return (
    <TableRow>
      <TableCell component="th">
        <TermLink term={processed.term} />
      </TableCell>
      {processed.type === 'fixed' ? (
        <>
          <TableCell>
            <TermSenseEdit processed={processed} edit={edit} />
          </TableCell>
          <TableCell>{relativeFrequency(processed.index, terms && terms.length)}</TableCell>
          <TableCell>{processed.recognized ? 1 : 0}</TableCell>
          <TableCell>{processed.synsets.length}</TableCell>
          <TableCell>{processed.related.length}</TableCell>
        </>
      ) : (
        <>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell>{processed.matches.length}</TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
        </>
      )}
      {cats.map(cat => (
        <TableCell key={cat}>
          <TextField
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = +e.target.value
              if (value) {
                processed.categories[cat] = value
              } else {
                delete processed.categories[cat]
              }
            }}
            value={processed.categories[cat] ? processed.categories[cat] : ''}
          ></TextField>
        </TableCell>
      ))}
    </TableRow>
  )
}

function TermFuzzy({processed}: {processed: FuzzyTerm}) {
  const processedTerms = useContext(Processed)
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
                if (!(match in processedTerms)) processedTerms[match] = processTerm(match, data)
                const processedMatch = processedTerms[match] as FixedTerm
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
    processed.forms = extractExpanded(processed.term, collapsedTerms ? collapsedTerms : '')
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
  const processedTerms = useContext(Processed)
  const data = useContext(ResourceContext)
  if (!(term in processedTerms)) processedTerms[term] = processTerm(term, data)
  const processed = processedTerms[term]
  return processed.type === 'fixed' ? <TermFixed processed={processed} /> : <TermFuzzy processed={processed} />
}
