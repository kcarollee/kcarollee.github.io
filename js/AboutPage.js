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

        this.div = createDiv(' Currently majoring in Computer Science at University of Seoul(서울시립대).<br><br>' +
            ' A graphics hopeful creating sketches using openFrameworks, glsl, Processing, and p5.js.<br><br>' +
            ' Currently on my learning backlog are: Touchdesigner, Unity, Three.js, openFrameworks with emscripten.');
        //sthis.div.style('width', '50%');
        this.div.style('font-family', 'customTTF');
        this.div.style('font-size', 14 + 'px');
        this.div.position(10, windowHeight * 4 / 20);
        this.div.style('font-family', 'customTTF');
        this.div.style('font-size', 14 + 'px');

        this.githubLink = createElement('a', 'Github');
        this.githubLink.attribute('href', 'https://github.com/kcarollee');
        this.githubLink.attribute('target', '_blank');
        this.githubLink.position(10, windowHeight * 19 / 20);
        this.githubLink.style('color', 'white');
        this.githubLink.style('font-family', 'customTTF');
        this.githubLink.style('font-size', 14 + 'px');

        this.instaLink = createElement('a', 'Instagram');
        this.instaLink.attribute('href', 'https://www.instagram.com/kleemotfd/');
        this.instaLink.attribute('target', '_blank');
        this.instaLink.position(80, windowHeight * 19 / 20);
        this.instaLink.style('color', 'white');
        this.instaLink.style('font-family', 'customTTF');
        this.instaLink.style('font-size', 14 + 'px');

        this.imgAnchorArr = [];
        this.m = min(windowWidth, windowHeight);
        this.imgSize = this.m * 0.40;
        this.imgNum = instaLinks.length;
        /*
        for (let i = 0; i < this.imgNum; i++) {
            let img = loadImage('imgs/test' + (i % 2) + '.jpg');
            //img.resize(this.imgSize * 0.40, this.imgSize * 0.40);
            this.imgAnchorArr.push(img);
        }


        this.anchor = createElement('a', '');
        this.anchor.attribute('href', 'https://google.com');
        this.anchor.attribute('target', '_blank');
        */
        this.opacity = 0.0
        for (let i = 0; i < this.imgNum; i++) {
            var anchor = createElement('a', '');
            anchor.attribute('href', instaLinks[i]);
            anchor.attribute('target', '_blank');
            anchor.hide();
            var imgElem = createElement('img', 'image');
            imgElem.parent(anchor);
            imgElem.attribute('src', 'imgs/subThumbs/thumb' + i + '.jpg');
            imgElem.attribute('width', this.imgSize + 'px');
            imgElem.attribute('height', this.imgSize + 'px');
            imgElem.style('opacity', this.opacity);
            //imgElem.style('background-repeat', 'repeat-x');
            imgElem.position(i * this.imgSize, windowHeight * 7.5 / 20);
            this.imgAnchorArr.push([anchor, imgElem]);
        }
        this.hideDom();
        imageMode(CENTER);
        this.fullyLoaded = false;

    }

    fixPosition() {
        this.header.position(10, windowHeight * 2.5 / 20);
        this.div.position(10, windowHeight * 4 / 20);
        this.githubLink.position(10, windowHeight * 19 / 20);
        this.instaLink.position(80, windowHeight * 19 / 20);
    }

    fixImgSize() {
        console.log("FIXED");
        this.m = min(windowWidth, windowHeight);
        this.imgSize = this.m * 0.40;
        this.imgNum = instaLinks.length;

        for (let i = 0; i < this.imgNum; i++) {
            this.imgAnchorArr[i][1].attribute('width', this.imgSize + 'px');
            this.imgAnchorArr[i][1].attribute('height', this.imgSize + 'px');
            this.imgAnchorArr[i][1].position(i * this.imgSize, windowHeight * 7.5 / 20);
        }
    }
    moveImages() {
        this.imgAnchorArr.forEach(function(arr) {
            arr[1].x += 1;
            arr[1].position(arr[1].x % windowWidth, 0);
        });
    }


    showDom() {
        this.header.show();
        this.div.show();
        this.githubLink.show();
        this.instaLink.show();
        this.imgAnchorArr.forEach(function(a) {
            a[0].show();
            a[1].show();
        });
    }

    hideDom() {
        console.log("HIDE");
        this.header.hide();
        this.div.hide();
        this.githubLink.hide();
        this.instaLink.hide();
        this.imgAnchorArr.forEach(function(a) {
            a[0].hide();
            a[1].hide();
        });
        this.opacity = 0.0;
        console.log("SET OPACITY" + this.opacity);
        this.fullyLoaded = false;
        /*
        for (let i = 0; i < this.imgNum; i++) {
            console.log(this.opacity);
            this.imgAnchorArr[i][1].style('opacity', this.opacity);
        }
        */
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
        //this.moveImages();
        rectMode(CORNER);
        fill('rgba(190, 190, 190, 0.3)');
        rect(this.pos.x, this.pos.y, this.width, this.height);
        //text(' Dukwon Karl Lee', this.pos.x, this.pos.y + 10);
        //this.header.position(random(50, 100), random(50, 100));



        if (this.opacity < 1.0 && !this.fullyLoaded) {
            console.log("FINAL OPACITY" + this.opacity);
            this.opacity += 0.05;
            for (let i = 0; i < this.imgNum; i++) {
                this.imgAnchorArr[i][1].style('opacity', this.opacity);
            }
        }
    }
}