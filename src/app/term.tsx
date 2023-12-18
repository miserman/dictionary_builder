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
import {CommonExpansions, sortByLength} from './utils'
import {Close, Done} from '@mui/icons-material'
import {SyntheticEvent, useState} from 'react'
import {TermInfo} from './termInfo'
import {Synset} from './resources'

export type FixedTerm = {
  type: 'fixed'
  term: string
  categories: {[index: string]: number}
  recognized: boolean
  index: number
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
  common_matches: CommonExpansions
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
        <Stack direction="row">
          {processed.type === 'fixed' ? (
            <TermFixed processed={processed}></TermFixed>
          ) : (
            <TermFuzzy processed={processed}></TermFuzzy>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

function TermFuzzy({processed}: {processed: FuzzyTerm}) {
  return (
    <Paper>
      <Typography>Matches{' (' + processed.matches.length + ')'}</Typography>
      {processed.matches.length ? (
        <Box sx={{maxHeight: 200, overflowY: 'auto'}}>
          <List sx={{marginLeft: '12px'}}>
            {processed.matches.length > 1e4 ? (
              <ListItem>Too many matches.</ListItem>
            ) : (
              [
                ...processed.matches.filter(term => term in processed.common_matches).sort(sortByLength),
                ...processed.matches.filter(term => !(term in processed.common_matches)).sort(sortByLength),
              ].map((match, index) => {
                const common = processed.common_matches[match]
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
              })
            )}
          </List>
        </Box>
      ) : (
        <Typography>No matches</Typography>
      )}
    </Paper>
  )
}

function TermFixed({processed}: {processed: FixedTerm}) {
  return (
    <Paper elevation={1}>
      <TermInfo term={processed.term}></TermInfo>
    </Paper>
  )
}
