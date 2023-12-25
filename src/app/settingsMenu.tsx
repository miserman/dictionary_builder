import {Close, Menu} from '@mui/icons-material'
import {
  Card,
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

export function SettingsMenu({
  asTable,
  displayToggle,
  sortBy,
  setSortBy,
}: {
  asTable: boolean
  displayToggle: (e: SyntheticEvent, checked: boolean) => void
  sortBy: SortOptions
  setSortBy: (by: SortOptions) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  return (
    <>
      <IconButton onClick={toggleMenu}>
        <Menu />
      </IconButton>
      <Drawer anchor="right" open={menuOpen} onClose={toggleMenu}>
        <Card sx={{height: '100%', width: '12em'}}>
          <CardHeader
            title={<Typography>Settings</Typography>}
            action={
              <IconButton onClick={toggleMenu}>
                <Close />
              </IconButton>
            }
          />
          <CardContent sx={{alignContent: 'left'}}>
            <Stack spacing={3}>
              <FormControlLabel
                sx={{width: '100%'}}
                label="As Table"
                control={<Switch checked={asTable} onChange={displayToggle} />}
              />
              <FormControl>
                <InputLabel>Sort By</InputLabel>
                <Select
                  label="Sort By"
                  value={sortBy as ''}
                  onChange={(e: SelectChangeEvent<HTMLSelectElement>) => {
                    setSortBy(e.target.value as SortOptions)
                  }}
                >
                  <MenuItem value="time">Order Added</MenuItem>
                  <MenuItem value="term">Term</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>
      </Drawer>
    </>
  )
}
