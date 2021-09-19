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

    camera.position.x = -40;
    camera.position.y = 40;
    camera.position.z = 40;
    camera.lookAt(scene.position);

    
    var ambientLight = new THREE.AmbientLight(0x0c0c0c);
    scene.add(ambientLight);

    var planeGeometry = new THREE.PlaneGeometry(60, 40, 1, 1);
    var planeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;

    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = -2;
    plane.position.z = 0;
    scene.add(plane);
    var group = new THREE.Mesh();
    var mats = [];
    mats.push(new THREE.MeshBasicMaterial({color: 0x009e60}));
    mats.push(new THREE.MeshBasicMaterial({color: 0x009e60}));
    mats.push(new THREE.MeshBasicMaterial({color: 0x0051ba}));
    mats.push(new THREE.MeshBasicMaterial({color: 0x0051ba}));
    mats.push(new THREE.MeshBasicMaterial({color: 0xffd500}));
    mats.push(new THREE.MeshBasicMaterial({color: 0xffd500}));
    mats.push(new THREE.MeshBasicMaterial({color: 0xff5800}));
    mats.push(new THREE.MeshBasicMaterial({color: 0xff5800}));
    mats.push(new THREE.MeshBasicMaterial({color: 0xC41E3A}));
    mats.push(new THREE.MeshBasicMaterial({color: 0xC41E3A}));
    mats.push(new THREE.MeshBasicMaterial({color: 0xffffff}));
    mats.push(new THREE.MeshBasicMaterial({color: 0xffffff}));
    //var faceMaterial = new THREE.MeshFaceMaterial(mats);
    for (var x = 0; x < 3; x++) {
            for (var y = 0; y < 3; y++) {
                for (var z = 0; z < 3; z++) {
                    var cubeGeom = new THREE.BoxGeometry(2.9, 2.9, 2.9);
                    var cube = new THREE.Mesh(cubeGeom, mats);
                    cube.position.set(x * 3 - 3, y * 3, z * 3 - 3);

                    group.add(cube);
                }
            }
    }
    scene.add(group);
    
    

    document.body.appendChild(renderer.domElement);

    renderScene();

    var controls = new function() {
        
    }
    
    var step = 0;
    function animateScene() {
        group.rotation.y = step+=0.1;
        
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