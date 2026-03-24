export const metadata = {
  title: 'JournalForge AI',
  description: 'The journaling coach that stops you from quitting',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{margin:0,padding:0}}>{children}</body>
    </html>
  )
}
