#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.141592
#define MAX_STEPS 500
#define SURFACE_DIST 0.05
#define MAX_DIST 250.

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D backbuffer;

mat2 rot(float t){
return mat2(cos(t), -sin(t), sin(t), cos(t));
}

vec3 twistP(vec3 p){
float cx = 0.;
float cy = 0.;
float cz = 0.1;
float x = p.x + cx * sin(p.x * p.y * 30.0 + time);
float y = p.y + cy * sin(p.y * p.z* 30.0 + time);
float z = p.z + cz * sin(p.z * p.z * 10.0+ time);

return vec3(x, y, z);
}

//float camSpeed = time * 0.05;

float su( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}
// SDFs
float sphere(vec3 p, vec3 pos, float r){
p = twistP(p);
return length(p - pos) - r;
}

float yzplane(vec3 p, float x){
return abs(p.x - x);
}
float xzplane(vec3 p, float y){
return abs(p.y - y);
}
float xyplane(vec3 p, float z){
return abs(p.z - z);
}

float GetDistanceFromScene(vec3 p){
float d;

//p.xy = rot(time) * p.xy;
float s1 = sphere(p, vec3(.0, 0.1, 3.0), 0.5);
float s2 = sphere(p, vec3(1.0 * sin(time), 0.2, 3.0), 0.4);
d = s1;
//p.xy = rot(time) * p.xy;
//d = min(d, yzplane(p, -2.0));
//d = min(d, yzplane(p, 2.0));
//d = min(d, xzplane(p, 2.0));
//d = min(d, xzplane(p, -2.0));
return d;
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

// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float rand(float n){return fract(sin(n) * 43758.5453123);}
float rand(vec2 n) {
return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}
float noise(vec2 n) {
const vec2 d = vec2(0.0, 1.0);
  vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

vec3 DiffuseLight(vec3 p, vec3 color){

vec3 lightCol = vec3 (1.0, .0, .0);
vec3 lightPos = vec3(.0, .0, -5.0);
vec3 lightDir = normalize(lightPos - p);
vec3 normal = Normal(p);
float difLight = clamp(dot(normal, lightDir), 0.0, 1.0); // clamp the value between 0 and 1
//float shadowVal = RayMarch(p + normal * SURFACE_DIST, lightDir);
//if (shadowVal < length(lightPos - p)) difLight *= 0.0;
return lightCol * difLight;
}

vec3 getPix(float x, float y){
return texture2D(backbuffer, (gl_FragCoord.xy + vec2(x, y)) / resolution).rgb;
}

vec3 diffuseFour(float f, float g){
vec3 inc;
inc = f * (
getPix(-g, .0)+
getPix(g, .0)+
getPix(.0, g)+
getPix(.0, -g)-
4.0*getPix(.0, .0));
return inc;
}
vec3 bloom(){
vec3 sum = vec3(.0);
const float d = 3.0; // dist
float div = 0.007;
for (float i = d; i > .0; i--){
sum += getPix(i, .0) * div * i;
sum += getPix(i, i)* div * i;
sum += getPix(i, -i)* div * i;
sum += getPix(-i, .0)* div * i;
sum += getPix(-i, -i)* div * i;
sum += getPix(-i, i)* div * i;
sum += getPix(.0, i)* div * i;
sum += getPix(.0, -i)* div * i;

}
return sum;
}
void main( void ) {

vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;
vec2 st = gl_FragCoord.xy / resolution.xy * 10.0;
vec3 outCol = vec3(0.0);

// camera
vec3 rayOrigin = vec3(.0, .0, 0.75);
vec3 rayDir = normalize(vec3(uv.x, uv.y, 1.0));

float dist = RayMarch(rayOrigin, rayDir);
dist /= 3.0;
vec3 p = rayOrigin + rayDir * dist;
p.x = mod (abs (p.x), 0.5);
vec3 light = DiffuseLight(p, vec3(1.0));

outCol = vec3(light);

//outCol += getPix(1.0, 1.0);
//outCol += getPix(0.0, 0.0);
outCol += diffuseFour(0.25 * mouse.y, 2.0);
//outCol += bloom();
//if (outCol.b < 0.1) outCol = vec3 (.0, pow (p.z, 10.0), .0);
gl_FragColor = vec4(outCol, 1.0);

}