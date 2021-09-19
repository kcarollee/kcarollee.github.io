function init(){
	var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  var stats = initStats();
  var renderer = new THREE.WebGLRenderer();
  var gui = new dat.GUI();
  var axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  scene.add(camera);
  
  renderer.setClearColor(0xEEEEEE, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  

  // plane mesh
  var planeGeo = new THREE.PlaneGeometry(60, 40, 1, 1);
  var planeMat = new THREE.MeshLambertMaterial({color: 0xffffff});
  var plane = new THREE.Mesh(planeGeo, planeMat);

  plane.rotation.x = -0.5 * Math.PI;
  plane.position.x = 0;
  plane.position.y = 0;
  plane.position.z = 0;
  plane.receiveShadow = true;
  scene.add(plane);

  camera.position.x = -30;
  camera.position.y = 40;
  camera.position.z = 30;
  camera.lookAt(scene.position);

  // ambient light
  var ambientLight = new THREE.AmbientLight(0x0c0c0c);
  scene.add(ambientLight);

  // spot light
  var spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(-40, 60, -10);
  spotLight.castShadow = true;
  scene.add(spotLight);

  // fog
  scene.fog = new THREE.Fog(0xffffff, 0.015, 100); // color, near, far
  //scene.fog = new THREE.FogExp2(0xffffff, 0.01); // exponential fog growth

  // override material
  scene.overrideMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff
  });
  // control via gui
  var controls = new function(){
    this.rotationSpeed = 0.02;
    this.numberOfObj = scene.children.length;
    this.addCube = function(){
      var cubeSize = Math.ceil(Math.random() * 3);
      var cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      var cubeMat = new THREE.MeshLambertMaterial({
        color: Math.random() * 0xffffff
      });
      var cube = new THREE.Mesh(cubeGeo, cubeMat);
      cube.castShadow = true;
      cube.name = "cube-" + scene.children.length;

      cube.position.x = -30 + Math.round((Math.random() * planeGeo.parameters.width));
      cube.position.y = Math.round((Math.random() * 5));
      cube.position.z = -20 + Math.round((Math.random() * planeGeo.parameters.height));

      // add he newly created cube to the scene
      scene.add(cube);
      this.numberOfObj = scene.children.length;
    }

    this.removeCube = function(){
      var allChildren = scene.children;
      var lastObj = allChildren[allChildren.length - 1];
      if (lastObj instanceof THREE.Mesh){
        scene.remove(lastObj);
        this.numberOfObj = scene.children.length;
      }
    }

    this.outputObj = function(){
      console.log(scene.children);
    }
  }

  gui.add(controls, 'rotationSpeed', 0, 0.5); // min, max
  gui.add(controls, 'addCube');
  gui.add(controls, 'outputObj');
  gui.add(controls, 'removeCube');
  
  
  document.body.appendChild(renderer.domElement);
  addGeometries();
  renderScene();

  function addGeometries(){
    var geoms = [];
    geoms.push(new THREE.CylinderGeometry(1, 4, 4));
    geoms.push(new THREE.OctahedronGeometry(3));
    geoms.push(new THREE.BoxGeometry(2, 2, 2));
    geoms.push(new THREE.SphereGeometry(2));
    
    // custom box geometry
    var verts = [
        new THREE.Vector3(1, 3, 1),
        new THREE.Vector3(1, 3, -1),
        new THREE.Vector3(1, -1, 1),
        new THREE.Vector3(1, -1, -1),
        new THREE.Vector3(-1, 3, -1),
        new THREE.Vector3(-1, 3, 1),
        new THREE.Vector3(-1, -1, -1),
        new THREE.Vector3(-1, -1, 1)
    ];

    var faces = [
        new THREE.Face3(0, 2, 1),
        new THREE.Face3(2, 3, 1),
        new THREE.Face3(4, 6, 5),
        new THREE.Face3(6, 7, 5),
        new THREE.Face3(4, 5, 1),
        new THREE.Face3(5, 0, 1),
        new THREE.Face3(7, 6, 2),
        new THREE.Face3(6, 3, 2),
        new THREE.Face3(5, 7, 0),
        new THREE.Face3(7, 2, 0),
        new THREE.Face3(1, 3, 4),
        new THREE.Face3(3, 6, 4)
    ];
    var customGeo = new THREE.Geometry();
    customGeo.vertices = verts;
    customGeo.faces = faces;
    customGeo.computeFaceNormals();
    geoms.push(customGeo);

    for (let i = 0; i < geoms.length; i++){
        var mesh = new THREE.Mesh(geoms[i]);
        mesh.position.x = -24 + i * 12;
        mesh.position.y = 4;
        mesh.position.z = 4;
        scene.add(mesh);
    }


  }
  function animateScene(){
    scene.traverse(e => {
      if (e instanceof THREE.Mesh && e != plane){
        e.rotation.x += controls.rotationSpeed;
        e.rotation.y += controls.rotationSpeed;
        e.rotation.z += controls.rotationSpeed;
      }
    });
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