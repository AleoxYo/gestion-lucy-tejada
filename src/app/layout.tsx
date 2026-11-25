import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'SGM-LT · Módulo de Música', template: '%s · SGM-LT' },
  description: 'Sistema de Gestión Musical del Centro Cultural Lucy Tejada - Secretaría de Cultura de Pereira',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
