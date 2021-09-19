#ifdef GL_ES
precision highp float;
#endif
uniform vec2 resolution;
uniform float time;
uniform vec2 mouse;
uniform sampler2D texture;
uniform sampler2D backbuffer;

float circle(vec2 uv, vec2 pos, float r){
	return 1.0 - step(r, length(uv - pos));	
}

vec2 pc(vec2 d){
  vec2 uv = (gl_FragCoord.xy - d) / resolution.xy;
  return uv;
}



void main( void ) {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec3 outCol = texture2D(texture, uv).rgb;
  float g = (outCol.g );
  //g = pow(g, 3.0);
 
  /*
  if (outCol.r > 0.9) gl_FragColor = vec4(vec3(.0), 1.0);
  else {
    vec3 sinCol = vec3(sin(g * 5.0), sin(g * 3.0), sin(g * 13.0));
    gl_FragColor = vec4(sinCol, 1.0);
  }
  */

  gl_FragColor = vec4(vec3(outCol.r - outCol.g) * 2.0, 1.0);
}