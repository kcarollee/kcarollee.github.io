var fixedMouse = (mx, my) => [mx - windowWidth / 2.0, my - windowHeight / 2.0];
var thumbTexArr = [];
var ThumbnailArr = [];
var SketchBar;
var AboutBar;
var AboutRect;
var rotateNum = 0;
var aboutShown = false;
var aboutShownNum = 0;
var thumbYPos = 0;
let img;
let generalFont;
let pg;
let domElem;
let currentFrontIndex = 0;
p5.disableFriendlyErrors = true;
let BackgroundShader;
let ShaderTexture;
let gl;

function preload() {
    generalFont = loadFont('fonts/Monoid-Regular.ttf');
    BackgroundShader = loadShader('shaders/BackgroundShader.vert', 'shaders/BackgroundShader.frag');
}

function setup() {
    // canv init
    var canv = createCanvas(windowWidth, windowHeight, WEBGL);
    canv.position(0, 0);
    canv.style('z-index', '-1');

    // shader init
    ShaderTexture = createGraphics(windowWidth, windowHeight, WEBGL);
    ShaderTexture.noStroke();

    textFont(generalFont);
    textSize(15);
    SketchBar = new NavBar(width, 25, new p5.Vector(0, -height / 2 * 9 / 10, 0));
    SketchBar.setText(" Sketches");
    SketchBar.barContentShown = true;
    AboutBar = new NavBar(width, 25, new p5.Vector(0, -height / 2 * 8 / 10, 0));
    AboutBar.setText(" About");
    AboutBar.barContentShown = false;
    AboutRect = new AboutPage(width, 0,
        new p5.Vector(-AboutBar.width * 0.5, -height / 2 * 8 / 10 + AboutBar.height * 0.5, 0));
    // load images into texture array
    for (let i = 0; i < 8; i++) {
        var img = loadImage('imgs/thumb' + i + '.jpg');
        thumbTexArr.push(img);
    }

    // init Thumbnails
    for (let i = 0; i < 8; i++) {
        var thumb = new Thumbnail();
        thumb.setTexture(thumbTexArr[i]);
        thumb.setTitle(entries[i].title);
        ThumbnailArr.push(thumb);
    }

    // init dom elements w/o actually creating them -> dom creation is initiated upon pressing 'v'
    domElem = new DomElements();

    // for enabling / disabling depth test
    gl = this._renderer.GL;
    gl.disable(gl.DEPTH_TEST);
}

function draw() {
    //shaders
    ShaderTexture.shader(BackgroundShader);
    BackgroundShader.setUniform("resolution", [width, height]);
    BackgroundShader.setUniform("time", millis() / 1000.0);
    ShaderTexture.rect(0, 0, width, height);

    background(0);
    // background texture
    gl.disable(gl.DEPTH_TEST);
    texture(ShaderTexture);
    rectMode(CENTER);
    rect(0, 0, width, height);

    // Thumbnails
    gl.enable(gl.DEPTH_TEST);
    push();
    let radius = 800 + 5 * sin(frameCount * 0.05);
    // manage sketch / about transition
    if (AboutBar.barContentShown && !SketchBar.barContentShown) {
        if (thumbYPos < windowHeight * 2.5) {
            thumbYPos += 70;
        }
        if (AboutRect.height < windowHeight * 0.75) {
            AboutRect.height += 50;
        }

    }
    if (SketchBar.barContentShown) {
        if (thumbYPos > 0) {
            thumbYPos -= 70;
        }
        if (AboutRect.height > 0) {
            AboutRect.height -= 50;
        }
    }
    translate(0, thumbYPos, -radius * cos(PI / 8.0));
    for (let i = 0; i < 8; i++) {
        if (rotateNum > 0) {
            if (i == (8 - rotateNum % 8) % 8) {
                ThumbnailArr[i].atFront = true;
                currentFrontIndex = i;
            } else ThumbnailArr[i].atFront = false;
        } else {
            if (i == (8 - (8 - abs(rotateNum) % 8) % 8) % 8) {
                ThumbnailArr[i].atFront = true;
                currentFrontIndex = i;
            } else ThumbnailArr[i].atFront = false;
        }
        push();
        rotateY(QUARTER_PI * (i + rotateNum) + PI);
        //translate y:  floor(20 * i * PI + frameCount * 10) % windowHeight - windowHeight * 0.5
        translate(0, thumbYPos, -radius);
        push();
        rotateY(PI);
        ThumbnailArr[i].display();
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
    text(" Press 'v' to view sketch.", -windowWidth / 2.0, -windowHeight / 2 * 7 / 10);
    // thumbnail rotation
    manageRotation();

    // about page
    if (AboutBar.barContentShown) {
        gl.disable(gl.DEPTH_TEST);
        AboutRect.display();
    }
    // if (domElem.domCreated) domElem.animate();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    SketchBar.setSize(windowWidth, 25);
    SketchBar.setPosition(new p5.Vector(0, -windowHeight / 2 * 9 / 10, 0));
    AboutBar.setSize(windowWidth, 25);
    AboutBar.setPosition(new p5.Vector(0, -windowHeight / 2 * 8 / 10, 0));
    AboutRect.setSize(windowWidth, AboutRect.height);
    AboutRect.setPosition(new p5.Vector(-AboutBar.width * 0.5, -height / 2 * 8 / 10 + AboutBar.height * 0.5, 0));
    //domElem.changePos(windowWidth * 0.5 - domElem.w * 0.5, windowHeight * 0.5 - domElem.h * 0.5);
    domElem.resizeDimensions();
    domElem.fixPosition();
}

var turnLeft;
var turnRight;
var dest;

function keyPressed() {
    switch (keyCode) {
        case LEFT_ARROW:
            // keyboard disabled when dom elements are visible
            if (!domElem.domCreated) {
                // nested if loop to prevent turning while rotating 
                if (!turnRight) {
                    if (!turnLeft) {
                        turnLeft = true;
                        turnRight = false;
                        dest = rotateNum + 1;
                    }
                }
                //rotateNum--;
            }
            break;
        case RIGHT_ARROW:
            if (!domElem.domCreated) {
                if (!turnLeft) {
                    if (!turnRight) {
                        turnRight = true;
                        turnLeft = false;
                        dest = rotateNum - 1;
                    }
                }
            }
            //rotateNum++;
            break;
    }
    switch (key) {
        case 'v':
            if (!domElem.domCreated) {
                domElem.domCreated = true;
                //domElem.createHeader("TESTING HEADER");
                domElem.createButton();
                domElem.createiFrame(entries[currentFrontIndex].vLink);
                domElem.createAnchor(entries[currentFrontIndex].rLink);
            }
            break;
    }
}

function manageRotation() {
    if (turnLeft) {
        if (rotateNum - dest < 0.01) {
            //rotateNum += 0.03;
            manageRotation.loopNum++;
            rotateNum += 0.00001 * manageRotation.loopNum * (200 - manageRotation.loopNum);
        } else {
            //manageRotation.loopNum--;
            //rotateNum -= 0.00001 * manageRotation.loopNum * (200 - manageRotation.loopNum);
            manageRotation.rot = 0;
            manageRotation.loopNum = 0;
            rotateNum = dest;
            turnLeft = false;
        }
    } else if (turnRight) {
        if (dest - rotateNum < 0.01) {
            //rotateNum -= 0.03;
            manageRotation.loopNum++;
            rotateNum -= 0.00001 * manageRotation.loopNum * (200 - manageRotation.loopNum);
        } else {
            //manageRotation.loopNum--;
            //rotateNum += 0.00001 * manageRotation.loopNum * (200 - manageRotation.loopNum);
            manageRotation.rot = 0;
            manageRotation.loopNum = 0;
            rotateNum = dest;
            turnRight = false;
        }
    }
}
manageRotation.loopNum = 0;


function mouseClicked() {
    /*
    for (let i = 0; i < 8; i++) {
        //console.log(i);
        if (ThumbnailArr[i].mouseInBounds()) {
            //console.log("HELLO WHAT");
            domElem = new DomElements('https://neort.io/embed/bptmfo43p9fefb92540g?autoStart=true&quality=1&info=true',
                'https://github.com/kcarollee/kcarollee.github.io');
            console.log("COMEONE");
        } else domElem.remove();
    }
    */
    /*
    if (ThumbnailArr[0].mouseInBounds()) {
        console.log("HELLO");
        domElem = new DomElements('https://neort.io/embed/bptmfo43p9fefb92540g?autoStart=true&quality=1&info=true',
            'https://github.com/kcarollee/kcarollee.github.io');
    } else domElem.remove();
    */
    if (AboutBar.mouseOver()) {
        AboutRect.showDom();
        frameCount = 0;
        AboutBar.barContentShown = true;
        SketchBar.barContentShown = false;
        console.log("ABOUT BAR CLICKED");
    } else if (SketchBar.mouseOver()) {
        AboutRect.hideDom();
        SketchBar.barContentShown = true;
        if (AboutBar.height == 0) AboutBar.barContentShown = false;
        console.log("Sketch BAR CLICKED");
    }

}