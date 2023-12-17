import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  List,
  ListItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {CommonExpansions, sortByLength} from '../../utils'
import {Close, Done} from '@mui/icons-material'
import {SyntheticEvent, useState} from 'react'

export type FuzzyTerm = {
  type: 'fuzzy'
  term: string
  categories: {[index: string]: number}
  recognized: boolean
  regex: RegExp
  matches: string[]
  common_matches: CommonExpansions
}
export type FixedTerm = {
  type: 'fixed'
  term: string
  categories: {[index: string]: number}
  recognized: boolean
  synsets: string[]
  synset: string
}

export function Term({
  term,
  onRemove,
  onUpdate,
}: {
  term: FuzzyTerm | FixedTerm
  onRemove: () => void
  onUpdate: (value: string) => void
}) {
  const [editedTerm, setEditedTerm] = useState(term.term)
  return (
    <Card sx={{m: 0.5}}>
      {term.recognized ? (
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
            {editedTerm !== term.term ? (
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
        <Stack direction="row">
          {term.type === 'fixed' ? <TermFixed term={term}></TermFixed> : <TermFuzzy term={term}></TermFuzzy>}
        </Stack>
      </CardContent>
    </Card>
  )
}

function TermFuzzy({term}: {term: FuzzyTerm}) {
  return (
    <Paper>
      <Typography>Matches{' (' + term.matches.length + ')'}</Typography>
      {term.matches.length ? (
        <Box sx={{maxHeight: 200, overflowY: 'auto'}}>
          <List sx={{marginLeft: '12px'}}>
            {[
              ...term.matches.filter(t => t in term.common_matches).sort(sortByLength),
              ...term.matches.filter(t => !(t in term.common_matches)).sort(sortByLength),
            ].map((match, index) => {
              const common = term.common_matches[match]
              return (
                <ListItem key={index} sx={{p: 0}}>
                  {common ? (
                    <Typography className={common.part === '' ? 'match-root' : ''}>
                      <span className="term-root">{common.root}</span>
                      <span>{common.part}</span>
                    </Typography>
                  ) : (
                    <Typography className="match-uncommon">{match}</Typography>
                  )}
                </ListItem>
              )
            })}
          </List>
        </Box>
      ) : (
        <Typography>No matches</Typography>
      )}
    </Paper>
  )
}

function TermFixed({term}: {term: FixedTerm}) {
  return (
    <Paper elevation={1}>
      <Typography>
        Recognized:
        <span>{' ' + term.recognized}</span>
      </Typography>
    </Paper>
  )
}
