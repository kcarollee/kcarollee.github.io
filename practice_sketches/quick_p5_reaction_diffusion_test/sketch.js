// pg0: velocity field, pg1: pressure field, pg2: ink field, probably? i don't fucking know
let pg0, pg1, pg2, pg3, bb;
let shd0, shd1, bbshd;
let mouseVel;
let mousePosPrev, mousePosCur;
let canvDiagonal;
let font;

let stepmode, stepTh; 
let diffuseClar, diffuseCoef;
let bloommode;

let step = 0;

let brush = 0.0;

let fontSize;
function preload(){
  shd0 = loadShader('Shader0.vert', 'Shader0.frag');
  shd1 = loadShader('Shader1.vert', 'Shader1.frag');
  

}
function setup() {
  createCanvas(810, 900, WEBGL);
  pg0 = createGraphics(width, height, WEBGL);
  pg1 = createGraphics(width, height, WEBGL);
  pg2 = createGraphics(width, height, WEBGL);
  
  bb = createGraphics(width, height, WEBGL);
  mousePosCur = [width * 0.5, height * 0.5];
  mosuePosPrev = mousePosCur;
  canvDiagonal = sqrt(pow(width, 2) + pow(height, 2));
  mouseVel = 0.001;
  
  stepmode = false;
  stepTh = 0.75;
  
  diffuseClar = 1.0;
  diffuseCoef = 0.16;
  
  bloommode = false;
  
 
}

function draw() {
  step++;
  //background(220, 220, 0);
  //orbitControl();
  /*
  var t = pg0;
  pg0 = pg1;
  pg1 = t;
  */
  pg0.background(0);
  pg0.shader(shd0);
  shd0.setUniform('resolution', [width, height]);
  shd0.setUniform('stepmod', step % 100);
  shd0.setUniform('time', frameCount * 0.01);
  shd0.setUniform('backbuffer', bb);
  shd0.setUniform('mouse',[map(mouseX, 0, width, 0, 1),  map(mouseY, 0, height, 0, 1)]);
  shd0.setUniform('mouseVel', mouseVel);
  shd0.setUniform('diffuseClar', diffuseClar);
  shd0.setUniform('diffuseCoef', diffuseCoef);
  shd0.setUniform('brush', brush);
  pg0.rect(0, 0, width, height);
  pg0.resetMatrix();
  pg0._renderer._update();
 
  pg1.background(0);
  pg1.shader(shd1);
  shd1.setUniform('resolution', [width, height]);
  shd1.setUniform('time', frameCount * 0.01);
  shd1.setUniform('texture', pg0);
  shd1.setUniform('backbuffer', bb);
  shd1.setUniform('mouse',[map(mouseX, 0, width, 0, 1),  map(mouseY, 0, height, 0, 1)]);
  shd1.setUniform('stepmode', stepmode);
  shd1.setUniform('stepTh', stepTh);
  shd1.setUniform('bloommode', bloommode);
  pg1.rect(0, 0, width, height);
  pg1.resetMatrix();
  pg1._renderer._update();
 
  image(pg1, -width * 0.5, -height * 0.5);
  
  // backbuffer 
  bb.background(0);
  bb.rotateX(PI);
  bb.image(pg0,-width * 0.5, -height * 0.5);
  bb.resetMatrix();
  bb._renderer._update();
  
  // texts
  /*
  text("DIFFUSE COEF (W/S): " + diffuseCoef.toFixed(3) ,-width * 0.475, -height * 0.45);
  text("DIFFUSE CLARITY (A/D): " + diffuseClar.toFixed(3) ,-width * 0.475, -height * 0.45 + fontSize);
  text("STEP MODE (Z): " + (stepmode?'ON':'OFF') ,-width * 0.475, -height * 0.45 + fontSize * 2);
  text("STEP THRESHOLD (Q/E): " + stepTh.toFixed(3) ,-width * 0.475, -height * 0.45 + fontSize * 3);
  text("BLOOM MODE (B): " + (bloommode?'ON':'OFF') ,-width * 0.475, -height * 0.45 + fontSize * 4);
  */
}

function mouseMoved(){
  mousePosPrev = mousePosCur;
  mousePosCur = [mouseX, mouseY];
  var d = dist(mousePosPrev[0], mousePosPrev[1], mousePosCur[0], mousePosCur[1]);
  mouseVel = map(d, 0, canvDiagonal, 0, 1.0);
  
}

function keyPressed(){
  switch(key){
    case 'z':
      stepmode = !stepmode;
      break;
    case 'd':
      if (diffuseClar < 5.0) diffuseClar += 1.0;
      break;
    case 'a':
      if (diffuseClar > 1.0) diffuseClar -= 1.0;
      break;  
    case 'w':
      if (diffuseCoef < 0.2) diffuseCoef += 0.01;
      break;
    case 's':
      if (diffuseCoef > 0.0)diffuseCoef -= 0.01;
      break;
    case 'e':
      if (stepTh < 1.0) stepTh += 0.05;
      break;
    case 'q':
      if (stepTh > 0.5) stepTh -= 0.05;
      break;
    case 'b':
      bloommode = !bloommode;
      break;
  }
 
}

function mouseDragged(){
  brush = 1.0;
}

function mouseReleased(){
  brush = 0.0;
}