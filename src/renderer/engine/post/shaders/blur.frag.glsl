#version 300 es
precision highp float;
precision highp sampler2D;

// Separable 5-tap gaussian via 3 linear-filtered samples; run once per axis.

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;
uniform vec2 direction; // texel-scaled axis

void main () {
    vec4 sum = texture(uTexture, vUv) * 0.29411764;
    sum += texture(uTexture, vUv + direction * 1.33333333) * 0.35294117;
    sum += texture(uTexture, vUv - direction * 1.33333333) * 0.35294117;
    fragColor = sum;
}
