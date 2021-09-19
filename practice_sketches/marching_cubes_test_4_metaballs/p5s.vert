#ifdef GL_ES
precision highp float;
#endif
  
attribute vec3 aPosition;

void main() {
  vec4 outPos = vec4(aPosition, 1.0); 
  outPos.xy = outPos.xy * 2.0 - 1.0; 
  gl_Position = outPos;
}