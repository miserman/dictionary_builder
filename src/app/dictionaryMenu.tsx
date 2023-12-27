import {Close, DeleteOutline} from '@mui/icons-material'
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
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {ChangeEvent, KeyboardEvent, useContext, useState} from 'react'
import {
  AllCategories,
  BuildEditContext,
  CategoryEditContext,
  Dictionaries,
  DictionaryName,
  EditHistory,
  EditHistoryEditor,
  EditHistoryIndex,
  EditHistoryIndexSetter,
  ManageDictionaries,
} from './building'
import {ImportMenu} from './importMenu'
import {ExportMenu} from './exportMenu'

const byTime = function (a: {time?: number}, b: {time?: number}) {
  return b.time && a.time ? b.time - a.time : -1
}
export function DictionaryMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)

  const dictionaries = useContext(Dictionaries)
  const manageDictionaries = useContext(ManageDictionaries)
  const currentDictionary = useContext(DictionaryName)
  const storedDictionaries = Object.keys(dictionaries)

  const categories = useContext(AllCategories)
  const editCategories = useContext(CategoryEditContext)
  const dictionaryAction = useContext(BuildEditContext)
  const history = useContext(EditHistory)
  const editHistory = useContext(EditHistoryEditor)
  const historyIndex = useContext(EditHistoryIndex)
  const setHistoryIndex = useContext(EditHistoryIndexSetter)
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
            width: '20em',
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
          <Stack direction="row" sx={{mb: 2}}>
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
          <CardContent sx={{alignContent: 'left', mb: 'auto', pt: 0, pb: 1, height: '100%', overflow: 'hidden'}}>
            <Stack spacing={1} sx={{height: '100%', overflowY: 'auto'}}>
              <Card elevation={5} sx={{height: '40%', minHeight: '300px', display: 'flex', flexDirection: 'column'}}>
                <CardHeader title={<Typography>Categories</Typography>} sx={{pb: 0}} />
                <CardContent sx={{pt: 0, pb: 0, mb: 'auto', overflowY: 'auto'}}>
                  <List>
                    {categories.map(cat => (
                      <ListItem key={cat} sx={{p: 0}}>
                        <ListItemText primary={cat} />
                        <IconButton
                          aria-label="delete category"
                          onClick={() => {
                            dictionaryAction({type: 'remove_category', name: cat})
                            editCategories({type: 'remove', cat: cat})
                          }}
                        >
                          <DeleteOutline />
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
                    <Button onClick={add}>Add</Button>
                  </Stack>
                </CardActions>
              </Card>
              <Card elevation={5} sx={{height: '60%', minHeight: '300px', display: 'flex', flexDirection: 'column'}}>
                <CardHeader title={<Typography>Edit History</Typography>} sx={{pb: 0}} />
                <CardContent sx={{p: 0, mb: 'auto', overflowY: 'auto'}}>
                  <List sx={{overflowX: 'hidden'}}>
                    {history.sort(byTime).map((edit, index) => (
                      <ListItem key={index} sx={{p: 0}}>
                        <ListItemButton
                          sx={{borderLeft: historyIndex >= index ? '2px solid #fff' : ''}}
                          onClick={() => {
                            setHistoryIndex(index)
                          }}
                        >
                          <ListItemText
                            sx={{m: 0}}
                            primary={edit.type + ': ' + edit.name}
                            secondary={edit.time ? new Date(edit.time).toLocaleString() : ''}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    onClick={() => {
                      editHistory({type: 'clear'})
                    }}
                  >
                    Clear
                  </Button>
                </CardActions>
              </Card>
            </Stack>
          </CardContent>
          <CardActions>
            <Stack direction="column" sx={{width: '100%'}} spacing={1}>
              <ExportMenu />
              <Button
                fullWidth
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
