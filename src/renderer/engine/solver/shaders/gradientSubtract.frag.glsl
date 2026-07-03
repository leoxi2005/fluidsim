#version 300 es
precision highp float;
precision highp sampler2D;

// Projection: subtract the pressure gradient to make the field divergence-free.

in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;

uniform sampler2D uPressure;
uniform sampler2D uVelocity;

void main () {
    float L = texture(uPressure, vL).x;
    float R = texture(uPressure, vR).x;
    float T = texture(uPressure, vT).x;
    float B = texture(uPressure, vB).x;
    vec2 velocity = texture(uVelocity, vUv).xy;
    velocity -= vec2(R - L, T - B);
    fragColor = vec4(velocity, 0.0, 1.0);
}
