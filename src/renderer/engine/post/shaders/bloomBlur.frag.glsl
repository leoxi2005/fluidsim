#version 300 es
precision highp float;
precision highp sampler2D;

// 4-tap tent filter — cheap blur that compounds across the mip chain.

in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;

uniform sampler2D uTexture;

void main () {
    vec4 sum = texture(uTexture, vL)
             + texture(uTexture, vR)
             + texture(uTexture, vT)
             + texture(uTexture, vB);
    fragColor = sum * 0.25;
}
