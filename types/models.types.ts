export interface Banca {
  id: string;
  name: string;
  code: string;
  address: string;
  isActive: boolean;
  salesCutoffMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ventana {
  id: string;
  bancaId: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  salesCutoffMinutes?: number;
  commissionMarginX?: number | null;
  createdAt: string;
  updatedAt: string;
}

// --- Usuarios ---

export type UserRole = 'ADMIN' | 'VENTANA' | 'VENDEDOR';

export interface Usuario {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  code?: string | null;
  role: UserRole;
  ventanaId?: string | null;   // solo para VENTANA / VENDEDOR
  isActive: boolean;

  // soft-delete flags (el backend los tiene)
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedReason?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface Loteria {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export enum SorteoStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  EVALUATED = 'EVALUATED',
}

export interface Sorteo {
  id: string;
  loteriaId: string;
  loteria?: Loteria;
  date: string;
  hour: string;
  status: SorteoStatus;
  winningNumber?: string;
  extraMultiplierId?: string;
  extraMultiplier?: Multiplier;
  extraOutcomeCode?: string;
  openedAt?: string;
  closedAt?: string;
  evaluatedAt?: string;
  createdAt: string;
}

export enum MultiplierKind {
  NUMERO = 'NUMERO',
  REVENTADO = 'REVENTADO',
}

export interface Multiplier {
  id: string;
  loteriaId: string;
  loteria?: Loteria;
  kind: MultiplierKind;
  outcomeCode: string;
  multiplier: number;
  isActive: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestrictionRule {
  id: string;
  bancaId?: string;
  ventanaId?: string;
  userId?: string;
  number?: string;
  maxAmount?: number;
  maxTotal?: number;
  salesCutoffMinutes?: number;
  appliesToDate?: string;
  appliesToHour?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export enum JugadaType {
  NUMERO = 'NUMERO',
  REVENTADO = 'REVENTADO',
}

export interface Jugada {
  id?: string;
  type: JugadaType;
  number?: string;
  reventadoNumber?: string;
  amount: number;
}

export enum TicketStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST',
}

export interface Ticket {
  id: string;
  ventanaId: string;
  ventana?: Ventana;
  vendedorId: string;
  vendedor?: Usuario;
  loteriaId: string;
  loteria?: Loteria;
  sorteoId: string;
  sorteo?: Sorteo;
  jugadas: Jugada[];
  totalAmount: number;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  ventanaId: string;
  loteriaId: string;
  sorteoId: string;
  jugadas: Omit<Jugada, 'id'>[];
}

export interface EvaluateSorteoRequest {
  winningNumber: string;
  extraMultiplierId?: string | null;
  extraOutcomeCode?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Paginación estándar del backend (usa "meta", no "pagination")
export interface MetaPage {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta: MetaPage;
}

export interface ApiItemResponse<T> {
  success: boolean;
  data: T;
}