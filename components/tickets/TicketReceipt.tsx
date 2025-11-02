import React, { useMemo } from 'react'
import { YStack, XStack, Text, Card } from 'tamagui'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency } from '@/utils/formatters'
import { groupJugadasByAmount, formatNumbersList } from '@/utils/ticket.helpers'
import JsBarcode from 'jsbarcode'

type Jugada = {
  type: 'NUMERO' | 'REVENTADO'
  number?: string
  reventadoNumber?: string
  amount: number
  isWinner?: boolean
  winAmount?: number
  finalMultiplierX?: number
}

type Ticket = {
  id: string
  ticketNumber?: string | number
  loteria?: { name?: string; rulesJson?: any }
  sorteo?: { name?: string; scheduledAt?: string }
  vendedor?: { 
    name?: string
    code?: string
    phone?: string | null
    printName?: string | null
    printPhone?: string | null
    printWidth?: number | null
    printFooter?: string | null
    printBarcode?: boolean | null
  }
  ventana?: {
    printName?: string | null
    printPhone?: string | null
    printWidth?: number | null
    printFooter?: string | null
    printBarcode?: boolean | null
  }
  clienteNombre?: string | null
  createdAt?: string
  jugadas: Jugadas
  totalAmount?: number
}

type Jugadas = Jugada[]

export type TicketReceiptProps = {
  ticket: Ticket
  widthPx?: number // width for 58mm thermal printer ~ 220px
}

function pad2(n?: string) {
  const s = (n ?? '').replace(/\D/g, '').slice(0, 2)
  return s.length === 2 ? s : s.padStart(2, '0')
}

export default function TicketReceipt({ ticket, widthPx: initialWidthPx }: TicketReceiptProps) {
  // Calcular ancho basado en configuración de impresión
  const printWidth = useMemo(() => {
    const vendorConfig = ticket.vendedor
    const ventanaConfig = ticket.ventana
    return vendorConfig?.printWidth ?? ventanaConfig?.printWidth ?? null
  }, [ticket.vendedor, ticket.ventana])

  // Ancho en píxeles: 58mm ≈ 220px, 88mm ≈ 340px
  const widthPx = useMemo(() => {
    if (printWidth === 88) return 340
    if (printWidth === 58) return 220
    return initialWidthPx ?? 220
  }, [printWidth, initialWidthPx])
  const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : new Date()
  const scheduledAt = ticket.sorteo?.scheduledAt ? new Date(ticket.sorteo.scheduledAt) : undefined

  const { numeros, reventados, total, multiplierX } = useMemo(() => {
    const grouped = groupJugadasByAmount(ticket.jugadas || [])
    const tot = (ticket.totalAmount != null
      ? ticket.totalAmount
      : (ticket.jugadas || []).reduce((s, j) => s + (j.amount || 0), 0))

    // Obtener multiplicador: usar finalMultiplierX de primera jugada NUMERO, sino del rulesJson
    let mult = 1
    const primeraNumero = (ticket.jugadas || []).find((j) => j.type === 'NUMERO')
    if (primeraNumero?.finalMultiplierX && primeraNumero.finalMultiplierX > 0) {
      mult = primeraNumero.finalMultiplierX
    } else if (ticket.loteria?.rulesJson?.baseMultiplierX) {
      mult = ticket.loteria.rulesJson.baseMultiplierX
    }

    return { numeros: grouped.numeros, reventados: grouped.reventados, total: tot, multiplierX: mult }
  }, [ticket])

  // Obtener configuración de impresión (priorizar vendedor sobre ventana)
  // Soporta tanto campos legacy (printName, printPhone, etc.) como campos desde settings.print.*
  const printConfig = useMemo(() => {
    const vendorConfig = ticket.vendedor
    const ventanaConfig = ticket.ventana
    
    // Helper para obtener configuración de impresión (legacy o desde settings)
    const getPrintConfig = (entity: any) => {
      if (!entity) return null
      
      // Intentar obtener desde settings.print primero (nuevo formato)
      const settings = entity.settings || (entity as any).settingsJson
      const settingsPrint = settings?.print
      
      if (settingsPrint) {
        return {
          printName: settingsPrint.name ?? entity.printName ?? null,
          printPhone: settingsPrint.phone ?? entity.printPhone ?? null,
          printWidth: settingsPrint.width ?? entity.printWidth ?? null,
          printFooter: settingsPrint.footer ?? entity.printFooter ?? null,
          printBarcode: settingsPrint.barcode ?? entity.printBarcode ?? null,
        }
      }
      
      // Fallback a campos legacy directos
      return {
        printName: entity.printName ?? null,
        printPhone: entity.printPhone ?? null,
        printWidth: entity.printWidth ?? null,
        printFooter: entity.printFooter ?? null,
        printBarcode: entity.printBarcode ?? null,
      }
    }
    
    const vendorPrint = getPrintConfig(vendorConfig)
    const ventanaPrint = getPrintConfig(ventanaConfig)
    
    // Priorizar vendedor sobre ventana, y luego valores por defecto del usuario/ventana
    return {
      printName: vendorPrint?.printName ?? ventanaPrint?.printName ?? (vendorConfig as any)?.name ?? (ventanaConfig as any)?.name ?? null,
      printPhone: vendorPrint?.printPhone ?? ventanaPrint?.printPhone ?? (vendorConfig as any)?.phone ?? (ventanaConfig as any)?.phone ?? null,
      printWidth: vendorPrint?.printWidth ?? ventanaPrint?.printWidth ?? null,
      printFooter: vendorPrint?.printFooter ?? ventanaPrint?.printFooter ?? null,
      printBarcode: vendorPrint?.printBarcode ?? ventanaPrint?.printBarcode ?? true, // Por defecto mostrar código de barras
    }
  }, [ticket.vendedor, ticket.ventana])

  // Código de barras real usando jsbarcode
  const barcodeSvg = useMemo(() => {
    // Mostrar código de barras solo si está habilitado
    const showBarcode = printConfig.printBarcode ?? true // Por defecto mostrar
    
    if (!showBarcode) return null
    
    // Usar el número de tiquete para el código de barras (tal cual viene del backend)
    const idStr = String(ticket.ticketNumber ?? (ticket as any).code ?? ticket.id).toUpperCase()
    
    // Calcular ancho del código de barras (aproximadamente 90% del ancho del ticket)
    const barcodeWidth = Math.floor(widthPx * 0.9)
    
    try {
      // En web, usar document.createElementNS
      if (typeof document !== 'undefined' && document.createElementNS) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('width', String(barcodeWidth))
        svg.setAttribute('height', '70')
        
        // Generar código de barras usando jsbarcode
        // CODE128 es compatible con caracteres alfanuméricos (incluye guiones)
        JsBarcode(svg, idStr, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 10,
          textMargin: 4,
          margin: 0,
        })
        
        // Obtener el XML del SVG generado
        return new XMLSerializer().serializeToString(svg)
      }
      
      // En React Native, generar SVG manualmente usando jsbarcode internamente
      // Crear un SVG temporal para capturar el resultado
      const xmlElements: string[] = []
      const mockSvg = {
        setAttribute: (name: string, value: string) => {
          if (name === 'width' || name === 'height') {
            // Ignorar para el elemento raíz
          }
        },
        appendChild: (child: any) => {
          if (child.tagName === 'rect') {
            const x = child.getAttribute('x') || 0
            const y = child.getAttribute('y') || 0
            const w = child.getAttribute('width') || 0
            const h = child.getAttribute('height') || 0
            xmlElements.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="black"/>`)
          } else if (child.tagName === 'text') {
            const x = child.getAttribute('x') || 0
            const y = child.getAttribute('y') || 0
            const text = child.textContent || ''
            xmlElements.push(`<text x="${x}" y="${y}" font-family="monospace" font-size="10" text-anchor="middle" fill="black">${text}</text>`)
          }
        },
      } as any
      
      JsBarcode(mockSvg, idStr, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 10,
        textMargin: 4,
        margin: 0,
      })
      
      return `<svg width="${barcodeWidth}" height="70" xmlns="http://www.w3.org/2000/svg">${xmlElements.join('')}</svg>`
    } catch (error) {
      console.error('Error generating barcode:', error)
      return null
    }
  }, [ticket, printConfig.printBarcode, widthPx])

  const sectionBorder = { borderWidth: 1, borderColor: '$borderColor', borderStyle: 'dashed' as const }

  return (
    <YStack alignSelf="center" width={widthPx} backgroundColor="$background">
      <style
        // print-friendly monospace and tight spacing for thermal receipt
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { size: ${Math.round(widthPx)}px auto; margin: 8px; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `,
        }}
      />
      <Card p="$2" backgroundColor="$background" {...sectionBorder}>
        <YStack gap="$1" ai="center">
          <Text fontFamily="monospace" fontSize={14} fontWeight="900">
            CODIGO # {String(ticket.ticketNumber ?? (ticket as any).code ?? ticket.id).toUpperCase()}
          </Text>
          <Text fontFamily="monospace" fontSize={14} fontWeight="900">
            {ticket.loteria?.name?.toUpperCase() ?? 'TICA'} {scheduledAt ? format(scheduledAt, 'h:mm a', { locale: es }).toUpperCase() : ''}
          </Text>
        </YStack>
      </Card>

      <Card mt="$2" p="$2" backgroundColor="$background" {...sectionBorder}>
        <YStack gap={1}>
          <Text fontFamily="monospace" fontSize={11}>
            VENDEDOR: {printConfig.printName ?? ticket.vendedor?.name ?? 'Nombre Vendedor'} {ticket.vendedor?.code ? ` - ${ticket.vendedor.code}` : ''}
          </Text>
          <Text fontFamily="monospace" fontSize={11}>
            TEL.: {printConfig.printPhone ?? ticket.vendedor?.phone ?? '8888-8888'}
          </Text>
          <Text fontFamily="monospace" fontSize={11}>CLIENTE: {ticket.clienteNombre ?? 'Nombre Cliente'}</Text>
          <Text fontFamily="monospace" fontSize={11}>SORTEO: {scheduledAt ? format(scheduledAt, 'dd/MM/yyyy', { locale: es }) : '—'}</Text>
          <Text fontFamily="monospace" fontSize={11}>IMPRESIÓN: {format(createdAt, 'dd/MM/yyyy hh:mm:ss a', { locale: es }).toUpperCase()}</Text>
        </YStack>
      </Card>

      <YStack mt="$2" gap={2} {...sectionBorder} p="$2" backgroundColor="$background">
        {numeros.map((group, idx) => (
          <XStack key={idx} gap="$2" jc="space-between" flexWrap="nowrap">
            <XStack gap="$2" flexShrink={0}>
              <Text fontFamily="monospace" fontSize={12}>
                {group.amount}
              </Text>
              <Text fontFamily="monospace" fontSize={12}>*</Text>
            </XStack>
            <Text fontFamily="monospace" fontSize={12} ta="right" flexShrink={1}>
              {formatNumbersList(group.numbers)}
            </Text>
          </XStack>
        ))}

        {reventados.length > 0 && (
          <>
            <XStack my={2} jc="center">
              <Text fontFamily="monospace" fontSize={11}>*******REVENTADOS*******</Text>
            </XStack>
            {reventados.map((group, idx) => (
              <XStack key={`r-${idx}`} gap="$2" jc="space-between" flexWrap="nowrap">
                <XStack gap="$2" flexShrink={0}>
                  <Text fontFamily="monospace" fontSize={12}>
                    {group.amount}
                  </Text>
                  <Text fontFamily="monospace" fontSize={12}>*</Text>
                </XStack>
                <Text fontFamily="monospace" fontSize={12} ta="right" flexShrink={1}>
                  {formatNumbersList(group.numbers)}
                </Text>
              </XStack>
            ))}
          </>
        )}
      </YStack>

      <Card mt="$2" p="$2" backgroundColor="$background" {...sectionBorder}>
        <XStack jc="space-between" ai="center">
          <Text fontFamily="monospace" fontSize={14} fontWeight="900">TOTAL</Text>
          <Text fontFamily="monospace" fontSize={14} fontWeight="900">{total}</Text>
        </XStack>
      </Card>

      <YStack mt="$2" ai="center" gap="$1" {...sectionBorder} p="$2" backgroundColor="$background">
        <Text fontFamily="monospace" fontSize={12}>PAGAMOS {multiplierX}x</Text>
        {printConfig.printFooter && (
          <Text fontFamily="monospace" fontSize={11}>{printConfig.printFooter}</Text>
        )}
        {barcodeSvg && (
          <XStack width="100%" ai="center" jc="center">
            <div
              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}
            />
          </XStack>
        )}
      </YStack>
    </YStack>
  )
}
