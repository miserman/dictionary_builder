import {Close, Menu} from '@mui/icons-material'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {ChangeEvent, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {HistoryStepper} from './building'

export type Settings = {
  selected?: string
  dictionary_names?: string[]
  undo?: string
  redo?: string
}

export function loadSettings() {
  return (
    'undefined' === typeof window ? {} : JSON.parse(localStorage.getItem('dictionary_builder_settings') || '{}')
  ) as Settings
}

export function SettingsMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const settings = useMemo(loadSettings, [])
  const historyStep = useContext(HistoryStepper)
  const [undo, setUndo] = useState(settings.undo || 'z')
  const [redo, setRedo] = useState(settings.redo || 'x')
  const listener = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === redo) {
          historyStep(-1)
        } else if (e.key === undo) {
          historyStep(1)
        }
      }
    },
    [undo, redo, historyStep]
  )
  useEffect(() => {
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
    }
  }, [undo, redo, listener])
  return (
    <>
      <IconButton onClick={toggleMenu}>
        <Menu />
      </IconButton>
      <Drawer anchor="right" open={menuOpen} onClose={toggleMenu}>
        <Card
          sx={{
            height: '100%',
            width: '12em',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <CardHeader
            title={<Typography>Settings</Typography>}
            action={
              <IconButton onClick={toggleMenu}>
                <Close />
              </IconButton>
            }
          />
          <CardContent sx={{alignContent: 'left', mb: 'auto'}}>
            <Stack spacing={3}>
              <Typography>Keybinds</Typography>
              <TextField
                size="small"
                label="undo"
                value={undo}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  window.removeEventListener('keydown', listener)
                  settings.undo = e.target.value
                  localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
                  setUndo(e.target.value)
                }}
              ></TextField>
              <TextField
                size="small"
                label="redo"
                value={redo}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  window.removeEventListener('keydown', listener)
                  settings.redo = e.target.value
                  localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
                  setRedo(e.target.value)
                }}
              ></TextField>
            </Stack>
          </CardContent>
          <CardActions>
            <Button
              fullWidth
              color="error"
              onClick={() => {
                const settings = loadSettings()
                if (settings.dictionary_names) {
                  settings.dictionary_names.forEach(name => {
                    localStorage.removeItem('dict_' + name)
                    localStorage.removeItem('dict_history_' + name)
                  })
                }
                localStorage.removeItem('dictionary_builder_settings')
                window.location.reload()
              }}
            >
              Clear Storage
            </Button>
          </CardActions>
        </Card>
      </Drawer>
    </>
  )
}
