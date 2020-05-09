#ifdef GL_ES
precision mediump float;
#endif
uniform float time;
uniform vec2 resolution;
void main() {
    vec2 st = gl_FragCoord.xy/resolution.xy;
    vec3 outColor = vec3(st.x, st.y, 1.0);
    gl_FragColor = vec4(outColor, 1.0);
}

