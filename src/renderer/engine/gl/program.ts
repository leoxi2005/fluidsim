export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
  keywords?: string[]
): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Failed to create shader')
  gl.shaderSource(shader, addKeywords(source, keywords))
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile error: ${log}`)
  }
  return shader
}

// #version must stay on line 1, so defines go right after it
function addKeywords(source: string, keywords?: string[]): string {
  if (!keywords || keywords.length === 0) return source
  const defines = keywords.map((k) => `#define ${k}`).join('\n')
  const newline = source.indexOf('\n')
  if (source.startsWith('#version')) {
    return source.slice(0, newline + 1) + defines + '\n' + source.slice(newline + 1)
  }
  return defines + '\n' + source
}

export class Program {
  readonly program: WebGLProgram
  readonly uniforms: Record<string, WebGLUniformLocation | null> = {}
  private gl: WebGL2RenderingContext

  constructor(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    this.gl = gl
    const program = gl.createProgram()
    if (!program) throw new Error('Failed to create program')
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`)
    }
    this.program = program

    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i)
      if (info) this.uniforms[info.name] = gl.getUniformLocation(program, info.name)
    }
  }

  bind(): void {
    this.gl.useProgram(this.program)
  }
}

/**
 * Program with compile-time variants (#define keywords), cached per keyword set.
 * Used by the display pass where toggling bloom/sunrays/shading changes the shader.
 */
export class Material {
  private gl: WebGL2RenderingContext
  private vertexShader: WebGLShader
  private fragmentSource: string
  private variants = new Map<string, Program>()
  private active: Program | null = null

  constructor(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentSource: string) {
    this.gl = gl
    this.vertexShader = vertexShader
    this.fragmentSource = fragmentSource
  }

  setKeywords(keywords: string[]): void {
    const key = keywords.join(',')
    let program = this.variants.get(key)
    if (!program) {
      const fs = compileShader(this.gl, this.gl.FRAGMENT_SHADER, this.fragmentSource, keywords)
      program = new Program(this.gl, this.vertexShader, fs)
      this.variants.set(key, program)
    }
    this.active = program
  }

  get uniforms(): Record<string, WebGLUniformLocation | null> {
    if (!this.active) throw new Error('Material.setKeywords() must be called before use')
    return this.active.uniforms
  }

  bind(): void {
    if (!this.active) throw new Error('Material.setKeywords() must be called before use')
    this.active.bind()
  }
}
