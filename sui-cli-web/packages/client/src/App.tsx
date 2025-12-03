import { Toaster } from 'react-hot-toast';
import { CommandPalette } from './components/CommandPalette';

export function App() {
  return (
    <>
      <CommandPalette />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#2a2a2a',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#34c759',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff453a',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
