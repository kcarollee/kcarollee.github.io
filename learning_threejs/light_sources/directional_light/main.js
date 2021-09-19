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
  
  camera.position.set(-25, 30, 100);
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

  

  var pointColor = "#ccffcc";
  var pointLight = new THREE.PointLight(pointColor);
  pointLight.distance = 100;
  scene.add(pointLight);

  var slsGeo = new THREE.SphereGeometry(0.2);
  var slsMat = new THREE.MeshBasicMaterial({color: 0xac6c25});
  var slightSphere = new THREE.Mesh(slsGeo, slsMat);
  slightSphere.castShadow = true;
  slightSphere.position.set(-40, 60, -10);
  scene.add(slightSphere);


  var spotColor = "#ffccff";
  var spotLight = new THREE.SpotLight(spotColor);
  spotLight.position.set(-40, 60, -10);
  spotLight.castShadow = true;
  spotLight.target = plane;
  spotLight.distance = 0;
  spotLight.angle = 0.4;
  spotLight.shadow.cameraNear = 2;
  spotLight.shadow.cameraFar = 200;
  spotLight.shadow.cameraFov = 30;
  

  var dirColor = "#ff5808";
  var directionalLight = new THREE.DirectionalLight(dirColor);
  directionalLight.position.set(-40, 60, -10);
  directionalLight.castShadow = true;
  directionalLight.shadowCameraNear = 2;
  directionalLight.shadowCameraFar = 200;
  directionalLight.shadowCameraLeft = -50;
  directionalLight.shadowCameraRight = 50;
  directionalLight.shadowCameraTop = 50;
  directionalLight.shadowCameraBottom = -50;
  directionalLight.distance = 0;
  directionalLight.intensity = 0.5;
  directionalLight.shadowMapHeight = 1024;
  directionalLight.shadowMapWidth = 1024;
  scene.add(directionalLight);

  var shadowCam = new THREE.CameraHelper(directionalLight.shadow.camera);
  //spotLight.shadowCameraVisible = true;
  scene.add(shadowCam);
  //scene.add(spotLight);

  document.body.appendChild(renderer.domElement);
  
  renderScene();

  var controls = new function(){
    this.ambientColor = ambColor;
    this.disableSpotLight = false;
    this.pointColor = pointColor;
    this.spotColor = spotColor;
    this.intensity = 1;
    this.distance = 100;
    this.angle = 0.1;
    this.debug = false;
    this.castShadow = true;
    this.onlyShadow = false;
    this.target = "Cube";
    this.stopMovingLight = false;
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
  gui.add(controls, 'angle', 0, Math.PI * 2).onChange(function (e) {
    spotLight.angle = e;
  });
  gui.addColor(controls, 'pointColor').onChange(e => {
    pointLight.color = new THREE.Color(e);
  });
  gui.addColor(controls, 'spotColor').onChange(e => {
    spotLight.color = new THREE.Color(e);
  });
  gui.add(controls, 'distance', 0, 100).onChange(e => {
    spotLight.distance = e;
  })
  gui.add(controls, 'intensity', 0, 15).onChange(e => {
    pointLight.intensity = e;
  })
  gui.add(controls, 'debug').onChange(e => {
    shadowCam.visible = e;
  });

  // switching spotLight's target.
  // unlike the lookAt function of the camera, the target needs to be a Three.Object3D object.
  gui.add(controls, 'target', ['Plane', 'Cube']).onChange(function (e) {
            console.log(e);
            switch (e) {
                case "Plane":
                    directionalLight.target = plane;
                    break;
                case "Cube":
                    directionalLight.target = cube;
                    break;
            }

        });

  
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

    slightSphere.position.set(
      14 * Math.cos(step * 2.0 + Math.PI),
      5,
      7 * Math.sin(step * 2.0 + Math.PI)
    );

    pointLight.position.copy(lightSphere.position);
    directionalLight.position.copy(slightSphere.position);
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