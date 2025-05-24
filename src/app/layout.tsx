import type {Metadata} from 'next'
import './globals.css'
import Theme from './theme'

export const metadata: Metadata = {
  title: 'Dictionary Builder',
  description: 'Make and edit dictionaries with term analysis.',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body style={{overflow: 'hidden'}}>
        <Theme>{children}</Theme>
      </body>
    </html>
  )
}
