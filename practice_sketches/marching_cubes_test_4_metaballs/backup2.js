// this is the version before manually setting normals
import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";
import {BufferGeometryUtils} from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/utils/BufferGeometryUtils.js";
let step = 0;
let scene;
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
    	this.meshVertArr = [];
    	this.meshNormalsArr = [];
    	this.mesh;

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
    	//console.log(this.cubeVertArr);
    }


    // f is a shape function that takes x, y, z as arguments
    // threshold is a threshold value over which we define as being 'inside' (1)
    setConfigIndex(f, threshold){
    	// start from vert # 7 since that's how the configIndex is generated.
    	for (let i = 7; i > -1; i--){
    		let x = this.cubeVertArr[i * 3];
    		let y = this.cubeVertArr[i * 3 + 1];
    		let z = this.cubeVertArr[i * 3 + 2];
    		if (f(x, y, z) > threshold) {
    			this.configIndex |= 1 << i;

    			// if f is a perlin noise function, it yields a value between -1 and 1.
    		}
    	}
    	//console.log(this.configIndex);

    	// set the array of triangulation edge indices based on the configIndex.
    	this.triangulationEdgeIndices = Cube.triangulationTable[this.configIndex];
    	//console.log(this.triangulationEdgeIndices);
    }

    setMeshVertices(f, threshold, interpolate, hashMap, vertices,  indices, index){

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

    		
    
    		let mx, my, mz;
    		

    		// hashMap

    		/*
    		let hx, hy, hz;
    		hx = v1x + v2x;
    		hy = v1y + v2y;
    		hz = v1z + v2z;
    		// try using the noise function as a hash function
    		let hn = noise.simplex3(hx * 0.0001, hy * 0.0001, hz * 0.0001) * 100;
			*/
    		// THIS IS PERFECT HASHING
    		let hn = this.id * 10000000 + edgeIndex;


    		// if the vertex hasn't been used yet, push the vertex to the vertices array
    		// push the index into the indices array and increment it.
    		if (!hashMap.has(hn)){    			
    			// 3.5. get the intepolated point between the two vertices
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
    			// 3. get the midpoint of the two vertices
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
    			
    		// 4. push the coordinates of the midpoint to meshVertArr
    		this.meshVertArr.push(mx, my, mz);
    	}

    }

    reset(){
    	//if (!this.empty) this.mesh.geometry.dispose();
    	this.empty = false;
    	this.meshVertArr = [];
    	this.meshNormalsArr = [];
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

		this.indexCount = new IndexObject(0);

		this.marchingCubes = [];
		this.initCubes();
		
		this.totalMesh;
		this.setCubes();

		this.material = new THREE.MeshNormalMaterial({ 
			transparent: false, 
			opacity: 0.7, 
			side: THREE.DoubleSide,
			wireframe: false,
			//flatShading: true
		});

/*
		this.material = new THREE.MeshLambertMaterial({
			color: 0xFCFCAC,
			flatShading: true
		});
*/
		this.interpolate = true;

		this.id = ++MarchingCubes.id;

		this.totalGeom;
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
		
		scene.remove(scene.getObjectByName("totalMesh"));
		
		let func = this.shapeFunc;
		let interpolate = this.interpolate;
		let threshold = this.threshold;
		let hashMap = this.hashMap;
		let vertices = this.vertices;
		let indices = this.indices;
		let index = this.indexCount;

		this.marchingCubes.forEach(function(c){
			c.reset();
			c.setConfigIndex(func, threshold);
			c.setMeshVertices(func, threshold, interpolate, hashMap, vertices, indices, index);
		});

		this.totalGeom = new THREE.BufferGeometry();
		this.totalGeom.setIndex(this.indices);
			
		let verts = new Float32Array(this.vertices);
		this.totalGeom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
		this.totalGeom.computeVertexNormals();
		this.totalGeom.normalizeNormals();
		this.totalMesh = new THREE.Mesh(this.totalGeom, this.material);
		this.totalMesh.name = "totalMesh";
		scene.add(this.totalMesh);
		


		// reset
		this.hashMap.clear();
		this.vertices = [];
		this.indices = [];
		this.indexCount.reset();
		this.totalMesh.geometry.dispose();
		
	}

	getMesh(){
		return this.totalMesh;
	}


	setShapeFunc(newFunc){
		this.shapeFunc = newFunc;
	}

	setThreshold(newThreshold){
		this.threshold = newThreshold;
	}

	setMaterial(newMat){
		this.material = newMat;
		this.material.needUpdate = true;
	}

}



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


function main(){
// NOISE
	noise.seed(Math.random());
// INDEX OBJECT
	



// TEST SHAPE FUNCTIONS
	const f1 = (x, y, z) =>{
		let val = 10000.0 / 
			(
				Math.pow(x, 2) +
				Math.pow(y, 2) + 
				Math.pow(z, 2)
			);
		return  val > 999 ? 1 : val;
	} 

	const f2 = (g, h) => {
		console.log(g);
		return g(1, 1, 1) + h(2, 2, 2);
	}

	const f3 = (x, y, z) => {
		return Math.sin(x * 1 + y * 1 + z * z);
	}

	const noiseFunc1 = (x, y, z) =>{
		let nx = 0.009;
		let ny = 0.009;
		let nz = 0.009;

		
		let n = noise.simplex3(x * nx + step * 0.03, y * ny + step * 0.03, z * nz + step * 0.03);
		
		return n;
	}

	const noiseFunc2 = (x, y, z) =>{
		let nx = 0.01;
		let ny = 0.01;
		let nz = 0.01;

		let n = noise.simplex3(x * nx + step * 0.01, y * ny + step * 0.01, z * nz + step * 0.01);

		let v = Math.cos(x * y * 100 + n);
		
		return v;
	}

	const sphereFunc1 = (x, y, z) => {
		let r = 3;
		let ds = x*x + y*y + z*z;
		let m = mapLinear(ds, 0, r*r, -1, 1);
		return m;
	}

	const randomSphereFunc = (x, y, z) => {
		let r = 100 + 50 * Math.sin(step * 0.01);
		let c = 0.005;
		let v = 0.009;
		let n = noise.simplex3(x * c + step * v, y * c + step * v, z * c + step * v);
		r += 20.0 * n;
		let ds = x*x + y*y + z*z;
		let m = mapLinear(ds, 0, r*r, -1, 1);
		return m;
	}



// METABALL

	class MetaBall{
		constructor(centerX, centerY, centerZ, radius){
			this.centerX = centerX;
			this.centerY = centerY;
			this.centerZ = centerZ;
			this.initX = centerX;
			this.initY = centerY;
			this.initZ = centerZ;
			this.radius = radius;
			this.initR = radius;
			this.randX = Math.random() * 10;
			this.randY = Math.random() * 10;
			this.randZ = Math.random() * 10;
			this.randD = Math.random() * 50
		}	

		updatePos(){
			this.centerX = this.initX + this.randD * Math.sin(step * 0.1 + this.randX);
			this.centerY = this.initY + this.randD * Math.sin(step * 0.1 + this.randY);
			this.centerZ = this.initZ + this.randD * Math.sin(step * 0.1 + this.randZ);
			this.radius = this.initR + Math.sin(step * 0.1 + this.randZ);
		}

		getValue(x, y, z){
			let dx = x - this.centerX;
			let dy = y - this.centerY;
			let dz = z - this.centerZ;

			let dist = dx * dx + dy * dy + dz * dz;
			return this.radius / Math.sqrt(dist);
		}
	}

	let metaBallNum = 5;
	let metaBallArr = [];
	for (let i = 0; i < metaBallNum; i++){
		let m = new MetaBall(Math.random() * 200 - 100, Math.random() * 200 - 100, Math.random() * 200 - 100, Math.random() * 20 + 20);
		metaBallArr.push(m);
	}

	const metaBall1 = (x, y, z) => {
		/*
		let max = -99999999;
		metaBallArr.forEach(function(m){
			let val = m.getValue(x, y, z);
			m.updatePos();
			if (val > max) max = val;
		});
		return max;
		*/
		
		let val = metaBallArr[0].getValue(x, y, z);
		metaBallArr[0].updatePos();
		for (let i = 1; i < metaBallArr.length; i++){
			val = smoothUnion(val, metaBallArr[i].getValue(x, y, z), 0.1);
			metaBallArr[i].updatePos();
		}

		return val;
		
	}

// CANVAS & RENDERER
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({canvas, antialias: true});

// CAMERA
	const fov = 45;
	const aspect = 2; // display aspect of the canvas
	const near = 0.1;
	const far = 1000;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

	camera.position.set(0, 0, 200);

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xCCCCCC);

	renderer.render(scene, camera);

	let cubes = new MarchingCubes(240, 240, 240, 18, 18, 18, 0, 0, 0, randomSphereFunc, 0.2);

	
	

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
		this.outputObj = function(){
			scene.children.forEach(c => console.log(c));
		}
		this.interpolate = true;
	}
	gui.add(controls, 'outputObj');
	gui.add(controls, 'interpolate').onChange(function(e) {
		cubes.interpolate = !cubes.interpolate;
	});


	function render(time){
		time *= 0.01;
		step += 1;

		dirLight.position.set(camera.position.x, camera.position.y, camera.position.z);

		cubes.updateCubes();
		//cubes.getMesh().position.set(50 * Math.sin(time), 0, 0);
		
		
		
		if (resizeRenderToDisplaySize(renderer)){
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();
		}

		

		//dirLight.position.set(50 * Math.sin(time), 50 * Math.cos(time), 0);
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