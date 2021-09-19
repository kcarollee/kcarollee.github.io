import * as THREE from "https://cdn.jsdelivr.net/npm/three@v0.124.0/build/three.module.js";
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
    
    var groundGeom = new THREE.PlaneGeometry(100, 100, 4, 4);
    var groundMesh = new THREE.Mesh(groundGeom, new THREE.MeshBasicMaterial({color: 0x555555}));
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -20;
    scene.add(groundMesh);

    var sphereGeometry = new THREE.SphereGeometry(14, 20, 20);
    var cubeGeometry = new THREE.BoxGeometry(15, 15, 15);
    var planeGeometry = new THREE.PlaneGeometry(14, 14, 4, 4);

    var meshMaterial = new THREE.MeshLambertMaterial({color: 0xEE0000});
    var sphere = new THREE.Mesh(sphereGeometry, meshMaterial);
    var cube = new THREE.Mesh(cubeGeometry, meshMaterial);
    var plane = new THREE.Mesh(planeGeometry, meshMaterial);

    var meshMaterial2 = new THREE.MeshPhongMaterial({color: 0x7777ff});
    // position the sphere
    sphere.position.x = 0;
    sphere.position.y = 3;
    sphere.position.z = 2;


    cube.position.copy(sphere.position);
    plane.position.copy(sphere.position);


    // add the sphere to the scene
    scene.add(cube);

     // add subtle ambient lighting
    var ambientLight = new THREE.AmbientLight(0x0c0c0c);
    scene.add(ambientLight);

    // add spotlight for the shadows
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(-30, 60, 60);
    spotLight.castShadow = true;
    scene.add(spotLight);

    document.body.appendChild(renderer.domElement);

    renderScene();

    var controls = new function() {
        this.opacity = meshMaterial.opacity;
            this.transparent = meshMaterial.transparent;
            
            this.visible = meshMaterial.visible;
            this.emissive = meshMaterial.emissive.getHex();
            
            this.side = "front";

            this.color = meshMaterial.color.getStyle();
            this.wrapAround = false;
            this.wrapR = 1;
            this.wrapG = 1;
            this.wrapB = 1;

            this.selectedMesh = "cube";
            this.selectedMaterial = "Lambert";

            this.metal = false;
            this.specular = meshMaterial2.specular.getHex();
    }
    var spGui = gui.addFolder("Mesh");
    var phongGui = gui.addFolder("PHONG");
        spGui.add(controls, 'opacity', 0, 1).onChange(function (e) {
            meshMaterial.opacity = e
        });
        spGui.add(controls, 'transparent').onChange(function (e) {
            meshMaterial.transparent = e
        });
        spGui.add(controls, 'visible').onChange(function (e) {
            meshMaterial.visible = e
        });
      
        spGui.addColor(controls, 'emissive').onChange(function (e) {
            meshMaterial.emissive = new THREE.Color(e)
        });
        spGui.add(controls, 'side', ["front", "back", "double"]).onChange(function (e) {
            console.log(e);
            switch (e) {
                case "front":
                    meshMaterial.side = THREE.FrontSide;
                    break;
                case "back":
                    meshMaterial.side = THREE.BackSide;
                    break;
                case "double":
                    meshMaterial.side = THREE.DoubleSide;
                    break;
            }
            meshMaterial.needsUpdate = true;

        });
        spGui.addColor(controls, 'color').onChange(function (e) {
            meshMaterial.color.setStyle(e)
        });
        spGui.add(controls, 'selectedMesh', ["cube", "sphere", "plane"]).onChange(function (e) {

            scene.remove(plane);
            scene.remove(cube);
            scene.remove(sphere);

            switch (e) {
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


            scene.add(e);
        });

        spGui.add(controls, 'wrapAround').onChange(function (e) {

            meshMaterial.wrapAround = e;
            meshMaterial.needsUpdate = true;
        });

        spGui.add(controls, 'wrapR', 0, 1).step(0.01).onChange(function (e) {
            meshMaterial.wrapRGB.x = e;
        });

        spGui.add(controls, 'wrapG', 0, 1).step(0.01).onChange(function (e) {
            meshMaterial.wrapRGB.y = e;
        });

        spGui.add(controls, 'wrapB', 0, 1).step(0.01).onChange(function (e) {
            meshMaterial.wrapRGB.z = e;

        });
        spGui.add(controls, 'selectedMaterial', ["Lambert", "Phong"]).onChange(e => {
            switch(e){
                case "Lambert":
                    cube.material = meshMaterial;
                    sphere.material = meshMaterial;
                    plane.material = meshMaterial;
                    break;
                case "Phong":
                    cube.material = meshMaterial2;
                    sphere.material = meshMaterial2;
                    plane.material = meshMaterial2;
                    break;
            }
        });

        //phongGui.add(controls, 'metal').listen();


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