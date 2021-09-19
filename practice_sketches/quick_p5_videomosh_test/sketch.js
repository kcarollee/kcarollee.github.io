let video;
let videoCopy;
let previousFrame;
let videoResized = false;
let indicesNeedingWarp = [];
let auxPixelArr = [];
let indicesToWarp = [];
let videoPixelsPrev = [];
let threshold = 1;
let shiftCount = 0;
let swapModeEnabled = false;
let chooseIndicesToWarp = false;

let assimilateCount = 0; // first source assimilating into the second one
let assimilate = false;

function mapLinear(x, a1, a2, b1, b2){
    return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}

function mix(x, y, a){
  return x * (1 - a) + y * a;
}

function setup() {
  createCanvas(400, 400);
  video = createVideo('test3.mp4');
  videoCopy = createVideo('test2.mp4');
  video.loop();
  videoCopy.loop();
}

function draw() {
  background(220);
  
  // resize video when video is loaded
  if (video.width != 300 && !videoResized) {
    resizeCanvas(video.width, video.height);
    
    // set flag to true
    videoResized = true;
    
    // initialize indicesNeedingWarp
    let pixelNum = video.width * video.height;
    for (let i = 0; i < pixelNum; i++){
      indicesNeedingWarp.push(0);
      auxPixelArr.push(0, 0, 0, 0);
    }
  }

  
  video.loadPixels();
  videoCopy.loadPixels();
  if (chooseIndicesToWarp) fillIndicesToWarp();
  //if (frameCount % 100 == 0) fillIndicesToWarp();
  for (let y = 0; y < height; y++){
    for (let x = 0; x < width; x++){
      const index = y * width + x;
      const offset = 4 * index;
      
      
      // if the pixel at the current index needs warping
      if (indicesNeedingWarp[index] == 1 && !swapModeEnabled){
        
        // upon first random selection of the pixel, 
        // copy current frame's color values to auxPixelArr
        // use the alpha channel to determine whether this pixel has been analyzed
        if (chooseIndicesToWarp && auxPixelArr[offset + 3] == 0){
          auxPixelArr[offset] = video.pixels[offset];
          auxPixelArr[offset + 1] = video.pixels[offset + 1];
          auxPixelArr[offset + 2] = video.pixels[offset + 2];
          auxPixelArr[offset + 3] = video.pixels[offset + 3];

        }

        // else use auxPixelArr's color values as video pixels.
        else {
          video.pixels[offset] = auxPixelArr[offset];
          video.pixels[offset + 1] = auxPixelArr[offset + 1];
          video.pixels[offset + 2] = auxPixelArr[offset + 2];
          video.pixels[offset + 3] = auxPixelArr[offset + 3];
        }
      }

      // swapMode: comparing with the previous frame.
      // determining whether a pixel should be warped depending on its gscale value
      if (swapModeEnabled){
        let colorSumCur = videoCopy.pixels[offset] + videoCopy.pixels[offset + 1] +
                       videoCopy.pixels[offset + 2];
        let colorSumPrev = videoPixelsPrev[offset] + videoPixelsPrev[offset + 1] +
                       videoPixelsPrev[offset + 2];
        colorSumCur /= 3;
        colorSumPrev /= 3;
        //if (index == 5000) console.log(colorSumCur, colorSumPrev);

        
        // if the difference is larger than the threshold, set pixel color to aux
        let greyDiff = Math.abs(colorSumCur - colorSumPrev);
        if (greyDiff > threshold){ 
          // have the pixels that are larger than the threshold
          // have shifted color values to SOMEWHAT simulate datamoshing.
          let offset2 = (offset + shiftCount) % auxPixelArr.length; 
          video.pixels[offset] = auxPixelArr[offset2];
          video.pixels[offset + 1] = auxPixelArr[offset2 + 1];
          video.pixels[offset + 2] = auxPixelArr[offset2 + 2];
          video.pixels[offset + 3] = auxPixelArr[offset2 + 3];
          
          auxPixelArr[offset] = videoCopy.pixels[offset];
          auxPixelArr[offset + 1] = videoCopy.pixels[offset + 1];
          auxPixelArr[offset + 2] = videoCopy.pixels[offset + 2];
          auxPixelArr[offset + 3] = videoCopy.pixels[offset + 3];
        }
        
        // all the other pixels below the threshold
        else{
          let offset2 = (offset + shiftCount) % auxPixelArr.length; 
          video.pixels[offset] = auxPixelArr[offset];
          video.pixels[offset + 1] = auxPixelArr[offset + 1];
          video.pixels[offset + 2] = auxPixelArr[offset + 2];
          video.pixels[offset + 3] = auxPixelArr[offset + 3];
        }

        
      }
    }
  }
  if (swapModeEnabled) shiftCount += 4;
  else shiftCount = 0;

  if (assimilate && assimilateCount < 1) assimilateCount += 0.01;

  // falsify flag
  chooseIndicesToWarp = false;
  
  video.updatePixels();
  videoPixelsPrev = [];
 
  videoCopy.pixels.forEach(e => videoPixelsPrev.push(e));
  //warpAuxPixelArr();
  image(video, 0, 0);
}

function fillIndicesToWarp(){
  indicesToWarp = [];

  /*
  let indicesToWarpNum = 10000;
  for (let i = 0; i < indicesToWarpNum; i++){
    indicesToWarp.push(Math.floor(Math.random() * video.width * video.height));
  }
  */

  for (let y = 0; y < height; y++){
    for (let x = 0; x < width; x++){
      const index = y * width + x;
      const offset = 4 * index;
      //if (Math.abs(x - mouseX) < 8 ) indicesToWarp.push(index);

      /*
      let dx = x - mouseX;
      let dy = y - mouseY;
      let radius = 100;
      if (dx*dx + dy*dy < radius * radius) indicesToWarp.push(index);
      */

      let dim = 50;
      let dx = Math.abs(x - mouseX);
      let dy = Math.abs(y - mouseY);
      if (dx < dim && dy < dim) indicesToWarp.push(index);
    }
  }



  indicesToWarp.forEach(function(index){
    indicesNeedingWarp[index] = 1;
  });
  //chooseIndicesToWarp = false;
}

function mouseDragged(){
  chooseIndicesToWarp = true;
}

function mouseReleased(){

}

function warpAuxPixelArr(){
  indicesToWarp.forEach(function(index, i){
    let offset = 4 * index;
    auxPixelArr[offset] += 10 * Math.sin(frameCount + i);
    auxPixelArr[offset + 1] += 30 * Math.cos(frameCount + i);
    auxPixelArr[offset + 2] -= 40 * Math.cos(frameCount + i * 2);
  }); 
}

function keyPressed(){
  switch(key){
    case 's':
      swapModeEnabled = !swapModeEnabled;
      break;
    case 'r':
      // reset
      indicesNeedingWarp = [];
      //auxPixelArr = [];
      indicesToWarp = [];
      break;
    case 'a':
      assimilate = !assimilate;
      if (!assimilate) assimilateCount = 0;
      break;
  }
}

