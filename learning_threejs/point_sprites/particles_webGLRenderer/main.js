import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";

function init() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    var stats = initStats();
    var renderer = new THREE.WebGLRenderer();
    var gui = new dat.GUI();
    

    scene.add(camera);

    renderer.setClearColor(new THREE.Color(0x000000, 1.0));
    renderer.setSize(window.innerWidth, window.innerHeight);
    

    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();

    camera.position.x = -30;
    camera.position.y = 40;
    camera.position.z = 30;
    camera.lookAt(scene.position);

    document.body.appendChild(renderer.domElement);

    var controls = new function() {
        this.size = 15;
            this.transparent = true;
            this.opacity = 0.6;
            this.color = 0xffffff;
            this.rotateSystem = true;
            this.sizeAttenuation = true;

            this.redraw = function () {
                if (scene.getObjectByName("pointcloud")) {
                    scene.remove(scene.getObjectByName("pointcloud"));
                }
                createPointCloud(controls.size, controls.transparent, controls.opacity, controls.sizeAttenuation, controls.color);
            };
    }

    var gui = new dat.GUI();
        gui.add(controls, 'size', 0, 20).onChange(controls.redraw);
        gui.add(controls, 'transparent').onChange(controls.redraw);
        gui.add(controls, 'opacity', 0, 1).onChange(controls.redraw);
        gui.addColor(controls, 'color').onChange(controls.redraw);
        gui.add(controls, 'sizeAttenuation').onChange(controls.redraw);

        gui.add(controls, 'rotateSystem');

        controls.redraw();
        console.log(scene.children);

    function getTexture(){
        var canvas = document.createElement('canvas');
        canvas.width = 32;
            canvas.height = 32;

            var ctx = canvas.getContext('2d');
            // the body
            ctx.translate(-81, -84);

            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.moveTo(83, 116);
            ctx.lineTo(83, 102);
            ctx.bezierCurveTo(83, 94, 89, 88, 97, 88);
            ctx.bezierCurveTo(105, 88, 111, 94, 111, 102);
            ctx.lineTo(111, 116);
            ctx.lineTo(106.333, 111.333);
            ctx.lineTo(101.666, 116);
            ctx.lineTo(97, 111.333);
            ctx.lineTo(92.333, 116);
            ctx.lineTo(87.666, 111.333);
            ctx.lineTo(83, 116);
            ctx.fill();

            // the eyes
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.moveTo(91, 96);
            ctx.bezierCurveTo(88, 96, 87, 99, 87, 101);
            ctx.bezierCurveTo(87, 103, 88, 106, 91, 106);
            ctx.bezierCurveTo(94, 106, 95, 103, 95, 101);
            ctx.bezierCurveTo(95, 99, 94, 96, 91, 96);
            ctx.moveTo(103, 96);
            ctx.bezierCurveTo(100, 96, 99, 99, 99, 101);
            ctx.bezierCurveTo(99, 103, 100, 106, 103, 106);
            ctx.bezierCurveTo(106, 106, 107, 103, 107, 101);
            ctx.bezierCurveTo(107, 99, 106, 96, 103, 96);
            ctx.fill();

            // the pupils
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(101, 102, 2, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(89, 102, 2, 0, Math.PI * 2, true);
            ctx.fill();


            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
    }

    var cloud;
    function createPointCloud(size, transparent, opacity, sizeAttenuation, color) {

            var geom = new THREE.Geometry();


            var material = new THREE.PointsMaterial({
                size: size,
                transparent: transparent,
                opacity: opacity,
                map: getTexture(),
                sizeAttenuation: sizeAttenuation,
                color: color
            });


            var range = 500;
            for (var i = 0; i < 5000; i++) {
                var particle = new THREE.Vector3(Math.random() * range - range / 2, Math.random() * range - range / 2, Math.random() * range - range / 2);
                geom.vertices.push(particle);

                
            }

            cloud = new THREE.Points(geom, material);
            cloud.name = 'pointcloud';
            cloud.sortParticles = true;
            cloud.FrustumCulled = true;
            scene.add(cloud);
        }
    
    function createSprites(){
        var mat = new THREE.SpriteMaterial({
            map: getTexture(),
            color: 0xffffff
        });

        var range = 500;
        for (var i = 0; i < 1500; i++){
            var sprite = new THREE.Sprite(mat);
            sprite.position.set(Math.random() * range - range * 0.5,
            Math.random() * range - range * 0.5,
            Math.random() * range - range * 0.5);
            sprite.scale.set(4, 4, 4);
            scene.add(sprite);
        }
    }
   
    renderScene();
    var step = 0;
    function animateScene() {
        step++;
    }

    function renderScene() {
        animateScene();
        if (controls.rotateSystem) {
                step += 0.01;

                cloud.rotation.x = step;
                cloud.rotation.z = step;
            }
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