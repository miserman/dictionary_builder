import {Close, Menu} from '@mui/icons-material'
import {Button, Card, CardActions, CardContent, CardHeader, Drawer, IconButton, Stack, Typography} from '@mui/material'
import {useState} from 'react'

export type Settings = {
  selected?: string
  dictionary_names?: string[]
}

export function loadSettings() {
  return (
    'undefined' === typeof window ? {} : JSON.parse(localStorage.getItem('dictionary_builder_settings') || '{}')
  ) as Settings
}

export function SettingsMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
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
            <Stack spacing={3}></Stack>
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
