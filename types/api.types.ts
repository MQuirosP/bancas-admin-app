// types/api.types.ts
// Tipos basados en el schema Prisma real y la guía de endpoints

export type Role = 'ADMIN' | 'VENTANA' | 'VENDEDOR';

export type TicketStatus = 'ACTIVE' | 'EVALUATED' | 'CANCELLED' | 'RESTORED';

export type SorteoStatus = 'SCHEDULED' | 'OPEN' | 'EVALUATED' | 'CLOSED';

export type BetType = 'NUMERO' | 'REVENTADO';

export type MultiplierKind = 'NUMERO' | 'REVENTADO';

// ============ AUTH ============
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  username: string;
  password: string;
  role?: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ============ USER ============
export interface User {
  id: string;
  ventanaId?: string;
  name: string;
  code?: string;
  email?: string;
  username: string;
  role: Role;
  isActive: boolean;
  ventana?: Ventana;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ BANCA ============
export interface Banca {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  defaultMinBet: number;
  globalMaxPerNumber: number;
  address?: string;
  phone?: string;
  email?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ VENTANA ============
export interface Ventana {
  id: string;
  bancaId: string;
  name: string;
  code: string;
  isActive: boolean;
  commissionMarginX: number;
  address?: string;
  phone?: string;
  email?: string;
  banca?: Banca;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ LOTERIA ============
export interface Loteria {
  id: string;
  name: string;
  isActive: boolean;
  rulesJson?: any;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoteriaRequest {
  name: string;
  rulesJson?: any;
}

export interface UpdateLoteriaRequest {
  name?: string;
  rulesJson?: any;
}

// ============ SORTEO ============
export interface Sorteo {
  id: string;
  name: string;
  loteriaId: string;
  scheduledAt: string;
  status: SorteoStatus;
  winningNumber?: string;
  extraOutcomeCode?: string;
  extraMultiplierId?: string;
  extraMultiplierX?: number;
  loteria?: Loteria;
  extraMultiplier?: LoteriaMultiplier;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSorteoRequest {
  loteriaId: string;
  scheduledAt: string; // ISO 8601
  name: string;
}

export interface UpdateSorteoRequest {
  scheduledAt?: string;
}

export interface EvaluateSorteoRequest {
  winningNumber: string; // "00" to "99"
  extraOutcomeCode?: string | null;
  extraMultiplierId?: string | null;
}

// ============ TICKET ============
export interface Jugada {
  id: string;
  ticketId: string;
  number: string;
  amount: number;
  multiplierId?: string;
  finalMultiplierX: number;
  type: BetType;
  reventadoNumber?: string;
  isWinner: boolean;
  payout?: number;
  multiplier?: LoteriaMultiplier;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  user: any;
  id: string;
  ticketNumber: number;
  loteriaId: string;
  ventanaId: string;
  vendedorId: string;
  sorteoId: string;
  totalAmount: number;
  status: TicketStatus;
  isWinner: boolean;
  isActive: boolean;
  loteria?: Loteria;
  ventana?: Ventana;
  vendedor?: User;
  sorteo?: Sorteo;
  jugadas: Jugada[];
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJugadaInput {
  number: string;
  amount: number;
  type?: BetType;
  reventadoNumber?: string | null;
}

export interface CreateTicketRequest {
  loteriaId: string;
  sorteoId: string;
  ventanaId: string;
  jugadas: CreateJugadaInput[];
}

export interface TicketsQueryParams {
  page?: number;
  pageSize?: number;
  status?: TicketStatus;
  loteriaId?: string;
  ventanaId?: string;
  vendedorId?: string;
  sorteoId?: string;
  startDate?: string;
  endDate?: string;
}

// ============ MULTIPLIER ============
export interface LoteriaMultiplier {
  id: string;
  loteriaId: string;
  name: string;
  valueX: number;
  isActive: boolean;
  appliesToDate?: string;
  appliesToSorteoId?: string;
  kind: MultiplierKind;
  loteria?: Loteria;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMultiplierRequest {
  loteriaId: string;
  name: string;
  valueX: number;
  kind?: MultiplierKind;
  appliesToDate?: string | null;
  appliesToSorteoId?: string | null;
  isActive?: boolean;
}

export interface UpdateMultiplierRequest {
  name?: string;
  valueX?: number;
  kind?: MultiplierKind;
  appliesToDate?: string | null;
  appliesToSorteoId?: string | null;
  isActive?: boolean;
}

export interface MultipliersQueryParams {
  loteriaId?: string;
  kind?: MultiplierKind;
  isActive?: boolean;
  appliesToSorteoId?: string;
  q?: string; // búsqueda por nombre
  page?: number;
  pageSize?: number;
}

// ============ USER MULTIPLIER OVERRIDE ============
export interface UserMultiplierOverride {
  id: string;
  userId: string;
  loteriaId: string;
  multiplierType: string;
  baseMultiplierX: number;
  user?: User;
  loteria?: Loteria;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserMultiplierOverrideRequest {
  userId: string;
  loteriaId: string;
  multiplierType: string;
  baseMultiplierX: number;
}

export interface UpdateUserMultiplierOverrideRequest {
  baseMultiplierX: number;
}

export interface UserMultiplierOverridesQueryParams {
  userId?: string;
  loteriaId?: string;
  page?: number;
  pageSize?: number;
}

// ============ RESTRICTION RULE ============
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
  appliesToHour?: number;
  banca?: Banca;
  ventana?: Ventana;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRestrictionRuleRequest {
  bancaId?: string;
  ventanaId?: string;
  userId?: string;
  number?: string;
  maxAmount?: number;
  maxTotal?: number;
  salesCutoffMinutes?: number;
  appliesToDate?: string;
  appliesToHour?: number;
}

export interface UpdateRestrictionRuleRequest {
  bancaId?: string;
  ventanaId?: string;
  userId?: string;
  number?: string;
  maxAmount?: number;
  maxTotal?: number;
  salesCutoffMinutes?: number;
  appliesToDate?: string;
  appliesToHour?: number;
}

export interface RestrictionRulesQueryParams {
  bancaId?: string;
  ventanaId?: string;
  userId?: string;
  number?: string;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
}

// ============ TICKET PAYMENT ============
export interface TicketPayment {
  id: string;
  ticketId: string;
  amountPaid: number;
  paidById: string;
  paymentDate: string;
  method?: string;
  notes?: string;
  isPartial: boolean;
  remainingAmount?: number;
  idempotencyKey?: string;
  isReversed: boolean;
  reversedAt?: string;
  reversedBy?: string;
  ticket?: Ticket;
  paidBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketPaymentRequest {
  ticketId: string;
  amountPaid: number;
  method?: string;
  notes?: string;
  idempotencyKey?: string;
}

// ============ PAGINATION ============
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ============ API ERROR ============
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  statusCode?: number;
}

// ============ DASHBOARD STATS ============
export interface DashboardStats {
  // Banca (ADMIN)
  totalSalesToday: number;
  totalSalesMonth: number;
  activeTicketsCount: number;
  evaluatedTicketsCount: number;
  activeSorteos: number;
  activeRules: number;
  topLoterias: Array<{
    loteriaId: string;
    loteriaName: string;
    totalSales: number;
    ticketCount: number;
  }>;
  salesByHour: Array<{
    hour: number;
    sales: number;
    ticketCount: number;
  }>;

  // Ventana
  ticketsCountToday: number;
  pendingEvaluations: number;
  salesByVendor: Array<{
    vendedorId: string;
    vendedorName: string;
    totalSales: number;
    ticketCount: number;
  }>;
  topNumbers: Array<{
    number: string;
    count: number;
    totalAmount: number;
  }>;
  tickets: Ticket[];
}

export type ApiListMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
};

export type ApiListResponse<T> = { data: T[]; meta: ApiListMeta };
export type ApiItemResponse<T> = { data: T };
export type UsersQueryParams = {
  page?: number; pageSize?: number; role?: 'ADMIN'|'VENTANA'|'VENDEDOR';
  isActive?: boolean; search?: string;
};