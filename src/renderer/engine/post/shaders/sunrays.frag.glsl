#version 300 es
precision highp float;
precision highp sampler2D;

// God-ray march: accumulate the bright mask toward screen center with decay.

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;
uniform float weight;
uniform float density;
uniform float decay;

#define ITERATIONS 16

void main () {
    vec2 dir = (vUv - 0.5) * (density / float(ITERATIONS));
    vec2 coord = vUv;
    float illumination = 1.0;
    float color = texture(uTexture, vUv).r;
    for (int i = 0; i < ITERATIONS; i++) {
        coord -= dir;
        color += texture(uTexture, coord).r * illumination * weight;
        illumination *= decay;
    }
    fragColor = vec4(color * 0.25, 0.0, 0.0, 1.0);
}
