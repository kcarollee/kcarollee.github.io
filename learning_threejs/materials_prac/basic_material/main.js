import * as THREE from "https://cdn.jsdelivr.net/npm/three@v0.124.0/build/three.module.js";
import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";
function init(){
	var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  var stats = initStats();
  var renderer = new THREE.WebGLRenderer({antialias: true});
  var gui = new dat.GUI();
  
  scene.add(camera);
  
  var orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.target.copy(scene.position);
  orbitControls.update();

  
  renderer.setClearColor(0x000000, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMapSoft = true;
  //renderer.outputEncoding = THREE.sRGBEndocing;
  
  camera.position.x = -30;
  camera.position.y = 40;
  camera.position.z = 30;
  camera.lookAt(scene.position);


        

        var groundGeom = new THREE.PlaneGeometry(100, 100, 4, 4);
        var groundMesh = new THREE.Mesh(groundGeom, new THREE.MeshBasicMaterial({color: 0x777777}));
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -20;
        scene.add(groundMesh);

        var sphereGeometry = new THREE.SphereGeometry(14, 20, 20);
        var cubeGeometry = new THREE.BoxGeometry(15, 15, 15);
        var planeGeometry = new THREE.PlaneGeometry(14, 14, 4, 4);


        var meshMaterial = new THREE.MeshBasicMaterial({color: 0x7777ff});

        var sphere = new THREE.Mesh(sphereGeometry, meshMaterial);
        var cube = new THREE.Mesh(cubeGeometry, meshMaterial);
        var plane = new THREE.Mesh(planeGeometry, meshMaterial);

        // position the sphere
        sphere.position.x = 0;
        sphere.position.y = 3;
        sphere.position.z = 2;


        cube.position.copy(sphere.position);
        plane.position.copy(sphere.position);


        // add the sphere to the scene
        scene.add(cube);

        // position and point the camera to the center of the scene
        camera.position.x = -20;
        camera.position.y = 50;
        camera.position.z = 40;
        camera.lookAt(new THREE.Vector3(10, 0, 0));

        // add subtle ambient lighting
        var ambientLight = new THREE.AmbientLight(0x0c0c0c);
        scene.add(ambientLight);

        // add spotlight for the shadows
        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(-40, 60, -10);
        spotLight.castShadow = true;
        scene.add(spotLight);
var step = 0;
        var oldContext = null;

        var controls = new function () {
            this.rotationSpeed = 0.02;
            this.bouncingSpeed = 0.03;

            this.opacity = meshMaterial.opacity;
            this.transparent = meshMaterial.transparent;
            this.overdraw = meshMaterial.overdraw;
            this.visible = meshMaterial.visible;
            this.side = "front";

            this.color = meshMaterial.color.getStyle();
            this.wireframe = meshMaterial.wireframe;
            this.wireframeLinewidth = meshMaterial.wireframeLinewidth;
            this.wireFrameLineJoin = meshMaterial.wireframeLinejoin;

            this.selectedMesh = "cube";

            
        };

        


        var spGui = gui.addFolder("Mesh");
        spGui.add(controls, 'opacity', 0, 1).onChange(function (e) {
            meshMaterial.opacity = e
        });
        spGui.add(controls, 'transparent').onChange(function (e) {
            meshMaterial.transparent = e
        });
        spGui.add(controls, 'wireframe').onChange(function (e) {
            meshMaterial.wireframe = e
        });
        spGui.add(controls, 'wireframeLinewidth', 0, 20).onChange(function (e) {
            meshMaterial.wireframeLinewidth = e
        });
        spGui.add(controls, 'visible').onChange(function (e) {
            meshMaterial.visible = e
        });
        spGui.add(controls, 'side', ["front", "back", "double"]).onChange(function (e) {

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

        
        

  document.body.appendChild(renderer.domElement);
  
  renderScene();
  
  function animateScene(){
    
  }
  
  function renderScene(){
    animateScene();
    stats.update();
    requestAnimationFrame(renderScene);
    renderer.render(scene, camera);
  }
  
  function initStats(){
    var stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);
    return stats;
  }
  
  function onResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  window.addEventListener('resize', onResize, false);
}

  
  
window.onload = init;