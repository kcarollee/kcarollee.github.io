class Thumbnail {
    constructor() {
        this.atFront = false;

    }

    setTexture(newTex) { this.imgTexture = newTex; }
    setTitle(text) { this.text = text; }
    mouseInBounds() {
        if (this.atFront) {
            let mouse = fixedMouse(mouseX, mouseY);
            let w = windowWidth * 0.5;
            let h = windowHeight * 0.5;
            if (-w * 0.5 < mouse[0] && mouse[0] < w * 0.5 &&
                -h * 0.5 < mouse[1] && mouse[1] < h * 0.5) {
                //this.imgTexture = loadImage('imgs/thumb2.png');
                //console.log("IN BOUNDS");
                return true;
            }
            return false;
        }
        return false;
    }


    display() {
        if (this.atFront) {
            fill(255);
            textAlign(CENTER, CENTER);
            text(this.text, 0, floor(windowHeight * 0.3));
        }
        texture(this.imgTexture);
        plane(windowHeight * 0.5, windowHeight * 0.5);
    }
}