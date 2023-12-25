import {Close} from '@mui/icons-material'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
} from '@mui/material'
import {useContext, useState} from 'react'
import {CategoryMenuToggler, Dictionaries, DictionaryName, ManageDictionaries} from './building'
import {ImportMenu} from './importMenu'

export function DictionaryMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)

  const dictionaries = useContext(Dictionaries)
  const manageDictionaries = useContext(ManageDictionaries)
  const currentDictionary = useContext(DictionaryName)
  const setCategoryMenuOpen = useContext(CategoryMenuToggler)
  const storedDictionaries = Object.keys(dictionaries)
  return (
    <>
      <Button variant="text" sx={{fontWeight: 'bold'}} onClick={toggleMenu}>
        {currentDictionary}
      </Button>
      <Drawer anchor="left" open={menuOpen} onClose={toggleMenu}>
        <Card
          sx={{
            height: '100%',
            width: '15em',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <CardHeader
            title={
              <Select
                fullWidth
                value={currentDictionary}
                onChange={(e: SelectChangeEvent<string>) => {
                  manageDictionaries({type: 'set', name: e.target.value, dict: dictionaries[e.target.value]})
                }}
              >
                {storedDictionaries.map(name => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            }
            action={
              <IconButton onClick={toggleMenu}>
                <Close />
              </IconButton>
            }
          />
          <CardContent sx={{alignContent: 'left', mb: 'auto'}}>
            <Stack spacing={3}>
              <Button variant="contained" onClick={() => setCategoryMenuOpen(true)}>
                Categories
              </Button>
            </Stack>
          </CardContent>
          <CardActions>
            <Stack sx={{width: '100%'}} spacing={1}>
              <ImportMenu />
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  manageDictionaries({type: 'delete', name: currentDictionary})
                }}
              >
                Delete
              </Button>
            </Stack>
          </CardActions>
        </Card>
      </Drawer>
    </>
  )
}
