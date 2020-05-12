var fixedMouse = (mx, my) => [mx - windowWidth / 2.0, my - windowHeight / 2.0];
var thumbTexArr = [];
var ThumbnailArr = [];
var SketchBar, AboutBar;
var ToRightBar, ToLeftBar, ViewBar;
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
    // init canvas
    var canv = createCanvas(windowWidth, windowHeight, WEBGL);
    canv.position(0, 0);
    canv.style('z-index', '-1');

    // init shader
    ShaderTexture = createGraphics(windowWidth, windowHeight, WEBGL);
    ShaderTexture.noStroke();
    // load images into texture array
    for (let i = 0; i < 8; i++) {
        var img = loadImage('imgs/mainThumbs/thumb' + i + '.jpg');
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

    // init text
    textFont(generalFont);
    textSize(15);

    // init nav bars
    SketchBar = new NavBar(width, 25, new p5.Vector(0, -height / 2 * 9 / 10, 0));
    SketchBar.setText(" Sketches");
    SketchBar.barContentShown = true;
    AboutBar = new NavBar(width, 25, new p5.Vector(0, -height / 2 * 8 / 10, 0));
    AboutBar.setText(" About");
    ToLeftBar = new NavBar(40, 20, new p5.Vector(-60, height / 2 * 8 / 10, 0));
    ToLeftBar.setText("<<<<");
    ToRightBar = new NavBar(40, 20, new p5.Vector(60, height / 2 * 8 / 10, 0));
    ToRightBar.setText(">>>>");
    ViewBar = new NavBar(40, 20, new p5.Vector(0, height / 2 * 8 / 10, 0));
    ViewBar.setText("VIEW");
    AboutBar.barContentShown = false;

    // init about page
    AboutRect = new AboutPage(width, 0,
        new p5.Vector(-AboutBar.width * 0.5, -height / 2 * 8 / 10 + AboutBar.height * 0.5, 0));

    // for enabling / disabling depth test
    gl = this._renderer.GL;
    gl.disable(gl.DEPTH_TEST);
}

function draw() {
    //shaders
    ShaderTexture.shader(BackgroundShader);
    BackgroundShader.setUniform("resolution", [windowWidth, windowHeight]);
    BackgroundShader.setUniform("time", millis() / 1000.0);
    ShaderTexture.rect(0, 0, windowWidth, windowHeight);

    background(0);
    // background texture
    gl.disable(gl.DEPTH_TEST);
    texture(ShaderTexture);
    rectMode(CENTER);
    rect(0, 0, windowWidth, windowHeight);

    // Thumbnails
    if (!AboutRect.fullyLoaded) {
        gl.enable(gl.DEPTH_TEST);
        push();
        let radius = 800;
        // manage sketch / about transition
        if (AboutBar.barContentShown && !SketchBar.barContentShown) {
            if (thumbYPos < windowHeight * 2.5) {
                thumbYPos += 70;
            }
            if (AboutRect.height < windowHeight) {
                AboutRect.height += 50;
            } else AboutRect.fullyLoaded = true;

        } else if (SketchBar.barContentShown) {
            if (thumbYPos > 0) {
                thumbYPos -= 70;
            }
            if (AboutRect.height > 0) {
                AboutRect.height -= 50;
            } else {
                AboutRect.fullyLoaded = false;
                AboutBar.barContentShown = false;
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
            translate(0, thumbYPos, -radius + 5 * sin(frameCount * 0.05 + QUARTER_PI * i));
            push();
            rotateY(PI);
            ThumbnailArr[i].display();
            pop();
            pop();
        }
        pop();
        //console.log(fixedMouse(mouseX, mouseY));
    }
    // navigation bars
    SketchBar.display();
    AboutBar.display();
    SketchBar.mouseOver();
    AboutBar.mouseOver();
    AboutBar.setPosition(new p5.Vector(0, -windowHeight / 2 * 8 / 10, 0));

    // do not show the 'press v'  or the arrow bars if the About page is shown. 
    if (SketchBar.barContentShown) {
        ToLeftBar.display();
        ToRightBar.display();
        ViewBar.display();
        ToLeftBar.mouseOver();
        ToRightBar.mouseOver();
        ViewBar.mouseOver();
        fill(255);
        text(" Press v or 'view' to view sketch.", -windowWidth / 2.0, -windowHeight / 2 * 7 / 10);
    }
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

    ToLeftBar.setPosition(new p5.Vector(-60, windowHeight / 2 * 8 / 10, 0));
    ToRightBar.setPosition(new p5.Vector(60, windowHeight / 2 * 8 / 10, 0));
    ViewBar.setPosition(new p5.Vector(0, windowHeight / 2 * 8 / 10, 0))
    AboutRect.setSize(windowWidth, AboutRect.height);
    AboutRect.setPosition(new p5.Vector(-AboutBar.width * 0.5, -height / 2 * 8 / 10 + AboutBar.height * 0.5, 0));
    AboutRect.fixPosition();
    AboutRect.fixImgSize();
    //domElem.changePos(windowWidth * 0.5 - domElem.w * 0.5, windowHeight * 0.5 - domElem.h * 0.5);
    domElem.resizeDimensions();
    domElem.fixPosition();
    BackgroundShader.setUniform("resolution", [windowWidth, windowHeight]);
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
    if (AboutBar.mouseOver()) {
        AboutRect.showDom();
        frameCount = 0;
        AboutBar.barContentShown = true;
        SketchBar.barContentShown = false;
        console.log("ABOUT BAR CLICKED");
    } else if (SketchBar.mouseOver()) {
        AboutRect.fullyLoaded = false;
        AboutRect.hideDom();
        SketchBar.barContentShown = true;
        if (AboutBar.height == 0) AboutBar.barContentShown = false;
        console.log("Sketch BAR CLICKED");
    }
    if (ToLeftBar.mouseOver()) {
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
        }
    } else if (ToRightBar.mouseOver()) {
        if (!domElem.domCreated) {
            if (!turnLeft) {
                if (!turnRight) {
                    turnRight = true;
                    turnLeft = false;
                    dest = rotateNum - 1;
                }
            }
        }
    } else if (ViewBar.mouseOver()) {
        if (!domElem.domCreated) {
            domElem.domCreated = true;
            domElem.createButton();
            domElem.createiFrame(entries[currentFrontIndex].vLink);
            domElem.createAnchor(entries[currentFrontIndex].rLink);
        }
    }

}