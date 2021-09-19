#ifdef GL_ES
precision highp float;
#endif
#define PI 3.141592

uniform vec2 resolution;
uniform float time;

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
  //      mix(c, d, smoothstep(0.0, 1.0, f.x)),
  //      smoothstep(0.0, 1.0, f.y)));

  // Same code, with the clamps in smoothstep and common subexpressions
  // optimized away.
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float metaball(vec2 uv, vec2 pos, float r){
	float dist = length(uv - pos);
    float val = 0.0001 * r / pow(dist, 2.5);
    val = smoothstep(0.1, 0.9, val);
    //val = sin(val * 50.0);
    return val;
}

// https://gist.github.com/companje/29408948f1e8be54dd5733a74ca49bb9
float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main(){
	  vec2 uv = gl_FragCoord.xy / resolution.xy;
  	
    vec3 outCol = vec3(.0);

    // take a look at http://glslsandbox.com/e#27744.8 to figure out how to create outer line 
    float nc = 1.0;
    float vc = 0.2;
    float nc2 = 1.0;
    float max = 0.0;

    for (float i = .0; i < 50.0; i++){
        float r = (i + 1.0) * 0.2;
        float vdiv = 1.0 - map(r, 1.0, 51.0, .0, 1.0);
        vdiv = pow(vdiv, 10.0);
        float nx = noise(vec2(time * vc * 0.5 * vdiv + i,  time * vc * 0.5 * vdiv + i));
        float ny = noise(vec2(time * vc * 2.0 * vdiv + i,  time * vc * 2.0 * vdiv + i));
        vec2 npos = vec2(nx, ny);
        float m = metaball(uv, npos, r);
        if (m > max) max = m;
        outCol += m;
    }
   
    //outCol = vec3(sin(outCol.r * 50.0));


    float th = 0.2;
    float dt = 0.8;
    if (outCol.r > th && outCol.r < th + dt) outCol = vec3(sin(outCol.r * 20.0 + time * 10.0));
    else outCol = vec3(.0);
  	gl_FragColor = vec4(outCol , 1.0);
}