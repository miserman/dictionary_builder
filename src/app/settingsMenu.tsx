import {Close, MoreVert} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Drawer,
  FormControlLabel,
  IconButton,
  Paper,
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
import {ImportCoarseSenseMap} from './senseMapImport'
import {ExportCoarseSenseMap} from './senseMapExport'
import {ResourceContext, SenseMapSetter} from './resources'
import {EditSenseMap} from './senseMapEdit'

export type Settings = {
  selected: string
  dictionary_names: string[]
  term_editor_width?: number
  info_drawer_height?: number
  undo?: string
  redo?: string
  copyTerm?: string
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
  const senseMapSetter = useContext(SenseMapSetter)
  const {senseMap, senseMapOptions} = useContext(ResourceContext)
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const historyStep = useContext(HistoryStepper)
  const [undo, setUndo] = useState(settings.undo || 'z')
  const [redo, setRedo] = useState(settings.redo || 'x')
  const [disableStore, setDisableStore] = useState(!!settings.disable_storage)
  const [use_db, setUseDB] = useState(!!settings.use_db)
  const setters = {
    undo: setUndo,
    redo: setRedo,
  }
  const listener = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (!e.target || !('tagName' in e.target) || e.target.tagName !== 'INPUT')) {
        switch (e.key) {
          case redo:
            historyStep(-1)
            break
          case undo:
            historyStep(1)
            break
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
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const key = e.target.name
    if (key && key in setters) {
      const value = e.target.value
      window.removeEventListener('keydown', listener)
      settings[key as 'redo'] = value
      setters[key as 'redo'](value)
      updateSettings({...settings})
      localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
    }
  }
  const mappedSenses = Object.keys(senseMap).length
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
            sx={{p: 1}}
          />
          <CardContent
            sx={{
              alignContent: 'left',
              mb: 'auto',
              p: 0,
              overflowY: 'auto',
              '& .MuiPaper-root': {ml: 0.5, mr: 0.5, mb: 1, p: 0.5},
            }}
          >
            <Typography fontWeight="bold">Storage</Typography>
            <Paper elevation={3}>
              <Stack spacing={1}>
                <FormControlLabel
                  label="Disable"
                  aria-label="disable storage"
                  labelPlacement="start"
                  sx={{justifyContent: 'space-between'}}
                  control={
                    <Switch
                      checked={disableStore}
                      size="small"
                      onChange={() => {
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
                      label="IndexedDB"
                      labelPlacement="start"
                      sx={{justifyContent: 'space-between'}}
                      control={
                        <Switch
                          checked={use_db}
                          size="small"
                          onChange={() => {
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
              </Stack>
            </Paper>
            <Typography fontWeight="bold">Keybinds</Typography>
            <Paper elevation={3}>
              <Box>
                <Typography variant="caption">CTRL + </Typography>
                <Stack spacing={2}>
                  <TextField size="small" label="Undo" name="undo" value={undo} onChange={handleChange}></TextField>
                  <TextField size="small" label="Redo" name="redo" value={redo} onChange={handleChange}></TextField>
                </Stack>
              </Box>
            </Paper>
            <Typography fontWeight="bold">Coarse Senses</Typography>
            <Paper elevation={3}>
              <Stack spacing={1}>
                <ImportCoarseSenseMap />
                <EditSenseMap />
                {mappedSenses ? (
                  <>
                    <Typography>
                      Mapped senses: <span className="number">{mappedSenses} </span>
                    </Typography>
                    <ExportCoarseSenseMap />
                    <Confirm
                      label="Remove"
                      message="The stored coarse sense map will be deleted."
                      onConfirm={() => {
                        indexedDB.deleteDatabase('dictionary_builder_coarse_sense_map')
                        senseMapSetter({}, {store: senseMapOptions.store})
                      }}
                    />
                  </>
                ) : (
                  <></>
                )}
              </Stack>
            </Paper>
          </CardContent>
          <CardActions>
            <Stack spacing={2}>
              <Button
                variant="contained"
                color="warning"
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
