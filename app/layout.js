import './globals.css';

export const metadata = { title: 'Galeri', description: 'Kumpulan foto dan cerita di baliknya.' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="wrap">
          <header className="top">
            <a href="/"><h1>Galeri</h1></a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
