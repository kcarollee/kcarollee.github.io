import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";
import {PLYLoader} from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/PLYLoader.js";
function init() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    var stats = initStats();
    var renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    var gui = new dat.GUI();

    scene.add(camera);

    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMapSoft = true;

    
    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();
    
    camera.position.x = -30;
    camera.position.y = 40;
    camera.position.z = 30;
    camera.lookAt(scene.position);

    var posSrc = {pos: 1};
    var tween= new TWEEN.Tween(posSrc).to({pos: 0}, 2000);
    tween.easing(TWEEN.Easing.Bounce.InOut);

    var tweenBack = new TWEEN.Tween(posSrc).to({pos: 1}, 2000);
    tweenBack.easing(TWEEN.Easing.Bounce.InOut);

    tweenBack.chain(tween);
    tween.chain(tweenBack);

    tween.start();

    var loader = new PLYLoader();
    loader.load("carcloud.ply", function(geometry){
        var material = new THREE.PointsMaterial({
            color:0xffffff,
            size: 1,
            opacity: 0.5,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: generateSprite()
        });

        var initialPos = geometry.attributes['position'].clone();
        geometry.initialPos = initialPos;

        var group = new THREE.Points(geometry, material);
        group.scale.set(2.5, 2.5, 2.5);
        scene.add(group);
    })



    document.body.appendChild(renderer.domElement);

    var controls = new function() {
        this.outputObj = function() {
            console.log(scene.children);
        }
    }
    gui.add(controls, 'outputObj');


    renderScene();
    var step = 0;
    function animateScene() {
        step++;
    }

    function renderScene() {
        TWEEN.update();
        animateScene();
        stats.update();
        requestAnimationFrame(renderScene);
        renderer.render(scene, camera);
    }

    function generateSprite() {

  var canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  var context = canvas.getContext('2d');

  // draw the sprites
  var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(0,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(0,0,64,1)');
  gradient.addColorStop(1, 'rgba(0,0,0,1)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // create the texture
  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
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