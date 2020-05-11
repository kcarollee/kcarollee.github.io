var button;

class DomElements {
    constructor() {
        this.w = windowHeight * 0.75;
        this.h = windowHeight * 0.75;
        this.currentHeaderHeight = windowHeight * 0.5;
        this.domCreated = false;
    }

    createiFrame(vidSrc) {
        this.iFrame = createElement('iframe');
        this.iFrame.attribute('src', vidSrc);
        this.iFrame.attribute('width', this.w + 'px');
        this.iFrame.attribute('height', this.h + 'px');
        this.iFrame.attribute('frameBorder', '0');
        this.iFrame.attribute('scrolling', 'no');
        this.iFrame.attribute('overflow', 'hidden');
        this.iFrame.style('overflow', 'hidden');
        //this.iFrame.attribute('style', 'position:relative');
        this.iFrame.position(windowWidth * 0.5 - this.w * 0.5, windowHeight * 0.5 - this.h * 0.5);

    }

    createButton() {
        button = createButton('close');
        button.position(windowWidth * 0.5 + this.w * 0.5 - 40, windowHeight * 0.5 + this.h * 0.5 + 13);
        button.mouseClicked(closeDom);
        button.style('background-color', 'black');
        button.style('border', 'none');
        button.style('color', 'white');
        button.style('cursor', 'pointer');
    }

    createAnchor(codeSrc) {
        this.anchor = createElement('a', 'View source code');
        this.anchor.position(windowWidth * 0.5 - this.w * 0.5, windowHeight * 0.5 + this.h * 0.5);
        this.anchor.attribute('href', codeSrc);
        this.anchor.attribute('target', '_blank');
        this.anchor.style('color', 'white');
        this.anchor.style('position', 'relative');
    }

    createHeader(text) {
        this.header = createElement('h1', text);
        this.header.position(windowWidth * 0.5 - 300, windowHeight * 0.5 - 300 - 70);
        this.header.style('color', 'white');
    }

    changePos(newX, newY) {
        this.iFrame.position(newX, newY);
    }

    resizeDimensions() {
        this.w = windowHeight * 0.75;
        this.h = windowHeight * 0.75;
        this.iFrame.attribute('width', this.w + 'px');
        this.iFrame.attribute('height', this.h + 'px');
    }
    animate() {
        var h = windowHeight * 0.5 - 300 - 70;
        if (this.currentHeaderHeight > h) {
            //console.log("HEIGHT CHANGE");
            this.currentHeaderHeight -= 1;
        }
        this.header.position(windowWidth * 0.5 - 300, this.currentHeaderHeight);
    }

    fixPosition() {
        this.iFrame.position(windowWidth * 0.5 - this.w * 0.5, windowHeight * 0.5 - this.h * 0.5);
        this.anchor.position(windowWidth * 0.5 - this.w * 0.5, windowHeight * 0.5 + this.h * 0.5 + 15);
        button.position(windowWidth * 0.5 + this.w * 0.5 - 30, windowHeight * 0.5 + this.h * 0.5 + 15);
    }

    remove() {
        this.iFrame.remove();
        //this.header.remove();
        this.anchor.remove();
        button.remove();
    }
}

function closeDom() {
    domElem.domCreated = false;
    domElem.remove();
}