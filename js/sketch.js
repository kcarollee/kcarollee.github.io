var fixedMouse = (mx, my) => [mx - width / 2.0, my - height / 2.0];
class DomElements {
    constructor(vidSrc) {
        this.src = vidSrc;
        this.iFrame = createElement('iframe');
        this.iFrame.attribute('src', vidSrc);
        this.iFrame.attribute('width', '600px');
        this.iFrame.attribute('height', '600px');
        this.iFrame.attribute('frameBorder', '0');
        this.iFrame.attribute('scrolling', 'no');
        this.iFrame.attribute('overflow', 'hidden');
        this.iFrame.style('overflow', 'hidden');
        //this.iFrame.attribute('style', 'position:relative');
        this.iFrame.position(windowWidth * 0.5 - 300, windowHeight * 0.5 - 300);

    }

    changePos(newX, newY) {
        this.iFrame.position(newX, newY);
    }
}

class Thumbnail {
    constructor() {
        this.atFront = false;

    }

    setTexture(newTex) { this.imgTexture = newTex; }
    setDomElements(dom) { this.domeElements = dom; }
    mouseInBounds() {
        if (this.atFront) {
            let mouse = fixedMouse(mouseX, mouseY);
            let w = windowWidth * 0.5;
            let h = windowHeight * 0.5;
            if (-w * 0.5 < mouse[0] && mouse[0] < w * 0.5 &&
                -h * 0.5 < mouse[1] && mouse[1] < h * 0.5) {
                console.log("IN");
                return true;
            }
        }
    }
    display() {
        /*
        push();
        rotateY(QUARTER_PI * i);
        //translate y:  floor(20 * i * PI + frameCount * 10) % windowHeight - windowHeight * 0.5
        translate(0, 0, -windowHeight / 2);
        texture(img);
        plane(windowHeight / 4, windowHeight / 4);
        pop();
        */
        texture(this.imgTexture);
        plane(windowHeight * 0.5, windowHeight * 0.5);
    }
}


class NavBar {
    constructor(width, height, pos) {
        this.width = width;
        this.height = height;
        this.pos = pos;
        this.color = color(255);
        //this.text;
    }

    setText(text) { this.text = text; }
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }
    setPosition(newPos) { this.pos = newPos; }
    display() {
        noStroke();
        fill(this.color);
        rectMode(CENTER);
        rect(this.pos.x, this.pos.y, this.width, this.height);

        fill(0);
        text(this.text, -this.width * 0.5, this.pos.y + this.height * 0.25);
    }

    mouseOver() {
        let mouse = fixedMouse(mouseX, mouseY);
        if (-this.width * 0.5 + this.pos.x < mouse[0] && mouse[0] < this.width * 0.5 + this.pos.x &&
            -this.height * 0.5 + this.pos.y < mouse[1] && mouse[1] < this.height * 0.5 + this.pos.y) {
            this.color = color(150);
        } else this.color = color(255);
    }
}

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
        var img = loadImage('imgs/thumb' + (i % 2 + 1) + '.png');
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
    for (let i = 0; i < 8; i++) {
        if (i == rotateNum) ThumbnailArr[i].atFront = true;
        else ThumbnailArr[i].atFront = false;
        push();
        rotateY(QUARTER_PI * (i + rotateNum) + PI);
        //translate y:  floor(20 * i * PI + frameCount * 10) % windowHeight - windowHeight * 0.5
        translate(0, 0, -radius);
        ThumbnailArr[i].display();
        ThumbnailArr[i].mouseInBounds();
        pop();
    }
    pop();
    //console.log(fixedMouse(mouseX, mouseY));

    // navigation bars
    SketchBar.display();
    AboutBar.display();
    SketchBar.mouseOver();
    AboutBar.mouseOver();



}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    SketchBar.setSize(windowWidth, 25);
    SketchBar.setPosition(new p5.Vector(0, -windowHeight / 2 * 9 / 10, 0));

    AboutBar.setSize(windowWidth, 25);
    AboutBar.setPosition(new p5.Vector(0, -windowHeight / 2 * 8 / 10, 0));
    //testi.changePos(windowWidth * 0.5 - 300, windowHeight * 0.5 - 300);
}

function keyPressed() {
    switch (keyCode) {
        case LEFT_ARROW:
            rotateNum--;
            break;
        case RIGHT_ARROW:
            rotateNum++;
            break;
    }
}