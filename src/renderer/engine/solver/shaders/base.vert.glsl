#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;

out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;

uniform vec2 texelSize;

void main () {
    vUv = aPosition * 0.5 + 0.5;
    // precomputed neighbor coords keep the fragment shaders branch-free
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
