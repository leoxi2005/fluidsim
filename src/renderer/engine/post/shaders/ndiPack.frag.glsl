#version 300 es
precision highp float;
precision highp sampler2D;

// NDI frame packer: vertical flip + RGBA→BGRA swizzle on the GPU.
// readPixels on the result returns bytes grandiose can send as-is — the old
// per-byte CPU pack in the main process capped the whole app's frame rate.

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;

void main () {
    fragColor = texture(uTexture, vec2(vUv.x, 1.0 - vUv.y)).bgra;
}
