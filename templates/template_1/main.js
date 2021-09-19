var camera, scene, renderer, stats;
var gui = new dat.GUI();

function init(){
	scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);
  stats = initStats();
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xEEEEEE, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  camera.position.x = -30;
  camera.position.y = 40;
  camera.position.z = 30;
  camera.lookAt(scene.position);

  document.body.appendChild(renderer.domElement);
  renderScene();
}

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

init();
window.addEventListener('resize', onResize, false);