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
        this.size = 3;
        this.transparent = true;
        this.opacity = 0.6;
        this.color = 0xffffff;
        this.sizeAttenuation = true;
        this.redraw = function(){
            //scene.remove(scene.getObjectByName("particles"));
            //scene.remove(scene.getObjectByName("particles2"));
            createPoints(controls.size, controls.transparent,
                controls.opacity, controls.sizeAttenuation, controls.color);
        }
    }

    var gui = new dat.GUI();
    gui.add(controls, 'size', 0, 20).onChange(controls.redraw);
    gui.add(controls, 'transparent').onChange(controls.redraw);
    gui.add(controls, 'opacity', 0, 1).onChange(controls.redraw);
    gui.addColor(controls, 'color').onChange(controls.redraw);
    gui.add(controls, 'sizeAttenuation').onChange(controls.redraw);

    controls.redraw();
    renderScene();


    var step = 0;

    function createPoints(size, transparent, opacity, sizeAttenuation, color){
        var texture = new THREE.TextureLoader().load("assets/raindrop-1.png");
        var geom = new THREE.Geometry();

        var material = new THREE.PointsMaterial({
            size: size,
            transparent: transparent,
            opacity: opacity,
            map: texture,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: sizeAttenuation,
            color: color
        });

        var range = 40;
        for (var i = 0; i < 1500; i++){
            var particle = new THREE.Vector3(
                Math.random() * range - range / 2,
                Math.random() * range * 1.5,
                Math.random() * range - range / 2
            );
            particle.velocityY = 0.1 + Math.random() / 5;
            particle.velocityX = (Math.random() - 0.5) / 3;
            geom.vertices.push(particle);
        }

        cloud = new THREE.Points(geom, material);
        cloud.name = "particles";
        scene.add(cloud);
    }
    function animateScene() {
        step++;
        var vertices = cloud.geometry.vertices;
        cloud.geometry.verticesNeedUpdate = true;
        console.log(vertices);
        vertices.forEach(function (v){
            v.y = v.y - v.velocityY;
            v.x = v.x - v.velocityX;
            
            if (v.y <= 0) {

                v.y = 60;
            }
            if (v.x <= -20 || v.x >= 20) v.velocityX = v.velocityX * -1;
        
        });
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

    window.addEventListener('resize', onResize, false);
}



window.onload = init;