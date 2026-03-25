export interface Empleado {
  uid: string;
  numEmpleado: string;
  nombre: string;
  rol: 'STAFF' | 'SUPERVISOR' | 'DIRECTOR';
  email: string;
  activo: boolean;
  permisos?: string[];
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  sku: string;
  categoria?: string;
  stock?: number;
  imagen?: string;
}

export interface ItemCarrito extends Producto {
  cantidad: number;
  subtotal: number;
}

export interface Orden {
  id?: string;
  empleadoId: string;
  items: ItemCarrito[];
  subtotal: number;
  iva: number;
  total: number;
  montoPagado?: number;
  cambio?: number;
  metodoPago: MetodoPago;
  estado: 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';
  fechaCreacion: string;
}

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'MERCADOPAGO' | 'CODI';

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  asignadoA: string;
  asignadoPor: string;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  fechaVencimiento?: string;
  createdAt?: string;
}

export interface RegistroAsistencia {
  id: string;
  empleadoId: string;
  tipo: 'ENTRADA' | 'SALIDA';
  timestamp: string;
  ubicacion?: { lat: number; lng: number };
}

export interface ConfigEmpresa {
  nombreEmpresa: string;
  rfcEmpresa: string;
  clabeInterbancaria: string;
  banco: string;
  regimenFiscal: string;
  lugarExpedicion: string;
  direccionEmpresa: string;
}

export interface DashboardStats {
  totalSales: number;
  todaySales: number;
  ordersCount: number;
  avgTicket: number;
  goal: number;
}
