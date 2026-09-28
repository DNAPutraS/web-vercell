import './globals.css';

export const metadata = { title: 'Jual Barang', description: 'Jual Barang Taruna STMKG' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="wrap">
          <header className="top">
            <a href="/"><h1>Jual Barang</h1></a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
