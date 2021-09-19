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

    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();

    camera.position.x = 30;
    camera.position.y = 30;
    camera.position.z = 30;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    var cubeGeo = new THREE.BoxGeometry(20, 20, 20);
     var meshMaterial1 = createShaderMaterial("vertex-shader",
    "fragment-shader-1");
  var meshMaterial2 = createShaderMaterial("vertex-shader",
    "fragment-shader-2");
  var meshMaterial3 = createShaderMaterial("vertex-shader",
    "fragment-shader-3");
  var meshMaterial4 = createShaderMaterial("vertex-shader",
    "fragment-shader-4");
  var meshMaterial5 = createShaderMaterial("vertex-shader",
    "fragment-shader-5");
  var meshMaterial6 = createShaderMaterial("vertex-shader",
    "fragment-shader-6");
    var cubeMatArr = [meshMaterial1, meshMaterial2, meshMaterial3, meshMaterial4, meshMaterial5, meshMaterial6];
    var cube = new THREE.Mesh(cubeGeo, cubeMatArr);
    
    scene.add(cube);
    document.body.appendChild(renderer.domElement);

    renderScene();

    var controls = new function() {
        this.outputObj = function() {
            console.log(scene.children);
        }
    }
    gui.add(controls, 'outputObj');

    var step = 0;
    function animateScene() {
        step++;
        
        cube.material.forEach(e => e.uniforms.time.value = step * 0.01);
        
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

    function createShaderMaterial(vert, frag){
        var vertShader = document.getElementById(vert).innerHTML;
        var fragShader = document.getElementById(frag).innerHTML;
        var attributes = {};
        var uniforms = {
            time: {type: 'f', value: 0.2},
            scale: {type: 'f', value: 0.2},
            alpha: {type: 'f', value: 0.6},
            resolution: {type: "v2", value: new THREE.Vector2()}
        }
        uniforms.resolution.value.x = window.innerWidth;
        uniforms.resolution.value.y = window.innerHeight;

        var meshMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            //attributes: attributes,
            vertexShader: vertShader,
            fragmentShader: fragShader,
            transparent: true
        });
        return meshMaterial;
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize, false);
}



window.onload = init;