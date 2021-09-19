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

    var orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();

    camera.position.x = -20;
    camera.position.y = 30;
    camera.position.z = 40;
    camera.lookAt(new THREE.Vector3(10, 0, 0));

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(-40, 60, -10);
    scene.add(spotLight);

    var matArr = [];
    var meshMat = new THREE.MeshNormalMaterial();
    meshMat.side = THREE.DoubleSide;

    var wireFrameMat = new THREE.MeshBasicMaterial({color: 0x000000});
    wireFrameMat.wireframe = true;

    matArr.push(meshMat);
    matArr.push(wireFrameMat);
    var planeGeo = new THREE.PlaneGeometry(10, 14, 4, 4);
    var plane = new THREE.Mesh(planeGeo, matArr);

    scene.add(plane);

    var shapeGeo = new THREE.ShapeGeometry(drawShape());
    var shape = new THREE.Mesh(shapeGeo, matArr);
    scene.add(shape);
    
    document.body.appendChild(renderer.domElement);

    renderScene();

    var controls = new function() {
        
        this.normalWireFrame = true;
        this.basicWireFrame = true;
        this.geometries = "plane";
        this.asGeom = function () {
                // remove the old plane
                scene.remove(shape);
                // create a new one
                shape = createMesh(new THREE.ShapeGeometry(drawShape()));
                // add it to the scene.
                scene.add(shape);
            };

            this.asPoints = function () {
                // remove the old plane
                scene.remove(shape);
                // create a new one
                shape = createLine(drawShape(), false);
                // add it to the scene.
                scene.add(shape);
            };

            this.asSpacedPoints = function () {
                // remove the old plane
                scene.remove(shape);
                // create a new one
                shape = createLine(drawShape(), true);
                // add it to the scene.
                scene.add(shape);
            };
    }
    gui.add(controls, 'asGeom');
        gui.add(controls, 'asPoints');
        gui.add(controls, 'asSpacedPoints');
    gui.add(controls, 'normalWireFrame').onChange(e => {
        this.normalWireFrame = e;
        meshMat.wireframe = this.normalWireFrame;
    });
    gui.add(controls, 'basicWireFrame').onChange(e => {
        this.basicWireFrame = e;
        wireFrameMat.wireframe = this.basicWireFrame;
    });
    gui.add(controls, 'geometries', ["plane", "circle"]).onChange(e => {
        
        switch(e){
            case "plane":
                break;
            case "circle":
                break;
        }
    });

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
    function createLine(shape, spaced) {
            console.log(shape);
            if (!spaced) {
                var mesh = new THREE.Line(shape.createPointsGeometry(10), new THREE.LineBasicMaterial({
                    color: 0xff3333,
                    linewidth: 2
                }));
                return mesh;
            } else {
                var mesh = new THREE.Line(shape.createSpacedPointsGeometry(3), new THREE.LineBasicMaterial({
                    color: 0xff3333,
                    linewidth: 2
                }));
                return mesh;
            }

        }
function createMesh(geom) {

            // assign two materials
            var meshMaterial = new THREE.MeshNormalMaterial();
            meshMaterial.side = THREE.DoubleSide;
            var wireFrameMat = new THREE.MeshBasicMaterial();
            wireFrameMat.wireframe = true;

            // create a multimaterial
            var mesh = THREE.Mesh(geom, [meshMaterial, wireFrameMat]);

            return mesh;
        }
    function drawShape(){
        var shape = new THREE.Shape();
        shape.moveTo(10, 10);
        shape.lineTo(10, 40);
        shape.bezierCurveTo(15, 25, 25, 25, 30, 40);
        shape.splineThru([
            new THREE.Vector2(32, 30),
            new THREE.Vector2(28, 20),
            new THREE.Vector2(30, 10)
        ]);

        shape.quadraticCurveTo(20, 15, 10, 10);

            // add 'eye' hole one
            var hole1 = new THREE.Path();
            hole1.absellipse(16, 24, 2, 3, 0, Math.PI * 2, true);
            shape.holes.push(hole1);

            // add 'eye hole 2'
            var hole2 = new THREE.Path();
            hole2.absellipse(23, 24, 2, 3, 0, Math.PI * 2, true);
            shape.holes.push(hole2);

            // add 'mouth'
            var hole3 = new THREE.Path();
            hole3.absarc(20, 16, 2, 0, Math.PI, true);
            shape.holes.push(hole3);

            // return the shape
            return shape;
    }

    window.addEventListener('resize', onResize, false);
}



window.onload = init;