class QuadMesh {
    constructor(width, height, centerPos) {
        this.width = width;
        this.height = height;
        this.centerPos = centerPos;
    }
}



class ThumbTile {
    imgTexture;
    constructor(width, height, pos) {
        this.width = width;
        this.height = height;
        this.centerPos = pos;
    }

    setTexture(newTex) {
        this.imgTexture = newTex;
    }

    display() {

    }
}

class NavBar {
    constructor(width, height, pos) {
        this.width = width;
        this.height = height;
        this.pos = pos;
        this.color;
        this.text;
    }

    setText(text) { this.text = text; }
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }
    setPosition(newPos) { this.pos = newPos; }
    display() {
        noStroke();
        rectMode(CENTER);
        rect(this.pos.x, this.pos.y, this.width, this.height);

        text(this.text, 0, this.pos.y);
    }
}

var thumbTexArr = [];
var SketchBar;
var AboutBar;
let img;
let generalFont;

function preload() {
    generalFont = loadFont('fonts/Monoid-Regular.ttf');
}

function setup() {
    var canv = createCanvas(windowWidth, windowHeight, WEBGL);
    canv.position(0, 0);
    img = loadImage('imgs/thumb1.png');
    textFont(generalFont);
    textSize(20);
    SketchBar = new NavBar(width, 25, new p5.Vector(0, -height / 2 * 7 / 8, 0));
    SketchBar.setText("Sketches");
}

function draw() {
    background(0);
    // navigation bars
    SketchBar.display();
    // thumbnails
    for (let i = 0; i < 8; i++) {
        push();
        rotateY(frameCount * 0.002 + QUARTER_PI * i);
        translate(0, 0, -windowHeight / 2);
        //texture(img);
        plane(windowHeight / 4, windowHeight / 4);
        pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    SketchBar.setSize(windowWidth, 25);
    SketchBar.setPosition(new p5.Vector(0, -windowHeight / 2 * 7 / 8, 0));
}