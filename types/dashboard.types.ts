/**
 * Tipos para Dashboard Admin v1
 * Basados en openapi-dashboard-v1.yaml
 */

// ============================================================
// FILTROS
// ============================================================
export type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'year'
export type BetType = 'DIRECTO' | 'PALE' | 'TRIPLETA' | 'REVENTADO' | 'all'

export interface DashboardFilters {
  date?: DatePreset
  fromDate?: string // ISO 8601
  toDate?: string // ISO 8601
  ventanaId?: string
  loteriaId?: string[] // multi-select
  betType?: BetType
}

// ============================================================
// METADATA
// ============================================================
export interface DashboardMeta {
  range: {
    from: string
    to: string
  }
  queryExecutionTime: number // ms
  totalQueries: number
  etag?: string
  cacheHit?: boolean
}

// ============================================================
// KPIs PRINCIPALES
// ============================================================
export interface DashboardKPIs {
  totalSales: number
  totalTickets: number
  totalWinners: number
  totalCommissions: number
  winRate: number // porcentaje
  margin: number // porcentaje
  previousPeriod?: {
    totalSales: number
    totalTickets: number
    totalWinners: number
    totalCommissions: number
    winRate: number
    margin: number
  }
}

// ============================================================
// TIME SERIES
// ============================================================
export interface TimeSeriesDataPoint {
  timestamp: string // ISO 8601
  sales: number
  commissions: number
  tickets: number
  winners?: number
  payout?: number
}

export interface TimeSeriesResponse {
  data: TimeSeriesDataPoint[]
  granularity: 'hour' | 'day' | 'week' | 'month'
  comparison?: TimeSeriesDataPoint[] // período anterior si se solicita
  meta: DashboardMeta
}

// ============================================================
// DESGLOSES POR DIMENSIÓN
// ============================================================
export interface VentanaBreakdown {
  ventanaId: string
  ventanaName: string
  ventanaCode?: string
  sales: number
  commissions: number
  margin: number // porcentaje
  tickets: number
  winners: number
  cxc: number // cuentas por cobrar
  cxp: number // cuentas por pagar
  winRate?: number
}

export interface LoteriaBreakdown {
  loteriaId: string
  loteriaName: string
  sales: number
  payout: number
  commissions: number
  margin: number // porcentaje
  tickets: number
  winners: number
  profitability: number // ventas - premios - comisiones
}

export interface VendedorBreakdown {
  vendedorId: string
  vendedorName: string
  vendedorCode?: string
  ventanaName?: string
  sales: number
  commissions: number
  tickets: number
  winners: number
  avgTicket: number // promedio por ticket
  winRate: number
}

// ============================================================
// EXPOSICIÓN / RIESGO
// ============================================================
export interface ExposureByNumber {
  number: string // "00" - "99"
  betType: BetType
  sales: number
  potentialPayout: number
  ratio: number // potentialPayout / sales
  ticketCount: number
}

export interface ExposureByLoteria {
  loteriaId: string
  loteriaName: string
  totalSales: number
  totalPotentialPayout: number
  ratio: number
  topNumbers: Array<{
    number: string
    betType: BetType
    sales: number
    potentialPayout: number
  }>
}

export interface ExposureResponse {
  topNumbers: ExposureByNumber[] // Top N con mayor exposición
  byLoteria: ExposureByLoteria[]
  heatmap: Array<{
    number: string // "00" - "99"
    sales: number
    potentialPayout: number
  }>
  meta: DashboardMeta
}

// ============================================================
// FINANZAS: CXC / CXP
// ============================================================
export interface AgingBucket {
  range: string // "0-7", "8-14", "15-30", "31+"
  amount: number
  count: number // número de items
}

export interface CxCItem {
  ventanaId: string
  ventanaName: string
  ventanaCode?: string
  totalSales: number
  totalPaidOut: number
  amount: number // CxC = totalPaidOut - pagos recibidos
  aging?: AgingBucket[]
}

export interface CxCResponse {
  items: CxCItem[]
  total: number
  meta: DashboardMeta
}

export interface CxPItem {
  ventanaId: string
  ventanaName: string
  ventanaCode?: string
  totalSales: number
  totalPaidToVentana: number
  amount: number // CxP = pagos enviados - totalSales
  aging?: AgingBucket[]
}

export interface CxPResponse {
  items: CxPItem[]
  total: number
  meta: DashboardMeta
}

// ============================================================
// GANANCIA (COMISIONES)
// ============================================================
export type GananciaDimension = 'ventana' | 'loteria' | 'vendedor' | 'global'

export interface GananciaItem {
  dimension: GananciaDimension
  key: string // ID de la entidad (ventanaId, loteriaId, vendedorId)
  name: string
  sales: number
  payout: number
  commissions: number
  netProfit: number // ventas - premios - comisiones
  margin: number // porcentaje
}

export interface GananciaResponse {
  dimension: GananciaDimension
  items: GananciaItem[]
  global: {
    sales: number
    payout: number
    commissions: number
    netProfit: number
    margin: number
  }
  meta: DashboardMeta
}

// ============================================================
// ALERTAS
// ============================================================
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AlertType = 
  | 'HIGH_EXPOSURE'
  | 'HIGH_CXC'
  | 'OVERPAYMENT'
  | 'LOW_MARGIN'
  | 'UNUSUAL_BETTING_PATTERN'
  | 'SYSTEM_ERROR'

export interface DashboardAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  suggestedAction?: string
  entity?: {
    type: 'ventana' | 'loteria' | 'vendedor' | 'numero'
    id: string
    name: string
  }
  value?: number
  threshold?: number
  timestamp: string
}

// ============================================================
// RESPUESTA PRINCIPAL DEL DASHBOARD
// ============================================================
export interface DashboardResponse {
  kpis: DashboardKPIs
  timeSeries?: TimeSeriesDataPoint[] // puede venir embebido o por endpoint separado
  byVentana: VentanaBreakdown[]
  byLoteria: LoteriaBreakdown[]
  alerts: DashboardAlert[]
  meta: DashboardMeta
}

// ============================================================
// VENDEDORES (endpoint separado)
// ============================================================
export interface VendedoresResponse {
  data: VendedorBreakdown[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  meta: DashboardMeta
}

// ============================================================
// EXPORT
// ============================================================
export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export interface ExportRequest extends DashboardFilters {
  format: ExportFormat
  sections?: Array<'kpis' | 'ventanas' | 'loterias' | 'vendedores' | 'exposure' | 'finanzas'>
}

export interface ExportResponse {
  url?: string // URL de descarga
  filename: string
  format: ExportFormat
  expiresAt: string // ISO 8601
}

