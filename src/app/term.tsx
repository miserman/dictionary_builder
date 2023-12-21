import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Link,
  List,
  ListItem,
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
import {relativeFrequency} from './utils'
import {Close, Done} from '@mui/icons-material'
import {ChangeEvent, SyntheticEvent, useContext, useState} from 'react'
import {ResourceContext, Synset} from './resources'
import {Processed, processTerm} from './building'
import {InfoDrawerContext} from './infoDrawer'
import {SynsetLink} from './synset'

export type FixedTerm = {
  type: 'fixed'
  term: string
  categories: {[index: string]: number}
  recognized: boolean
  index: number
  forms: string[]
  similar: string[]
  synsets: Synset[]
}
export type FuzzyTerm = {
  type: 'fuzzy'
  term: string
  categories: {[index: string]: number}
  recognized: boolean
  regex: RegExp
  matches: string[]
  common_matches: string[]
}

export function Term({
  processed,
  onRemove,
  onUpdate,
}: {
  processed: FuzzyTerm | FixedTerm
  onRemove: () => void
  onUpdate: (value: string) => void
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
      <CardContent>
        {processed.type === 'fixed' ? (
          <TermFixed processed={processed}></TermFixed>
        ) : (
          <TermFuzzy processed={processed}></TermFuzzy>
        )}
      </CardContent>
    </Card>
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
    for (let i = page * perPage, n = i + perPage; i < n; i++) {
      pageMatches.push(processed.matches[i])
    }
  }
  return (
    <Box sx={{width: '100%'}}>
      {nMatches ? (
        <TableContainer sx={{width: '100%'}}>
          <Table
            size="small"
            sx={{
              width: '100%',
              '& .MuiTableCell-root:first-of-type': {pl: 0},
              '& .MuiTableCell-root:last-of-type': {pr: 0},
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell component="th" width="999">
                  Match
                </TableCell>
                <TableCell component="th" align="right">
                  Frequency
                </TableCell>
                <TableCell component="th" align="right">
                  Similar
                </TableCell>
                <TableCell component="th" align="right">
                  Senses
                </TableCell>
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
                    <TableCell align="right">{processedMatch.similar.length}</TableCell>
                    <TableCell align="right">{processedMatch.synsets.length}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 20, 50, 100, 1000]}
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
  return <TermDisplay term={processed.term} />
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

export function TermDisplay({term, maxHeight}: {term: string; maxHeight?: string | number}) {
  const containerStyle = {p: 1, maxHeight: maxHeight || '20vh', overflowY: 'auto', overflowX: 'hidden'}
  const processedTerms = useContext(Processed)
  const data = useContext(ResourceContext)
  if (!(term in processedTerms)) processedTerms[term] = processTerm(term, data)
  const processed = processedTerms[term] as FixedTerm
  return (
    <Stack direction="row" spacing={4}>
      <Stack>
        <Tooltip title="100 - index / n terms * 100; terms are losely sorted by frequency and space coverage">
          <Typography>Relative Frequency</Typography>
        </Tooltip>
        <Box sx={{p: 1}}>
          <span className="number">{relativeFrequency(processed.index, data.terms && data.terms.length)}</span>
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
      {processed.similar.length ? (
        <Stack>
          <Typography>Similar Terms</Typography>
          <Box sx={containerStyle}>
            <List sx={{p: 0}}>
              {processed.similar.map(term => (
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
      {processed.synsets.length ? (
        <Stack>
          <Typography>Senses</Typography>
          <Box sx={containerStyle}>
            <List sx={{p: 0}}>
              {processed.synsets.map(info => (
                <ListItem key={info.key} sx={{p: 0}}>
                  <SynsetLink info={info} />
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
