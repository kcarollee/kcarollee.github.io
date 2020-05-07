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
var SketchBar;
var vidTexTest;
var AboutBar;
let img;
let generalFont;


var fixedMouse = (mx, my) => [mx - width / 2.0, my - height / 2.0];

function preload() {
    generalFont = loadFont('fonts/Monoid-Regular.ttf');

}

function setup() {
    var canv = createCanvas(windowWidth, windowHeight, WEBGL);
    canv.position(0, 0);
    textFont(generalFont);
    textSize(15);
    SketchBar = new NavBar(width, 25, new p5.Vector(0, -height / 2 * 9 / 10, 0));
    SketchBar.setText("Sketches");
    img = loadImage("imgs/thumb1.png");
    AboutBar = new NavBar(width, 25, new p5.Vector(0, -height / 2 * 8 / 10, 0));
    AboutBar.setText("About");
}

function draw() {
    background(0);
    image(img, 0, 0);
    // thumbnails
    //fill(255);
    for (let i = 0; i < 8; i++) {
        push();
        rotateY(frameCount * 0.002 + QUARTER_PI * i);
        //translate y:  floor(20 * i * PI + frameCount * 10) % windowHeight - windowHeight * 0.5
        translate(0, 0, -windowHeight / 2);
        texture(img);
        plane(windowHeight / 4, windowHeight / 4);
        pop();
    }

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
}