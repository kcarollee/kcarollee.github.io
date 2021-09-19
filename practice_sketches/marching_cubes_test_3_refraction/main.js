import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";
let step = 0;
let scene;
let seedAlt = 0;
let stats;
let texture;
let vertShader, fragShader;
let uniforms;

function mapLinear(x, a1, a2, b1, b2){
    return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}
function mix(x, y, k){
	return x * (1.0 - k) + y * k;
}
function clamp(x, min, max){
	return Math.min(Math.max(x, min), max);
}
function smoothUnion(x, y, k){
	let h = clamp(0.5 + 0.5 * (y - x) / k, 0, 1);
	return mix(x, y, h) - k * h * (1.0 - h);
}

class Cube{
    constructor(centerX, centerY, centerZ, w, h, d){
    	this.centerX = centerX;
    	this.centerY = centerY;
    	this.centerZ = centerZ;
    	this.cubeVertArr = []; // [x0, y0, z0, x1, y1, z1..., x7, y7, z7]



    	this.width = w;
    	this.height = h;
    	this.depth = d;

    	/*****************
		  4________5
		 /		   /
		7_________6 |
		|         | |
		| 0________1
		|/		  |/
		3_________2
			
		0: left down back   | cx-hw cy-hh cz-hd
		1: right down back  | cx+hw cy-hh cz-hd 
		2: right down front | cx+hw cy-hh cz+hd
		3: left down front  | cx-hw cy-hh cz+hd
		4: left up back     | cx-hw cy+hh cz-hd
		5: right up back    | cx+hw cy+hh cz-hd
        6: right up front   | cx+hw cy+hh cz+hd
        7: left up front    | cx-hw cy+hh cz+hd

        testing should be done in a decreasing order to create the correct configIndex.
    	******************/

    	this.configIndex = 0; // index in the triangulation table
    	this.triangulationEdgeIndices;

    	this.empty = false;

    	this.normalsCount = 0;
    	this.prevVertInHashMap = false;

    	this.id = ++Cube.id;
    }

    hashFunc(){

    }

    setCubeCorners(){
    	// half width, height, depth
    	let hw = this.width * 0.5;
    	let hh = this.height * 0.5;
    	let hd = this.depth * 0.5;
    	let mult = [
    		-1, -1, -1,
    		1, -1, -1,
    		1, -1, 1,
    		-1, -1, 1,
    		-1, 1, -1,
    		1, 1, -1,
    		1, 1, 1,
    		-1, 1, 1
    	];
    	for (let i = 0; i < 24; i++){
    		switch(i % 3){
    			// push xpos of the corner
    			case 0:
    				let x = this.centerX + mult[i] * hw;
    				this.cubeVertArr.push(x);
    				break;
    			// push ypos of the corner
    			case 1:
    				let y = this.centerY + mult[i] * hh;
    				this.cubeVertArr.push(y);
    				break;
    			// push zpos of the corner
    			case 2:
    				let z = this.centerZ + mult[i] * hd;
    				this.cubeVertArr.push(z);
    				break;
    		}
    	}
    }


    // f is a shape function that takes x, y, z as arguments
    // threshold is a threshold value over which we define as being 'inside' (1)
    // if f is a perlin noise function, it yields a value between -1 and 1.
    setConfigIndex(f, threshold){
    	// start from vert # 7 since that's how the configIndex is generated.
    	for (let i = 7; i > -1; i--){
    		let x = this.cubeVertArr[i * 3];
    		let y = this.cubeVertArr[i * 3 + 1];
    		let z = this.cubeVertArr[i * 3 + 2];
    		if (f(x, y, z) > threshold) {
    			this.configIndex |= 1 << i;
    		}
    	}
    	

    	// set the array of triangulation edge indices based on the configIndex.
    	this.triangulationEdgeIndices = Cube.triangulationTable[this.configIndex];
    }

    setMeshVertices(f, threshold, interpolate, hashMap, vertices,  indices, index, useDifferentHashFunc = false, funcIndex = 0){
    	let tempForNormals = [];
    	for (let i = 0; i < 16; i++){
    		if (this.triangulationEdgeIndices[i] == -1){
    			if (i == 0) {
    				this.empty = true;
    				break;
    			}
    			break;
    		} 
    		
    		// 1. get edge index in triEdgeIndices 
    		let edgeIndex = this.triangulationEdgeIndices[i];
    		
    		// 2. use Cube.edgeToVerticesIndices to determine which two vertices the edge is in between
    		let vertIndices = Cube.edgeToVerticesIndices[edgeIndex];
    		let vertIndex1 = vertIndices[0];
    		let vertIndex2 = vertIndices[1];

    		let v1x = this.cubeVertArr[vertIndex1 * 3];
    		let v1y = this.cubeVertArr[vertIndex1 * 3 + 1];
    		let v1z = this.cubeVertArr[vertIndex1 * 3 + 2];

    		let v2x = this.cubeVertArr[vertIndex2 * 3];
    		let v2y = this.cubeVertArr[vertIndex2 * 3 + 1];
    		let v2z = this.cubeVertArr[vertIndex2 * 3 + 2];

    		
    		// coordinates of the point between the two vertices
    		let mx, my, mz;
    		
    		// hash value. 
    		let hn;
    		// THIS IS PERFECT HASHING, as in this function gaurantees that every vertex is paired with an unique index. 
    		if (!useDifferentHashFunc) hn = this.id * 10000000 + edgeIndex;
    		// the functions below yields overlapping values for some of the vertices, resulting in distorted shapes.
    		else {
    			let hx, hy, hz;
    			hx = v1x + v2x;
    			hy = v1y + v2y;
    			hz = v1z + v2z;
    			switch(funcIndex){
    				case 0:
    					hn = noise.simplex3(hx * 0.0001, hy * 0.0001, hz * 0.0001);
    					break;
    				case 1:
    					hn = hx * hy * hz;
    					break;
    				case 2:
    					hn = noise.simplex2(hx * 0.001, hy * 0.001) + noise.simplex2(hy * 0.001, hz * 0.001);
    					break;
    				case 3:
    					hn = noise.simplex2(hx * 0.001, hy * 0.001) * noise.simplex2(hy * 0.001, hz * 0.001);
    					break;
    			}
    		}

    		// if the vertex hasn't been used yet, push the vertex to the vertices array
    		// push the index into the indices array and increment it.
    		if (!hashMap.has(hn)){    			
    			// 3. get the intepolated point between the two vertices
    			if (interpolate){
    				let v1f = f(v1x, v1y, v1z);
    				let v2f = f(v2x, v2y, v2z);
    				let r = v1f < v2f ?
    				mapLinear(threshold, v1f, v2f, 0, 1) : 
    				mapLinear(threshold, v2f, v1f, 0, 1);
    			
    				if (v1f < v2f){
    					mx = v1x + (v2x - v1x) * r;
    					my = v1y + (v2y - v1y) * r;
    					mz = v1z + (v2z - v1z) * r;
    				}

    				else{
    					mx = v2x + (v1x - v2x) * r;
    					my = v2y + (v1y - v2y) * r;
    					mz = v2z + (v1z - v2z) * r;
    				}
    			}
    			// 3.5 else get the midpoint of the two vertices
    			else{
    				mx = (v1x + v2x) * 0.5;
					my = (v1y + v2y) * 0.5;
					mz = (v1z + v2z) * 0.5;
    			}
    			hashMap.set(hn, {index: index.getValue()});
    			vertices.push(mx, my, mz);
    			indices.push(index.getValue());
    			index.increment();
    		}
    		// else the vertex has been used. 
    		// no need to push the vertex to the vertices array -> solves the redundancy issue
    		// push the index of the corresponding vertex into the indices array
    		else indices.push(hashMap.get(hn).index);
    	}

    }

    reset(){
    	this.empty = false;
    	this.configIndex = 0;
    	this.normalsCount = 0;
    	
    }
    getMeshGeometry(){
    	return this.mesh.geometry;
    }
}

Cube.edgeIndices = edgeIndices;
Cube.triangulationTable = triangulationTable;
Cube.edgeToVerticesIndices = [
	[0, 1], // edge number 0 is between vert0 & vert1
	[1, 2], // edge number 1 is between vert1 & vert2
	[2, 3], // edge number 2
	[3, 0], // edge number 3 
	[4, 5], // edge number 4
	[5, 6], // edge number 5
	[6, 7], // edge number 6
	[7, 4], // edge number 7
	[0, 4], // edge number 8
	[1, 5], // edge number 9
	[2, 6], // edge number 10
	[3, 7]  // edge number 11
];	
Cube.uvs = [
	0, 0,
	0, 1,
	1, 1,
	1, 0
];
Cube.id = 0;


class MarchingCubes{
	// test space w, h, d & single cube w, h, d & centerx, centery, centerz
	constructor(tw, th, td, sw, sh, sd, cx, cy, cz, shapeFunc, threshold){

		this.testSpace = {
			width: tw,
			height: th,
			depth: td
		}

		this.singleCubeParams = {
			width: sw,
			height: sh,
			depth: sd
		}

		this.centerX = cx;
		this.centerY = cy;
		this.centerZ = cz;

		this.shapeFunc = shapeFunc;
		this.threshold = threshold;

		this.hashMap = new Map();
		this.vertices = [];
		this.indices = [];
		this.uvs = [];

		this.indexCount = new IndexObject(0);

		this.marchingCubes = [];
		this.initCubes();
		
		this.marchingCubesMesh;
		this.setCubes();

	
		this.materialArr = [
			new THREE.MeshNormalMaterial({
				side: THREE.DoubleSide,
			}),

			// when using envMap, TURN OFF THREE.DOUBLESIDE

			new THREE.MeshBasicMaterial({ 
				transparent: false, 
				opacity: 0.7, 
				refractionRatio: 0.9,
				//side: THREE.DoubleSide,
				wireframe: false,
				
				//flatShading: true
			}),

			new THREE.MeshLambertMaterial({
			 	color: 0xFFFFFF * Math.random(),
			 	side: THREE.DoubleSide
			}),

			new THREE.ShaderMaterial({
			 	uniforms: uniforms,
			 	vertexShader: vertShader,
			 	fragmentShader: fragShader,
			 	//side: THREE.DoubleSide
			 	
			}),
		];

		this.material = this.materialArr[3];

		this.interpolate = true;

		this.id = ++MarchingCubes.id;

		this.totalGeom;
		this.useDifferentHashFunc = false;
		this.hashFuncIndex = 0;

		this.addedToScene = false; // set to true as soon as mesh is added to scene
	}

	updateShaderMaterial(){
		let ref = scene.getObjectByName("marchingCubesMesh" + this.id);
		ref.material.uniforms.time.value = step * 0.01;
	}


	initCubes(){
		let testSpace = this.testSpace;
		let singleCubeParams = this.singleCubeParams;

		let wStart = testSpace.width * -0.5 + this.centerX;
		let wEnd = testSpace.width * 0.5 + this.centerX;

		let hStart = testSpace.height * -0.5 + this.centerY;
		let hEnd = testSpace.height * 0.5 + this.centerY;

		let dStart = testSpace.depth * -0.5 + this.centerZ;
		let dEnd = testSpace.depth * 0.5 + this.centerZ;

		for (let w = wStart; w < wEnd; w += singleCubeParams.width){
			for (let h = hStart; h < hEnd; h += singleCubeParams.height){
				for (let d = dStart; d < dEnd; d += singleCubeParams.depth){
					let cube = new Cube(w, h, d, singleCubeParams.width, singleCubeParams.height, singleCubeParams.depth);
					this.marchingCubes.push(cube);
				}
			}	
		}
	}

	setCubes(){
		this.marchingCubes.forEach(function(c){
			c.setCubeCorners();
		});
	}

	updateCubes(){
		
		
		let func = this.shapeFunc;
		let interpolate = this.interpolate;
		let threshold = this.threshold;
		let hashMap = this.hashMap;
		let vertices = this.vertices;
		let indices = this.indices;
		let index = this.indexCount;
		let uvs = this.uvs;
		let useDifferentHashFunc = this.useDifferentHashFunc;
		let hashFuncIndex = this.hashFuncIndex;
		

		// note that the vertices and indices arrays are passed as arguments to the cubes, but not the uv array.
		// the uv array is filled AFTER vertices and indices are calculated. 
		this.marchingCubes.forEach(function(c){
			c.reset();
			c.setConfigIndex(func, threshold);
			c.setMeshVertices(func, threshold, interpolate, hashMap, 
				vertices, indices, index, 
				useDifferentHashFunc, hashFuncIndex);
		});

			
		let vertFloat = new Float32Array(this.vertices);
		let uvFloat = new Float32Array(this.uvs);
		// this is the best i could do for now for optimization.
		if (!this.addedToScene) {
			this.totalGeom = new THREE.BufferGeometry();
			this.totalGeom.setAttribute('position', new THREE.BufferAttribute(vertFloat, 3));
			this.totalGeom.setAttribute('uv', new THREE.BufferAttribute(uvFloat, 2));
			this.totalGeom.setIndex(this.indices);
			this.totalGeom.computeVertexNormals();
			this.marchingCubesMesh = new THREE.Mesh(this.totalGeom, this.material);
			this.marchingCubesMesh.name = "marchingCubesMesh" + this.id;
			scene.add(this.marchingCubesMesh);
			this.addedToScene = true;

			this.totalGeom.dispose();
			this.material.dispose();
		}
		else{
			let ref = scene.getObjectByName("marchingCubesMesh" + this.id); // reference to the mesh in scene
			
			ref.geometry = new THREE.BufferGeometry();
			ref.geometry.setAttribute('position', new THREE.BufferAttribute(vertFloat, 3));
			

			// push only the x and y coordinates of the position array.
			let u = this.uvs;
			let testSpace = this.testSpace;
			ref.geometry.attributes.position.array.forEach(function(n, i){
				switch(i % 3){
					case 0: // x
						u.push(mapLinear(n, -testSpace.width * 0.5, testSpace.width * 0.5, 0.0, 1.0)); 
						break;
					case 2: // y
						u.push(mapLinear(n, -testSpace.height * 0.5, testSpace.height * 0.5, 0.0, 1.0)); 
						break;
				}
			});
			uvFloat = new Float32Array(this.uvs);
			ref.geometry.setAttribute('uv', new THREE.BufferAttribute(uvFloat, 2));

			ref.geometry.setIndex(this.indices);
			// COMPUTE VERTICES AFTER SETTING THE INDICES
			ref.geometry.computeVertexNormals();
			
			ref.geometry.attributes.position.needsUpdate = true;
			ref.geometry.attributes.normal.needsUpdate = true;
			ref.geometry.attributes.uv.needsUpdate = true;

			// disposing the material after being done with it is also a must.
			ref.geometry.dispose();
			ref.material.dispose();
		}


		// reseting attributes
		this.hashMap.clear();
		this.vertices = [];
		this.indices = [];
		this.uvs = [];
		this.indexCount.reset();	
	}

	// use this for instances that aren't updated every frame
	manageResources(){	
		this.marchingCubesMesh.geometry.dispose();
		this.marchingCubesMesh.material.dispose();
	}

	useDifferentHashFunc(){
		this.useDifferentHashFunc = true;
	}

	useDefaultHashFunc(){
		this.useDefaultHashFunc = false;
	}

	getMesh(){
		return this.marchingCubesMesh;
	}


	setShapeFunc(newFunc){
		this.shapeFunc = newFunc;
	}

	setThreshold(newThreshold){
		this.threshold = newThreshold;
	}

	setMaterial(newMat){
		this.getMesh().material = newMat;
		this.getMesh().material.needUpdate = true;
	}

}

MarchingCubes.id = 0;



class IndexObject{
	constructor(i){
		this.value = i;
	}
	increment(){
		this.value++;
	}
	getValue(){
		return this.value;
	}
	reset(){
		this.value = 0;
	}
}

let p5texture;
let p5Font;
let p5Canvas;
function main(){

// P5 SKETCH
	const p5Sketch = (sketch) => {

		let textSize = 120;
		let testString, testString2;
		let mainFont;
		let stringArr = [];
		let stringNum = 8;
		class StringManager{
			constructor(str, textSize, posx, posy, mode){
				this.mainString = str;
				this.textSize = textSize;

				this.posx = posx;
				this.posy = posy;

				this.initPosx = posx;
				this.initPosy = posy;
				this.textBoundary;
				this.textBoundarySet = false;
				this.mode = mode; // 0: left, 1: right
				
			}
			
			checkForBounds(){
				if (mainFont.font !== undefined){
					this.textBoundary = mainFont.textBounds(this.mainString, this.posx, this.posy, this.textSize);
				}
			}
			moveStringY(){
				this.posy += 2;
			}

			resetPosition(){
				if (this.posy > sketch.height + textSize){
					this.posx = this.initPosx;
					this.posy = 0;
				}
			}
			
			moveStringX(){
				this.checkForBounds();
				try{	
					
						if (this.mode == 0){

							sketch.textAlign(sketch.LEFT);
							if(this.textBoundary.x < 0){
								this.posx += Math.abs(this.posx) / 5.0;
							}
							sketch.textAlign(sketch.LEFT);
							sketch.text(this.mainString, this.posx, this.posy);
							}
						else if (this.mode == 1){
							
							//sketch.textAlign(sketch.RIGHT);
							if(this.textBoundary.x + this.textBoundary.w  > sketch.width && this.posx > 0){
								this.posx -=  Math.abs(sketch.width - this.textBoundary.w - this.posx) / 25.0;
							}
							//sketch.textAlign(sketch.RIGHT);
							sketch.text(this.mainString, this.posx, this.posy);
							
						}
					
				}catch{}
			}

			drawString(){

			}
		}

        sketch.setup = () => {
        	
			sketch.createCanvas(window.innerWidth, window.innerHeight);
			sketch.textSize(textSize);
			mainFont = sketch.loadFont('helvetica_bold.ttf', sketch.drawText);

		
			for (let i = 0; i < stringNum; i++){
				let r = i % 2;

				let str;
				switch(r){
					case 0:
						str = new StringManager("CREATIVE", textSize, -2000, textSize * i, 0);
						stringArr.push(str);
					break;

					case 1:
						str = new StringManager("BANKRUPTCY", textSize, sketch.width + 2000, textSize * i, 1);
						stringArr.push(str);
					break;
				}
			}
		}
		sketch.draw = () => {
			
	
            sketch.smooth();
			sketch.background(0);
            
           
            sketch.noStroke();
            sketch.fill(255);
           
           	stringArr.forEach(function (s, i){
           		s.moveStringX();
           		s.moveStringY();
           		s.resetPosition();
           	});
			if (p5texture) p5texture.needsUpdate = true;
		}

		sketch.windowResized = () => {
			sketch.resizeCanvas(window.width, window.height);
			sketch.createCanvas(window.innerWidth, window.innerHeight);
			 p5texture.needsUpdate = true;
		}

		// use callbacks instead of async functions to load assets.

		sketch.drawText = (f) => {
			sketch.textFont(f, textSize);

		}
    };

// NOISE
	noise.seed(Math.random());

	p5Canvas = new p5(p5Sketch);
	p5texture = new THREE.CanvasTexture(p5Canvas.canvas);
	p5texture.wrapS = THREE.RepeatWrapping;
	p5texture.wrapT = THREE.RepeatWrapping;
	p5texture.needsUpdate = true;
	p5Canvas.canvas.style.display = "none";

// SHADERS
	vertShader = document.getElementById('vert').innerHTML;
	fragShader = document.getElementById('frag').innerHTML;
	uniforms = {
		time: {type: 'f', value: 0.0},
		resolution: {type: 'v2', value: new THREE.Vector2()},
		tex: {type: 't', value: p5texture}
	}
	uniforms.resolution.value.x = window.innerWidth;
	uniforms.resolution.value.y = window.innerHeight;
// TEST SHAPE FUNCTIONS
	
	const noiseFunc1 = (x, y, z) =>{
		let nx = 0.01;
		let ny = 0.01;
		let nz = 0.01;


		
		let n = noise.simplex3(x * nx + step * 0.003, y * ny + step * 0.003, z * nz + step * 0.003);
		
		return n;
	}

	

	const randomSphereFunc = (x, y, z) => {
		let r = 50;
		let c = 0.012;
		let v = 0.003;
		let n = noise.simplex3(x * c + step * v + seedAlt, y * c + step * v + seedAlt, z * c + step * v + seedAlt);
		r += 30.0 * n;
		let ds = x*x + y*y + z*z;
		let m = mapLinear(ds, 0, r*r, -1, 1);
		return m;
	}

	



// CANVAS & RENDERER
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();

// CAMERA
	const fov = 60;
	const aspect = 2; // display aspect of the canvas
	const near = 0.1;
	const far = 5000;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	//const camera = new THREE.OrthographicCamera(window.innerWidth * -0.5, window.innerWidth * 0.5, window.innerHeight * 0.5, window.innerHeight  *-0.5, 1, 1000);
	camera.position.set(0, 0, 200);

	scene = new THREE.Scene();
	scene.background = p5texture;

	renderer.render(scene, camera);


	let marchingCubes = new MarchingCubes(240, 240, 240, 12, 12, 12, 0, 0, 0, noiseFunc1, 0.0);
	marchingCubes.updateCubes();
	

// LIGHTS
	let dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
	dirLight.position.set(0, 0, 20);
	scene.add(dirLight);
	
	const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();



// GUI
	const gui = new dat.GUI();
	const controls = new function(){
		/*
		this.outputObj = function(){
			scene.children.forEach(c => console.log(c));
		}
		this.interpolate = true;
		*/
		this.switchFunction = true;
		this.threshold = 0.25;
	}
	/*
	gui.add(controls, 'outputObj');
	gui.add(controls, 'interpolate').onChange(function(e) {
		cubes.interpolate = !cubes.interpolate;
	});
	*/
	gui.add(controls, 'switchFunction').onChange(function(e) {
		if (e) marchingCubes.setShapeFunc( randomSphereFunc);
		else marchingCubes.setShapeFunc( noiseFunc1);
	});
	gui.add(controls, 'threshold', 0, 1.0).onChange(function(e) {
		marchingCubes.setThreshold(e);
	});


	function render(time){
		time *= 0.001;
		step += 1;

		//stats.update();

		//camera.position.set(0, 0, 100 + 50 * Math.sin(step * 0.01));

		marchingCubes.updateCubes();
		marchingCubes.updateShaderMaterial();

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

	function onMouseMove(){
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        //debugCube.position.set(mouse.x, mouse.y);
    }

	function initStats(){
		stats = new Stats();
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

window.onload = main;