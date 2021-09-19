import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";

let p5Canvas; // a p5 canvas to be used as a texture
let canvasTexture;

class Cube{
    constructor(){

    }
}
Cube.width;
Cube.height;
Cube.depth;


function main(){
//----------------p5 SETUP---------------------------
	const p5Sketch = (sketch) => {
		sketch.setup = () => {
			sketch.createCanvas(1000, 1000);
			sketch.textSize(80);
			
		}
		sketch.draw = () => {
            sketch.smooth();
			sketch.background(212, 134, 78);
            
           
            sketch.noStroke();
           
            let rectNum = 100;
            let rectHeight = sketch.height / rectNum;
            for (var i = 0; i < rectNum; i++){
                if (i % 2 == 0) sketch.fill(255);
                else sketch.fill(0);
                sketch.rect(0, rectHeight * i, sketch.width, rectHeight);
            }

			if (canvasTexture) canvasTexture.needsUpdate = true;
		}
	};
	p5Canvas = new p5(p5Sketch);

	canvasTexture = new THREE.CanvasTexture(p5Canvas.canvas);
	canvasTexture.mapping = THREE.EquirectangularRefractionMapping;
	console.log(canvasTexture);
	canvasTexture.encoding = THREE.sRGBEncoding;
	canvasTexture.needsUpdate = true;
//---------------------------------------------------
	noise.seed(Math.random());
	const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas, antialias: true});



//------------------CAMERA---------------------------
	const fov = 75;
	const aspect = 2; // display aspect of the canvas
	const near = 0.1;
	const far = 1000;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	camera.position.set(0, 0, 20);


//---------------------------------------------------
	const scene = new THREE.Scene();


	scene.background = new THREE.Color(0xFFAAAA);
	renderer.render(scene, camera);

	const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();

//-------------------OBJECTS-------------------------

	const mat = new THREE.MeshBasicMaterial({
        envMap: canvasTexture, 
        refractionRatio: 0.99,
        color:0xFF00FF
    });
	console.log(mat);
	mat.needsUpdate = true;
	const icoGeom = new THREE.IcosahedronGeometry(8, 15);
	const icoMesh = new THREE.Mesh(icoGeom, mat);
	console.log(icoMesh);
    scene.add(icoMesh);
    
    const range = 30.0;
    for (let i = 0; i < 100; i++){
        const boxGeom = createRandomGeometry();
        const boxMesh = new THREE.Mesh(boxGeom, mat);
        boxMesh.position.set(
            Math.random() * range - range * 0.5,
            Math.random() * range - range * 0.5,
            Math.random() * range - range * 0.5
        );
        boxMesh.morphTargetInfluences[0] = 1.0;
        scene.add(boxMesh);
    }
    

	

//---------------------------------------------------

	
//---------------------GUI---------------------------
	const gui = new dat.GUI();
	const controls = new function(){
		this.outputObj = function(){
			scene.children.forEach(c => console.log(c));
        }
        this.materialParams = {
            refractionRatio: 0.98,
            reflectivity: 1,
            color: 0xFFFFFF
        }

        this.morph = 0.5;
	}
    gui.add(controls, 'outputObj');
    gui.add(controls, 'morph', 0, 1).onChange(function(c){
		scene.children.forEach(function(e){
			e.morphTargetInfluences[0] = c;
			
		});  	
    });
    const materialFolder = gui.addFolder('Material Params');
    materialFolder.add(controls.materialParams, 'refractionRatio', 0, 1).step(0.001);
    materialFolder.add(controls.materialParams, 'reflectivity', 0, 1).step(0.001);
//----------------------------------------------------
	
	function updateBackground(){
        canvasTexture.dispose();
		canvasTexture = new THREE.CanvasTexture(p5Canvas.canvas);
		canvasTexture.mapping = THREE.EquirectangularRefractionMapping;
		//console.log(canvasTexture);
		//canvasTexture.encoding = THREE.sRGBEncoding;
		canvasTexture.needsUpdate = true;
		scene.background = canvasTexture;
    }
    
    function createRandomGeometry(){
        const geom = new THREE.SphereGeometry(1, 32, 32);
        
        geom.morphAttributes.position = [];
        const initialPosAttribute = geom.attributes.position;
        const morphPositions = [];
       	const rs = Math.random();
        for (let i = 0; i < initialPosAttribute.count; i++){
        	const x = initialPosAttribute.getX(i) + rs;
        	const y = initialPosAttribute.getY(i) + rs;
        	const z = initialPosAttribute.getZ(i) + rs;
        	const c = 1;
        	const vc = 0.3;
            const nx = noise.simplex2(x * vc, y * vc);
            const ny = noise.simplex2(y * vc, z * vc);
            const nz = noise.simplex2(z * vc, x * vc);
            
        	morphPositions.push(
        		x + nx * c,
        		y + ny * c,
        		z + nz * c
        	);
  
        }
        
        geom.morphAttributes.position[0] = new THREE.Float32BufferAttribute(morphPositions, 3);
        return geom;
    }
	function render(time){
		time *= 0.001;
        updateBackground();
        
        
        canvasTexture.needsUpdate = true;
        
        let params = controls.materialParams;
		
        
        scene.children.forEach(function(c, i){
            c.material = new THREE.MeshBasicMaterial({
                envMap: canvasTexture,
                refractionRatio: params.refractionRatio,
                reflectivity: params.reflectivity,
                color: params.color,
                morphTargets: true
            });
            c.material.needsUpdate = true;
            c.geometry.attributes.position.needsUpdate = true;
            if (i > 0) c.morphTargetInfluences[0] = Math.sin(time * 2.0 + i);
        })
		if (resizeRenderToDisplaySize(renderer)){
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();
		}
		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}

	function resizeRenderToDisplaySize(renderer){
		const canvas = renderer.domElement;
		const pixelRatio = window.devicePixelRatio;
		const width = canvas.clientWidth * pixelRatio | 0; // or 0
		const height = canvas.clientHeight * pixelRatio | 0; // 0
		const needResize = canvas.width !== width || canvas.height !== height;
		if (needResize){
			renderer.setSize(width, height, false);
		}
		return needResize;
	}
	requestAnimationFrame(render);
}

window.onload = main;