import { redirect } from 'next/navigation';
import { PanelShell } from '@/components/PanelShell';
import { sesionActual } from '@/lib/sesionServidor';

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  return <PanelShell sesion={sesion}>{children}</PanelShell>;
}
