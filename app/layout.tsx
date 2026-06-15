export const metadata = {
  title: 'Bolão da Copa',
  description: 'Gerencie seus palpites',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}