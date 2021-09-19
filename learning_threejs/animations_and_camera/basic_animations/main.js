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

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    
    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();
    
    camera.position.x = -30;
    camera.position.y = 40;
    camera.position.z = 30;
    camera.lookAt(scene.position);

    var planeGeom = new THREE.PlaneGeometry(60, 20, 120, 120);
    var planeMat = new THREE.MeshPhongMaterial({
        color: 0xffffff
    })
    var plane = new THREE.Mesh(planeGeom, planeMat);
    plane.receiveShadow = true;

    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(15, 0, 0);

    scene.add(plane);

    var cubeGeom = new THREE.BoxGeometry(4, 4, 4);
    var cubeMat = new THREE.MeshStandardMaterial({color: 0xff0000});
    var cube = new THREE.Mesh(cubeGeom, cubeMat);
    cube.castShadow = true;

    cube.position.set(-10, 4, 0);

    scene.add(cube);

    var ambientLight = new THREE.AmbientLight(0x353535);
    scene.add(ambientLight);

    document.body.appendChild(renderer.domElement);

    var controls = new function() {
        this.rotationSpeed = 0.02;
        this.bouncingSpeed = 0.03;
        this.scalingSpeed = 0.03;
    }
    gui.add(controls, 'rotationSpeed', 0, 0.5);
    gui.add(controls, 'bouncingSpeed', 0, 0.5);
    gui.add(controls, 'scalingSpeed', 0, 0.5);


    renderScene();
    var step = 0;
    function animateScene() {
        step++;

        cube.rotation.x += controls.rotationSpeed;
        cube.rotation.y += controls.rotationSpeed;
        cube.rotation.z += controls.rotationSpeed;

        var intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0){
            intersects[0].object.material.transparent = true;
            intersects[0].object.material.opacity = 0.1; 
        }
        //console.log(intersects);
    }

    function renderScene() {
        raycaster.setFromCamera(mouse, camera);
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

    function onMouseMove(event){
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    window.addEventListener('resize', onResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
}



window.onload = init;