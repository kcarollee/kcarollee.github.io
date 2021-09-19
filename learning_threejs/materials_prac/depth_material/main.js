import * as THREE from "https://cdn.jsdelivr.net/npm/three@v0.124.0/build/three.module.js";
import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";
import {SceneUtils} from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/utils/SceneUtils.js";
function init(){
	var scene = new THREE.Scene();
  // previous near = 0.1, previous far = 1000. MeshDepthMaterial() had no effect with these values
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 10, 130);
  var stats = initStats();
  var renderer = new THREE.WebGLRenderer({antialias: true});
  var gui = new dat.GUI();
  //scene.overrideMaterial = new THREE.MeshDepthMaterial();
  scene.add(camera);
  
  camera.position.set(-50, 40, 50);
  camera.lookAt(scene.position);
  var orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.target.copy(scene.position);
 orbitControls.update();

  
  renderer.setClearColor(0x000000, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  //renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  //renderer.shadowMapSoft = true;
  //renderer.outputEncoding = THREE.sRGBEndocing;
  
  var ambLight = new THREE.AmbientLight({color: 0xffffff});
  scene.add(ambLight);

  var spotLight = new THREE.SpotLight({
    color: 0xffffff
  });
  spotLight.position.set(0, 100, 0);
  scene.add(spotLight);
  var controls = new function() {
    this.addCube = function(){
      var side =  Math.ceil(3 + (Math.random() * 3));
      var cubeGeo = new THREE.BoxGeometry(side, side, side);
      var cubeMat = new THREE.MeshDepthMaterial();
      var colorMat = new THREE.MeshBasicMaterial({
        color: 0xffffff * Math.random(),
        transparent: true,
        blending: THREE.MultiplyBlending
      });
      var xr = -60 + Math.round((Math.random() * 100));;
      var yr = Math.round((Math.random() * 10));
      var zr =  -100 + Math.round((Math.random() * 150));
      //var cube = new THREE.Mesh(cubeGeo, cubeMat);
      var cube = new SceneUtils.createMultiMaterialObject(
        cubeGeo, [colorMat, cubeMat]);
      cube.castShadow = true;
      cube.position.set(xr, yr, zr);
      console.log(cube.position);
      scene.add(cube);
      console.log(scene.children.length);

    }
  };
        
  gui.add(controls, 'addCube');

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