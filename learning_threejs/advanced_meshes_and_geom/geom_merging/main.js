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

    camera.position.set(0, 40, 50);
    camera.lookAt(scene.position);

    var cubeMaterial = new THREE.MeshNormalMaterial({
        transparent: true,
        opacity: 0.5
    });
    

    document.body.appendChild(renderer.domElement);

    var controls = new function() {
        this.cameraNear = camera.near;
        this.cameraFar = camera.far;
        this.rotationSpeed = 0.01;
        this.combined = false;

        this.objNum = 500;

        this.redraw = function(){
            var toRemove = [];
            scene.traverse(function(e){
                if (e instanceof THREE.Mesh) toRemove.push(e);
            });
            toRemove.forEach(function(e){
                scene.remove(e);
            });
            
            if (controls.combined){
                var geom = new THREE.Geometry();
                for (var i = 0; i < controls.objNum; i++){
                    var cubeMesh = addCube();
                    cubeMesh.updateMatrix();
                    geom.merge(cubeMesh.geometry, cubeMesh.matrix);
                }
                scene.add(new THREE.Mesh(geom, cubeMaterial));
            }
            else{
                for (var i = 0; i < controls.objNum; i++){
                    scene.add(controls.addCube());
                }
            }
        }
        this.addCube = addCube;
    }
    gui.add(controls, 'objNum', 0, 20000);
    gui.add(controls, 'combined').onChange(controls.redraw);
    gui.add(controls, 'redraw');
    
    controls.redraw();

    
    renderScene();
    var step = 0;

    function animateScene() {
        step++;
        camera.position.x = Math.sin(step * 0.001) * 50;
        camera.position.z = Math.cos(step * 0.001) * 50;
        camera.lookAt(scene.position);
        
    }

    function renderScene() {
        animateScene();
        stats.update();
        requestAnimationFrame(renderScene);
        renderer.render(scene, camera);
    }

    function addCube(){
        var cubeSize = 1.0;
        var cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

        var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.castShadow = true;

        // position the cube randomly in the scene
        cube.position.x = -60 + Math.round((Math.random() * 100));
        cube.position.y = Math.round((Math.random() * 10));
        cube.position.z = -150 + Math.round((Math.random() * 175));

        // add the cube to the scene
        return cube;
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