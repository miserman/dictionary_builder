import {Close, Menu} from '@mui/icons-material'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import {SortOptions} from './addedTerms'
import {SyntheticEvent, useState} from 'react'

export type Settings = {
  selected?: string
  dictionary_names?: string[]
  asTable?: boolean
  sortBy?: 'time' | 'term'
}

export function loadSettings() {
  return (
    'undefined' === typeof window ? {} : JSON.parse(localStorage.getItem('dictionary_builder_settings') || '{}')
  ) as Settings
}

export function SettingsMenu({
  asTable,
  displayToggle,
  sortBy,
  setSortBy,
}: {
  asTable: boolean
  displayToggle: (e: SyntheticEvent, checked: boolean) => void
  sortBy: SortOptions
  setSortBy: (e: SelectChangeEvent<HTMLSelectElement>) => void
}) {
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
            <Stack spacing={3}>
              <FormControlLabel
                sx={{width: '100%'}}
                label="As Table"
                control={<Switch checked={asTable} onChange={displayToggle} />}
              />
              <FormControl>
                <InputLabel>Sort By</InputLabel>
                <Select size="small" label="Sort By" value={sortBy as ''} onChange={setSortBy}>
                  <MenuItem value="time">Order Added</MenuItem>
                  <MenuItem value="term">Term</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
          <CardActions>
            <Button
              fullWidth
              color="error"
              onClick={() => {
                const settings = loadSettings()
                if (settings.dictionary_names) {
                  settings.dictionary_names.forEach(name => localStorage.removeItem(name))
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
