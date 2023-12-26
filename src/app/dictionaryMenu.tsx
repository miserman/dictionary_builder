import {Close, Delete} from '@mui/icons-material'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {ChangeEvent, KeyboardEvent, useContext, useState} from 'react'
import {AllCategoies, CategoryEditContext, Dictionaries, DictionaryName, ManageDictionaries} from './building'
import {ImportMenu} from './importMenu'

export function DictionaryMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)

  const dictionaries = useContext(Dictionaries)
  const manageDictionaries = useContext(ManageDictionaries)
  const currentDictionary = useContext(DictionaryName)
  const storedDictionaries = Object.keys(dictionaries)

  const categories = useContext(AllCategoies)
  const editCategories = useContext(CategoryEditContext)
  const [newCategory, setNewCategory] = useState('')
  const add = () => {
    if (newCategory && -1 === categories.indexOf(newCategory)) {
      editCategories({type: 'add', cat: newCategory})
      setNewCategory('')
    }
  }
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
            title={<Typography>Dictionary Menu</Typography>}
            action={
              <IconButton onClick={toggleMenu}>
                <Close />
              </IconButton>
            }
          />
          <CardContent sx={{alignContent: 'left', mb: 'auto', pt: 0}}>
            <Stack direction="row" sx={{mb: 4}}>
              <FormControl fullWidth>
                <InputLabel>Current</InputLabel>
                <Select
                  label="Current"
                  size="small"
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
              </FormControl>
              <ImportMenu />
            </Stack>
            <Card elevation={3}>
              <CardHeader title={<Typography>Categories</Typography>} sx={{pb: 0}} />
              <CardContent sx={{pt: 0, pb: 0}}>
                <List sx={{maxHeight: '9em', overflowY: 'auto'}}>
                  {categories.map(cat => (
                    <ListItem key={cat} sx={{p: 0}}>
                      <ListItemText primary={cat} />
                      <IconButton
                        aria-label="delete category"
                        onClick={() => {
                          editCategories({type: 'remove', cat: cat})
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Stack direction="row">
                  <TextField
                    size="small"
                    value={newCategory}
                    onKeyDown={(e: KeyboardEvent) => {
                      if (e.code === 'Enter') {
                        add()
                      }
                    }}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setNewCategory(e.target.value)
                    }}
                  ></TextField>
                  <Button variant="contained" onClick={add}>
                    Add
                  </Button>
                </Stack>
              </CardActions>
            </Card>
          </CardContent>
          <CardActions>
            <Button
              fullWidth
              color="error"
              onClick={() => {
                manageDictionaries({type: 'delete', name: currentDictionary})
              }}
            >
              Delete
            </Button>
          </CardActions>
        </Card>
      </Drawer>
    </>
  )
}
