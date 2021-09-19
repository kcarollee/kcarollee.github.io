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

    camera.position.x = -20;
    camera.position.y = 30;
    camera.position.z = 40;
    camera.lookAt(new THREE.Vector3(10, 0, 0));

    var sphere = createMesh(new THREE.SphereGeometry(4, 10, 10));
    scene.add(sphere);

    document.body.appendChild(renderer.domElement);

    renderScene();

    var controls = new function() {
        this.radius = sphere.geometry.parameters.radius;
        this.widthSegments = sphere.geometry.parameters.widthSegments;
        this.heightSegments = sphere.geometry.parameters.heightSegments;
        this.phiStart = 0;
        this.phiLength = Math.PI * 2;
        this.thetaStart = 0;
        this.thetaLength = Math.PI;
        this.redraw = function(){
            scene.remove(sphere);
            sphere = createMesh(new THREE.SphereGeometry(controls.radius, controls.widthSegments, controls.heightSegments, 
                controls.phiStart, controls.phiLength, 
                controls.thetaStart, controls.thetaLength));
            scene.add(sphere);
        }
    }

    gui.add(controls, 'radius', 0, 40).onChange(controls.redraw);
    gui.add(controls, 'widthSegments', 0, 20).onChange(controls.redraw);
    gui.add(controls, 'heightSegments', 0, 20).onChange(controls.redraw);
    gui.add(controls, 'phiStart', 0, 2 * Math.PI).onChange(controls.redraw);
    gui.add(controls, 'phiLength', 0, 2 * Math.PI).onChange(controls.redraw);
    gui.add(controls, 'thetaStart', 0, 2 * Math.PI).onChange(controls.redraw);
    gui.add(controls, 'thetaLength', 0, 2 * Math.PI).onChange(controls.redraw);
    

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

    function createMesh(geom){
        var meshMat = new THREE.MeshNormalMaterial();
        meshMat.side = THREE.DoubleSide;
        
        var mesh = new THREE.Mesh(geom, meshMat);
        return mesh;
    }

    window.addEventListener('resize', onResize, false);
}



window.onload = init;