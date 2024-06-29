import {Close} from '@mui/icons-material'
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography} from '@mui/material'
import {useState} from 'react'

export function Confirm({label, message, onConfirm}: {label: string; message: string; onConfirm: () => void}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  return (
    <>
      <Button fullWidth color="error" onClick={toggleMenu}>
        {label}
      </Button>
      {menuOpen && (
        <Dialog open={menuOpen} onClose={toggleMenu}>
          <DialogTitle>Confirm</DialogTitle>
          <IconButton
            aria-label="close confirmation dialog"
            onClick={toggleMenu}
            sx={{
              position: 'absolute',
              right: 8,
              top: 12,
            }}
            className="close-button"
          >
            <Close />
          </IconButton>
          <DialogContent>
            <Typography>{message}</Typography>
          </DialogContent>
          <DialogActions sx={{justifyContent: 'space-between'}}>
            <Button onClick={toggleMenu}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                onConfirm()
                toggleMenu()
              }}
            >
              {label}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  )
}
