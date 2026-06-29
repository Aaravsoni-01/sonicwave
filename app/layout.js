import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { PlayerProvider } from '@/contexts/PlayerContext';
import Sidebar from '@/components/Sidebar/Sidebar';
import BottomPlayer from '@/components/Player/BottomPlayer';
import Header from '@/components/Header/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  title: 'Sonicwave — Feel the Music',
  description: 'A premium music streaming experience with AI recommendations, lyrics, visualizer, and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body>
        <PlayerProvider>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              <Header />
              <div className="page-container">
                {children}
              </div>
            </main>
            <BottomPlayer />
          </div>
        </PlayerProvider>
      </body>
    </html>
  );
}
