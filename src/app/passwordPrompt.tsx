import {Close} from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import {type ChangeEvent, useState, useContext, type KeyboardEvent} from 'react'
import {ManageDictionaries, PasswordEnterer, PasswordPrompter, PasswordResolve} from './building'

export function PasswordPrompt() {
  const dictName = useContext(PasswordEnterer)
  const reply = useContext(PasswordResolve)
  const close = useContext(PasswordPrompter)
  const manageDictionaries = useContext(ManageDictionaries)
  const [failed, setFailed] = useState(false)
  const bail = () => {
    setPassword('')
    manageDictionaries({type: 'set', name: 'default'})
    close('')
  }
  const [password, setPassword] = useState('')
  const submit = () => {
    if (password) {
      setFailed(false)
      reply(password)
        .then(() => {
          close('')
          setPassword('')
        })
        .catch(() => {
          setPassword('')
          setFailed(true)
        })
    }
  }
  return (
    <Dialog open={!!dictName} onClose={bail}>
      <DialogTitle>Decrypt Dictionary</DialogTitle>
      <IconButton
        aria-label="close export menu"
        onClick={bail}
        sx={{
          position: 'absolute',
          right: 8,
          top: 12,
        }}
        className="close-button"
      >
        <Close />
      </IconButton>
      <DialogContent sx={{p: 1}}>
        <Typography>Enter the password for the {dictName} dictionary:</Typography>
        <TextField
          fullWidth
          size="small"
          type="password"
          value={password}
          error={failed}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.code === 'Enter') {
              submit()
            }
          }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setPassword(e.target.value)
          }}
        />
      </DialogContent>
      <DialogActions sx={{justifyContent: 'space-between'}}>
        <Button onClick={bail}>Cancel</Button>
        <Button variant="contained" onClick={submit}>
          Decrypt
        </Button>
      </DialogActions>
    </Dialog>
  )
}
