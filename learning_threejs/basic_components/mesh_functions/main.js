function init(){
	var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  var stats = initStats();
  var renderer = new THREE.WebGLRenderer();
  var gui = new dat.GUI();
  
  scene.add(camera);
  
  renderer.setClearColor(0xEEEEEE, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  
  camera.position.x = -30;
  camera.position.y = 40;
  camera.position.z = 30;
  camera.lookAt(scene.position);

  document.body.appendChild(renderer.domElement);

  var planeGeo = new THREE.PlaneGeometry(60, 40, 1, 1);
  var planeMat = new THREE.MeshLambertMaterial({
    opacity: 0.6,
    color: 0xfcfcfc
  });
  var plane = new THREE.Mesh(planeGeo, planeMat);
  plane.receiveShadow = true;
  //plane.rotation.x = Math.PI * 2.0;
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.x = 0;
  plane.position.y = 0;
  plane.position.z = 0;
  scene.add(plane);

  var ambLight = new THREE.AmbientLight(0x0c0c0c);
  scene.add(ambLight);

  // add spotlight for the shadows
  var spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(-40, 60, 20);
  spotLight.castShadow = true;
  scene.add(spotLight);
  

  var step = 0;

  var controls = new function () {
      this.scaleX = 1;
      this.scaleY = 1;
      this.scaleZ = 1;
  
      this.positionX = 0;
      this.positionY = 4;
      this.positionZ = 0;

      this.rotationX = 0;
      this.rotationY = 0;
      this.rotationZ = 0;
      this.scale = 1;

      this.translateX = 0;
      this.translateY = 0;
      this.translateZ = 0;

      this.visible = true;

      this.translate = function () {

          cube.translateX(controls.translateX);
          cube.translateY(controls.translateY);
          cube.translateZ(controls.translateZ);

         controls.positionX = cube.position.x;
         controls.positionY = cube.position.y;
         controls.positionZ = cube.position.z;
     }


  };
  
  var material = new THREE.MeshLambertMaterial({color: 0x44ff44});
  var geom = new THREE.BoxGeometry(5, 8, 3);
  var cube = new THREE.Mesh(geom, material);
  cube.position.y = 4;
  cube.castShadow = true;
  scene.add(cube);

  var gui = new dat.GUI();

  

  var guiPosition = gui.addFolder('position');


  var contX = guiPosition.add(controls, 'positionX', -10, 10);
  var contY = guiPosition.add(controls, 'positionY', -4, 20);
  var contZ = guiPosition.add(controls, 'positionZ', -10, 10);

  contX.listen();
  contX.onChange(function (value) {
      cube.position.x = controls.positionX;
  });

  contY.listen();
  contY.onChange(function (value) {
      cube.position.y = controls.positionY;
  });

  contZ.listen();
  contZ.onChange(function (value) {
      cube.position.z = controls.positionZ;
  });


  var guiRotation = gui.addFolder('rotation');
  guiRotation.add(controls, 'rotationX', -4, 4);
  guiRotation.add(controls, 'rotationY', -4, 4);
  guiRotation.add(controls, 'rotationZ', -4, 4);

  var guiTranslate = gui.addFolder('translate');

  guiTranslate.add(controls, 'translateX', -10, 10);
  guiTranslate.add(controls, 'translateY', -10, 10);
  guiTranslate.add(controls, 'translateZ', -10, 10);
  guiTranslate.add(controls, 'translate');

  gui.add(controls, 'visible');

  var guiScale = gui.addFolder('scale');
  guiScale.add(controls, 'scaleX', 0, 5);
  guiScale.add(controls, 'scaleY', 0, 5);
  guiScale.add(controls, 'scaleZ', 0, 5);

  renderScene();
  function animateScene(){
    cube.visible = controls.visible;


    cube.rotation.x = controls.rotationX;
    cube.rotation.y = controls.rotationY;
    cube.rotation.z = controls.rotationZ;

    cube.scale.set(controls.scaleX, controls.scaleY, controls.scaleZ);
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