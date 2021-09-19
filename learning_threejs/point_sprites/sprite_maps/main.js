import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";

function init() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    var stats = initStats();
    var renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    var gui = new dat.GUI();

    scene.add(camera);

    renderer.setClearColor(0xEEEEEE, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMapSoft = true;

/*
    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();
*/
    camera.position.x = -30;
    camera.position.y = 40;
    camera.position.z = 30;
    camera.lookAt(scene.position);

    var sceneOrtho = new THREE.Scene();
    var cameraOrtho = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -10, 10);

    var sphereMat = new THREE.MeshNormalMaterial();
    var sphereGeom = new THREE.SphereGeometry(15, 20, 20);
    var sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);

    scene.add(sphereMesh);


    document.body.appendChild(renderer.domElement);

    

    var controls = new function() {
        this.size = 150;
    this.sprite = 0;
    this.transparent = true;
    this.opacity = 0.6;
    this.color = 0xffffff;
    this.rotateSystem = true;

    this.redraw = function () {
      sceneOrtho.children.forEach(function (child) {
        if (child instanceof THREE.Sprite) sceneOrtho.remove(child);
      });
      createSprite(controls.size, controls.transparent, controls.opacity, controls.color, controls.sprite);
    };
    }

    var gui = new dat.GUI();
  gui.add(controls, 'sprite', 0, 4).step(1).onChange(controls.redraw);
  gui.add(controls, 'size', 0, 120).onChange(controls.redraw);
  gui.add(controls, 'transparent').onChange(controls.redraw);
  gui.add(controls, 'opacity', 0, 1).onChange(controls.redraw);
  gui.addColor(controls, 'color').onChange(controls.redraw);

  controls.redraw();
  renderScene();
    
    var step = 0;

    function getTexture(){
        var tex = new THREE.TextureLoader().load("./assets/sprite-sheet.png");
        return tex;
    }

    function createSprite(size, transparent, opacity, color, spriteNumber){
        var spriteMaterial = new THREE.SpriteMaterial({
            opacity: opacity,
            color: color,
            transparent: transparent,
            map: getTexture()
        });

        console.log(spriteMaterial);
        spriteMaterial.map.offset = new THREE.Vector2(0.2 * spriteNumber, 0);
        spriteMaterial.map.repeat = new THREE.Vector2(0.2, 1);
        spriteMaterial.blending = THREE.AdditiveBlending;
        spriteMaterial.depthTest = false;
        
        console.log(spriteMaterial);
        var sprite = new THREE.Sprite(spriteMaterial);

        sprite.scale.set(size, size, size);
        sprite.position.set(100, 50, -10);
        sprite.velocityX = 5;

        sceneOrtho.add(sprite);

    }
    function animateScene() {
        step++;

        //camera.position.y = Math.sin(step += 0.001) * 20;
        sceneOrtho.children.forEach(function (e){
            if (e instanceof THREE.Sprite){
                e.position.x += e.velocityX;
                if (e.position.x > window.innerWidth) {
                    e.velocityX = -5;
                    controls.sprite += 1;
                    e.material.map.offset.set(1 / 5 * (controls.sprite % 4), 0);
                 }
                if (e.position.x < 0) {
                    e.velocityX = 5;
                }
            }
        });
    }

    function renderScene() {
        animateScene();
        stats.update();
        requestAnimationFrame(renderScene);
        renderer.render(scene, camera);
        renderer.autoClear = false;
        renderer.render(sceneOrtho, cameraOrtho);
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