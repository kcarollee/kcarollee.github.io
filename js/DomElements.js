class DomElements {
    constructor(vidSrc, codeSrc) {
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

        this.header = createElement('h1', 'TEST SKETCH');
        this.header.position(windowWidth * 0.5 - 300, windowHeight * 0.5 - 300 - 70);
        this.header.style('color', 'white');

        this.anchor = createElement('a', 'View source code');
        this.anchor.position(windowWidth * 0.5 - 300, windowHeight * 0.5 + 300);
        this.anchor.attribute('href', codeSrc);
        this.anchor.attribute('target', '_blank');
        this.anchor.style('color', 'white');

        console.log("DOM CREATED");
    }

    changePos(newX, newY) {
        this.iFrame.position(newX, newY);
    }

    remove() {
        this.iFrame.remove();
        this.header.remove();
        this.anchor.remove();

        console.log("DOM REMOVED");
    }
}