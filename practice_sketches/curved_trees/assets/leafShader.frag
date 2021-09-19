#ifdef GL_ES
precision highp float;
#endif


void main( void ) {
  //vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  vec3 outCol = vec3(1.0, .0, .0);
  
  gl_FragColor = vec4(outCol, 1.0);
}