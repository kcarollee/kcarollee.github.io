import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";

class SubtractedBoxMesh{
    constructor(xpos, ypos, zpos, width, height, depth, boxNum, scene){
        this.xpos = xpos; this.ypos = ypos; this.zpos = zpos;
        this.width = width; this.height = height; this.depth = depth;
        
        this.pillarGeom = new THREE.BoxGeometry(this.width, this.height, this.depth);
        this.pillar = new THREE.Mesh(this.pillarGeom);
        this.pillar.position.set(this.xpos, this.ypos, this.zpos);

        this.pillarBSP = new ThreeBSP(this.pillar);
        this.resultBSP = this.pillarBSP;
        this.result;

        this.boxArr = [];
        this.boxNum = boxNum;

        for (let i = 0; i < this.boxNum; i++){
            var bg = new THREE.BoxGeometry(this.width * 0.5, this.height * 0.5, this.depth * 0.5);
            var b = new THREE.Mesh(bg, new THREE.MeshLambertMaterial({color: 0xFF0000}));
            var xr = Math.random() * this.width * 2 - this.width;
            var yr = Math.random() * this.height * 2 - this.height;
            var zr = Math.random() * this.depth * 2 - this.depth;
            xr *= 0.5;
            yr *= 0.5;
            zr *= 0.5;
            xr += this.xpos;
            yr += this.ypos;
            zr += this.zpos;
            b.position.set(xr, yr, zr);
            scene.add(b);
            this.boxArr.push(b);
            var bBsp = new ThreeBSP(b);
            this.resultBSP = this.resultBSP.subtract(bBsp);
        }

        this.result = this.resultBSP.toMesh(SubtractedBoxMesh.mat);
        this.result.geometry.computeFaceNormals();
        this.result.geometry.computeVertexNormals();
        scene.add(this.result);
    }

    toggleBoxVisibility(){
        this.boxArr.forEach(b => b.visible = !b.visible);
    }
}



SubtractedBoxMesh.matArr = [
    new THREE.MeshNormalMaterial({
        wireframe: false,
        flatShading: false,
        //roughness: 0.0
    }),
    new THREE.MeshPhongMaterial({
        wireframe: false,
        flatShading: false,
        //roughness: 0.0
    }),
    new THREE.MeshStandardMaterial({
        wireframe: false,
        flatShading: false,
        roughness: 0.0
    })
];

SubtractedBoxMesh.mat = SubtractedBoxMesh.matArr[0];

function init() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
    var stats = initStats();
    var renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    var gui = new dat.GUI();

    scene.add(camera);

    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMapSoft = true;

    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();

    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 100;
    camera.lookAt(scene.position);

    var pillarSideNum = 6;
    var pillarArr = [];
    var gap = 600;
    for(let i = 0; i < pillarSideNum; i++){
        for (let j = 0; j < pillarSideNum; j++){
            var p = new SubtractedBoxMesh(-pillarSideNum * gap * 0.5 + gap * i, 0, 
                -pillarSideNum * gap * 0.5 + gap * j, 
                50, 500, 50, 
                20, scene);
            pillarArr.push(p);
        }
    }
    

    var pointLight = new THREE.PointLight();
    pointLight.position.set(0, 0, 500);
    scene.add(pointLight);

    var pointLight2 = new THREE.PointLight();
    pointLight2.position.set(0, 0, -500);
    scene.add(pointLight2);

    var pointLight3 = new THREE.PointLight({intensity: 0.5});
    pointLight3.position.set(500, 0, 0);
    scene.add(pointLight3);

    var pointLight4 = new THREE.PointLight({intensity: 0.5});
    pointLight4.position.set(-500, 0, 0);
    scene.add(pointLight4);

    var pointLight5 = new THREE.PointLight();
    pointLight5.position.set(0, 500, 0);
    scene.add(pointLight5);

    document.body.appendChild(renderer.domElement);

    renderScene();

    var controls = new function() {
        this.showBoxes = true;
        this.material = 'normal';
    }
    gui.add(controls, 'showBoxes').onChange(e => {
        pillarArr.forEach(p => p.toggleBoxVisibility());
    });
    gui.add(controls, 'material', ['normal', 'phong', 'standard', 'wireframe']).onChange(e => {
        switch(e){
            case 'normal':
                SubtractedBoxMesh.mat = SubtractedBoxMesh.matArr[0];
                pillarArr.forEach(p => {
                    p.result.material = SubtractedBoxMesh.mat;
                });
                break;
            case 'phong':
                SubtractedBoxMesh.mat = SubtractedBoxMesh.matArr[1];
                pillarArr.forEach(p => {
                    p.result.material = SubtractedBoxMesh.mat;
                });
                break;
            case 'standard':
                SubtractedBoxMesh.mat = SubtractedBoxMesh.matArr[2];
                SubtractedBoxMesh.mat.wireframe = false;
                pillarArr.forEach(p => {
                    p.result.material = SubtractedBoxMesh.mat;
                });
                break;
            case 'wireframe':
                SubtractedBoxMesh.mat = SubtractedBoxMesh.matArr[2];
                SubtractedBoxMesh.mat.wireframe = true;
                pillarArr.forEach(p => {
                    p.result.material = SubtractedBoxMesh.mat;
                });
                break;
        }
    });

    var step = 0;
    function animateScene() {
        step++;
        
    }

    function renderScene() {
        animateScene();
        stats.update();
        requestAnimationFrame(renderScene);
        renderer.render(scene, camera);
    }

    function initStats() {
        var stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.body.appendChild(stats.domElement);
        return stats;
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize, false);
}



window.onload = init;