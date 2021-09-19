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

    var points = gosper(4, 60);
    
    var lines = new THREE.Geometry();
    var colors = [];
    var i = 0;
    points.forEach(e => {
        lines.vertices.push(new THREE.Vector3(e.x, e.z, e.y));
        colors[i] = new THREE.Color(0xffffff);
        colors[i].setHSL(e.x / 100 + 0.5, (e.y * 20) / 300, 0.8);
        i++
    });
    lines.colors = colors;
    lines.computeLineDistances();
    var material = new THREE.LineDashedMaterial({
            opacity: 0.5,
            linewidth: 10,
            vertexColors: THREE.VertexColors
        });

        var line = new THREE.Line(lines, material);
        line.position.set(25, -30, -60);
        scene.add(line);

        document.body.appendChild(renderer.domElement);
    renderScene();

    var controls = new function() {
        this.outputObj = function() {
            console.log(scene.children);
        }
    }
    gui.add(controls, 'outputObj');

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

     function gosper(a, b) {

            var turtle = [0, 0, 0];
            var points = [];
            var count = 0;

            rg(a, b, turtle);


            return points;

            function rt(x) {
                turtle[2] += x;
            }

            function lt(x) {
                turtle[2] -= x;
            }

            function fd(dist) {
//                ctx.beginPath();
                points.push({x: turtle[0], y: turtle[1], z: Math.sin(count) * 5});
//                ctx.moveTo(turtle[0], turtle[1]);

                var dir = turtle[2] * (Math.PI / 180);
                turtle[0] += Math.cos(dir) * dist;
                turtle[1] += Math.sin(dir) * dist;

                points.push({x: turtle[0], y: turtle[1], z: Math.sin(count) * 5});
//                ctx.lineTo(turtle[0], turtle[1]);
//                ctx.stroke();

            }

            function rg(st, ln, turtle) {

                st--;
                ln = ln / 2.6457;
                if (st > 0) {
//                    ctx.strokeStyle = '#111';
                    rg(st, ln, turtle);
                    rt(60);
                    gl(st, ln, turtle);
                    rt(120);
                    gl(st, ln, turtle);
                    lt(60);
                    rg(st, ln, turtle);
                    lt(120);
                    rg(st, ln, turtle);
                    rg(st, ln, turtle);
                    lt(60);
                    gl(st, ln, turtle);
                    rt(60);
                }
                if (st == 0) {
                    fd(ln);
                    rt(60);
                    fd(ln);
                    rt(120);
                    fd(ln);
                    lt(60);
                    fd(ln);
                    lt(120);
                    fd(ln);
                    fd(ln);
                    lt(60);
                    fd(ln);
                    rt(60)
                }
            }

            function gl(st, ln, turtle) {
                st--;
                ln = ln / 2.6457;
                if (st > 0) {
//                    ctx.strokeStyle = '#555';
                    lt(60);
                    rg(st, ln, turtle);
                    rt(60);
                    gl(st, ln, turtle);
                    gl(st, ln, turtle);
                    rt(120);
                    gl(st, ln, turtle);
                    rt(60);
                    rg(st, ln, turtle);
                    lt(120);
                    rg(st, ln, turtle);
                    lt(60);
                    gl(st, ln, turtle);
                }
                if (st == 0) {
                    lt(60);
                    fd(ln);
                    rt(60);
                    fd(ln);
                    fd(ln);
                    rt(120);
                    fd(ln);
                    rt(60);
                    fd(ln);
                    lt(120);
                    fd(ln);
                    lt(60);
                    fd(ln);
                }
            }
        }

    

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize, false);
}



window.onload = init;