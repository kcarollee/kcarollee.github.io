import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";

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

    /*
    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();
    */
    camera.position.x = -30;
    camera.position.y = 40;
    camera.position.z = 30;
    camera.lookAt(scene.position);

    var cubeGeom = new THREE.BoxGeometry(2, 2, 2);
    console.log(cubeGeom);
    var cubeMat = new THREE.MeshNormalMaterial({morphTargets: true});

    var cubeTarget1 = new THREE.BoxGeometry(2, 20, 2);
    var cubeTarget2 = new THREE.BoxGeometry(40, 2, 2);

    cubeGeom.morphTargets[0] = {name: 't1', vertices: cubeGeom.vertices};
    cubeGeom.morphTargets[1] = {name: 't2', vertices: cubeTarget2.vertices};
    cubeGeom.morphTargets[2] = {name: 't3', vertices: cubeTarget1.vertices};
    cubeGeom.computeMorphNormals();

    var mesh = new THREE.Mesh(cubeGeom, cubeMat);
    mesh.updateMorphTargets();
    console.log(mesh.morphTargetInfluences);
    mesh.position.set(0, 3, 3);

    scene.add(mesh);

    document.body.appendChild(renderer.domElement);

    var controls = new function() {
        this.outputObj = function() {
            console.log(scene.children);
        }

        this.inf1 = 0.01;
        this.inf2 = 0.01;

        this.update = function(){
            mesh.morphTargetInfluences[1] = controls.inf1;
            mesh.morphTargetInfluences[2] = controls.inf2;
        }
    }
    gui.add(controls, 'outputObj');
    gui.add(controls, 'inf1', 0, 1);
    gui.add(controls, 'inf2', 0, 1).onChange(function(val){
        mesh.morphTargetInfluences[2] = val;
    });


    renderScene();
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