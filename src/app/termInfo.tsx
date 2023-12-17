import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  Stack,
  Typography,
} from '@mui/material'
import {ResourceContext} from './resources'
import {useContext, useState} from 'react'
import {Close} from '@mui/icons-material'

export function TermInfo({term}: {term: string}) {
  const {terms, termAssociations, synsets, synsetInfo} = useContext(ResourceContext)
  const [open, setOpen] = useState(false)
  if (!terms || !synsets || !synsetInfo || !termAssociations || !terms.includes(term))
    return (
      <Button variant="text" disabled>
        {term}
      </Button>
    )

  const associated = termAssociations[terms.indexOf(term)]
  const similar = associated[0] ? (Array.isArray(associated[0]) ? associated[0] : [associated[0]]) : []
  const senses = associated[1] ? (Array.isArray(associated[1]) ? associated[1] : [associated[1]]) : []
  return (
    <Box>
      <Button variant="text" onClick={() => setOpen(true)}>
        {term}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} scroll="paper">
        <DialogTitle>{term}</DialogTitle>
        <IconButton
          aria-label="Close"
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
          onClick={() => setOpen(false)}
        >
          <Close />
        </IconButton>
        <DialogContent>
          <DialogContent>
            <Stack direction="row" spacing={4}>
              {similar.length ? (
                <Stack>
                  <Typography variant="h5">Similar Terms</Typography>
                  <List sx={{p: 0}}>
                    {similar.map(index => (
                      <ListItem key={index} sx={{p: 0}}>
                        {<TermInfo term={terms[index - 1]}></TermInfo>}
                      </ListItem>
                    ))}
                  </List>
                </Stack>
              ) : (
                <></>
              )}
              {senses.length ? (
                <Stack>
                  <Typography variant="h5">Senses</Typography>
                  <List sx={{p: 0}}>
                    {senses.map(index => (
                      <ListItem key={index} sx={{p: 0}}>
                        {<TermInfo term={synsets[index - 1]}></TermInfo>}
                      </ListItem>
                    ))}
                  </List>
                </Stack>
              ) : (
                <></>
              )}
            </Stack>
          </DialogContent>
        </DialogContent>
        <DialogActions>
          <Button>{['a'].includes(term) ? 'Remove' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
