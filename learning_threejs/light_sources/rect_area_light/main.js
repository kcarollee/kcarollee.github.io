import * as THREE from "https://cdn.jsdelivr.net/npm/three@v0.124.0/build/three.module.js";
import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";
import {RectAreaLightUniformsLib} from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {RectAreaLightHelper} from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/helpers/RectAreaLightHelper.js";
function init(){
  
	var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  var stats = initStats();
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  var gui = new dat.GUI();
  
  scene.add(camera);
  
  //renderer.setClearColor(0xEEEEEE, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  //renderer.outputEncoding = THREE.sRGBEndocing;
  
  camera.position.set(-10, -60, 70);
  camera.lookAt(scene.position);
  

  var planeGeo = new THREE.PlaneBufferGeometry(100, 100);
  var planeMat = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.1,
    metalness: 0
  });
  var plane = new THREE.Mesh(planeGeo, planeMat);

  var sphereGeo = new THREE.SphereBufferGeometry(5, 32, 32);
  var sphereMat = new THREE.MeshStandardMaterial({
    color: 0xA00000,
    roughness: 0.1,
    metalness: 0
  });
  var sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  sphere.position.set(0, 0, 10);
  //scene.add(sphere);
  //plane.receiveShadow = true;
  scene.add(plane);

  var knotGeo = new THREE.TorusKnotBufferGeometry(4.0, 1.0, 100, 16);
  var knotMat = new THREE.MeshStandardMaterial({
    color: 0xA00000,
    roughness: 0.1,
    metalness: 0
  });
  var knot = new THREE.Mesh(knotGeo, knotMat);
  knot.position.set(0, 0, 5);
  knot.castShadow = true;
  knot.receiveShadow = true;
  scene.add(knot);

  var orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.target.copy(plane.position);
  orbitControls.update();

  var ambLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambLight);

  RectAreaLightUniformsLib.init();
  var lightRadius = 15;
  var rectLight = new THREE.RectAreaLight(0xffffff, 5, 10, 10);
  rectLight.position.set(lightRadius, 0, 15);
  rectLight.lookAt(sphere.position);
  scene.add(rectLight);

  var rectLightHelper = new RectAreaLightHelper(rectLight);
  rectLight.add(rectLightHelper);


  document.body.appendChild(renderer.domElement);
  
  renderScene();

  var controls = new function(){
    this.knotRoughness = 0.0;
    this.outputObj = function(){
      console.log(scene.children);
    }
  }
  gui.add(controls, 'outputObj');
  gui.add(controls, 'knotRoughness', 0, 1).onChange(e => {
    knot.roughness = e;
  });
  
  var step = 0;
  function animateScene(){
    step += 0.01;
    sphere.rotation.x = step;
    sphere.rotation.y = step;
    sphere.rotation.z = step;

    rectLight.position.set(lightRadius * Math.cos(step),
      lightRadius * Math.sin(step), 15);
    rectLight.lookAt(sphere.position);
    rectLightHelper.update();

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