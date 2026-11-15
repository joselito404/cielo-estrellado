// Cielo nocturno estrellado (versión 2), todo en vectores y sin imágenes. Capas, de atrás adelante: fondo negro azulado,
// Vía Láctea con estructura (nubes, bandas de polvo oscuro y granulado de estrellas diminutas), viñeta que oscurece los
// bordes, tres capas de estrellas, unas pocas brillantes con halo y espigas de difracción, y fugaces muy espaciadas.
// Todo en azul y blanco: sin nebulosas de color, sin cúmulo y sin tonos rojos, naranjas, rosas ni verdes (orden del Director).
// Movimiento con varios mecanismos a la vez, por si la app no pinta alguno: `stroke-dashoffset` (titileo de estrellas
// dibujadas como trazo, espigas que respiran, polvo que deriva y dos fugaces), `opacity`, `r` y `transform`.

function rng(seed: number): () => number {
  let s = seed | 0

  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f = (n: number): number => Math.round(n * 10) / 10

function campana(r: () => number): number {
  return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r())
}

const BLANCO = '#ffffff'
const AZUL = '#b9d0ff'
// Las estrellas «cálidas» ya no lo son: el Director no quiere rojo ni naranja en el cielo.
const PALIDA = '#f2f5ff'
const HIELO = '#e4ecff'

function color(r: () => number): string {
  const x = r()

  return x < 0.14 ? PALIDA : x < 0.2 ? HIELO : x < 0.55 ? AZUL : BLANCO
}

// Muchos puntos en un solo <path>: cada punto es un subtrazo de largo cero con extremo redondo.
function puntos(lista: Array<[number, number]>, ancho: number, tono: string, op: number, entero = false): string {
  if (lista.length === 0) {
    return ''
  }

  const d = lista.map(([x, y]) => (entero ? `M${Math.round(x)} ${Math.round(y)}h0` : `M${f(x)} ${f(y)}h0`)).join('')

  return `<path d="${d}" stroke="${tono}" stroke-width="${ancho}" stroke-opacity="${op}" stroke-linecap="round" fill="none"/>`
}

// Eje de las dos bandas de polvo oscuro, en las coordenadas del grupo girado de la Vía Láctea (centro en 800, 418).
const banda1 = (x: number): number => -5 + 17 * Math.sin((x - 800) / 230 + 0.6) + 6 * Math.sin((x - 800) / 75)
const banda2 = (x: number): number => 24 + 12 * Math.sin((x - 800) / 160 + 2)

function formaBanda(eje: (x: number) => number, x0: number, x1: number, grosor: number, semilla: number): string {
  const r = rng(semilla)
  const arriba: string[] = []
  const abajo: string[] = []

  for (let x = x0; x <= x1; x += 22) {
    const t = (x - x0) / (x1 - x0)
    const w = grosor * Math.sin(Math.PI * t) ** 0.7 * (0.15 + r() * 1.2)
    const y = 418 + eje(x)
    arriba.push(`${x} ${f(y - w / 2)}`)
    abajo.unshift(`${x} ${f(y + w / 2)}`)
  }

  return `<path d="M${arriba.join('L')}L${abajo.join('L')}Z"/>`
}

// Manchas sueltas de polvo oscuro, para que las bandas no parezcan dos líneas.
function manchas(): string {
  const r = rng(88)
  let out = ''

  for (let i = 0; i < 16; i++) {
    const x = 800 + campana(r) * 380
    out += `<ellipse cx="${f(x)}" cy="${f(418 + campana(r) * 40)}" rx="${f(18 + r() * 50)}" ry="${f(6 + r() * 12)}" transform="rotate(${f((r() - 0.5) * 40)} ${f(x)} 418)"/>`
  }

  return out
}

function viaLactea(animado: boolean): string {
  const r = rng(71)
  const tonos = ['#5f7fd8', '#7f98ee', '#8fa4ff', '#6f8fe6', '#9fb4ff']
  let nubes = '<ellipse cx="800" cy="418" rx="900" ry="125" fill="#3b5cb4" fill-opacity="0.1"/>'

  for (let i = 0; i < 30; i++) {
    const x = 800 + campana(r) * 430
    const caida = Math.exp(-(((x - 800) / 700) ** 2))
    const y = 418 + campana(r) * 58 * caida
    nubes += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(45 + r() * 85)}" fill="${tonos[Math.floor(r() * tonos.length)]}" fill-opacity="${f((0.04 + r() * 0.06) * caida * 100) / 100}"/>`
  }

  let finas = '<ellipse cx="780" cy="416" rx="640" ry="34" fill="#aebfff" fill-opacity="0.06"/><ellipse cx="560" cy="424" rx="210" ry="40" fill="#9fb8ff" fill-opacity="0.08"/><ellipse cx="1010" cy="402" rx="150" ry="26" fill="#8fb0ff" fill-opacity="0.07"/><ellipse cx="400" cy="436" rx="130" ry="24" fill="#7f9cf0" fill-opacity="0.07"/>'

  for (let i = 0; i < 22; i++) {
    const x = 800 + campana(r) * 380
    const y = 418 + campana(r) * 34
    finas += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(16 + r() * 34)}" fill="${r() < 0.3 ? '#dfe8ff' : '#b7c6ff'}" fill-opacity="${f((0.04 + r() * 0.07) * 100) / 100}"/>`
  }

  const polvo = `<g fill="#02040a" fill-opacity="0.5" filter="url(#b3)">${manchas()}${formaBanda(banda1, 250, 1350, 34, 3)}${formaBanda(banda2, 500, 1000, 22, 9)}${formaBanda((x) => -30 + 8 * Math.sin(x / 60), 900, 1240, 11, 4)}</g>`

  // Granulado: estrellas diminutas apretadas hacia el eje y escasas sobre las bandas de polvo.
  const g = rng(29)
  const grupos: Array<Array<[number, number]>> = [[], [], [], []]

  for (let i = 0; i < 900; i++) {
    const dx = campana(g) * 470
    const x = 800 + dx
    const ancho = 20 + 50 * Math.exp(-((dx / 650) ** 2))
    const dy = campana(g) * ancho
    const enPolvo = (x > 250 && x < 1350 && Math.abs(dy - banda1(x)) < 10) || (x > 500 && x < 1000 && Math.abs(dy - banda2(x)) < 6)
    const k = g()
    const cual = k < 0.6 ? 0 : k < 0.8 ? 1 : k < 0.92 ? 2 : 3

    if (Math.abs(dx) > 900 || (enPolvo && g() < 0.85)) {
      continue
    }

    grupos[cual].push([x, 418 + dy])
  }

  const grano = puntos(grupos[0], 0.8, '#dfe8ff', 0.34) + puntos(grupos[1], 0.9, PALIDA, 0.36) + puntos(grupos[2], 1.2, BLANCO, 0.5) + puntos(grupos[3], 1.6, AZUL, 0.55)

  // Hilos de polvo de estrellas que derivan muy despacio a lo largo del eje (stroke-dashoffset).
  let hilos = ''
  const h = rng(53)

  for (let i = 0; i < 6; i++) {
    const y0 = 418 + (i - 2.5) * 17 + (h() - 0.5) * 8
    const a = 10 + h() * 16
    const d = `M150 ${f(y0)}C${f(380)} ${f(y0 - a)} ${f(600)} ${f(y0 + a)} 800 ${f(y0 + (h() - 0.5) * 10)}S${f(1220)} ${f(y0 - a)} 1450 ${f(y0 + (h() - 0.5) * 14)}`
    const sentido = i % 2 === 0 ? 'normal' : 'reverse'
    const movimiento = animado ? `class="d" style="animation-duration:${190 + i * 37}s;animation-direction:${sentido};animation-delay:-${i * 23}s"` : 'stroke-dasharray="0 31 0 57 0 23 0 71 0 44 0 90"'
    hilos += `<path ${movimiento} d="${d}" stroke="${i % 3 === 0 ? PALIDA : '#e4ecff'}" stroke-width="${i % 2 === 0 ? 1.1 : 0.9}"/>`
  }

  return `<g transform="rotate(-24 800 418)"><g filter="url(#b1)">${nubes}</g><g filter="url(#b2)">${finas}</g>${polvo}${grano}<g fill="none" stroke-linecap="round" stroke-opacity="0.5" mask="url(#mh)">${hilos}</g></g>`
}

// Estrellas fijas del fondo: dos capas (lejana y media) metidas en unos pocos <path>.
function fondoEstrellas(): string {
  const r = rng(11)
  const lejos: Array<Array<[number, number]>> = [[], []]
  const medio: Array<Array<[number, number]>> = [[], [], []]

  for (let i = 0; i < 620; i++) {
    lejos[r() < 0.7 ? 0 : 1].push([r() * 1600, r() * 836])
  }

  for (let i = 0; i < 190; i++) {
    const k = r()
    medio[k < 0.5 ? 0 : k < 0.82 ? 1 : 2].push([r() * 1600, r() * 836])
  }

  return (
    puntos(lejos[0], 0.7, '#cfdcff', 0.3, true) +
    puntos(lejos[1], 0.9, '#e4ecff', 0.3, true) +
    puntos(medio[0], 1.3, BLANCO, 0.5) +
    puntos(medio[1], 1.3, AZUL, 0.55) +
    puntos(medio[2], 1.4, PALIDA, 0.5)
  )
}

// Capa cercana: estrellas sueltas que titilan, repartidas con distancia mínima entre ellas.
// Tres mecanismos: a = opacity, b = radio (r), c = stroke-dashoffset (la estrella es un trazo circular que se recorta).
function cercanas(animado: boolean): string {
  const r = rng(101)
  const sitios: Array<[number, number]> = []
  let out = ''
  let intentos = 0

  while (sitios.length < 190 && intentos < 6000) {
    intentos++
    const x = 14 + r() * 1572
    const y = 12 + r() * 812

    if (sitios.some(([a, b]) => (a - x) ** 2 + (b - y) ** 2 < 55 ** 2)) {
      continue
    }

    sitios.push([x, y])
  }

  sitios.forEach(([x, y], i) => {
    const radio = f(0.6 + r() ** 3 * 1.1)
    const op = f((0.5 + r() * 0.4) * 100) / 100
    const tono = color(r)
    const dur = f(3.5 + r() * 6.5)
    const ritmo = `style="animation-duration:${dur}s;animation-delay:-${f(r() * dur)}s"`
    const tipo = i % 3

    // Fijo: todas son puntos sencillos, sin clase ni estilo.
    if (!animado) {
      out += `<circle cx="${f(x)}" cy="${f(y)}" r="${radio}" fill="${tono}" fill-opacity="${op}"/>`

      return
    }

    if (tipo === 0) {
      out += `<circle class="c" ${ritmo} pathLength="1" cx="${f(x)}" cy="${f(y)}" r="${f(radio / 2)}" stroke="${tono}" stroke-width="${radio}" stroke-opacity="${op}"/>`
    } else {
      out += `<circle class="${tipo === 1 ? 'a' : 'b'}" ${ritmo} cx="${f(x)}" cy="${f(y)}" r="${radio}" fill="${tono}" fill-opacity="${op}"/>`
    }
  })

  return out
}

// Pocas estrellas brillantes: halo suave, núcleo y espigas de difracción finas que respiran (stroke-dashoffset).
function brillantes(animado: boolean): string {
  const lista: Array<[number, number, number, string]> = [
    [212, 148, 1.5, '#dbe7ff'],
    [1338, 196, 1.2, '#dbe7ff'],
    [948, 96, 0.85, '#dbe7ff'],
    [1466, 520, 1, '#dbe7ff'],
    [388, 632, 1.25, '#ffffff'],
    [706, 300, 0.75, '#eaf0ff'],
    [1096, 706, 0.9, '#cfe0ff'],
    [118, 446, 0.8, '#ffffff'],
    [1236, 404, 0.7, '#cfe0ff'],
  ]

  return lista
    .map(([x, y, s, tono], i) => {
      const dur = 6 + ((i * 7) % 5) * 1.3
      const rayos = 'M0 0h10M0 0h-10M0 0v10M0 0v-10'

      return `<circle cx="${x}" cy="${y}" r="${f(15 * s)}" fill="url(#h)"/><g transform="translate(${x} ${y}) scale(${f(s * 1.5)})" fill="none" stroke="${tono}" stroke-linecap="round"><path${animado ? ` class="k" style="animation-duration:${f(dur)}s;animation-delay:-${f(i * 1.7)}s"` : ''} d="${rayos}" stroke-width="${f(0.5 / (s * 1.5))}" stroke-opacity="0.45"/><path d="M0 0h3.4M0 0h-3.4M0 0v3.4M0 0v-3.4" stroke-width="${f(0.9 / (s * 1.5))}" stroke-opacity="0.6"/></g><circle cx="${x}" cy="${y}" r="${f(1.5 * s)}" fill="#ffffff"/><circle cx="${x}" cy="${y}" r="${f(3 * s)}" fill="${tono}" fill-opacity="0.22"/>`
    })
    .join('')
}

// Fugaces: dos con stroke-dashoffset (un guion que recorre una línea, en tres grosores para afinar la cola) y una con transform.
function fugaces(): string {
  const dash: Array<[number, number, number, number, number, number]> = [
    [1250, 90, 930, 232, 43, -6],
    [520, 150, 250, 262, 67, -39],
  ]
  let out = ''

  for (const [x1, y1, x2, y2, dur, delay] of dash) {
    const ritmo = `style="animation-duration:${dur}s;animation-delay:${delay}s"`
    const d = `M${x1} ${y1}L${x2} ${y2}`
    out += `<g fill="none" stroke-linecap="round"><path class="m1" ${ritmo} pathLength="100" d="${d}" stroke="#9bb8ff" stroke-width="0.8" stroke-opacity="0.3"/><path class="m2" ${ritmo} pathLength="100" d="${d}" stroke="#cfe0ff" stroke-width="1.2" stroke-opacity="0.55"/><path class="m3" ${ritmo} pathLength="100" d="${d}" stroke="#ffffff" stroke-width="1.7" stroke-opacity="0.95"/></g>`
  }

  out += '<g transform="translate(1480 300)"><g class="f" style="animation-duration:89s;animation-delay:-58s"><line x1="0" y1="0" x2="110" y2="-48" stroke="url(#c)" stroke-width="1.6" stroke-linecap="round"/></g></g>'

  return out
}

// `animado` false: el cielo quieto, sin `<style>`, sin clases y sin fugaces. Se dibuja una sola vez y no gasta GPU en reposo
// (animado, la app lo repinta entero en cada fotograma, con sus desenfoques grandes, y llegó a medirse cerca del 46 % de una RTX 5060).
export function cieloEstrelladoSvg(animado = true): string {
  const estilo =
    '<style>' +
    '.a{animation:a 5s ease-in-out infinite}@keyframes a{0%,100%{opacity:1}50%{opacity:.2}}' +
    '.b{animation:b 6s ease-in-out infinite}@keyframes b{50%{r:.3px}}' +
    '.c{fill:none;stroke-dasharray:1;animation:c 6s ease-in-out infinite}@keyframes c{0%,100%{stroke-dashoffset:0}50%{stroke-dashoffset:.82}}' +
    '.k{stroke-dasharray:10;animation:k 8s ease-in-out infinite}@keyframes k{0%,100%{stroke-dashoffset:0}50%{stroke-dashoffset:4.6}}' +
    '.d{stroke-dasharray:0 31 0 57 0 23 0 71 0 44 0 90;animation:d 200s linear infinite}@keyframes d{to{stroke-dashoffset:-316}}' +
    '.m1{stroke-dasharray:30 400;stroke-dashoffset:30;animation:m1 40s linear infinite}@keyframes m1{0%{stroke-dashoffset:30}3%,100%{stroke-dashoffset:-100}}' +
    '.m2{stroke-dasharray:16 400;stroke-dashoffset:16;animation:m2 40s linear infinite}@keyframes m2{0%{stroke-dashoffset:16}3%,100%{stroke-dashoffset:-114}}' +
    '.m3{stroke-dasharray:5 400;stroke-dashoffset:5;animation:m3 40s linear infinite}@keyframes m3{0%{stroke-dashoffset:5}3%,100%{stroke-dashoffset:-125}}' +
    '.f{opacity:0;animation:f 60s linear infinite}@keyframes f{0%{opacity:0;transform:translate(0,0)}.4%{opacity:1}2.4%{opacity:0;transform:translate(-340px,148px)}100%{opacity:0;transform:translate(-340px,148px)}}' +
    '</style>'

  const zona = 'filterUnits="userSpaceOnUse" x="-400" y="-300" width="2400" height="1440"'

  const defs =
    `<defs>${animado ? estilo : ''}` +
    '<linearGradient id="g" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#02040a"/><stop offset="0.55" stop-color="#050a18"/><stop offset="1" stop-color="#03060f"/></linearGradient>' +
    '<radialGradient id="v" cx="0.5" cy="0.5" r="0.72"><stop offset="0.45" stop-color="#02040a" stop-opacity="0"/><stop offset="1" stop-color="#02040a" stop-opacity="0.85"/></radialGradient>' +
    '<radialGradient id="h"><stop offset="0" stop-color="#cfe0ff" stop-opacity="0.5"/><stop offset="0.35" stop-color="#cfe0ff" stop-opacity="0.14"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset="1" stop-color="#9bb8ff" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="lh" x1="0" y1="0" x2="1" y2="0"><stop offset="0.08" stop-color="#fff" stop-opacity="0"/><stop offset="0.35" stop-color="#fff"/><stop offset="0.65" stop-color="#fff"/><stop offset="0.92" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<mask id="mh" maskUnits="userSpaceOnUse" x="0" y="200" width="1600" height="440"><rect x="0" y="200" width="1600" height="440" fill="url(#lh)"/></mask>' +
    `<filter id="b1" ${zona}><feGaussianBlur stdDeviation="34"/></filter>` +
    `<filter id="b2" ${zona}><feGaussianBlur stdDeviation="13"/></filter>` +
    `<filter id="b3" ${zona}><feGaussianBlur stdDeviation="10"/></filter>` +
    `<filter id="b4" ${zona}><feGaussianBlur stdDeviation="60"/></filter>` +
    '</defs>'

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 836" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">' +
    defs +
    '<rect width="1600" height="836" fill="url(#g)"/>' +
    viaLactea(animado) +
    '<rect width="1600" height="836" fill="url(#v)"/>' +
    fondoEstrellas() +
    cercanas(animado) +
    brillantes(animado) +
    (animado ? fugaces() : '') +
    '</svg>'
  )
}
