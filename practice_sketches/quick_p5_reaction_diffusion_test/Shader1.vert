#ifdef GL_ES
precision highp float;
#endif
  
attribute vec3 aPosition;
uniform float time;


void main() {

  vec4 outPos = vec4(aPosition, 1.0); // Copy the position data into a vec4, adding 1.0 as the w parameter
  
 outPos.xy = outPos.xy * 2.0 - 1.0; // Scale to make the output fit the canvas. 
    
  
  gl_Position = outPos;

}