#version 300 es
precision highp float;
precision highp sampler2D;

// MacCormack correction pass: phi1 (forward) and phi2 (forward-then-backward)
// bracket the advection error; adding half the difference back sharpens the dye.
// Clamped to the source neighborhood so overshoot can't ring or go negative.

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uVelocity;
uniform sampler2D uSource;   // phi0
uniform sampler2D uForward;  // phi1
uniform sampler2D uBackward; // phi2
uniform vec2 texelSize;      // velocity grid texel
uniform vec2 dyeTexelSize;
uniform float dt;
uniform float dissipation;

void main () {
    vec4 phi0 = texture(uSource, vUv);
    vec4 phi1 = texture(uForward, vUv);
    vec4 phi2 = texture(uBackward, vUv);
    vec4 result = phi1 + 0.5 * (phi0 - phi2);

    // limiter: bilinear footprint of phi0 at the back-traced coord
    vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
    vec2 st = coord / dyeTexelSize - 0.5;
    vec2 iuv = floor(st);
    vec4 a = texture(uSource, (iuv + vec2(0.5, 0.5)) * dyeTexelSize);
    vec4 b = texture(uSource, (iuv + vec2(1.5, 0.5)) * dyeTexelSize);
    vec4 c = texture(uSource, (iuv + vec2(0.5, 1.5)) * dyeTexelSize);
    vec4 d = texture(uSource, (iuv + vec2(1.5, 1.5)) * dyeTexelSize);
    vec4 mn = min(min(a, b), min(c, d));
    vec4 mx = max(max(a, b), max(c, d));
    result = clamp(result, mn, mx);

    float decay = 1.0 + dissipation * dt;
    fragColor = result / decay;
}
