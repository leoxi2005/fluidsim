import type { RGB } from '../engine/color'

export class Pointer {
  id = -1
  texcoordX = 0
  texcoordY = 0
  prevTexcoordX = 0
  prevTexcoordY = 0
  deltaX = 0
  deltaY = 0
  down = false
  moved = false
  color: RGB = [0.03, 0.15, 0.15]
}

export function updatePointerDown(p: Pointer, id: number, posX: number, posY: number, canvas: HTMLCanvasElement): void {
  p.id = id
  p.down = true
  p.moved = false
  p.texcoordX = posX / canvas.width
  p.texcoordY = 1 - posY / canvas.height
  p.prevTexcoordX = p.texcoordX
  p.prevTexcoordY = p.texcoordY
  p.deltaX = 0
  p.deltaY = 0
  // caller assigns p.color (palette-sampled)
}

export function updatePointerMove(p: Pointer, posX: number, posY: number, canvas: HTMLCanvasElement): void {
  p.prevTexcoordX = p.texcoordX
  p.prevTexcoordY = p.texcoordY
  p.texcoordX = posX / canvas.width
  p.texcoordY = 1 - posY / canvas.height
  const aspect = canvas.width / canvas.height
  // aspect-correct so diagonal drags feel isotropic
  p.deltaX = (p.texcoordX - p.prevTexcoordX) * (aspect < 1 ? aspect : 1)
  p.deltaY = (p.texcoordY - p.prevTexcoordY) * (aspect > 1 ? 1 / aspect : 1)
  p.moved = p.down && (Math.abs(p.deltaX) > 0 || Math.abs(p.deltaY) > 0)
}

export function updatePointerUp(p: Pointer): void {
  p.down = false
}
