export interface Auditoria {
  id: number;
  usuario_id: number | null;
  accion: string;
  entidad: string;
  entidad_id: number | null;
  detalle: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
  usuario_nombre: string | null;
  usuario_email: string | null;
}
