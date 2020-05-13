#ifdef GL_ES
precision lowp float;
#endif
uniform vec2 resolution;
uniform float time;
float lightOrb(vec2 st, vec2 orbPos, float intensity){
	return 0.01 / length(st - orbPos) * intensity;
}

void main()
{	
    float PI = 3.1415926535897932384626433832795;
	vec2 st = gl_FragCoord.xy / max(resolution.x, resolution.y);
	vec2 center;
	center = vec2(0.5);
	vec3 color = vec3(0.0);	
	const int orbNum = 10;
    float f_orbNum = float(orbNum);
	float orbArr[orbNum];
	float orbArr2[orbNum];
	float orbArr3[orbNum];

	float intensity = 0.04 + 0.005 * sin(time * 2.0);
	
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
	
	gl_FragColor = vec4(color, 1.0);
}

