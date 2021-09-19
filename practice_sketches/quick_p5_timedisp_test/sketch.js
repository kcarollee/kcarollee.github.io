let pgbg;
let pgf; // final output buffer of original sketch
let imgArr = []; // array of sub-images selected with mouse
let mCoord1, mCoord2; 
let shd1;
let vid;
let modeArr = ['VERTICAL, RIGHTMOST LATEST', 'VERTICAL, LEFTMOST LATEST',
               'HORIZONTAL, BOTTOMMOST LATEST', 'HORIZONTAL, TOPMOST LATEST', 'VERTICAL RANDOM', 'HORIZONTAL RANDOM']; // 0:vert, 1:hori 
let font;
let video;
let video2;



class SubImage{
  constructor(pos1, pos2, pg, subImgNum, mode){
    this.pos1 = pos1;
    this.pos2 = pos2;
    this.w = abs(this.pos1[0] - this.pos2[0]);
    this.h = abs(this.pos1[1] - this.pos2[1]);
    this.subImgArr = [];
    this.subImgNum = subImgNum;
    this.mode = mode;
    this.img = pg.get(this.pos1[0], this.pos1[1], this.w, this.h);
  }
  display(pg, randDeg){
    this.updateFrames(pg);
    let wdiv = int(this.w / float(this.subImgNum));
    let hdiv = int(this.h / float(this.subImgNum));

    let rd = randDeg;
    switch(this.mode){
      // vertical. rightmost = latest frame
      case 0:
        for (let i = 0; i < this.subImgArr.length; i++){
          image(this.subImgArr[i].get(wdiv * i, 0, wdiv, this.h),
          this.pos1[0] + wdiv * i, this.pos1[1], wdiv, this.h);
        }
        break;
      // vertical. leftmost = latest frame
      case 1:
        for (let i = 0; i < this.subImgArr.length; i++){
          image(this.subImgArr[i].get(wdiv * (this.subImgArr.length - 1 - i), 0, wdiv, this.h),
          this.pos1[0] + wdiv * (this.subImgArr.length - 1 - i), this.pos1[1], wdiv, this.h);
        }
        break;  
      case 2:
        for (let i = 0; i < this.subImgArr.length; i++){
          image(this.subImgArr[i].get(0, hdiv * i, this.w, hdiv),
          this.pos1[0], this.pos1[1] + hdiv * i, this.w, hdiv);
        }
        break;
      case 3:
        for (let i = 0; i < this.subImgArr.length; i++){
          image(this.subImgArr[i].get(0, hdiv * (this.subImgArr.length - 1 - i), this.w, hdiv),
          this.pos1[0], this.pos1[1] + hdiv * (this.subImgArr.length - 1 - i), this.w, hdiv);
        }
        break;
      case 4:
        for (let i = 0; i < this.subImgArr.length; i++){
          let r = int(random(this.subImgArr.length * (1 - rd), this.subImgArr.length));
          image(this.subImgArr[r].get(wdiv * i, 0, wdiv, this.h),
          this.pos1[0] + wdiv * i, this.pos1[1], wdiv, this.h);
        }
        break;
      case 5:
        for (let i = 0; i < this.subImgArr.length; i++){
          let r = int(random(this.subImgArr.length * (1- rd), this.subImgArr.length));
          image(this.subImgArr[r].get(0, hdiv * i, this.w, hdiv),
          this.pos1[0], this.pos1[1] + hdiv * i, this.w, hdiv);
        }
        break;
    }
  }
  updateFrames(pg){
    this.img = pg.get(this.pos1[0], this.pos1[1], this.w, this.h);
    if (this.subImgArr.length < this.subImgNum){
      let copiedTex = this.img.get();
      this.subImgArr.push(copiedTex);
    }
    else{
      this.subImgArr.shift();
      let copiedTex = this.img.get();
      this.subImgArr.push(copiedTex);
    }
  }
}
function preload(){
  shd1 = loadShader('Shader1.vert', 'Shader1.frag');
  font = loadFont('helvetica.ttf');
}

function afterLoad(){
  video.play();
}
function setup() {
 
  textFont(font);
  textSize(8);
  //let gl = pgf._renderer.GL;
  //gl.disable(gl.DEPTH_TEST);

  video = createVideo('test1.mp4', afterLoad);
 

  createCanvas(video.width * 3, video.height * 3);
  pgf = createGraphics(width, height, WEBGL);
  pgbg = createGraphics(width, height, WEBGL);
  
  video.loop();
 video.play();
  video.hide();
  video.volume(0)


 

}

function draw() {
  background(220);
  
  pgbg.background(0, 0);
  pgbg.shader(shd1);
  shd1.setUniform('resolution', [width, height]);
  shd1.setUniform('time', frameCount);
  pgbg.rect(0, 0);
  pgbg._renderer._update();
  
  
  pgf.background(0);
  pgf.noStroke();
  pgf.texture(video);
  pgf.plane(width, height);
  /*
  pgf.push();
  pgf.translate(0, 0, -100);
  pgf.image(pgbg, -width * 0.5,- height * 0.5);
  pgf.pop();
  */

  /*
  pgf.push();
  pgf.translate(0, 0,0);
  pgf.rotateX(frameCount * 0.02);
  pgf.rotateY(frameCount * 0.02);
  pgf.rotateZ(frameCount * 0.02);
  pgf.noFill();
  
  
  pgf.texture(video);
  let boxNum = 3;
  let boxInc = 60;
  
  for (let i = 0; i < boxNum; i++){
    pgf.rotateX(HALF_PI * i);
    pgf.box(boxInc * (i + 1));
  }
  pgf.pop();
  
  pgf.push();
  //pgf.translate(0, 1000, 0);
  pgf.rotateZ(PI);
  pgf.noStroke();
  pgf.texture(video);
  pgf.sphere(500);
  pgf.pop();
  */
 
  pgf._renderer._update();
  
  image(pgf, 0, 0);
  
  imgArr.forEach(img=>img.display(pgf, randDeg));
  
  if (md) {
    noFill();

    stroke(255);
    rect(mCoord1[0], mCoord1[1], mouseX - mCoord1[0], mouseY - mCoord1[1]);
  }
  
  push();
  noStroke();
  fill(255);
  text("NEXT MODE (W/S): " + modeArr[nextMode], 10, 20);
  text("NUMBER OF FRAMES PER DISPLACEMENT (Q/E): " + subImageNum, 10, 33);
  text("RANDOM RANGE (A/D): " + randDeg.toFixed(3), 10, 46);
  text("DELETE DISPLACEMENT AREA (X)", 10, 59);
  pop();

  swapVideo();
}

function mousePressed(){
  mCoord1 = [mouseX, mouseY];
}

function swapVideo(){
 
  
}
let md = false;
function mouseDragged(){
  md = true;
  //rect(mCoord1[0], mCoord1[1], mouseX, mouseY);
}
let nextMode = 0;
function mouseReleased(){
  md = false;
  mCoord2 = [mouseX, mouseY];
  let img = new SubImage(mCoord1, mCoord2, pgf, subImageNum, nextMode);
  imgArr.push(img);
  
}
let randDeg = 0.1;
let subImageNum = 20;
function keyPressed(){
  switch(key){
    case 'x':
      imgArr = imgArr.splice(1, imgArr.length - 1);
      break;
    case 'w':
      nextMode++;
      nextMode %= 6;
      break;
    case 's':
      nextMode--;
      if (nextMode < 0) nextMode = 5;
      nextMode %= 6;
      break;
    case 'd':
      randDeg += 0.1;
      if (randDeg > 1.0) randDeg = 1.0;
      break;
    case 'a':
      randDeg -= 0.1;
      if (randDeg <= 0.1) randDeg = 0.1;
      break;
    case 'q':
      subImageNum -= 10;
      break;
    case 'e':
      subImageNum += 10;
      break;
  }
}