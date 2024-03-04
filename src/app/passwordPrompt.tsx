import {Close, Visibility, VisibilityOff} from '@mui/icons-material'
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
  const name = useContext(PasswordEnterer)
  const reply = useContext(PasswordResolve)
  const close = useContext(PasswordPrompter)
  const manageDictionaries = useContext(ManageDictionaries)
  const [failed, setFailed] = useState(false)
  const [hide, setHide] = useState(true)
  let succeeded = false
  const bail = () => {
    setFailed(false)
    setPassword('')
    close('')
    if (!succeeded && !!name) {
      if (name !== 'coarse_sense_map') {
        manageDictionaries({type: 'set', name: 'default'})
      }
    }
    reply('')
  }
  const [password, setPassword] = useState('')
  const submit = () => {
    if (password) {
      setFailed(false)
      reply(password)
        .then(() => {
          succeeded = true
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
    <Dialog open={!!name} onClose={bail}>
      <DialogTitle>Encrypted Resource</DialogTitle>
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
        <Typography sx={{mb: 2}}>
          The <span className="number">{name}</span> resource is encrypted.
        </Typography>
        <TextField
          fullWidth
          label="Password"
          size="small"
          type={hide ? 'password' : 'text'}
          value={password}
          error={failed}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.code === 'Enter' || e.code === 'NumpadEnter') {
              submit()
            }
          }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setPassword(e.target.value)
          }}
        />
        <IconButton
          sx={{position: 'absolute', right: 15}}
          aria-label="toggle password visibility"
          onClick={() => setHide(!hide)}
        >
          {hide ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </DialogContent>
      <DialogActions sx={{justifyContent: 'space-between'}}>
        <Button onClick={bail}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!password}>
          Decrypt
        </Button>
      </DialogActions>
    </Dialog>
  )
}
