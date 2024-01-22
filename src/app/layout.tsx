import type {Metadata} from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dictionary Builder',
  description: 'Make and edit dictionaries with term analysis.',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
