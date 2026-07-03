#version 300 es
precision highp float;
precision highp sampler2D;

// Soft-knee threshold (Unity-style quadratic knee) — keeps the bloom rolloff
// smooth instead of a hard clip at the threshold.

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;
uniform vec3 curve; // (threshold - knee, 2*knee, 0.25/knee)
uniform float threshold;

void main () {
    vec3 c = texture(uTexture, vUv).rgb;
    float br = max(c.r, max(c.g, c.b));
    float rq = clamp(br - curve.x, 0.0, curve.y);
    rq = curve.z * rq * rq;
    c *= max(rq, br - threshold) / max(br, 0.0001);
    fragColor = vec4(c, 0.0);
}
