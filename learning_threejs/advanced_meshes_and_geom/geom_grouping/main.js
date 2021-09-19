import {
    OrbitControls
} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";

function init() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    var stats = initStats();
    var renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    var gui = new dat.GUI();

    scene.add(camera);

    renderer.setClearColor(0xEEEEEE, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMapSoft = true;

    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();

    camera.position.set(30, 30, 30);
    camera.lookAt(scene.position);

    var group;
    var cube;
    var sphere;
    var bboxMesh;
    var arrow;


    document.body.appendChild(renderer.domElement);

    var controls = new function() {
        this.cubePosX = 0;
        this.cubePosY = 3;
        this.cubePosZ = 10;

        this.spherePosX = 10;
        this.spherePosY = 5;
        this.spherePosZ = 0;

        this.groupPosX = 10;
        this.groupPosY = 5;
        this.groupPosZ = 0;

        this.grouping = false;
        this.rotate = false;

        this.groupScale = 1;
        this.cubeScale = 1;
        this.sphereScale = 1;

        this.outputObj = function() {
            console.log(scene.children);
        }

        this.redraw = function() {
            scene.remove(group);
            sphere = createMesh(new THREE.SphereGeometry(5, 10, 10));
            cube = createMesh(new THREE.BoxGeometry(6, 6, 6));
            sphere.position.set(controls.spherePosX, controls.spherePosY, controls.spherePosZ);
            sphere.scale.set(controls.sphereScale, controls.sphereScale, controls.sphereScale);
            cube.position.set(controls.cubePosX, controls.cubePosY, controls.cubePosZ);
            cube.scale.set(controls.cubeScale, controls.cubeScale, controls.cubeScale);

            group = new THREE.Group();
            group.position.set(controls.groupPosX, controls.groupPosY, controls.groupPosZ);
            group.scale.set(controls.groupScale, controls.groupScale, controls.groupScale);
            group.add(sphere);
            group.add(cube);
            scene.add(group);

        }
    }
    gui.add(controls, 'outputObj');

    var sphereFolder = gui.addFolder("sphere");
    sphereFolder.add(controls, "spherePosX", -20, 20).onChange(function(e) {
        sphere.position.x = e;
        controls.positionBoundingBox()
        controls.redraw();
    });
    sphereFolder.add(controls, "spherePosZ", -20, 20).onChange(function(e) {
        sphere.position.z = e;
        controls.positionBoundingBox();
        controls.redraw();
    });
    sphereFolder.add(controls, "spherePosY", -20, 20).onChange(function(e) {
        sphere.position.y = e;
        controls.positionBoundingBox();
        controls.redraw();
    });
    sphereFolder.add(controls, "sphereScale", 0, 3).onChange(function(e) {
        sphere.scale.set(e, e, e);
        controls.positionBoundingBox();
        controls.redraw();
    });

    var cubeFolder = gui.addFolder("cube");
    cubeFolder.add(controls, "cubePosX", -20, 20).onChange(function(e) {
        cube.position.x = e;
        controls.positionBoundingBox();
        controls.redraw();
    });
    cubeFolder.add(controls, "cubePosZ", -20, 20).onChange(function(e) {
        cube.position.z = e;
        controls.positionBoundingBox();
        controls.redraw();
    });
    cubeFolder.add(controls, "cubePosY", -20, 20).onChange(function(e) {
        cube.position.y = e;
        controls.positionBoundingBox();
        controls.redraw();
    });
    cubeFolder.add(controls, "cubeScale", 0, 3).onChange(function(e) {
        cube.scale.set(e, e, e);
        controls.positionBoundingBox();
        controls.redraw();
    });

    var cubeFolder = gui.addFolder("group");
    cubeFolder.add(controls, "groupPosX", -20, 20).onChange(function(e) {
        group.position.x = e;
        controls.positionBoundingBox();
        controls.redraw();
    });
    cubeFolder.add(controls, "groupPosZ", -20, 20).onChange(function(e) {
        group.position.z = e;
        controls.positionBoundingBox();
        controls.redraw();
    });
    cubeFolder.add(controls, "groupPosY", -20, 20).onChange(function(e) {
        group.position.y = e;
        controls.positionBoundingBox();
        controls.redraw();
    });
    cubeFolder.add(controls, "groupScale", 0, 3).onChange(function(e) {
        group.scale.set(e, e, e);
        controls.positionBoundingBox();
        controls.redraw();
    });

    gui.add(controls, "grouping");
    gui.add(controls, "rotate");
    controls.redraw();
    renderScene();
    var step = 0;

    function animateScene() {
        step++;
        if (controls.rotate && controls.grouping){
            group.rotation.y = step * 0.01;
        }
        if (controls.rotate && !controls.grouping){
            sphere.rotation.y = step * 0.01;
            cube.rotation.y = step * 0.01;
        }
    }

    function renderScene() {
        animateScene();
        stats.update();
        requestAnimationFrame(renderScene);
        renderer.render(scene, camera);
    }

    function createMesh(geom) {
        var meshMat = new THREE.MeshNormalMaterial();
        meshMat.side = THREE.DoubleSide;

        var plane = new THREE.Mesh(geom, meshMat);
        return plane;
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