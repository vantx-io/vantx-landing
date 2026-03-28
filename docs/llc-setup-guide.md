# Vantx LLC — Guia de Formacion y Operacion desde Chile

> Guia completa para formar una LLC en Estados Unidos como residente chileno,
> operar un negocio de servicios de ingenieria, y manejar compliance fiscal y legal.
>
> Ultima actualizacion: marzo 2026

---

## Tabla de contenido

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Fase 0: Operar con SpA Chile + Stripe Chile (dia 1)](#fase-0-spa-chile)
3. [Eleccion de estado: Wyoming vs Delaware](#eleccion-de-estado)
4. [Servicios de formacion](#servicios-de-formacion)
5. [Proceso paso a paso](#proceso-paso-a-paso)
6. [Estructura legal resultante](#estructura-legal-resultante)
7. [Banking y pagos](#banking-y-pagos)
8. [Flujo de dinero: cliente → Vantx → Chile](#flujo-de-dinero)
9. [Compliance fiscal anual](#compliance-fiscal-anual)
10. [Obligaciones en Chile](#obligaciones-en-chile)
11. [Contratos: estrategia de jurisdiccion](#contratos-estrategia-de-jurisdiccion)
12. [Contratos: idioma y localizacion LATAM](#contratos-idioma-y-localizacion-latam)
13. [Firma electronica: compliance multi-jurisdiccion](#firma-electronica)
14. [Arbitraje internacional](#arbitraje-internacional)
15. [Costos anuales estimados](#costos-anuales-estimados)
16. [Timeline de lanzamiento](#timeline-de-lanzamiento)
17. [Checklist pre-lanzamiento](#checklist-pre-lanzamiento)
18. [Preguntas frecuentes](#preguntas-frecuentes)
19. [Recursos y links](#recursos-y-links)

---

## Resumen ejecutivo

Vantx es un negocio de servicios de ingenieria (performance, observability, SRE, QA) operado como suscripcion mensual flat-rate, con clientes globales y equipo distribuido. El modelo es similar a DesignJoy: async, una request a la vez, sin contratos de horas.

**Estructura recomendada:**

```
Vantx LLC (Wyoming, USA)
  ├── Owner: [Tu nombre] (residente fiscal Chile)
  ├── Registered Agent: servicio tercerizado en Wyoming
  ├── Bank: Mercury (US)
  ├── Payments: Stripe (US)
  ├── Domain: vantx.io
  ├── Email: hello@vantx.io
  └── Contratos: jurisdiccion Wyoming, firmados digitalmente
```

**Por que LLC y no SpA chilena:**
- Clientes internacionales esperan entidad US para pagos en USD
- Stripe US tiene mejor soporte y menores fees que Stripe Chile
- Jurisdiccion US da confianza a clientes enterprise
- No necesitas oficina fisica en US
- SpA chilena puede existir en paralelo si necesitas facturar localmente

---

## Fase 0: SpA Chile + Stripe Chile {#fase-0-spa-chile}

> **Objetivo:** empezar a vender y cobrar desde el dia 1, sin esperar la LLC.
> La SpA que ya tienes en Chile es suficiente para operar mientras se forma la entidad en US.

### Por que empezar con la SpA

- **Velocidad:** puedes cobrar hoy, no en 4 semanas
- **Stripe Chile:** acepta SpA como entidad. Puedes crear productos, cobrar en USD y recibir en CLP
- **Sin riesgo:** si un cliente llega antes de que la LLC este lista, no lo pierdes
- **Transicion suave:** cuando la LLC este activa, migras los clientes a Stripe US sin interrupcion

### Setup dia 1 con SpA

```
SpA Chile (tu entidad existente)
  ├── Stripe Chile
  │     ├── Cuenta Business verificada con SpA
  │     ├── Productos y precios en USD (Stripe convierte a CLP en payout)
  │     ├── Checkout links listos para compartir
  │     └── Payout: deposito en cuenta bancaria chilena (CLP)
  │
  ├── Contratos
  │     ├── Mismos templates del repo (MSA, NDA, SOW)
  │     ├── Entidad: [Nombre SpA], RUT [XX.XXX.XXX-X]
  │     ├── Jurisdiccion: Chile (transitorio, cambia a Wyoming con la LLC)
  │     └── Firma digital: valida bajo Ley 19.799
  │
  └── Facturacion
        ├── Boleta/factura electronica via SII
        └── Exportacion de servicios (exenta de IVA si el cliente es extranjero)
```

### Stripe Chile: lo que necesitas saber

| Aspecto | Detalle |
|---|---|
| **Entidad requerida** | SpA, SPA, EIRL, o persona natural con inicio de actividades |
| **Moneda de cobro** | USD, EUR, y otros (Stripe convierte automaticamente) |
| **Moneda de payout** | CLP (deposito en tu banco chileno) |
| **Fee** | 3.6% + $0.30 USD por transaccion (mas alto que Stripe US: 2.9%) |
| **Payouts** | 7 dias rolling (vs 2 dias en Stripe US) |
| **Suscripciones** | Si, billing completo |
| **Customer portal** | Si |
| **Webhooks** | Si, misma API que Stripe US |
| **Tax ID en factura** | RUT de la SpA |

### Limitaciones vs Stripe US

- **Fee mas alto:** 3.6% vs 2.9% (0.7% de diferencia)
- **Payouts mas lentos:** 7 dias vs 2 dias
- **Sin Stripe Atlas:** no aplica, la SpA ya existe
- **Percepcion:** algunos clientes enterprise US prefieren pagar a entidad US
- **Funcionalidades:** Stripe Chile tiene paridad con US en la mayoria de features

### Exportacion de servicios (IVA exento)

Si el cliente es extranjero (fuera de Chile), los servicios de ingenieria son **exportacion de servicios** y estan **exentos de IVA**:

- **Base legal:** DL 825, Art. 12, letra E, No. 16
- **Requisito:** el servicio debe ser utilizado en el extranjero
- **Documentacion:** factura de exportacion electronica (no boleta comun)
- **SII:** debes tener habilitada la facturacion de exportacion en tu inicio de actividades

Consulta con tu contador para confirmar que tu SpA tiene el giro correcto y la facturacion de exportacion habilitada.

### Plan de transicion: SpA → LLC

```
Fase 0 (ahora)          SpA Chile + Stripe Chile
                         Cobrar, firmar contratos, operar
                              │
Fase 1-5 (semana 1-4)   Formar LLC Wyoming (en paralelo)
                         Abrir Mercury, Stripe US, Wise
                              │
Transicion               Migrar clientes a Stripe US:
                           1. Crear mismos productos en Stripe US
                           2. Notificar al cliente del cambio de entidad
                           3. Actualizar payment method al nuevo checkout
                           4. Nuevos contratos con VANTX LLC como entidad
                           5. SpA sigue activa para facturacion local si necesitas
```

### Que hacer si llega un cliente ahora

1. **Enviar NDA** con SpA como entidad
2. **Enviar MSA + SOW** con SpA, jurisdiccion Chile
3. **Compartir Stripe Checkout link** (Stripe Chile, cobro en USD)
4. **Emitir factura de exportacion** via SII
5. Cuando la LLC este lista, renegociar contrato con nueva entidad (o simplemente para el siguiente ciclo de facturacion)

> **Bottom line:** no esperes la LLC para empezar a vender. La SpA es perfectamente valida para operar con clientes internacionales. La LLC es una mejora, no un requisito.

---

## Eleccion de estado

### Wyoming vs Delaware vs otros

| Criterio | Wyoming | Delaware | New Mexico | Nevada |
|----------|---------|----------|------------|--------|
| Filing fee | ~$100 | ~$200 | ~$50 | ~$425 |
| Annual fee | $60 | $300 (franchise tax) | $0 | $350 |
| State income tax | 0% | 0% (out-of-state) | Varies | 0% |
| Privacy | Fuerte (no public members) | Moderada | Fuerte | Moderada |
| Annual report | Si ($60) | Si ($300) | No requerido | Si ($350) |
| Court system | Standard | Court of Chancery | Standard | Standard |
| Reputacion | Excelente para LLCs | Gold standard para C-Corps/VC | Bajo perfil | Reputacion mixta |
| Registered agent (avg) | $100-150/yr | $100-150/yr | $100-150/yr | $100-150/yr |

### Recomendacion: Wyoming

Para Vantx (single-member services LLC, sin venture capital, owner extranjero):

- **$240/year mas barato** que Delaware (ahorro acumulado significativo)
- **Mejor privacidad**: Wyoming no publica miembros de la LLC en registros publicos
- **Misma proteccion legal**: limited liability, pass-through taxation, operating agreement
- **Sin desventaja real**: el Court of Chancery de Delaware solo importa para disputas corporativas complejas entre accionistas — irrelevante para una services LLC

**Delaware conviene solo si:**
- Planeas levantar venture capital (VCs prefieren Delaware C-Corp)
- Tienes multiples socios con governance complejo
- Necesitas el Court of Chancery para disputas de equity

Ninguno aplica a Vantx hoy. Si en el futuro conviertes a C-Corp para levantar capital, puedes re-domesticar de Wyoming a Delaware en ese momento.

---

## Servicios de formacion

### Opcion 1: Stripe Atlas — $500 (recomendado)

**Por que para Vantx:** ya vas a usar Stripe para cobrar suscripciones. Stripe Atlas integra todo en un solo flujo.

**Incluye:**
- LLC formation (puedes elegir estado)
- Registered agent (1 año incluido)
- EIN (Tax ID federal del IRS)
- Operating Agreement template
- Cuenta bancaria Mercury (pre-aprobada, apertura acelerada)
- Stripe account lista para cobrar
- Acceso a red de descuentos (AWS credits, etc.)
- Guia fiscal basica

**No incluye:**
- Tax filing anual (necesitas CPA por separado)
- Registered agent despues del primer año (~$100-150/yr)

**URL:** stripe.com/atlas

### Opcion 2: Firstbase — $399

**Incluye:**
- LLC formation (Wyoming disponible directamente)
- EIN
- Registered agent (1 año)
- Cuenta Mercury (asistida)
- Dashboard de compliance (te recuerda deadlines)
- Bookkeeping add-on ($200/mo, opcional)
- Mail forwarding (opcional)

**Ventaja:** soporta Wyoming nativamente. Dashboard de compliance util.

**URL:** firstbase.io

### Opcion 3: doola — $297

**Incluye:**
- LLC formation
- EIN
- Registered agent (1 año)
- Operating Agreement
- Compliance calendar

**Ventaja:** mas barato. Buen soporte para founders LATAM.

**Desventaja:** bank account no incluida (la abres tu en Mercury).

**URL:** doola.com

### Comparacion directa

| | Stripe Atlas | Firstbase | doola |
|---|---|---|---|
| Precio | $500 | $399 | $297 |
| Bank account | Mercury (incluida) | Mercury (asistida) | No incluida |
| Stripe integration | Nativa | Manual | Manual |
| Registered agent yr 1 | Incluido | Incluido | Incluido |
| Registered agent yr 2+ | ~$100/yr | ~$150/yr | ~$150/yr |
| Wyoming support | Si | Si | Si |
| Dashboard/compliance | Basico | Completo | Basico |
| Bookkeeping | No | Add-on $200/mo | Add-on |
| Best for | Stripe-first businesses | Compliance-focused | Budget-conscious |

**Mi recomendacion: Stripe Atlas** si quieres rapidez y Stripe integrado. **Firstbase** si prefieres mejor dashboard de compliance y Wyoming nativo.

---

## Proceso paso a paso

### Fase 1: Formacion (semana 1-2)

```
Dia 1    Crear cuenta en servicio elegido (Stripe Atlas/Firstbase/doola)
         Completar formulario:
           - Nombre de la LLC: VANTX LLC
           - Estado: Wyoming
           - Tu nombre completo (como aparece en pasaporte)
           - Direccion en Chile
           - Numero de pasaporte
           - Tipo de negocio: Technology consulting / Software services
         Pagar el fee

Dia 2-7  El servicio procesa:
           - Articles of Organization → filed con Wyoming Secretary of State
           - Registered agent asignado
           - Operating Agreement generado

Dia 7-14 EIN (Employer Identification Number):
           - El servicio aplica al IRS en tu nombre
           - Tarda 3-10 business days por fax/mail (el servicio maneja esto)
           - Resultado: un numero tipo XX-XXXXXXX
```

### Fase 2: Banking (semana 2-3)

```
Dia 14   Abrir cuenta Mercury:
           - Si usaste Stripe Atlas: cuenta pre-aprobada, abre en minutos
           - Si no: aplicar en mercury.com con EIN + pasaporte + Articles
           - Tipo de cuenta: LLC Business Checking
           - Resultado: routing number + account number

Dia 15   Configurar Wise (para transferir a Chile):
           - Crear Wise Business account
           - Agregar USD balance
           - Configurar transferencia Mercury → Wise → cuenta chilena
```

### Fase 3: Payments (semana 3)

```
Dia 16   Activar Stripe:
           - Si Stripe Atlas: ya esta activo
           - Si no: crear cuenta en stripe.com con EIN + Mercury bank
           - Conectar Mercury como bank account para payouts
           - Configurar productos y precios:
             · Performance as a Service: $5,995/mo (recurring)
             · Observability as a Service: $6,995/mo
             · Fractional SRE: $7,995/mo
             · Fractional QA: $6,995/mo
             · Performance Checkup: $2,995 (one-time)
             · Load Testing Sprint: $4,995
             · Web Performance Audit: $1,995
             · Trainings: $1,495-$2,495

Dia 17   Configurar Stripe webhooks:
           - Endpoint: tu Cloudflare Worker URL
           - Eventos: checkout.session.completed, invoice.paid
           - Esto activa la generacion automatica de contratos
```

### Fase 4: Legal (semana 3-4)

```
Dia 18   Deploy sistema de contratos digitales:
           - Cloudflare Worker + KV namespace
           - Secrets: STRIPE_WEBHOOK_SECRET, RESEND_API_KEY
           - Verificar dominio en Resend para emails

Dia 20   Configurar dominio:
           - vantx.io → landing page
           - contracts.vantx.io → signing wizard
           - contracts-api.vantx.io → Cloudflare Worker

Dia 21   Firmar tu propio Operating Agreement:
           - El servicio de formacion genera un template
           - Firmalo y guardalo (no se registra publicamente)
```

### Fase 5: Go Live (semana 4)

```
Dia 22   Testing end-to-end:
           - Stripe test mode → webhook → contrato → firma → PDF → email
           - Verificar que los emails llegan correctamente

Dia 23   Switch a Stripe live mode
         Publicar pricing page con links de checkout
         Listo para vender
```

---

## Estructura legal resultante

```
VANTX LLC (Wyoming)
│
├── Owner/Member
│   └── [Tu nombre] — 100% ownership
│       └── Residente fiscal: Chile
│
├── Registered Agent
│   └── [Servicio en Wyoming] — recibe correo legal
│
├── Tax Status
│   └── Single-member LLC, disregarded entity (IRS)
│       └── No US income tax on non-ECI income
│       └── Files: Form 5472 + pro forma 1120
│
├── Banking
│   ├── Mercury (US checking) — recibe Stripe payouts
│   └── Wise (bridge) — transfiere a Chile
│
├── Payments
│   └── Stripe (US) — procesa suscripciones y one-shots
│
└── Contracts
    └── Jurisdiccion Wyoming, firma digital, sistema automatizado
```

---

## Banking y pagos

### Mercury (cuenta principal)

- **Tipo:** Business Checking
- **Requisitos:** EIN + Articles of Organization + pasaporte + proof of address (Chile)
- **Features:** wire transfers, ACH, debit card (virtual/fisica), multi-user
- **Fees:** $0/month, free domestic wires, free ACH
- **App:** iOS/Android + web dashboard
- **Limite:** FDIC insured up to $250K (extendido a $5M via partner banks)

### Wise (puente a Chile)

- **Para:** transferir ganancias de Mercury (USD) a tu cuenta chilena (CLP)
- **Fee:** ~0.5-1% por conversion USD→CLP (mucho menor que wire bancario)
- **Velocidad:** 1-2 business days
- **Setup:** Wise Business account vinculado a Mercury

### Stripe (procesador de pagos)

- **Fee:** 2.9% + $0.30 por transaccion
- **Payouts:** deposito automatico a Mercury (2 business days)
- **Subscriptions:** billing automatico, dunning emails, customer portal
- **Webhooks:** activan el sistema de contratos digitales

### Flujo de dinero

```
Cliente paga $5,995/mo
        │
        ▼
    Stripe
    (fee: ~$174 + $0.30)
        │
        ▼
    Mercury (US)
    balance: ~$5,821
        │
        ▼ (cuando necesites)
      Wise
    (fee: ~$35-58)
        │
        ▼
    Banco en Chile
    (~$5,763-5,786 CLP equiv.)
```

**Fee total estimado: ~3.5-4%** del ingreso bruto (Stripe + Wise). Compara con recibir wire directo de un cliente: $25-50 por wire + spread bancario de 2-3% en conversion.

---

## Compliance fiscal anual

### En Estados Unidos

| Obligacion | Deadline | Que es | Costo |
|---|---|---|---|
| **Form 5472** | Marzo 15 | Reporte de transacciones entre la LLC y su foreign owner | Incluido con CPA |
| **Pro forma 1120** | Marzo 15 | Return informativo (no pagas impuestos, solo reportas) | Incluido con CPA |
| **Wyoming Annual Report** | Primer dia del mes de aniversario | Reporte basico al estado | $60 |
| **BOI Report (FinCEN)** | 30 dias desde formacion, luego ante cambios | Beneficial Ownership Information | $0 (lo haces online) |
| **Registered Agent** | Anual | Mantener agente registrado en Wyoming | $100-150/yr |

### Penalidades por no cumplir

- **Form 5472 late/missing:** $25,000 por formulario. No es broma. Consigue un CPA.
- **Wyoming Annual Report late:** se disuelve la LLC administrativamente despues de un periodo de gracia
- **BOI Report late:** multas de $500/dia hasta $10,000, mas posibles cargos criminales

### CPA recomendado

Busca un CPA que se especialice en **foreign-owned US LLCs**. Costo tipico: $500-800/year para el filing completo.

Caracteristicas a buscar:
- Experiencia con single-member foreign-owned LLCs
- Conocimiento de Form 5472 requirements
- Idealmente bilingue (ingles/espanol)
- Servicios como: 1-800Accountant, Greenback Expat Tax, o CPA independiente via Firstbase/doola referral

---

## Obligaciones en Chile

Como residente fiscal chileno con una LLC en US, tambien tienes obligaciones locales:

### SII (Servicio de Impuestos Internos)

- **Rentas de fuente extranjera:** los ingresos de la LLC son rentas de fuente extranjera. Debes declararlos en tu declaracion de renta anual (formulario F22)
- **Impuesto Global Complementario:** tasa progresiva sobre tu renta total (chilena + extranjera). Tasa maxima: 40%
- **Credito por impuestos pagados en exterior:** si pagas impuestos en US (no aplica directamente a la LLC, pero si tienes withholding), puedes acreditar contra tu impuesto chileno
- **Convenio Chile-US:** existe un Tax Treaty (Convenio para Evitar la Doble Tributacion) que puede reducir withholding taxes

### Recomendaciones

- Consulta con un **contador chileno** que conozca rentas de fuente extranjera
- Registra la existencia de la LLC ante el SII si corresponde (consulta con tu contador)
- Manten registros de todas las transferencias Wise → Chile
- Guardar comprobantes de todos los ingresos y gastos de la LLC

---

## Contratos: estrategia de jurisdiccion

### Jurisdiccion unica: Wyoming (o Delaware)

**Recomendacion:** manten una sola jurisdiccion para todos los contratos, independientemente de donde este el cliente.

**Razones:**
- Consistencia legal — un solo set de contratos, un solo framework
- Predecibilidad — sabes exactamente bajo que ley operas
- Simplicidad — no necesitas abogado en cada pais donde tengas un cliente
- Standard en tech services — empresas como Automattic (WordPress), Basecamp, y Toptal usan una sola jurisdiccion US para clientes globales

**En los contratos actuales:**
- Governing law: State of Wyoming (o Delaware, segun donde formes)
- Dispute resolution: ICC Arbitration (ver seccion de arbitraje)
- Language: English governs

### Excepciones donde necesitarias jurisdiccion local

- **Contratos con gobierno** de un pais LATAM (licitaciones publicas)
- **Regulacion financiera** (fintech, banking — pueden exigir entidad local)
- **Empleo local** (si contratas empleados, no contractors, en un pais LATAM)

Ninguna aplica al modelo Vantx actual (todo es B2B SaaS-like, contractors, clientes privados).

---

## Contratos: idioma y localizacion LATAM

### Estrategia de idioma

| Contrato | Ingles | Espanol | Justificacion |
|---|---|---|---|
| MSA | Principal | Traduccion cortesia | Gobierna la version ingles |
| NDA | Principal | Traduccion cortesia | Gobierna la version ingles |
| SOW Subscription | Principal | Traduccion cortesia | Detalles del servicio deben ser claros |
| SOW One-Shot | Principal | Traduccion cortesia | Detalles del servicio deben ser claros |
| DPA | Solo ingles | — | Standard GDPR, siempre en ingles |
| Contractor | Solo ingles | — | Contractors deben operar en ingles |
| Referral | Solo ingles | — | Partners ya estan en el ecosistema |

### Implementacion en el wizard

Agregar toggle EN/ES al wizard. Cuando el cliente selecciona espanol:

1. Se carga el template en espanol (ej. `03-sow-subscription-es.html`)
2. El contrato muestra ambas versiones: espanol visible, ingles en anexo
3. Clausula de prevalencia: "In the event of conflict between the English and Spanish versions, the English version shall prevail"
4. El PDF generado incluye ambas versiones

### Clausula bilingue (agregar al MSA)

```
Language. This Agreement is executed in English. A Spanish translation may be
provided for convenience. In the event of any conflict or discrepancy between
the English and Spanish versions, the English version shall prevail and govern
the interpretation of this Agreement.

Idioma. Este Acuerdo se ejecuta en ingles. Se puede proporcionar una traduccion
al espanol como cortesia. En caso de conflicto o discrepancia entre las versiones
en ingles y espanol, la version en ingles prevalecera y regira la interpretacion
de este Acuerdo.
```

---

## Firma electronica

### Compliance multi-jurisdiccion

El sistema de contratos digitales ya cumple con ESIGN Act (US) y eIDAS (EU). Para cubrir LATAM, agregar referencia a las leyes locales de firma electronica:

| Pais | Ley | Equivalencia | Notas |
|---|---|---|---|
| **Chile** | Ley 19.799 (2002) | Firma electronica simple (FES) valida para contratos privados | Firma avanzada (FEA) solo para actos con el Estado |
| **Colombia** | Ley 527 de 1999 + Decreto 2364 de 2012 | Mensaje de datos con firma electronica tiene validez juridica | Firma digital (certificada) para ciertos actos |
| **Mexico** | LFSDA (Ley de Firma Electronica Avanzada, 2012) + Codigo de Comercio Art. 89-114 | Firma electronica simple valida en actos de comercio | Firma avanzada para actos ante SAT |
| **Argentina** | Ley 25.506 (2001) | Firma electronica (simple) tiene valor probatorio | Firma digital (PKI) tiene presuncion de autoria |
| **Peru** | Ley 27269 (2000) + DS 052-2008 | Firma electronica tiene misma validez que firma manuscrita | Incluye manifestaciones de voluntad por medios electronicos |
| **Brasil** | MP 2.200-2 (2001) + Ley 14.063 (2020) | Assinatura eletronica simples valida entre partes privadas | ICP-Brasil para assinatura qualificada |
| **Uruguay** | Ley 18.600 (2009) | Firma electronica simple admisible en juicio | Firma avanzada con certificado reconocido |

### Clausula actualizada para contratos

```
Electronic Signatures. This document was signed electronically. Electronic
signatures on this document are legally binding under:

(a) The U.S. ESIGN Act (15 U.S.C. §7001) and the Uniform Electronic
    Transactions Act (UETA);
(b) The EU eIDAS Regulation (No 910/2014), Article 25;
(c) The UNCITRAL Model Law on Electronic Signatures;
(d) Applicable local electronic signature laws, including but not limited to:
    Chile (Ley 19.799), Colombia (Ley 527/1999), Mexico (Codigo de Comercio
    Art. 89-114), Argentina (Ley 25.506), Peru (Ley 27269), and Brazil
    (Lei 14.063/2020).

All parties consented to conduct this transaction electronically.
```

### Audit trail como evidencia

El audit trail generado por el sistema (SHA-256 hash, IP, timestamp, user agent) sirve como evidencia en todas las jurisdicciones listadas. En particular:

- **Chile (Ley 19.799 Art. 3):** la firma electronica no sera desestimada por el solo hecho de presentarse en forma electronica
- **Colombia (Ley 527 Art. 5):** no se negaran efectos juridicos a la informacion por el solo hecho de constar en forma de mensaje de datos
- **Mexico (CCom Art. 89):** los actos de comercio pueden celebrarse por medios electronicos

---

## Arbitraje internacional

### Por que ICC en vez de AAA

Los contratos actuales usan AAA (American Arbitration Association). Para clientes LATAM, **ICC (International Chamber of Commerce)** es mejor:

| | AAA | ICC |
|---|---|---|
| Reconocimiento LATAM | Bajo | Alto (oficinas en toda LATAM) |
| Idioma | Ingles | Ingles + Espanol |
| Sede LATAM | No | Si (Santiago, Bogota, CDMX, SP) |
| Costo base | Moderate | Higher (pero mas predecible) |
| Ejecucion de laudos | Via Convencion de NY | Via Convencion de NY |
| Reputacion enterprise | US-centric | Global |

### Clausula de arbitraje actualizada

```
Dispute Resolution.

(a) Negotiation. Any dispute arising from this Agreement shall first be
    submitted to good-faith negotiation between the parties for a period
    of thirty (30) days.

(b) Arbitration. If not resolved through negotiation, the dispute shall be
    finally resolved by arbitration administered by the International
    Chamber of Commerce (ICC) under its Rules of Arbitration. The arbitration
    shall be conducted by a single arbitrator, in the English language, with
    the seat of arbitration in [Wyoming/Miami/New York]. Judgment on the
    award may be entered in any court of competent jurisdiction.

(c) Governing Law. This Agreement is governed by the laws of the State of
    Wyoming, USA, without regard to conflict of law principles.

(d) Convention. The parties acknowledge that any arbitral award is enforceable
    under the Convention on the Recognition and Enforcement of Foreign
    Arbitral Awards (New York Convention, 1958), to which [relevant countries]
    are signatories.
```

**Nota sobre sede:** Miami es una buena opcion como sede de arbitraje para disputes con clientes LATAM — es hub neutral, timezone compatible, y tiene infraestructura ICC.

---

## Costos anuales estimados

### Año 1 (formacion + operacion)

| Concepto | Costo | Frecuencia |
|---|---|---|
| LLC formation (Stripe Atlas) | $500 | Una vez |
| Registered agent (incluido yr 1) | $0 | — |
| Wyoming annual report | $60 | Anual |
| BOI Report (FinCEN) | $0 | Una vez |
| CPA (Form 5472 + 1120) | $600 | Anual |
| Dominio vantx.io | $30 | Anual |
| Cloudflare (free plan) | $0 | — |
| Resend (free tier: 100 emails/dia) | $0 | — |
| Wise (cuenta business) | $0 | — |
| Mercury (business checking) | $0 | — |
| **Total año 1** | **~$1,190** | |

### Año 2+ (operacion continua)

| Concepto | Costo | Frecuencia |
|---|---|---|
| Registered agent | $100-150 | Anual |
| Wyoming annual report | $60 | Anual |
| CPA | $600-800 | Anual |
| Dominio | $30 | Anual |
| Stripe fees | ~3% de revenue | Per transaction |
| Wise fees | ~0.5-1% de transferencias | Per transfer |
| **Total fijo anual** | **~$840-1,040** | |

### Comparacion con alternativas

| Opcion | Costo fijo anual | Percepcion cliente | Stripe support |
|---|---|---|---|
| Wyoming LLC | ~$900 | Profesional (US entity) | Full |
| Delaware LLC | ~$1,140 | Profesional (US entity) | Full |
| SpA Chile | ~$300-500 (SII, contador) | Local only | Limitado |
| No entidad (freelance) | $0 | Amateur | Stripe personal |

---

## Timeline de lanzamiento

```
Semana 1  ┃ Formacion LLC
          ┃  └ Aplicar en Stripe Atlas o Firstbase
          ┃  └ Completar formulario + pagar
          ┃
Semana 2  ┃ Banking
          ┃  └ LLC aprobada → recibir EIN
          ┃  └ Abrir Mercury → recibir account numbers
          ┃  └ Abrir Wise Business
          ┃
Semana 3  ┃ Payments + Legal
          ┃  └ Activar Stripe → crear productos y precios
          ┃  └ Deploy contratos digitales (Cloudflare Worker)
          ┃  └ Configurar Stripe webhooks
          ┃  └ Configurar Resend + verificar dominio
          ┃  └ Firmar Operating Agreement
          ┃
Semana 4  ┃ Testing + Go Live
          ┃  └ Test end-to-end: pago → contrato → firma → email
          ┃  └ BOI Report (FinCEN)
          ┃  └ Publicar pricing page
          ┃  └ Primer cliente
          ┃
Mes 2-3   ┃ Compliance
          ┃  └ Contratar CPA
          ┃  └ Setup bookkeeping (Wave, QuickBooks, o manual)
          ┃
Mes 12    ┃ Primer tax filing
          ┃  └ CPA prepara Form 5472 + 1120
          ┃  └ Wyoming Annual Report
          ┃  └ Renovar registered agent
```

---

## Checklist pre-lanzamiento

### Formacion
- [ ] Elegir servicio de formacion (Stripe Atlas / Firstbase / doola)
- [ ] Completar aplicacion
- [ ] Recibir Articles of Organization
- [ ] Recibir EIN del IRS
- [ ] Firmar Operating Agreement
- [ ] Completar BOI Report (FinCEN)

### Banking
- [ ] Abrir cuenta Mercury
- [ ] Abrir cuenta Wise Business
- [ ] Vincular Mercury → Wise para transferencias
- [ ] Configurar cuenta bancaria chilena en Wise

### Payments
- [ ] Activar Stripe con EIN + Mercury bank
- [ ] Crear productos y precios en Stripe
- [ ] Agregar metadata de contratos a cada producto
- [ ] Configurar Customer Portal en Stripe (pause/cancel)
- [ ] Configurar Stripe Tax (si aplica)

### Contratos digitales
- [ ] Deploy Cloudflare Worker
- [ ] Crear KV namespace
- [ ] Configurar secrets (STRIPE_WEBHOOK_SECRET, RESEND_API_KEY)
- [ ] Verificar dominio en Resend
- [ ] Configurar webhook en Stripe Dashboard
- [ ] Test: checkout → webhook → email → firma → PDF
- [ ] Pre-cargar firma de Vantx (PROVIDER_SIGNATURE_URL)

### Legal
- [ ] Revisar contratos con abogado (recomendado)
- [ ] Contratar CPA para tax compliance
- [ ] Configurar recordatorio: March 15 → Form 5472 + 1120
- [ ] Configurar recordatorio: aniversario LLC → Wyoming Annual Report

### Dominio y email
- [ ] DNS: vantx.io → landing page
- [ ] DNS: contracts.vantx.io → signing wizard
- [ ] DNS: contracts-api.vantx.io → Cloudflare Worker
- [ ] Configurar DKIM, SPF, DMARC para hello@vantx.io
- [ ] Verificar delivery de emails (test con Gmail, Outlook)

---

## Preguntas frecuentes

### Necesito abogado?

**Para la formacion:** no. Los servicios (Stripe Atlas, etc.) manejan todo el paperwork.

**Para los contratos:** recomendado pero no bloqueante. Los contratos en el repo estan basados en templates standard de la industria. Una revision por un abogado (~$500-1,500 one-time) te da tranquilidad. Busca un abogado de commercial/tech law que conozca SaaS agreements.

**Para los impuestos:** si, necesitas un CPA. Los $25,000 de penalidad por Form 5472 missing no valen la pena el riesgo.

### Puedo operar sin LLC?

Si, tecnicamente puedes facturar como persona natural con boleta de honorarios en Chile. Pero:
- Clientes US enterprise no van a pagar a una persona natural extranjera
- Stripe en Chile tiene limitaciones vs Stripe US
- No tienes limited liability (tu patrimonio personal responde)
- Se ve poco profesional para un servicio de $5,995/mo

### Que pasa si un cliente no paga?

La LLC te protege: el cliente le debe a VANTX LLC, no a ti personalmente. Los contratos tienen clausula de late payment (1.5%/month) y puedes enviar a collections si es necesario. En la practica, Stripe maneja dunning (retries automaticos) para suscripciones.

### Puedo tener contractors en otros paises?

Si. Usa el Independent Contractor Agreement (06-contractor.html). El contractor factura a VANTX LLC, tu les pagas via Wise/Mercury. Ellos son responsables de sus propios impuestos locales.

### Necesito seguro?

**Professional Liability (E&O) insurance** es recomendado una vez que tengas clientes enterprise. Cubre errores en tus servicios que causen dano al cliente. Costo: ~$500-1,500/year dependiendo de coverage. Providers: Hiscox, Hartford, Next Insurance.

No es obligatorio para operar, pero algunos clientes enterprise lo exigen.

### Que pasa con la declaracion de renta en Chile?

Los ingresos de la LLC son rentas de fuente extranjera. Debes declararlos en tu F22. Consulta con un contador chileno — la tasa depende de tu renta global. El convenio Chile-US puede ayudar a evitar doble tributacion.

---

## Recursos y links

### Formacion
- Stripe Atlas: stripe.com/atlas
- Firstbase: firstbase.io
- doola: doola.com
- Wyoming Secretary of State: sos.wyo.gov

### Banking
- Mercury: mercury.com
- Wise Business: wise.com/business

### Compliance
- IRS Form 5472: irs.gov/forms-pubs/about-form-5472
- IRS Form 1120: irs.gov/forms-pubs/about-form-1120
- FinCEN BOI Report: fincen.gov/boi
- Wyoming Annual Report: wyobiz.wyo.gov

### Legal references
- ESIGN Act: law.cornell.edu/uscode/text/15/chapter-96
- eIDAS Regulation: eur-lex.europa.eu (Regulation 910/2014)
- Chile Ley 19.799: bcn.cl/leychile
- Colombia Ley 527: funcionpublica.gov.co
- ICC Arbitration: iccwbo.org/dispute-resolution

### Vantx
- Website: vantx.io
- Email: hello@vantx.io
- Contracts: contracts.vantx.io
- GitHub: github.com/vantx-io
