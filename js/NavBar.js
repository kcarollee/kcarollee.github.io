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