#version 300 es
precision highp float;
precision highp sampler2D;

// Bright-area mask feeding the radial scattering pass.

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;

void main () {
    vec3 c = texture(uTexture, vUv).rgb;
    float br = max(c.r, max(c.g, c.b));
    fragColor = vec4(vec3(smoothstep(0.12, 0.9, br)), 1.0);
}
