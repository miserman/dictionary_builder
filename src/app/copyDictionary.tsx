import {Close} from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Tooltip,
} from '@mui/material'
import {useContext, useState} from 'react'
import {Dictionaries} from './building'

export function CopyDictionary({
  setName,
  setContent,
}: {
  setName: (name: string) => void
  setContent: (content: string) => void
}) {
  const dictionaries = useContext(Dictionaries)
  const names = Object.keys(useContext(Dictionaries))
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  return (
    <>
      <Tooltip title="select an existing dictionary to import as a copy">
        <Button variant="outlined" onClick={toggleMenu}>
          Copy
        </Button>
      </Tooltip>
      {menuOpen && (
        <Dialog open={menuOpen} onClose={toggleMenu}>
          <DialogTitle>Copy Dictionary</DialogTitle>
          <IconButton
            aria-label="close export menu"
            onClick={toggleMenu}
            sx={{
              position: 'absolute',
              right: 8,
              top: 12,
            }}
            className="close-button"
          >
            <Close />
          </IconButton>
          <DialogContent sx={{p: 0}}>
            <List sx={{p: 0, pb: 2}}>
              {names.map(name => (
                <ListItem sx={{p: 0}} key={name}>
                  <ListItemButton
                    onClick={() => {
                      setName(
                        name + ' Copy' in dictionaries ? name + ' Copy' + ((Math.random() * 1e4) >> 0) : name + ' Copy'
                      )
                      setContent(JSON.stringify(dictionaries[name], void 0, 2))
                      toggleMenu()
                    }}
                  >
                    {name}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
