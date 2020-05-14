var fixedMouse = (mx, my) => [mx - windowWidth / 2.0, my - windowHeight / 2.0];
var thumbTexArr = [];
var ThumbnailArr = [];
var followPos = [0, 0];
var followX = 0,
    followY = 0;
var easingVal = 0.04;
var shaderMode = 0;
var shaderOn = true;
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
    ViewBar.setText("PLAY");
    AboutBar.barContentShown = false;

    // init about page
    AboutRect = new AboutPage(width, 0,
        new p5.Vector(-AboutBar.width * 0.5, -height / 2 * 8 / 10 + AboutBar.height * 0.5, 0));

    // for enabling / disabling depth test
    gl = this._renderer.GL;
    gl.disable(gl.DEPTH_TEST);
    //gl.useProgram();
}


function setUniformArray(shader, uniformName, data) {
    const uniform = shader.uniforms[uniformName];
    const location = uniform.location;
    switch (uniform.type) {
        case gl.FLOAT:
            if (uniform.size > 1) {
                gl.uniform1fv(location, data);
            } else {
                gl.uniform1f(location, data);
            }
            break;
    }
}

function draw() {
    if (shaderOn) {
        //shaders
        followPos[0] += (mouseX / windowWidth - followPos[0]) * easingVal;
        followPos[1] += ((windowHeight - mouseY) / windowHeight - followPos[1]) * easingVal;
        ShaderTexture.shader(BackgroundShader);
        BackgroundShader.setUniform("shaderMode", shaderMode);
        BackgroundShader.setUniform("resolution", [windowWidth, windowHeight]);
        BackgroundShader.setUniform("time", millis() / 1000.0);
        BackgroundShader.setUniform("mouse", [mouseX, windowHeight - mouseY]);
        BackgroundShader.setUniform("followPos", [followPos[0], followPos[1]]);
        //setUniformArray(BackgroundShader, "piArr", [3.14, 3.14]);
        ShaderTexture.rect(0, 0, windowWidth, windowHeight);

        background(0);
        // background texture
        gl.disable(gl.DEPTH_TEST);
        texture(ShaderTexture);
        rectMode(CENTER);
        rect(0, 0, windowWidth, windowHeight);
    } else background(0);
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
                if (AboutRect.opacity < 1.0) AboutRect.opacity += 0.1;
            } else AboutRect.fullyLoaded = true;

        } else if (SketchBar.barContentShown) {
            if (thumbYPos > 0) {
                thumbYPos -= 70;
            }
            if (AboutRect.height > 0) {
                AboutRect.fullyLoaded = false;
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
            translate(0, thumbYPos, -radius + 3 * sin(frameCount * 0.05 + QUARTER_PI * i));
            push();
            rotateY(PI);
            ThumbnailArr[i].display();
            pop();
            pop();
        }
        pop();
    }
    // navigation bars
    SketchBar.display();
    AboutBar.display();
    SketchBar.mouseOver();
    AboutBar.mouseOver();
    AboutBar.setPosition(new p5.Vector(0, -windowHeight / 2 * 8 / 10, 0));

    // do not show the 'press enter'  or the arrow bars if the About page is shown. 
    if (SketchBar.barContentShown) {
        ToLeftBar.display();
        ToRightBar.display();
        ViewBar.display();
        ToLeftBar.mouseOver();
        ToRightBar.mouseOver();
        ViewBar.mouseOver();
        fill(255);

        text(" Press Enter or click 'PLAY' to play sketch.", -220, -windowHeight / 2 * 6.5 / 10);

        text(" z: change background x: " + (shaderOn ? "disable" : "enable") + " background", -windowWidth / 2, windowHeight / 2 * 9.75 / 10);
    }
    // thumbnail rotation
    manageRotation();

    // about page
    if (AboutBar.barContentShown) {
        gl.disable(gl.DEPTH_TEST);
        AboutRect.display();
    }
}

function windowResized() {
    ShaderTexture.resizeCanvas(windowWidth, windowHeight);
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
            break;
        case ENTER:
            if (!domElem.domCreated) {
                domElem.domCreated = true;
                domElem.createButton();
                domElem.createiFrame(entries[currentFrontIndex].vLink);
                domElem.createAnchor(entries[currentFrontIndex].rLink);
            }
            break;
        case ESCAPE:
            if (domElem.domCreated) closeDom();
            break;
    }
    switch (key) {
        case 'z':
            shaderMode = (++shaderMode) % 3;
            break;
        case 'x':
            shaderOn = !shaderOn;
            break;
    }
}

function manageRotation() {
    if (turnLeft) {
        if (rotateNum - dest < 0.01) {
            manageRotation.loopNum++;
            rotateNum += 0.00001 * manageRotation.loopNum * (200 + manageRotation.loopNum);

        } else {
            manageRotation.rot = 0;
            manageRotation.loopNum = 0;
            rotateNum = dest;
            turnLeft = false;
        }
    } else if (turnRight) {
        if (dest - rotateNum < 0.01) {
            //rotateNum -= 0.03;
            manageRotation.loopNum++;
            rotateNum -= 0.00001 * manageRotation.loopNum * (200 + manageRotation.loopNum);
        } else {
            manageRotation.rot = 0;
            manageRotation.loopNum = 0;
            rotateNum = dest;
            turnRight = false;
        }
    }
}
manageRotation.loopNum = 0;

function mouseClicked() {
    if (AboutBar.mouseOver() && !domElem.domCreated) {
        AboutRect.showDom();
        frameCount = 0;
        AboutBar.barContentShown = true;
        SketchBar.barContentShown = false;
    } else if (SketchBar.mouseOver()) {
        AboutRect.fullyLoaded = false;
        AboutRect.hideDom();
        SketchBar.barContentShown = true;
        if (AboutBar.height == 0) AboutBar.barContentShown = false;
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