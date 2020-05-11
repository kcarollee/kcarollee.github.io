// rectmode CORNER
class AboutPage {
    constructor(width, height, pos) {
        this.width = width;
        this.height = height;
        this.pos = pos;

        this.header = createElement('h1', 'TEST');
        this.header.position(0, windowHeight * 2 / 20);


        this.div = createDiv(' Currently majoring in Computer Science at University of Seoul (서울시립대)<br>' +
            ' A graphics hopeful creating sketches using openFrameworks, Processing, and p5.js.');
        this.div.position(0, windowHeight * 4 / 20);


        this.githubLink = createElement('a', 'Github');
        this.githubLink.attribute('href', 'https://github.com/kcarollee');
        this.githubLink.attribute('target', '_blank');
        this.githubLink.position(0, windowHeight * 6 / 20);

        this.instaLink = createElement('a', 'Instagram');
        this.instaLink.attribute('href', 'https://www.instagram.com/kleemotfd/');
        this.instaLink.attribute('target', '_blank');
        this.instaLink.position(0, windowHeight * 7 / 20);

        this.hideDom();
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
        fill(255);
        rect(this.pos.x, this.pos.y, this.width, this.height);
        this.header.style('opacity', 0.2);
        //this.header.position(random(50, 100), random(50, 100));
    }
}