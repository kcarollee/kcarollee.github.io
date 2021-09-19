#ifdef GL_ES
precision mediump float;
#endif


#define PI 3.141592
#define MAX_STEPS 100
#define SURFACE_DIST 0.001
#define MAX_DIST 100.
#define OCTAVE_NUM 8

uniform float time;

uniform vec2 resolution;

uniform sampler2D tex;

uniform vec2 mouse;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}
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

// shapes
float Sphere(vec3 p, vec3 pos, float r){
   
   return length(p - pos) - r;
}
float Box(vec3 p, vec3 pos, vec3 s){
  return  length(max(abs(p - pos) - s, 0.0));
}

float Gyroid(vec3 p, vec3 pos, float r){
/*
  float gd = 3.0; // density
  float gt = 0.2; // thickness
  */

  float gd = map(mouse.x, .0, 1.0, 1.0, 5.0); // density
  float gt = map(mouse.y, .0, 1.0, 0.0, 0.3); // thickness

  float dt = time * 2.0;
  float val = sin(p.x * gd + dt) * cos(p.y * gd + dt) + 
  sin(p.y * gd + dt) * cos(p.z * gd + dt) + 
  sin(p.z * gd + dt) * cos(p.x * gd + dt);
  val *= gt;
  return val;
}

float XZPlane(vec3 p){
  return p.y;
}
// fuzz circle
float fcircle(vec2 uv, vec2 pos, float r){
  float a = 0.02;
  float dt = 0.01 * noise(uv * 20.0 + time * 00.1);
  r += dt;
  return 1.0 - smoothstep(r - a, r + a, length(uv - pos));
}
mat2 rotate(float deg){
  float s = sin(deg);
  float c = cos(deg);
  return mat2(c, -s, s, c);
}

float GyroSphere(vec3 p, vec3 pos, float r){
  float g = Gyroid(p, pos, r);
  float s = Sphere(p, pos, r);
  float f = 10000.0;
  f = min(s, f);
  f = max(g, f);
  return f;
}

// define scenes
float GetDistanceFromScene(vec3 p){
float final = 10000.0;
vec3 pcopy = p;

p -= vec3(3.5, 3.5, .0);
p.xy *= rotate(time * 0.2);
p.xz *= rotate(time * 0.2);

float gs1 = GyroSphere(p, vec3(.0), 2.0);

p = pcopy;

p -= vec3(3.5, -3.5, .0);
p.xy *= rotate(time * 0.2);
p.xz *= rotate(time * 0.2);

float gs2 = GyroSphere(p, vec3(.0), 2.0);

p = pcopy;

p -= vec3(-3.5, 3.5, .0);
p.xy *= rotate(time * 0.2);
p.xz *= rotate(time * 0.2);

float gs3 = GyroSphere(p, vec3(.0), 2.0);

p = pcopy;

p -= vec3(-3.5, -3.5, .0);
p.xy *= rotate(time * 0.2);
p.xz *= rotate(time * 0.2);

float gs4 = GyroSphere(p, vec3(.0), 2.0);


final = min(gs1, final);
final = min(gs2, final);
final = min(gs3, final);
final = min(gs4, final);
float b = Box(p, vec3(.0), vec3(2.0));
 
return final;
}

// ray march
float RayMarch(vec3 rayOrig, vec3 rayDir){
float dist = 0.0;
for (int i = 0; i < MAX_STEPS; i++){
vec3 p = rayOrig + dist * rayDir; // new starting point
float distScene = GetDistanceFromScene(p);
dist += distScene;
if (distScene < SURFACE_DIST || dist > MAX_DIST) break;
}
return dist;
}

float circle(vec2 uv, vec2 pos, float r){
  return 1.0 - step(length(uv - pos), r);
}
// normals and lights
vec3 Normal(vec3 p){
float a = 0.01;
float dist = GetDistanceFromScene(p);
vec3 norm = vec3(
dist - GetDistanceFromScene(p - vec3(a, 0, 0)),
dist - GetDistanceFromScene(p - vec3(0, a, 0)),
dist - GetDistanceFromScene(p - vec3(0, 0, a))
);
return normalize(norm);
}

vec3 DiffuseLight(vec3 p, vec3 rayDir, float d){
  //float c = circle(p.xz)
    if (d > MAX_DIST * 0.2) return vec3(.0);
    
    float n1 = noise(p.xy * 5.0 + time * 0.01);
    float n2 = noise(p.zy * 5.0 + time * 0.01);
    float n3 = noise(p.xz * 5.0 + time * 0.01);
  //float ns = n1 + n2 - n3;
  float ns = n1;
  vec3 normal = Normal(p);
  vec3 lightCol = vec3(1.0, normal.xy);
  vec3 lightPos = p + vec3(.0, .0, -1.0);
  vec3 lightDir = normalize(lightPos - p);
 
  float difLight = clamp(dot(normal, lightDir), .0, 1.0) / clamp(pow(d, 0.001), 0.75, MAX_DIST * 0.5); // clamp the value between 0 and 1
  /*
  float shadowVal = RayMarch(p + normal * SURFACE_DIST, lightDir);
  if (shadowVal < length(lightPos - p)) difLight = 0.0;
    */
  //if (difLight < .001) return vec3(2.0 * sin(ns * 10.0))/ clamp(pow(d, 2.0), 1.5, MAX_DIST);
 //if (difLight < .001) return vec3(2.0 * sin(10.0))/ clamp(pow(d, 2.0), 1.5, MAX_DIST);
  
  vec3 specLight = vec3(0.1);
  return (lightCol * difLight + specLight);
}




void main( void ) {
vec2 uvo = (vec2(gl_FragCoord.x, gl_FragCoord.y)) / resolution;
vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;

vec3 outCol = vec3(0.0);

vec3 color = vec3(1.0, .0, .0);

// camera
vec3 rayOrigin = vec3(0, 0, -12);
vec3 rayDir = normalize(vec3(uv.x, uv.y, 1.0));

  float d = RayMarch(rayOrigin, rayDir);
 
vec3 p = rayOrigin + rayDir * d;
vec3 light = DiffuseLight(p, rayDir, d);

outCol = vec3(light);

if (uv.x - uv.y > 0.333){
  if (outCol.x == .0) outCol = vec3(0.15);
  else outCol = outCol;
}

else if (uv.x - uv.y < -0.333){
 if (outCol.x == .0) outCol = vec3(0.15);
  else outCol = outCol;
}
else{
  if (outCol.x == .0) {
    float n1 = noise(uv.xy * 50.0 + time * 0.1);
    float n2 = noise(uv.yx * 50.0 + time * 0.1);
    float n3 = noise(uv.xx * 5.0 + time * 0.1);
    
    outCol = vec3(uvo.x, 1.0 - uvo.y, 1.0);
    outCol -= texture2D(tex, uvo).rgb;
    /*
    if (outCol.x <= .5){
      float n1 = noise(uv.xy * 5.0 + time * 0.1);
      float n2 = noise(uv.yx * 5.0 + time * 0.1);
      float n3 = noise(uv.xx * 5.0 + time * 0.1);

      float n4 = n1 + n2 - n3;
      outCol = vec3(sin(n4 * 20.0), sin(n4 * 20.0), cos(n4 * 13.0));
    }
    */
    //outCol += vec3(noise(time + uv.x * 10.0 + uv.y * 10.0));
  }
  outCol -= texture2D(tex, uvo).rgb;

}


gl_FragColor = vec4(outCol, 1.0);

}