import {Close, MoreVert} from '@mui/icons-material'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Drawer,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {type ChangeEvent, useCallback, useContext, useEffect, useState} from 'react'
import {HistoryStepper, SettingEditor, SettingsContext} from './building'
import {Confirm} from './confirmDialog'
import {removeStorage} from './storage'

export const INFO_DRAWER_HEIGHT = '30vh'
export const TERM_EDITOR_WIDTH = '200px'

export type Settings = {
  selected: string
  dictionary_names: string[]
  undo?: string
  redo?: string
  disable_storage?: boolean
  use_db?: boolean
}

export function loadSettings() {
  const raw = 'undefined' === typeof window ? null : localStorage.getItem('dictionary_builder_settings')
  const parsed = (
    raw ? JSON.parse(raw) : {dictionary_names: ['default'], selected: 'default', use_db: true}
  ) as Settings
  if (!parsed.dictionary_names) parsed.dictionary_names = ['default']
  if (!parsed.selected || !parsed.dictionary_names.includes(parsed.selected)) parsed.selected = 'default'
  if (!('use_db' in parsed)) parsed.use_db = true
  return parsed
}

export function SettingsMenu() {
  const updateSettings = useContext(SettingEditor)
  const settings = useContext(SettingsContext)
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const historyStep = useContext(HistoryStepper)
  const [undo, setUndo] = useState(settings.undo || 'z')
  const [redo, setRedo] = useState(settings.redo || 'x')
  const [disableStore, setDisableStore] = useState(!!settings.disable_storage)
  const [use_db, setUseDB] = useState(!!settings.use_db)
  const listener = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (!e.target || !('tagName' in e.target) || e.target.tagName !== 'INPUT')) {
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
  }, [listener])
  return (
    <>
      <IconButton onClick={toggleMenu} aria-label="toggle settings menu">
        <MoreVert />
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
            title={<Typography fontWeight="bold">Settings</Typography>}
            action={
              <IconButton onClick={toggleMenu} aria-label="close settings menu" className="close-button">
                <Close />
              </IconButton>
            }
          />
          <CardContent sx={{alignContent: 'left', mb: 'auto'}}>
            <Stack spacing={2}>
              <FormControlLabel
                label="Disable Storage"
                labelPlacement="start"
                sx={{justifyContent: 'space-between'}}
                control={
                  <Switch
                    checked={disableStore}
                    size="small"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      settings.disable_storage = !disableStore
                      updateSettings({...settings})
                      localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
                      setDisableStore(!disableStore)
                    }}
                  />
                }
              />
              {disableStore ? (
                <></>
              ) : (
                <Tooltip title="IndexedDB can store larger dictionaries, but it may be a bit slower.">
                  <FormControlLabel
                    label="Use IndexedDB"
                    labelPlacement="start"
                    sx={{justifyContent: 'space-between'}}
                    control={
                      <Switch
                        checked={use_db}
                        size="small"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          settings.use_db = !use_db
                          updateSettings({...settings})
                          localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
                          setUseDB(!use_db)
                        }}
                      />
                    }
                  />
                </Tooltip>
              )}
              <Typography fontWeight="bold">Keybinds</Typography>
              <Typography variant="caption">CTRL + </Typography>
              <Stack spacing={2} sx={{mt: 1}}>
                <TextField
                  size="small"
                  label="undo"
                  value={undo}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    window.removeEventListener('keydown', listener)
                    settings.undo = e.target.value
                    updateSettings({...settings})
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
                    updateSettings({...settings})
                    localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
                    setRedo(e.target.value)
                  }}
                ></TextField>
              </Stack>
            </Stack>
          </CardContent>
          <CardActions>
            <Stack spacing={2}>
              <Button
                variant="contained"
                size="small"
                color="error"
                onClick={() => {
                  indexedDB.deleteDatabase('dictionary_builder_resources')
                  location.reload()
                }}
              >
                Refresh Resources
              </Button>
              <Confirm
                label="Clear Storage"
                message="Clearing storage will delete all settings, dictionaries, and edit history."
                onConfirm={() => {
                  if (settings.dictionary_names) {
                    settings.dictionary_names.forEach(name => {
                      removeStorage(name, 'dict_')
                      removeStorage(name, 'dict_history_')
                    })
                  }
                  localStorage.removeItem('dictionary_builder_settings')
                  window.location.reload()
                }}
              />
            </Stack>
          </CardActions>
        </Card>
      </Drawer>
    </>
  )
}
