import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";
import {SceneUtils} from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/utils/SceneUtils.js";


class Walker {
    constructor(trailNum, movementRadius, scene) {
        this.trailNum = trailNum;
        
        this.lineMat = new THREE.LineBasicMaterial({
            color: 0xffffff * Math.random(),
            linewidth: 3
        });

        this.colorMat = new THREE.MeshStandardMaterial({
            color: 0xffffff * Math.random(),
            roughness: 0.0
        });
        
        this.movementRadius = movementRadius;
        this.sphereArr = [];

        this.startRand = Math.random() * 100.0;
       
        this.pointArr = [];

        var randDeg1, randDeg2;
        for (let i = 0; i < this.trailNum; i++) {
            var sphereGeo = new THREE.SphereGeometry(1.0, 16, 16);

            //var sphere = new SceneUtils.createMultiMaterialObject(sphereGeo, [this.colorMat]);
            var sphere = new THREE.Mesh(sphereGeo, this.colorMat);
            randDeg1 = noise.simplex2(Walker.noiseStep * i, 0) * Math.PI * 2;
            randDeg2 = noise.simplex2(this.startRand + Walker.noiseStep * i, 0) * Math.PI * 2;
            var pos = this.getPos(randDeg1, randDeg2);
            
            sphere.position.set(pos[0], pos[1], pos[2]);
            sphere.visible = false;
            scene.add(sphere);
            this.sphereArr.push(sphere);

            var point = new THREE.Vector3(pos[0], pos[1], pos[2]);
            this.pointArr.push(point);
        }

        this.lineGeo = new THREE.BufferGeometry().setFromPoints(this.pointArr);
        this.line =  new THREE.Line(this.lineGeo, this.lineMat);
        scene.add(this.line);
        this.positionVec3Arr = [];
    }

    hideLine(){this.line.visible = false;}
    showLine(){this.line.visible = true;}
    hideSpheres(){this.sphereArr.forEach(s => s.visible = false)}
    showSpheres(){this.sphereArr.forEach(s => s.visible = true)}
    changeLineWidth(newWidth) {this.lineMat.lineWidth = newWidth;}
    getPos(deg1, deg2){
        var x = this.movementRadius * Math.cos(deg1) * Math.cos(deg2);
        var y = this.movementRadius * Math.sin(deg1) * Math.cos(deg2);
        var z = this.movementRadius * Math.sin(deg2);
        
        return [x, y, z];
    }

    update(step) {
        var vel =  step * Walker.vel;
        var randDeg1, randDeg2;
        var i = step % Walker.modBy;

        for (; i < this.sphereArr.length; i += Walker.modBy) {
            randDeg1 = noise.simplex2(Walker.noiseStep * i + vel, this.startRand) * Math.PI * 2;
            randDeg2 = noise.simplex2(this.startRand + Walker.noiseStep * i + vel, this.startRand) * Math.PI * 2;
            var pos = this.getPos(randDeg1, randDeg2);
            if (Walker.showSpheres) this.sphereArr[i].position.set(pos[0], pos[1], pos[2]);
            if (Walker.showLine) this.pointArr[i].set(pos[0], pos[1], pos[2]);
            
        }
    
        if (Walker.showLine) this.lineGeo.setFromPoints(this.pointArr);
        
        this.sphereArr.forEach(s => {
            s.rotation.x = step * 0.01;
            s.rotation.y = step * 0.01;
            s.rotation.z = step * 0.01;
        });
        this.line.rotation.x = step * 0.01;
        this.line.rotation.y = step * 0.01;
        this.line.rotation.z = step * 0.01;
        
    }
}
Walker.depthMat = new THREE.MeshDepthMaterial();
Walker.noiseStep = 0.01;
Walker.modBy = 1;
Walker.showLine = true;
Walker.showSpheres = false;
Walker.vel = 0.001;

function init() {
    noise.seed(Math.random());
    
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    //var stats = initStats();
    var renderer = new THREE.WebGLRenderer({
        antialias: false
    });
    
    var gui = new dat.GUI();

    var walkerArr = [];

    var walkerNum = 3;
    var sphereMaxRadius = 50;
    var gapSize = sphereMaxRadius / walkerNum;
    var walkerNumPerRadius = 1;
    for (let i = 0; i < walkerNum; i++){
        for (let j = 0; j < walkerNumPerRadius; j++){
            var w = new Walker(200,  (i + 1) * gapSize * 0.5, scene);
            walkerArr.push(w);
        }
    }

    scene.add(camera);

    renderer.setClearColor(0x000000, 1.0);
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMapSoft = true;
    
    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();

    camera.position.set(0, 0, 100);

    camera.lookAt(scene.position);

    var ambLight = new THREE.PointLight({
        color: 0xffffff,
        instensity: 0.5
    });
    scene.add(ambLight);
    
    var spotLightArr = [];
    var spotLightDist = 10;
    var spotLightPosArr = [
        [0, 0, 0],
        [spotLightDist, 0, 0],
        [-spotLightDist, 0, 0],
        [0, 0, spotLightDist],
        [0, 0, -spotLightDist]
    ];
    for (let i = 0;  i < 5; i++){
        var spotLight = new THREE.SpotLight({
            color: 0xffffff,
            intensity: 30.0
        })
        spotLight.position.set(spotLightPosArr[i]);
        scene.add(spotLight);
    }
    
    

    var composer = new THREE.EffectComposer(renderer);
    var renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // bloom shader pass
    var bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85 );
    bloomPass.threshold = 0;
	bloomPass.strength = 2.0;
	bloomPass.radius = 1;
    composer.addPass(bloomPass);

    // anti-alias shader pass
    var smaaPass = new THREE.SMAAPass(window.innderWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
    composer.addPass(smaaPass);
    document.body.appendChild(renderer.domElement);

    renderScene();

    var controls = new function() {
        this.noiseStep = 0.01;
        this.indexMod = 1;
        this.lineWidth = 1;
        this.showSpheres = false;
        this.showLines = true;
        this.changeLineWidth = 1;
        this.velocity = 0.001;
        
    }
        
    gui.add(controls, 'noiseStep', 0.001, 0.1).onChange(function(e){
        Walker.noiseStep = e;
    });
    gui.add(controls, 'indexMod', 1, 10).onChange(function(e){
        Walker.modBy = Math.floor(e);
    });
    gui.add(controls, 'showSpheres').onChange(e => {
        Walker.showSpheres = e;
        Walker.showSpheres ? walkerArr.forEach(w => w.showSpheres()) : walkerArr.forEach(w => w.hideSpheres());
    });
    gui.add(controls, 'showLines').onChange(e => {
        Walker.showLine = e;
        Walker.showLine ? walkerArr.forEach(w => w.showLine()) : walkerArr.forEach(w => w.hideLine());
    });
    gui.add(controls, 'changeLineWidth', 0, 5).onChange(e => {
        walkerArr.forEach(w => w.changeLineWidth(e));
    });
    gui.add(controls, 'velocity', 0.001, 0.01).onChange(e => {
        Walker.vel = e;
    });
    

    var step = 0;
    function animateScene() {
        step++;
        spotLight.position.set(0, 0, 10);
        walkerArr.forEach(w => w.update(step));
    }

    
    
    function renderScene() {
        
        //var delta = clock.getDelta();
        animateScene();
        //stats.update();
        requestAnimationFrame(renderScene);
        //renderer.render(scene, camera);
        composer.render();
        
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
        composer.setSize(window.innerWidth, window.innerHeight);
        //smaaPass.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize, false);
}



window.onload = init;