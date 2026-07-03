#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
// dye saturates (≈1.3) so stacked drops can't fuse into a flat black mass;
// velocity passes use a huge ceiling — effectively unclamped
uniform float clampValue;

void main () {
    vec2 p = vUv - point;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture(uTarget, vUv).xyz;
    fragColor = vec4(clamp(base + splat, vec3(-clampValue), vec3(clampValue)), 1.0);
}
