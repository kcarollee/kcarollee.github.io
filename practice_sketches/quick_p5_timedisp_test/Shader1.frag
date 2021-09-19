#ifdef GL_ES
precision highp float;
#endif
#define PI 3.141592

uniform vec2 resolution;
uniform float time;
uniform vec2 mouse;


float hash(float n) { return fract(sin(n) * 1e4); }
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

float noise(float x) {
	float i = floor(x);
	float f = fract(x);
	float u = f * f * (3.0 - 2.0 * f);
	return mix(hash(i), hash(i + 1.0), u);
}

float noise(vec2 x) {
	vec2 i = floor(x);
	vec2 f = fract(x);

	// Four corners in 2D of a tile
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));

	// Simple 2D lerp using smoothstep envelope between the values.
	// return vec3(mix(mix(a, b, smoothstep(0.0, 1.0, f.x)),
	//			mix(c, d, smoothstep(0.0, 1.0, f.x)),
	//			smoothstep(0.0, 1.0, f.y)));

	// Same code, with the clamps in smoothstep and common subexpressions
	// optimized away.
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// hard circle
float hcircle(vec2 uv, vec2 pos, float r){
  return 1.0 - step(r, length(uv - pos));
}
// fuzz circle
float fcircle(vec2 uv, vec2 pos, float r){
  float a = 0.02;
  float dt = 0.03 * noise(uv * 20.0 + time * 00.1);
  r += dt;
  return 1.0 - smoothstep(r - a, r + a, length(uv - pos));
}
float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}
void main(){
  vec3 outCol = vec3(.0);
  vec2 uv = gl_FragCoord.xy / resolution;
  float d = 4.0;
  float n1 = noise(uv * d  - time * 0.01);
  float n2 = noise(uv * d  - time * 0.01);
  float n3 = noise(uv * d - time * 0.02);
  float c = .0;
  float c0 = fcircle(uv, vec2(uv.x, 0.5 + 0.1 * sin(time * 0.1)), 0.2);
  //float c1 = fcircle(uv, vec2(0.5 + sin(time * 0.01), .75), 0.2);
  //float c2 = fcircle(uv, vec2(0.5 + sin(time * 0.01 - 0.5), .25), 0.2);
  float s = (n1 + n2 - n3) / 3.0;
  
  outCol += vec3(s,.0, .0);
  
  
  //outCol *= c0 ;//+ c1 + c2;
  outCol = vec3(sin(outCol.r * (100.0)), sin(outCol.r * (5.0)), sin(outCol.r * (10.0)));
  if (outCol.r < 0.8) discard;
  gl_FragColor = vec4(outCol, 1.0);
}