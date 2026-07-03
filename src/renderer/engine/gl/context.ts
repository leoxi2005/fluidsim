export interface TexFormat {
  internalFormat: number
  format: number
}

export interface GLExtensions {
  formatRGBA: TexFormat
  formatRG: TexFormat
  formatR: TexFormat
  halfFloatTexType: number
  supportLinearFiltering: boolean
}

export interface GLContext {
  gl: WebGL2RenderingContext
  ext: GLExtensions
}

export function getWebGLContext(canvas: HTMLCanvasElement): GLContext {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false
  })
  if (!gl) throw new Error('WebGL2 not available')

  // makes half-float formats color-renderable — required, no byte fallback
  const colorBufferFloat = gl.getExtension('EXT_color_buffer_float')
  if (!colorBufferFloat) throw new Error('EXT_color_buffer_float not supported — cannot run half-float sim')
  const supportLinearFiltering = gl.getExtension('OES_texture_float_linear') !== null

  gl.clearColor(0, 0, 0, 1)

  const halfFloatTexType = gl.HALF_FLOAT
  const formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType)
  const formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType)
  const formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType)
  if (!formatRGBA || !formatRG || !formatR) throw new Error('No renderable half-float texture format found')

  return {
    gl,
    ext: { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering }
  }
}

function getSupportedFormat(
  gl: WebGL2RenderingContext,
  internalFormat: number,
  format: number,
  type: number
): TexFormat | null {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    // widen channel count until the driver accepts it
    switch (internalFormat) {
      case gl.R16F:
        return getSupportedFormat(gl, gl.RG16F, gl.RG, type)
      case gl.RG16F:
        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type)
      default:
        return null
    }
  }
  return { internalFormat, format }
}

function supportRenderTextureFormat(
  gl: WebGL2RenderingContext,
  internalFormat: number,
  format: number,
  type: number
): boolean {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null)

  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.deleteFramebuffer(fbo)
  gl.deleteTexture(texture)
  return status === gl.FRAMEBUFFER_COMPLETE
}
