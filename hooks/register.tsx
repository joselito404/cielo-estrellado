import type { Register, ThemeResult, ThemeSetArgs } from 'claude-code'

import { cieloEstrelladoSvg } from './cielo'
import { makeColors } from './make-colors.js'

// Tema para Claude Code de escritorio: azul noche casi negro, blanco azulado y un acento ámbar. Solo oscuro.
// FONDO: el motor rechaza las imágenes de fondo y la app pinta los fondos de escena como imagen, así que el cielo se dibuja
// como vectores (`cielo.ts`): Vía Láctea con polvo oscuro, estrellas de colores que titilan y fugaces. De su movimiento solo
// está comprobado en la app el de `stroke-dashoffset`; el resto es un extra y el fondo se ve bien también quieto.
// `/fondo [variante]` cambia el fondo durante la sesión; al abrir una sesión nueva vuelve a `estrellas`.
const { theme, problems } = makeColors({
  label: 'Cielo estrellado',
  only: 'dark',
  roles: { accent: '#7fb4ff', danger: '#ff7b7b', success: '#5fd4a4', warning: '#e0a45c', pro: '#a99bff' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#04070e',
        'surface-1': '#0c1326',
        'surface-2': '#101a33',
        'surface-3': '#141e3a',
        'text-primary': '#e9f1ff',
        'text-secondary': '#b6c6e4',
        'text-muted': '#8d9fc3',
      },
    },
  },
})

const VIDRIO = { blur: 18, tint: '#050a16', opacity: 0.5 }

const VARIANTES: Record<string, ThemeSetArgs> = {
  // El nombre de la escena (`cielo`) no es el de la variante: al cambiar el dibujo se cambia aquí también, porque la app
  // puede conservar el dibujo anterior mientras la escena se llame igual.
  estrellas: { colors: theme, backdrop: { scene: 'cielo', glass: VIDRIO } },
  degradado: { colors: theme, backdrop: { gradient: { stops: ['#04070e', '#1d46a0', '#04070e'], angle: 135 } } },
}

const AYUDA = `Fondos: ${Object.keys(VARIANTES).join(', ')}. «estrellas» es el cielo estrellado (el de siempre); «degradado» un degradado azul sin dibujo, por si el cielo diera problemas.`

// OJO: `$` y sus sustantivos (`$.theme`, `$.ui`...) no se pasan a funciones ni se guardan en variables: el motor rechaza
// el módulo entero («$.theme is used as a value») y no carga nada. Cada llamada se escribe `$.theme.set(...)` donde se usa.
function resumen(nombre: string, set: ThemeResult): string {
  return set.isDrawn ? `Fondo «${nombre}» pedido.` : `Fondo «${nombre}» no se dibuja: ${set.reason}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // La línea que haría que el escritorio no pinte el tema.
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    await $.command.register({ name: 'fondo', description: 'Cambia el fondo del tema cielo-estrellado', argumentHint: '[estrellas|degradado]' })
    await $.theme.set(VARIANTES.estrellas)

    return next(e)
  })

  on('command.run', { command: 'fondo' }, async ($, e) => {
    const nombre = e.args.trim()

    if (nombre === '') {
      return { text: AYUDA }
    }
    const args = VARIANTES[nombre]

    if (args === undefined) {
      return { text: `No conozco «${nombre}». ${AYUDA}` }
    }

    return { text: resumen(nombre, await $.theme.set(args)) }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }

    if (String(e.props.scene) !== 'cielo') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={cieloEstrelladoSvg()} alt="Cielo nocturno con una Vía Láctea con polvo oscuro, estrellas de colores que titilan y algunas fugaces" isInteractive />
  })
}
