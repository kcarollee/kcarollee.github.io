// rectmode CORNER
class AboutPage {
    constructor(width, height, pos) {
        this.width = width;
        this.height = height;
        this.pos = pos;

        this.header = createElement('h1', 'Dukwon Karl Lee');
        this.header.position(10, windowHeight * 2.5 / 20);
        this.header.style('font-family', 'customTTF');
        this.header.style('font-size', 15 + 'px');

        this.div = createDiv(' Currently majoring in Computer Science at University of Seoul(서울시립대).<br>' +
            ' A graphics hopeful creating sketches using openFrameworks, glsl, Processing, and p5.js.');
        this.div.style('font-family', 'customTTF');
        this.div.style('font-size', 14 + 'px');
        this.div.position(10, windowHeight * 4 / 20);
        this.div.style('font-family', 'customTTF');
        this.div.style('font-size', 14 + 'px');

        this.githubLink = createElement('a', 'Github');
        this.githubLink.attribute('href', 'https://github.com/kcarollee');
        this.githubLink.attribute('target', '_blank');
        this.githubLink.position(10, windowHeight + this.pos.y + this.height - 10);
        this.githubLink.style('color', 'white');
        this.githubLink.style('font-family', 'customTTF');
        this.githubLink.style('font-size', 14 + 'px');

        this.instaLink = createElement('a', 'Instagram');
        this.instaLink.attribute('href', 'https://www.instagram.com/kleemotfd/');
        this.instaLink.attribute('target', '_blank');
        this.instaLink.position(80, windowHeight + this.pos.y + this.height - 10);
        this.instaLink.style('color', 'white');
        this.instaLink.style('font-family', 'customTTF');
        this.instaLink.style('font-size', 14 + 'px');

        this.hideDom();
    }

    fixPosition() {
        this.header.position(10, windowHeight * 2.5 / 20);
        this.div.position(10, windowHeight * 4 / 20);
        this.githubLink.position(10, windowHeight * 6 / 20);
        this.instaLink.position(10, windowHeight * 7 / 20);
    }

    showDom() {
        console.log("SHOW");
        this.header.show();
        this.div.show();
        this.githubLink.show();
        this.instaLink.show();
    }

    hideDom() {
        console.log("HIDE");
        this.header.hide();
        this.div.hide();
        this.githubLink.hide();
        this.instaLink.hide();
    }
    setText(text) {
        this.text = text;
    }
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }
    setPosition(pos) {
        this.pos = pos;
    }
    display() {
        rectMode(CORNER);
        fill('rgba(180, 180, 180, 0.5)');
        rect(this.pos.x, this.pos.y, this.width, this.height);
        //text(' Dukwon Karl Lee', this.pos.x, this.pos.y + 10);
        //this.header.position(random(50, 100), random(50, 100));
    }
}