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
  
  camera.position.set(-25, 30, 25);
  camera.lookAt(scene.position);

  var planeG = new THREE.PlaneGeometry(60, 20, 1, 1);
  var planeM = new THREE.MeshLambertMaterial({color: 0xffffff});
  var plane = new THREE.Mesh(planeG, planeM);
  plane.receiveShadow = true;
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.x = 15;
  plane.position.y = 0;
  plane.position.z = 0;
  scene.add(plane);

  var cubeG = new THREE.BoxGeometry(4, 4, 4);
  var cubeM = new THREE.MeshLambertMaterial({color: 0xff0000});
  var cube = new THREE.Mesh(cubeG, cubeM);
  cube.castShadow = true;
  cube.position.set(-4, 3, 0);
  scene.add(cube);

  var lsGeo = new THREE.SphereGeometry(0.2);
  var lsMat = new THREE.MeshBasicMaterial({color: 0xac6c25});
  var lightSphere = new THREE.Mesh(lsGeo, lsMat);
  lightSphere.castShadow = true;
  lightSphere.position.set(3, 0, 3);
  scene.add(lightSphere);

  var ambColor = "#0c0c0c";
  var ambLight = new THREE.AmbientLight(ambColor);
  scene.add(ambLight);

  var spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(-40, 60, -10);
  spotLight.castShadow = true;
  scene.add(spotLight);

  var pointColor = "#ccffcc";
  var pointLight = new THREE.PointLight(pointColor);
  pointLight.distance = 100;
  scene.add(pointLight);

  document.body.appendChild(renderer.domElement);
  
  renderScene();

  var controls = new function(){
    this.ambientColor = ambColor;
    this.disableSpotLight = false;
    this.pointColor = pointColor;
    this.intensity = 1;
    this.distance = 100;
    this.outputObj = function(){
      console.log(scene.children);
    }
  }
  gui.add(controls, 'outputObj');
  // addColor shows a drop down color selection menu
  gui.addColor(controls, 'ambientColor').onChange(e => {
    ambLight.color = new THREE.Color(e);
  });
  gui.add(controls, 'disableSpotLight').onChange(e => {
    spotLight.visible = !e;
  });
  gui.addColor(controls, 'pointColor').onChange(e => {
    pointLight.color = new THREE.Color(e);
  });
  gui.add(controls, 'distance', 0, 100).onChange(e => {
    pointLight.distance = e;
  })
  gui.add(controls, 'intensity', 0, 15).onChange(e => {
    pointLight.intensity = e;
  })
  
  var step = 0;
  function animateScene(){
    step += 0.01;
    cube.rotation.x = step;
    cube.rotation.y = step;
    cube.rotation.z = step;

    lightSphere.position.set(
      14 * Math.cos(step * 2.0),
      7 * Math.sin(step * 2.0),
      5
    );

    pointLight.position.copy(lightSphere.position);
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