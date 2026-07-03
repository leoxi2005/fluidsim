#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;

void main () {
    fragColor = texture(uTexture, vUv);
}
