export const metadata: Metadata = {
  title: 'Bolão da Copa',
  description: 'App para gerenciar seu bolão da Copa do Mundo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  )
}
