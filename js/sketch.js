var fixedMouse = (mx, my) => [mx - windowWidth / 2.0, my - windowHeight / 2.0];



var thumbTexArr = [];
var ThumbnailArr = [];
var SketchBar;
var vidTexTest;
var AboutBar;
var rotateNum = 0;
let img;
let generalFont;
let pg;
let testi;


function preload() {
    generalFont = loadFont('fonts/Monoid-Regular.ttf');

}

function setup() {
    var canv = createCanvas(windowWidth, windowHeight, WEBGL);
    canv.position(0, 0);
    canv.style('z-index', '-1');
    textFont(generalFont);
    textSize(15);
    SketchBar = new NavBar(width, 25, new p5.Vector(0, -height / 2 * 9 / 10, 0));
    SketchBar.setText("Sketches");
    AboutBar = new NavBar(width, 25, new p5.Vector(0, -height / 2 * 8 / 10, 0));
    AboutBar.setText("About");

    // load images into texture array
    for (let i = 0; i < 8; i++) {
        var img = loadImage('imgs/thumb' + i + '.png');
        thumbTexArr.push(img);
    }

    // init Thumbnails
    for (let i = 0; i < 8; i++) {
        var thumb = new Thumbnail();
        thumb.setTexture(thumbTexArr[i]);
        ThumbnailArr.push(thumb);
    }

    //testi = new DomElements('https://neort.io/embed/bptmfo43p9fefb92540g?autoStart=true&quality=1&info=true');

}

function draw() {
    background(0);
    // Thumbnails
    //fill(255);
    push();
    let radius = 800;
    translate(0, 0, -radius * cos(PI / 8.0));
    //console.log(rotateNum);
    for (let i = 0; i < 8; i++) {
        if (rotateNum > 0) {
            if (i == (8 - rotateNum % 8) % 8) ThumbnailArr[i].atFront = true;
            else ThumbnailArr[i].atFront = false;
        } else {
            if (i == (8 - (8 - abs(rotateNum) % 8) % 8) % 8) ThumbnailArr[i].atFront = true;
            else ThumbnailArr[i].atFront = false;
        }
        push();
        rotateY(QUARTER_PI * (i + rotateNum) + PI);
        //translate y:  floor(20 * i * PI + frameCount * 10) % windowHeight - windowHeight * 0.5
        translate(0, 0, -radius);
        push();
        rotateY(PI);
        ThumbnailArr[i].display();
        ThumbnailArr[i].mouseInBounds();
        fill(255);
        text("index:" + i, 0, 200);
        text("rotateNum:" + rotateNum, 0, 225);
        if (ThumbnailArr[i].atFront) text("front", 0, 250);
        pop();
        pop();
    }
    pop();
    //console.log(fixedMouse(mouseX, mouseY));

    // navigation bars
    SketchBar.display();
    AboutBar.display();
    SketchBar.mouseOver();
    AboutBar.mouseOver();
    AboutBar.setPosition(new p5.Vector(0, -windowHeight / 2 * 8 / 10, 0));
    fill(255);
    text("Press 'v' to view sketch.", -windowWidth / 2.0, -windowHeight / 2 * 7 / 10);
    // thumbnail rotation
    manageRotation();

}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    SketchBar.setSize(windowWidth, 25);
    SketchBar.setPosition(new p5.Vector(0, -windowHeight / 2 * 9 / 10, 0));
    AboutBar.setSize(windowWidth, 25);
    AboutBar.setPosition(new p5.Vector(0, -windowHeight / 2 * 8 / 10, 0));
    testi.changePos(windowWidth * 0.5 - 300, windowHeight * 0.5 - 300);
}

var turnLeft;
var turnRight;
var dest;

function keyPressed() {
    switch (keyCode) {
        case LEFT_ARROW:
            if (!turnLeft) {
                turnLeft = true;
                turnRight = false;
                dest = rotateNum + 1;
            }
            //rotateNum--;
            break;
        case RIGHT_ARROW:
            if (!turnRight) {
                turnRight = true;
                turnLeft = false;
                dest = rotateNum - 1;
            }
            //rotateNum++;
            break;
    }
    switch (key) {
        case 'v':
            console.log("V");
            testi = new DomElements('https://youtu.be/9Bwx4Azjc_E',
                'https://github.com/kcarollee/kcarollee.github.io');
            break;
    }
}

function manageRotation() {
    if (turnLeft) {
        if (rotateNum - dest < 0.01) rotateNum += 0.03;
        else {
            rotateNum = dest;
            turnLeft = false;
        }
    } else if (turnRight) {
        if (dest - rotateNum < 0.01) rotateNum -= 0.03;
        else {
            rotateNum = dest;
            turnRight = false;
        }
    }
}

function mouseClicked() {
    for (let i = 0; i < 8; i++) {
        //console.log(i);
        if (ThumbnailArr[i].mouseInBounds()) {
            //console.log("HELLO WHAT");
            testi = new DomElements('https://neort.io/embed/bptmfo43p9fefb92540g?autoStart=true&quality=1&info=true',
                'https://github.com/kcarollee/kcarollee.github.io');
            console.log("COMEONE");
        } else testi.remove();
    }
    /*
    if (ThumbnailArr[0].mouseInBounds()) {
        console.log("HELLO");
        testi = new DomElements('https://neort.io/embed/bptmfo43p9fefb92540g?autoStart=true&quality=1&info=true',
            'https://github.com/kcarollee/kcarollee.github.io');
    } else testi.remove();
    */
}