import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";

function init() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    var stats = initStats();
    var renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    var gui = new dat.GUI();
    var cloud;

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

    document.body.appendChild(renderer.domElement);

    var controls = new function() {
        this.size = 4;
            this.transparent = true;
            this.opacity = 0.6;
            this.vertexColors = true;
            this.color = 0xffffff;
            this.sizeAttenuation = true;
            this.rotateSystem = true;

            this.redraw = function () {
                if (scene.getObjectByName("particles")) {
                    scene.remove(scene.getObjectByName("particles"));
                }
                createParticles(controls.size, controls.transparent, controls.opacity, controls.vertexColors, controls.sizeAttenuation, controls.color);
            };
    }
    gui.add(controls, 'size', 0, 10).onChange(controls.redraw);
        gui.add(controls, 'transparent').onChange(controls.redraw);
        gui.add(controls, 'opacity', 0, 1).onChange(controls.redraw);
        gui.add(controls, 'vertexColors').onChange(controls.redraw);
        gui.addColor(controls, 'color').onChange(controls.redraw);
        gui.add(controls, 'sizeAttenuation').onChange(controls.redraw);
        gui.add(controls, 'rotateSystem');
    //createSprites();
    createParticles(controls.size, controls.transparent, controls.opacity, controls.vertexColors, controls.sizeAttenuation, controls.color);
    renderScene();

    

    var step = 0;
    function animateScene() {
        step++;
    }

    function renderScene() {
        animateScene();
        stats.update();
        requestAnimationFrame(renderScene);
        renderer.render(scene, camera);
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

    function createSprites(){
        
        var mat = new THREE.SpriteMaterial();
        for (var x = -5; x < 5; x++) {
            for (var y = -5; y < 5; y++) {
                var sprite = new THREE.Sprite(mat);
                sprite.position.set(x * 10, y * 10, 0);
                scene.add(sprite);
            }
        }
        
    }

    function createParticles(size, transparent, opacity, vertexColors, sizeAttenuation, color){
        var geom = new THREE.Geometry();
        var mat = new THREE.PointsMaterial({
            size: size,
            transparent: transparent,
            opacity: opacity,
            vertexColors: vertexColors,

            sizeAttenuation: sizeAttenuation,
            color: color
        });
        cloud = new THREE.Points(geom, mat);
        cloud.name = "particles";
        var range = 500;

        for (var i = 0; i < 15000; i++){
            var p = new THREE.Vector3(Math.random() * range - range * 0.5,
            Math.random() * range - range * 0.5,
            Math.random() * range - range * 0.5);
            geom.vertices.push(p);
            var color = new THREE.Color(0x00ff00);
            color.setHSL(color.getHSL(p).h, color.getHSL(p).s, Math.random() * color.getHSL(p).l);
            geom.colors.push(color);
        }

        
        scene.add(cloud);

    }

    window.addEventListener('resize', onResize, false);
}



window.onload = init;