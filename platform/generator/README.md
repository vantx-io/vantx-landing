# Vantix Deliverable Generator

Escribe tus hallazgos en Markdown → genera Word, PDF, PPTX y Excel automáticamente.

## Quick Start

```bash
# Generar desde un checkup:
node generate.js examples/checkup-novapay.md

# Generar informe mensual:
node generate.js examples/monthly-novapay-abril.md

# Generar reporte semanal:
node generate.js examples/weekly-novapay-s15.md

# Especificar directorio de salida:
node generate.js examples/checkup-novapay.md --output ./delivery/novapay
```

## Con IA (Claude Code)

Para que la IA lea tu MD, lo mejore, y genere todos los deliverables:

```bash
claude "Lee el SKILL.md para entender el formato y las reglas de calidad. 
Luego lee examples/checkup-novapay.md como input.
Mejora el contenido técnico siguiendo las reglas del SKILL.
Genera: DOCX, PDF, PPTX de presentación, y XLSX con datos de evaluación.
Output en ./output/"
```

La IA puede:
- **Expandir hallazgos**: Si escribes "queries lentas", la IA agrega análisis técnico detallado
- **Calcular deltas**: Si proporcionas datos de dos períodos, calcula todas las diferencias
- **Asignar severidad**: Si no la pones, la IA la determina por impacto
- **Generar resumen ejecutivo**: A partir de los hallazgos, genera el resumen para C-level
- **Priorizar roadmap**: Ordena por quick-win / impacto si no está priorizado
- **Cross-reference**: Conecta hallazgos relacionados entre sí

## Formato del Markdown

### Frontmatter (obligatorio)

```yaml
---
type: checkup          # checkup | monthly | weekly
client: NovaPay SpA    # Nombre completo
client_short: NovaPay  # Para nombres de archivo
date: 2026-03-14
period: 10 — 14 de Marzo 2026
engineer: José Castillo
stack: Java 17 / Spring Boot 3.2 / PostgreSQL 15
infra: AWS EKS 1.28 — 3x m5.xlarge
services:
  - payment-gateway
  - settlement-service
environment: Staging
loom_link: https://loom.com/share/xxx
---
```

### Secciones (H2 = sección, H3 = subsección)

```markdown
## Resumen Ejecutivo
Texto libre. La IA lo mejora.

## Hallazgos
### Hallazgo 1: Título [CRÍTICO]
- **Componente**: servicio → dependencia
- **Problema**: descripción
- **Evidencia**: datos, métricas
- **Impacto**: efecto medible
- **Acción**: fix específico

## Prueba de Carga
| Escenario | VUs | TPS | p95 | Errors |
|-----------|-----|-----|-----|--------|
| Smoke     | 10  | 45  | 156ms | 0.00% |

## Web Performance
| Métrica | Valor | Target | Estado |
...

## Roadmap
| # | Acción | Esfuerzo | Impacto | Prioridad |
...
```

## Estructura de Archivos

```
vantix-generator/
├── SKILL.md              # Prompt/skill para IA
├── generate.js           # Script generador
├── README.md             # Este archivo
├── assets/
│   ├── vantix-logo-h-transparent.png
│   └── vantix-logo-h-white.png
├── examples/
│   ├── checkup-novapay.md
│   ├── monthly-novapay-abril.md
│   └── weekly-novapay-s15.md
└── output/               # Archivos generados
```

## Requisitos

- Node.js 18+
- `npm install -g docx` (generación de Word)
- LibreOffice (conversión a PDF) — opcional
- `npm install -g pptxgenjs react-icons react react-dom sharp` (para PPTX con IA)

## Tips

1. **Empieza simple**: Escribe solo los hallazgos y las tablas de datos. La IA completa el resto.
2. **Tablas en MD**: Usa formato estándar de tablas Markdown. El generador las convierte automáticamente.
3. **Severidad en título**: Pon [CRÍTICO], [ALTO], [MEDIO] o [BAJO] en el título del hallazgo.
4. **Colores automáticos**: Las palabras CRÍTICO, FALLA, OK, PASS se colorean automáticamente en los documentos.
5. **Loom link**: Siempre incluye el link al video Loom en el frontmatter.
