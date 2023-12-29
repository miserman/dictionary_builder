import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import {useContext, useMemo} from 'react'
import {Dict, EditHistory, EditHistoryEditor, HistoryContainer, HistoryEntry, HistoryStepper} from './building'
import {ChevronLeft, ChevronRight, LastPage} from '@mui/icons-material'

function undoChange(change: HistoryEntry, dict: Dict) {
  switch (change.type) {
    case 'add_term':
      delete dict[change.name]
      return
    case 'remove_term':
      dict[change.name] = change.value
      return
    case 'replace_term':
      delete dict[change.name]
      dict[change.originalName] = change.originalValue
      return
    case 'edit_term':
      if (change.value.field === 'categories') {
        const current = {...dict[change.name]}
        change.value.edits.forEach(e => {
          if (e.from) {
            current.categories[e.category] = e.from
          } else {
            delete current.categories[e.category]
          }
        })
      } else {
        dict[change.name][change.value.field] = change.value.original as 'fixed'
      }
      return
    case 'add_category':
      Object.keys(dict).forEach(term => {
        const e = dict[term]
        Object.keys(e.categories).forEach(cat => {
          if (cat in change.value) delete e.categories[cat]
        })
      })
      return
    case 'remove_category':
      Object.keys(dict).forEach(term => {
        if (term in change.value) dict[term].categories[change.name] = change.value[term]
      })
      return
  }
}
function redoChange(change: HistoryEntry, dict: Dict) {
  switch (change.type) {
    case 'add_term':
      dict[change.name] = change.value
      return
    case 'remove_term':
      delete dict[change.name]
      return
    case 'replace_term':
      delete dict[change.originalName]
      dict[change.name] = change.value
      return
    case 'edit_term':
      if (change.value.field === 'categories') {
        const current = {...dict[change.name]}
        change.value.edits.forEach(e => {
          if (e.to) {
            current.categories[e.category] = e.to
          } else {
            delete current.categories[e.category]
          }
        })
      } else {
        dict[change.name][change.value.field] = change.value.new as 'fixed'
      }
      return
    case 'add_category':
      Object.keys(dict).forEach(term => {
        if (term in change.value) dict[term].categories[change.name] = change.value[term]
      })
      return
    case 'remove_category':
      Object.keys(change.value).forEach(term => {
        const e = dict[term]
        if (e && e.categories && change.name in e.categories) delete e.categories[change.name]
      })
      return
  }
}
export function moveInHistory(to: number, history: HistoryContainer, dict: Dict) {
  let i = history.position
  if (to > history.position) {
    for (i = Math.max(0, i); i < to + 1; i++) {
      if (history.edits[i]) undoChange(history.edits[i], dict)
    }
  } else {
    for (i = Math.min(history.edits.length - 1, i); i > to; i--) {
      if (history.edits[i]) redoChange(history.edits[i], dict)
    }
  }
  history.position = to
}

export function History() {
  const history = useContext(EditHistory)
  const editHistory = useContext(EditHistoryEditor)
  const historyStep = useContext(HistoryStepper)

  const historyItems = useMemo(
    () =>
      history.edits.map((edit, index) => (
        <ListItem key={index} sx={{p: 0}}>
          <ListItemButton
            sx={{borderLeft: history.position >= index ? '2px solid #fff' : ''}}
            onClick={() => historyStep(index - history.position)}
          >
            <ListItemText
              sx={{m: 0}}
              primary={
                <>
                  <Typography>
                    <span style={{opacity: '.75'}}>{edit.type + ': '}</span>
                    {edit.name}
                  </Typography>
                  {edit.type === 'edit_term' ? (
                    <Typography className="code">
                      {edit.value.field === 'categories'
                        ? edit.value.edits.map(edit => edit.category + ': ' + edit.from + ' -> ' + edit.to).join('\n')
                        : edit.value.field + ': ' + edit.value.original + ' -> ' + edit.value.new}
                    </Typography>
                  ) : (
                    <></>
                  )}
                </>
              }
              secondary={
                <Typography sx={{fontSize: '.8em', opacity: 0.6}} variant="body2">
                  {edit.time ? new Date(edit.time).toLocaleString() : ''}
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>
      )),
    [history, historyStep]
  )
  return (
    <Card
      elevation={5}
      sx={{height: '60%', minHeight: '300px', position: 'relative', display: 'flex', flexDirection: 'column'}}
    >
      <CardHeader title={<Typography>Edit History</Typography>} sx={{pb: 0}} />
      <Stack direction="row" sx={{position: 'absolute', top: 8, right: 8}}>
        <IconButton onClick={() => historyStep(1)}>
          <ChevronLeft />
        </IconButton>
        <IconButton onClick={() => historyStep(-1)}>
          <ChevronRight />
        </IconButton>
        <IconButton onClick={() => historyStep(-1000)}>
          <LastPage />
        </IconButton>
      </Stack>
      <CardContent sx={{p: 0, mb: 'auto', overflowY: 'auto'}}>
        <List sx={{overflowX: 'hidden'}}>{historyItems}</List>
      </CardContent>
      <CardActions>
        <Button
          fullWidth
          onClick={() => {
            editHistory({type: 'clear'})
          }}
        >
          Clear
        </Button>
      </CardActions>
    </Card>
  )
}
