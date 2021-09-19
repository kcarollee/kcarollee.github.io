function init(){
	var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  var stats = initStats();
  var renderer = new THREE.WebGLRenderer();
  var gui = new dat.GUI();

  scene.fog = new THREE.Fog(0xaaaaaa, 0.010, 200);
  
  scene.add(camera);
  
  renderer.setClearColor(0xaaaaff, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  
  camera.position.x = -20;
  camera.position.y = 15;
  camera.position.z = 45;
  camera.lookAt(new THREE.Vector3(10, 0, 0));

  var textureGrass = new THREE.TextureLoader().load("assets/grass.jpg");
  console.log(textureGrass);
  textureGrass.wrapS = THREE.RepeatWrapping;
  textureGrass.wrapT = THREE.RepeatWrapping;
  textureGrass.repeat.set(4, 4);

  var planeGeometry = new THREE.PlaneGeometry(1000, 200, 20, 20);
  var planeMaterial = new THREE.MeshLambertMaterial({map: textureGrass});
  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  // rotate and position the plane
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.x = 15;
  plane.position.y = 0;
  plane.position.z = 0;
  // add the plane to the scene
  scene.add(plane);

  var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
  var cubeMaterial = new THREE.MeshLambertMaterial({color: 0xff3333});
  var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.castShadow = true;

  cube.position.x = -4;
  cube.position.y = 3;
  cube.position.z = 0;
  scene.add(cube);

  // note that even with textures, light is needed to actually see them

  var spotLight0 = new THREE.SpotLight(0xcccccc);
  spotLight0.position.set(-40, 60, -10);
  spotLight0.lookAt(plane);
  scene.add(spotLight0);
  document.body.appendChild(renderer.domElement);

  var hemiLight = new THREE.HemisphereLight(0x0000ff, 0x00ff00, 0.6);
  hemiLight.position.set(0, 500, 0);
  scene.add(hemiLight);
  
  renderScene();

  var controls = new function(){
    this.rotationSpeed = 0.03;

    this.hemisphere = true;
    this.color = 0x00ff00;
    this.skyColor = 0x0000ff;
    this.intensity = 0.6
    this.outputObj = function(){
      console.log(scene.children);
    }
  }
  gui.add(controls, 'outputObj');
  gui.addColor(controls, 'color').onChange(e => {
    hemiLight.groundColor = new THREE.Color(e);
  }); 
  gui.addColor(controls, 'skyColor').onChange(e => {
    hemiLight.color = new THREE.Color(e);
  });
  gui.add(controls, 'intensity', 0, 3.0).onChange(e => {
    hemiLight.intensity = e;
  });
  var step = 0;
  function animateScene(){
    step += 0.1;
    cube.rotation.x = step;
    cube.rotation.z = step;
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