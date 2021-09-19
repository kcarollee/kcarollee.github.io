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

    renderer.setClearColor(0x000000, 1.0);
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

    var groundGeom = new THREE.PlaneGeometry(100, 100, 4, 4);
    var groundMesh = new THREE.Mesh(groundGeom, new THREE.MeshBasicMaterial({
        color: 0x777777
    }));
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -20;
    scene.add(groundMesh);
    
    var sphereGeometry = new THREE.SphereGeometry(14, 20, 20);
    var cubeGeometry = new THREE.BoxGeometry(15, 15, 15);
    var planeGeometry = new THREE.PlaneGeometry(14, 14, 4, 4);
    var meshMaterial = new THREE.MeshNormalMaterial();
    var sphere = new THREE.Mesh(sphereGeometry, meshMaterial);
    var cube = new THREE.Mesh(cubeGeometry, meshMaterial);
    var plane = new THREE.Mesh(planeGeometry, meshMaterial);
    sphere.position.set(0, 3, 2);
    cube.position.copy(sphere.position);
    plane.position.copy(sphere.position);
    scene.add(cube);

    var ambientLight = new THREE.AmbientLight(0x0c0c0c);
    scene.add(ambientLight);
    

    document.body.appendChild(renderer.domElement);

    renderScene();

    var controls = new function() {
        this.opacity = meshMaterial.opacity;
        this.transparent = meshMaterial.transparent;
        this.selectedMesh = "cube";
        this.shadow = "flat";
    }
    var spGui = gui.addFolder("Mesh");
    spGui.add(controls, 'opacity', 0, 1).onChange(e => meshMaterial.opacity = e);
    spGui.add(controls, 'transparent').onChange(e => meshMaterial.transparent = e);
    spGui.add(controls, 'selectedMesh', ["cube", "sphere", "plane"]).onChange(e => {
        scene.remove(plane);
        scene.remove(cube);
        scene.remove(sphere);
        switch(e){
            case "cube":
                scene.add(cube);
                break;
            case "sphere":
                scene.add(sphere);
                break;
            case "plane":
                scene.add(plane);
                break;
        }
    });
    spGui.add(controls, 'shadow', ["flat", "smooth"]).onChange(e => {
        switch (e) {
            case "flat":
                // https://github.com/mrdoob/three.js/issues/1929
                meshMaterial.flatShading = true;
                break;
            case "smooth":
                meshMaterial.flatShading = false;
                break;
            }
            meshMaterial.needsUpdate = true;
    });

    function animateScene() {

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