var vectorArr = [];
var pos;
var left = new p5.Vector(-1, 0);
var right = new p5.Vector(1, 0);
var up = new p5.Vector(0, 1);
var down = new p5.Vector(0, -1);
var vel = 5;
var walk;
var walkerArr = [];
var walkerArrNum;
var loopNum = 0;
class Walker {
    constructor(size, initPos) {
        this.size = size;
        this.initPos = new p5.Vector(initPos.x, initPos.y);
        this.positionArr = [];
        this.positionArr.push(this.initPos);
        this.color = color(random(150, 255), random(150, 255), random(150, 255));
        for (let i = 0; i < this.size - 1; i++) {
            this.addRandomPos();
        }

    }
    addRandomPos() {
        var rand = floor(random(0, 4));
        switch (rand) {
            case 0:
                this.initPos.x += vel * left.x;
                this.initPos.y += vel * left.y;
                break;
            case 1:
                this.initPos.x += vel * right.x;
                this.initPos.y += vel * right.y;
                break;
            case 2:
                this.initPos.x += vel * up.x;
                this.initPos.y += vel * up.y;
                break;
            case 3:
                this.initPos.x += vel * down.x;
                this.initPos.y += vel * down.y;
                break;
        }
        this.initPos.x %= width;
        this.initPos.y %= height;
        var newPos = new p5.Vector(this.initPos.x, this.initPos.y);
        this.positionArr.push(newPos);
    }
    update() {
        this.addRandomPos();
        this.positionArr.shift();
    }
    display() {
        for (let i = 0; i < this.positionArr.length; i++) {
            noStroke();
            fill(this.color);
            ellipse(this.positionArr[i].x, this.positionArr[i].y, 1, 1);
        }
    }
}

function setup() {
    createCanvas(windowWidth, 150);
    walkerArrNum = 100;
    for (let i = 0; i < walkerArrNum; i++) {
        var init = new p5.Vector(floor(random(0, width)), floor(random(0, height)));
        var walker = new Walker(25, init);
        walkerArr.push(walker);
    }
}

function draw() {
    background(0);
    for (let i = 0; i < walkerArr.length; i++) {
        walkerArr[i].update();
        walkerArr[i].display();
    }

}

function windowResized() {
    width = windowWidth;
    walkerArr.length = 0;
    for (let i = 0; i < walkerArrNum; i++) {
        var init = new p5.Vector(floor(random(0, width)), floor(random(0, height)));
        var walker = new Walker(25, init);
        walkerArr.push(walker);
    }
}