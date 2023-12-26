import {Close} from '@mui/icons-material'
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField} from '@mui/material'
import {ChangeEvent, KeyboardEvent, useContext, useState} from 'react'
import {ManageDictionaries} from './building'

export function ImportMenu() {
  const manageDictionaries = useContext(ManageDictionaries)
  const [name, setName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const addDict = () => {
    if (name) {
      manageDictionaries({type: 'add', name: name, dict: {}})
    }
  }
  return (
    <>
      <Button variant="contained" onClick={toggleMenu}>
        New
      </Button>
      <Dialog open={menuOpen} onClose={toggleMenu}>
        <DialogTitle>Add Dictionary</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={toggleMenu}
          sx={{
            position: 'absolute',
            right: 8,
            top: 12,
            color: theme => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
        <DialogContent>
          <TextField
            label="name"
            value={name}
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
              if (name && e.code === 'Enter') {
                addDict()
              }
            }}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setName(e.target.value)
            }}
          />
        </DialogContent>
        <DialogActions>
          <Stack direction="row">
            <Button variant="contained" onClick={addDict}>
              Add
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  )
}
