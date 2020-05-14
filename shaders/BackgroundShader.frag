#ifdef GL_ES
precision lowp float;
#endif
#define PI 3.1415926535897932384626433832795
uniform vec2 resolution;
uniform float time;
uniform float easingVal;
uniform int shaderMode;
uniform vec2 mouse;
uniform vec2 followPos;
float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
float lightOrb(vec2 st, vec2 orbPos, float intensity){
	return 0.01 / length(st - orbPos) * intensity;
}

float circle(vec2 st, vec2 pos, float radius){
	return step(length(st - pos), radius);
}
void main()
{	
	
    
	vec2 st = gl_FragCoord.xy /resolution;
	vec2 center;
	center = vec2(0.5);
	vec3 color = vec3(0.0);	
	
	if (shaderMode == 0){
	const int orbNum = 6;
	const int followOrbNum = 3;
    float f_orbNum = float(orbNum);
	float f_followOrbNum = float(followOrbNum);
	float orbArr[orbNum];
	float orbArr2[orbNum];
	float orbArr3[orbNum];
	float followOrbs[orbNum];
	float intensity = 0.04 + 0.01 * sin(time * 2.0);
	
	for (int i = 0; i < orbNum; i++){
        float i_float = float(i);
		
		orbArr[i] = lightOrb(st, vec2(i_float * 1.0 /f_orbNum, 0.5 + 0.2 * sin(i_float *1.0/f_orbNum * 4.0 * PI + time) + 
		0.1 * sin(i_float *1.0/f_orbNum * 2.0 * PI + time)) + 
		0.05 * sin(i_float *1.0/f_orbNum * 14.0 * PI + time), intensity);

		orbArr2[i] = lightOrb(st, vec2(i_float * 1.0 /f_orbNum, 0.75 + 0.2 * cos(i_float *1.0/f_orbNum * 4.0 * PI + time) + 
		0.1 * cos(i_float *1.0/f_orbNum * 2.0 * PI + time)) + 
		0.05 * cos(i_float *1.0/f_orbNum * 14.0 * PI + time), intensity);

		orbArr3[i] = lightOrb(st, vec2(i_float * 1.0 /f_orbNum, 0.25 + 0.2 * cos(i_float *1.0/f_orbNum * 4.0 * PI + time) + 
		0.1 * sin(i_float *1.0/f_orbNum * 14.0 * PI + time)) + 
		0.05 * cos(i_float *1.0/f_orbNum * 3.0 * PI + time), intensity);
		
		color += orbArr[i];
		color += orbArr2[i];
		color += orbArr3[i];
	}
	
	for (int i = 0; i < followOrbNum; i++){
		float i_float = float(i);
		followOrbs[i] = lightOrb(st, 
		vec2(followPos.x + 0.1 * cos(time + 2.0 * PI / f_followOrbNum * i_float), 
		followPos.y + 0.1 * sin(time + 2.0 * PI / f_followOrbNum * i_float)), intensity * 5.0);
		color += followOrbs[i];
	}
	
	
	}

	
	else if (shaderMode == 1) color = vec3(st.x, st.y, followPos.x * followPos.y);
	else{
		// based on https://thebookofshaders.com/12/
		const int pointsNum = 10;
		float f_pointsNum = float(pointsNum);
		float div = 2.0 * PI /f_pointsNum;
		vec2 point[pointsNum + 1];
		for (int i = 0; i < pointsNum; i++){
			float f_i = float(i);
			float r = 0.8 / f_pointsNum * f_i;
			point[i] = vec2(0.5 + r * cos(time * 0.25 + div * f_i), 0.5 + r * sin(time * 0.25 + div * f_i));
		}
		point[pointsNum] = followPos;
    	float m_dist = 1.; 
    	for (int i = 0; i < pointsNum + 1; i++) {
        	float dist = distance(st, point[i]);
        	m_dist = min(m_dist, dist);
    	}
    	color += m_dist * 2.0;
	}
    gl_FragColor = vec4(color,1.0);
	
}

