import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@v0.124.0/examples/jsm/controls/OrbitControls.js";
let step = 0;
let scene;

let seedAlt = 0;
let stats;
let texture;
let vertShader, fragShader;
let uniforms;



let globalVerticesArray = [];
let globalVerticesHashMap = new Map();

let feedGlobal = 0.030;
let killGlobal = 0.062;
let thresholdGlobal = 0.3;

let daGlobal = 0.9;
let dbGlobal = 0.1;

let fcGlobal = 1.0 / 26.0;
let scGlobal = 1.0 / 26.0;;
let vcGlobal = 1.0 / 26.0;

let dtGlobal = 1.0;

let addCenterVal = false;

let enableBoundary = false;

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
	let h = clamp(0.5 + 0.5 * (y - x) / (1 - k), 0, 1);
	return mix(x, y, h) - (1 - k) * h * (1.0 - h);
}

function hash2D(x, y){
	
	return 0.5 * (x + y) * (x + y + 1) + y;
}
function hash3D(x, y, z){

	return 0.5 * (hash2D(x, y) + z) * (hash2D(x, y) + z + 1) + z;
}

// perfect hashing
function hashString(x, y, z){
	//return noise.simplex3(x * 0.01, y * 0.01, z * 0.01);
	return x.toString() + y.toString() + z.toString();
}

function distSquared(x0, y0, z0, x1, y1, z1){
	let ds = Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2) + Math.pow(z1 - z0, 2);
	return ds;
}

function diffuseSumTest(x, y, z){
	let vertex = globalVerticesHashMap.get(hashString(x, y, z));

	let asum = 0.0;
	let bsum = 0.0;
	let fc = fcGlobal;
	let sc = scGlobal;
	let vc = vcGlobal;

	/*
	vertex.neighborHashValues.forEach(function (h, i){

		if (i < 8){
			

			asum += globalVerticesHashMap.get(h).aprev * fc;
			bsum += globalVerticesHashMap.get(h).bprev * fc;
		}
		else if (i < 12){
			asum += globalVerticesHashMap.get(h).aprev * sc;
			bsum += globalVerticesHashMap.get(h).bprev * sc;
		}
		else if (i < 26){
			asum += globalVerticesHashMap.get(h).aprev * vc;
			bsum += globalVerticesHashMap.get(h).bprev * vc;
		}
	});
	*/

	// Array index-based is a whole lot faster than hashmap-get-based. nice.

	

	vertex.neighborIndices.forEach(function (h, i){
		let neighborVertex = globalVerticesArray[h];
		
		if (enableBoundary && neighborVertex.boundary) {
			asum += 0.0;
			bsum += 0.0;
		}
		
		else {
			if (i < 8){
			

				asum += neighborVertex.aprev * fc;
				bsum += neighborVertex.bprev * fc;
			}
			else if (i < 12){
				asum += neighborVertex.aprev * sc;
				bsum += neighborVertex.bprev * sc;
			}
			else if (i < 26){
				asum += neighborVertex.aprev * vc;
				bsum += neighborVertex.bprev * vc;
			}
		}
	});


	asum -= vertex.aprev;
	bsum -= vertex.bprev;

	let a = vertex.aprev;
	let b = vertex.bprev;

	let abb = a * b * b;

	// whether to have a constant feed or a conditionally given one should be decided later.
	if (addCenterVal) {	
		//let dist = Math.sqrt(distSquared(x, y, z, 5 * Math.sin(step * 0.1), 5 * Math.cos(step * 0.1), 0));
        let dist = Math.sqrt(distSquared(x, y, z, 0, 0, 0));
		// moving source.
		//let dist = Math.sqrt(distSquared(x, y, z, 1.5 * Math.sin(step * 0.1), 1.5 * Math.cos(step * 0.1), 0));
		//let r = 3;
		let nc = 100.0;
		let nh = 1.0;
		let r = nh ;// * mapLinear(noise.simplex3(x * nc, y * nc, z * nc), -1, 1, 0, 1);
		dist = dist > r ? 0.0 : 1.0;
		//dist = mapLinear(dist, 0, 15, 0, 1);
		b +=  dist;
	}

	a += (daGlobal * asum - abb + feedGlobal * (1.0 - a)) * dtGlobal;
	b += (dbGlobal * bsum + abb - (feedGlobal + killGlobal) * b) * dtGlobal;
	a = clamp(a, 0.0, 1.0);
	b = clamp(b, 0.0, 1.0);
	

	vertex.anext = a;
	vertex.bnext = b;

	vertex.rdval = (a - b) * 2.0;

	
	/*
    vertex.anext = vertex.aprev + vertex.da * asum - abb + vertex.feed * (1.0 - vertex.aprev);
    vertex.bnext = vertex.bprev + vertex.db * bsum + abb - (vertex.feed + vertex.kill) * vertex.bprev;
	*/

	/*
	vertex.anext = vertex.aprev + vertex.da * asum - abb + feedGlobal * (1.0 - vertex.aprev);
    vertex.bnext = vertex.bprev + vertex.db * bsum + abb - (feedGlobal+ killGlobal) * vertex.bprev;
	*/

	/*
	vertex.anext = vertex.aprev + daGlobal * asum - abb + feedGlobal * (1.0 - vertex.aprev);
    vertex.bnext = vertex.bprev + dbGlobal * bsum + abb - (feedGlobal + killGlobal) * vertex.bprev;
	
    vertex.anext = clamp(vertex.anext, 0.0, 1.0);
    vertex.bnext = clamp(vertex.bnext, 0.0, 1.0);

    vertex.rdval = (vertex.anext + vertex.bnext) / 2.0;
    */
    //console.log(vertex.rdval);
    if (vertex.boundary && enableBoundary) vertex.rdval = null;

    return vertex.rdval;
}

function swapGlobalVerticesValue(){
	globalVerticesHashMap.forEach(function(val, key){
		//console.log("PREV: " + val.aprev);
		val.aprev = val.anext;
		val.bprev = val.bnext;
		//console.log("NEXT: " + val.aprev);

	});
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

    	// used for reaction diffusion.
    	this.index3;
    	this.indexFlat;
    	this.neighborIndices;

    	this.da;
    	this.db;
    	this.feed;
    	this.kill;

    	this.aprev;
    	this.anext;
    	
    	this.bprev;
    	this.bnext;

    	this.rdval;


    	/*
    	this.debugGeom = new THREE.BoxGeometry(this.width, this.height, this.depth);
    	this.debugCube = new THREE.Mesh(this.debugGeom, Cube.debugMat);
    	this.debugCube.position.set(this.centerX, this.centerY, this.centerZ);
    	scene.add(this.debugCube);

    	*/
    }

    hashFunc(){

    }

   
    
    setCubeCorners(testSpace, cx, cy, cz, tws, twe, ths, the, tds, tde){
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
    	let x, y, z;

    	/*
    	let testWidthStart = cx - testSpace.width * 0.5;
    	let testWidthEnd = cx + testSpace.width * 0.5;

    	let testHeightStart = cy - testSpace.height * 0.5;
    	let testHeightEnd = cy + testSpace.height * 0.5;

    	let testDepthStart = cz - testSpace.depth * 0.5;
    	let testDepthEnd = cz + testSpace.depth * 0.5;
		*/

		let testWidthStart = tws;
    	let testWidthEnd = twe;

    	let testHeightStart = ths;
    	let testHeightEnd = the;

    	let testDepthStart = tds;
    	let testDepthEnd = tde;

    	for (let i = 0; i < 24; i++){
    		
    		switch(i % 3){
    			// push xpos of the corner
    			case 0:
    				x = this.centerX + mult[i] * hw;
    				this.cubeVertArr.push(x);
    				break;
    			// push ypos of the corner
    			case 1:
    				y = this.centerY + mult[i] * hh;
    				this.cubeVertArr.push(y);
    				break;
    			// push zpos of the corner
    			case 2:
    				z = this.centerZ + mult[i] * hd;
    				this.cubeVertArr.push(z);

    				let vhash = hashString(x, y, z);
    				if (!globalVerticesHashMap.has(vhash)){

    					let newXMinus = x - this.width;
    					let newXPlus = x + this.width;
    					let newYMinus = y - this.height;
    					let newYPlus = y + this.height;
    					let newZMinus = z - this.depth;
    					let newZPlus = z + this.depth;
    					let boundary = false;
    					
    					if (newXMinus < testWidthStart){

    					 	newXMinus = testWidthEnd;

    					 	boundary = true;
    					}
    					if (newXPlus > testWidthEnd){
    						newXPlus = testWidthStart;
    						boundary = true;
    					} 

    					if (newYMinus < testHeightStart) {
    						newYMinus = testHeightEnd;
    						boundary = true;
    					}
    					if (newYPlus > testHeightEnd){

    					 	newYPlus = testHeightStart;
    					 	boundary = true;
    					}

    					if (newZMinus < testDepthStart) {
    						newZMinus = testDepthEnd;
							boundary = true;
    					}
    					if (newZPlus > testDepthEnd){

    						 newZPlus = testDepthStart;
    						 boundary = true;
    					}
						
    					globalVerticesHashMap.set(vhash, {
    						pos: [x, y, z],
    						neighborHashValues: [
    							// face sharing
    							hashString(newXMinus, y, z),// left
    							hashString(newXPlus, y, z),// right
    							hashString(x, newYPlus, z),// down
    							hashString(x, newYMinus, z),// up
    							hashString(x, y, newZMinus),// back
    							hashString(x, y, newZPlus),// front

    							// side sharing
    							hashString(newXMinus, newYMinus, z),
    							hashString(newXMinus, newYPlus, z),
    							hashString(newXMinus, y, newZMinus),
    							hashString(newXMinus, y, newZPlus),
    							hashString(newXPlus, newYMinus, z),
    							hashString(newXPlus, newYPlus, z),
    							hashString(newXPlus, y, newZMinus),
    							hashString(newXPlus, y, newZPlus),
    							hashString(x, newYMinus, newZMinus),
    							hashString(x, newYMinus, newZPlus),
    							hashString(x, newYPlus, newZMinus),
    							hashString(x, newYPlus, newZPlus),

    							// vertex sharing
    							hashString(newXMinus, newYMinus, newZMinus),
    							hashString(newXMinus, newYMinus, newZPlus),
    							hashString(newXMinus, newYPlus, newZMinus),
    							hashString(newXMinus, newYPlus, newZPlus),
    							hashString(newXPlus, newYMinus, newZMinus),
    							hashString(newXPlus, newYMinus, newZPlus),
    							hashString(newXPlus, newYPlus, newZMinus),
    							hashString(newXPlus, newYPlus, newZPlus),
    						],
    						aprev: 1.0,
    						anext: 1.0,



    						bprev:0,
    						
    						bnext: 0.0,
    						
    						da: daGlobal,
    						db: dbGlobal,
    						
    						feed: feedGlobal,
    						kill: killGlobal,
    						
    						rdval: 0.5,
    						boundary: boundary
    					});
    					/*
    					let vh = globalVerticesHashMap.get(vhash);
    					let debugGeom = new THREE.BoxGeometry(this.width * 0.5, this.height * 0.5, this.depth * 0.5);
    					let debugBox = new THREE.Mesh(debugGeom, Cube.debugMat);
    					debugBox.position.set(x, y, z);

    					//debugBox.scale.set(vh.rdval, vh.rdval, vh.rdval);
    					scene.add(debugBox);
    					*/
    					
    				}
    				//console.log(globalVerticesHashMap.get(vhash).aprev);
    				break;
    		}

    	}
    }


    // REMEMBER THAT thresholdGlobal IS USED FOR THE THRESHOLD!!!!!!

    // f is a shape function that takes x, y, z as arguments
    // threshold is a threshold value over which we define as being 'inside' (1)
    // if f is a perlin noise function, it yields a value between -1 and 1.
    setConfigIndex(f, threshold){
    	// start from vert # 7 since that's how the configIndex is generated.
    	for (let i = 7; i > -1; i--){
    		let x = this.cubeVertArr[i * 3];
    		let y = this.cubeVertArr[i * 3 + 1];
    		let z = this.cubeVertArr[i * 3 + 2];
    		//if (f(x, y, z) > threshold) {
    		if (f(x, y, z) > thresholdGlobal) {
    			//console.log("HEY");
    			//if (!globalVerticesHashMap.has(hashString(x, y, z))) console.log("HAS");
    		//if (this.rdval > threshold) {
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
    				/*
    				let v1f = f(v1x, v1y, v1z);
    				let v2f = f(v2x, v2y, v2z);
    				*/

    				let v1f = globalVerticesHashMap.get(hashString(v1x, v1y, v1z)).rdval;
    				let v2f = globalVerticesHashMap.get(hashString(v2x, v2y, v2z)).rdval;
    				
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

Cube.debugMat = new THREE.MeshBasicMaterial({color: 0xFFFFFF});


class MarchingCubes{
	// test space w, h, d & single cube w, h, d & centerx, centery, centerz
	constructor(tw, th, td, sw, sh, sd, cx, cy, cz, shapeFunc, threshold, matIndex){

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
                //wireframe: true
			}),

			// when using envMap, TURN OFF THREE.DOUBLESIDE

			new THREE.MeshBasicMaterial({ 
				//transparent: false, 
				//opacity: 0.7, 
				//refractionRatio: 0.9,
				reflectivity: 0.7,
				side: THREE.DoubleSide,
				wireframe: false,
				//envMap: p5texture,
				map: p5texture
				//flatShading: true
			}),

			new THREE.MeshPhongMaterial({
			 	color: 0xFFFFFF ,
			 	side: THREE.DoubleSide
			}),

			new THREE.ShaderMaterial({
			 	uniforms: uniforms,
			 	vertexShader: vertShader,
			 	fragmentShader: fragShader,
			 	side: THREE.DoubleSide
			}),
		];

		this.material = this.materialArr[matIndex];

		this.interpolate = true;

		this.id = ++MarchingCubes.id;

		this.totalGeom;
		this.useDifferentHashFunc = false;
		this.hashFuncIndex = 0;

		this.addedToScene = false; // set to true as soon as mesh is added to scene
	}

	updateShaderMaterial(){
        if (this.material instanceof THREE.ShaderMaterial){
		    let ref = scene.getObjectByName("marchingCubesMesh" + this.id);
            ref.material.uniforms.time.value = step * 0.01;
            
        }
	}


	initCubes(){
		let testSpace = this.testSpace;
		let singleCubeParams = this.singleCubeParams;

		let wStart = testSpace.width * -0.5 + this.centerX + singleCubeParams.width * 0.5;
		let wEnd = testSpace.width * 0.5 + this.centerX;

		let hStart = testSpace.height * -0.5 + this.centerY + singleCubeParams.height * 0.5;
		let hEnd = testSpace.height * 0.5 + this.centerY;

		let dStart = testSpace.depth * -0.5 + this.centerZ + singleCubeParams.depth * 0.5;
		let dEnd = testSpace.depth * 0.5 + this.centerZ;

		let wi = 0;
		let hi = 0;
		let di = 0;

		let dnum = this.testSpace.depth / this.singleCubeParams.depth;
		let hnum = this.testSpace.height / this.singleCubeParams.height;
		let wnum = this.testSpace.width / this.singleCubeParams.width;

		var flatten = (w, d, h) =>{
			return w + wnum * (d + dnum * h);
		}

		var mod = (n, m) => {
			return ((n % m) + m) % m;
		}

		// neighboring cubes:
		`
		left: 
		right:
		down:
		up:
		back:
		front:


		`
		let wdiv = testSpace.width / singleCubeParams;
		let hdiv;
		let ddiv;
		for (let h = hStart; h < hEnd; h += singleCubeParams.height){
			for (let d = dStart; d < dEnd; d += singleCubeParams.depth){
				for (let w = wStart; w < wEnd; w += singleCubeParams.width){
					//console.log(w, h, d);
					let cube = new Cube(w, h, d, singleCubeParams.width, singleCubeParams.height, singleCubeParams.depth);
					wi++;
					this.marchingCubes.push(cube);
				}
				di++;
				wi = 0;
			}
			hi++;
			di = 0;	
		}
	}

	setCubes(){
		let testSpace = this.testSpace;
		let singleCubeParams = this.singleCubeParams;

		let wStart = testSpace.width * -0.5 + this.centerX;
		let wEnd = testSpace.width * 0.5 + this.centerX;

		let hStart = testSpace.height * -0.5 + this.centerY;
		let hEnd = testSpace.height * 0.5 + this.centerY;

		let dStart = testSpace.depth * -0.5 + this.centerZ;
		let dEnd = testSpace.depth * 0.5 + this.centerZ;


		//let testSpace = this.testSpace;
		let cx = this.centerX;
		let cy = this.centerY;
		let cz = this.centerZ;
		this.marchingCubes.forEach(function(c){
			c.setCubeCorners(testSpace, cx, cy, cz, wStart, wEnd, hStart, hEnd, dStart, dEnd);
		});

		// globalHashMap is now complete. Push every object in the map to globalVerticesArray
		let index = 0;
		globalVerticesHashMap.forEach(function(val, key){
			val.globalVerticesArrayIndex = index;
			globalVerticesArray.push(val);
			index++;
		});

		// globalVerticesArray is now complete. Add an array of neighborIndices to each object.
		globalVerticesHashMap.forEach(function (val, key){
			let tempIndexArr = [];
			val.neighborHashValues.forEach(function(hv){
				let neighborIndex = globalVerticesHashMap.get(hv).globalVerticesArrayIndex;
				tempIndexArr.push(neighborIndex);
			});
			val.neighborIndices = tempIndexArr;
		});

		console.log(globalVerticesHashMap);
		console.log(globalVerticesArray);
	}

	updateCubes(){
		
		
		let func = this.shapeFunc;
		let interpolate = this.interpolate;
		let threshold = thresholdGlobal;
		let hashMap = this.hashMap;
		let vertices = this.vertices;
		let indices = this.indices;
		let index = this.indexCount;
		let uvs = this.uvs;
		let useDifferentHashFunc = this.useDifferentHashFunc;
		let hashFuncIndex = this.hashFuncIndex;
		let marchingCubes = this.marchingCubes;

		// note that the vertices and indices arrays are passed as arguments to the cubes, but not the uv array.
		// the uv array is filled AFTER vertices and indices are calculated. 
		this.marchingCubes.forEach(function(c){
			c.reset();

			c.setConfigIndex(func, threshold);

			//c.diffuseSum(marchingCubes);
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

		/*
		this.marchingCubes.forEach(function(c){
			c.swapValues();
		});
		*/

		// reseting attributes
		this.hashMap.clear();
		this.vertices = [];
		this.indices = [];
		this.uvs = [];
		this.indexCount.reset();	

		if (addCenterVal) addCenterVal = false;
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

		let textSize = 130;
		let testString, testString2;
		let mainFont;
		let stringArr = [];
		let stringNum = 8;
		let mainString = "CREATIVEBANKRUPTCY";
		let textBoundary; 
		
		let testStr;

		class MovingString{
			constructor(str, posx, posy){
				this.str = str;
				this.strLength;
				console.log(this.strLength);
				this.posx = posx;
				this.posy = posy;
				this.posxCopy = posx;
				this.posx2 = - 1550;
			}

			display(){
				sketch.text(this.str, this.posx2, this.posy);
				sketch.text(this.str, this.posx, this.posy);
			}

			updatePos(){
				this.strLength = mainFont.textBounds(this.str, 0, 0, textSize).w;
				//this.posx2 = this.posxCopy - this.strLength;
				//console.log(this.posx2);
				if (this.posx > window.innerWidth) {
					this.posx = this.posx2 - this.strLength;
				}
				if (this.posx2 > window.innerWidth) this.posx2 = this.posx - this.strLength;

				this.posx += 10;
				this.posx2 += 10;
			}
		}
        sketch.setup = () => {
        	
			sketch.createCanvas(window.innerWidth, window.innerHeight);
			sketch.textSize(textSize);
			mainFont = sketch.loadFont('helvetica_bold.ttf', sketch.drawText);

			

			for (let i = 0; i < stringNum; i++){
				let t = new MovingString(mainString, 0, textSize * (i + 1));
				stringArr.push(t);
			}
		}
		sketch.draw = () => {
			
			//textBoundary = mainFont.textBounds(mainString, 0, 0, textSize);
			try{
            	sketch.smooth();
				sketch.background(210, 255, 55);
            
           		//testStr.display();
           		//testStr.updatePos();

           		stringArr.forEach(function(s){
           			s.display();
           			s.updatePos();
           		});
           		
           	}catch{}
           
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
    p5Canvas = new p5(p5Sketch);
	p5texture = new THREE.CanvasTexture(p5Canvas.canvas);
	//p5texture.mapping = THREE.EquirectangularReflectionMapping;
	p5texture.wrapS = THREE.RepeatWrapping;
	p5texture.wrapT = THREE.RepeatWrapping;
	p5texture.needsUpdate = true;
	p5Canvas.canvas.style.display = "none";
   

	//initStats();
// NOISE
	noise.seed(Math.random());
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
	

// CANVAS & RENDERER
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({canvas, antialias: true});

	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();

// CAMERA
	const fov = 90;
	const aspect = window.innerWidth / window.innerHeight; // display aspect of the canvas
	const near = 0.1;
	const far = 5000;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	//const camera = new THREE.OrthographicCamera(window.innerWidth * -0.5, window.innerWidth * 0.5, window.innerHeight * 0.5, window.innerHeight  *-0.5, 1, 1000);
	camera.position.set(0, 0, 30);

	scene = new THREE.Scene();
	
	scene.background = new THREE.Color(0x111111);
	renderer.render(scene, camera);


	
    var f = (x, y, z) => {
    	let r  = 15;
    	let ds = x*x+y*y+z*z;
    	let m = mapLinear(ds, 0, r*r, 0, 1);
    	return m;
    }

    let dimTotal = 3.25;
    let dimCube = 0.25;
    let marchingCubes = new MarchingCubes(dimTotal, dimTotal, dimTotal, dimCube, dimCube, dimCube, 0, 0, 0, diffuseSumTest, thresholdGlobal, 3);
	//marchingCubes.updateCubes();
	console.log(globalVerticesHashMap);


// LIGHTS
	let dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
	dirLight.position.set(0, 0, 20);
	scene.add(dirLight);
	
	const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.target.copy(scene.position);
    orbitControls.update();



// GUI
	const gui = new dat.GUI();

	const controls = new function(){	
		this.feedGlobal = feedGlobal;
		this.killGlobal = killGlobal;
		this.thresholdGlobal = thresholdGlobal;
		this.daGlobal = daGlobal;
		this.dbGlobal = dbGlobal;
		this.addCenterVal = addCenterVal;
		
		this.fcGlobal = fcGlobal;
		this.scGlobal = scGlobal;
		this.vcGlobal = vcGlobal;
		this.dtGlobal = dtGlobal;
		this.enableBoundary = enableBoundary;

		this.debug = () => {
			let v0 = "-7.5-7.5-7.5";
			let v1 = "-6.5-4.57.5";
			console.log(globalVerticesHashMap.get(v0));
			console.log(globalVerticesHashMap.get(v1));
		};

		this.reset = () => {
				globalVerticesArray.forEach(function(v){
				v.aprev = 1.0;
				v.bprev = 0.0;
				v.anext = 1.0;
				v.bnext = 0.0;
				v.rdval = 0.0;

			});
		};

		this.presets = null;
	}
	
	gui.add(controls, 'feedGlobal', 0.01, 0.1).step(0.0001).onChange(function(e){
		feedGlobal = e;
	}).listen();

	gui.add(controls, 'killGlobal', 0.01, 0.1).step(0.0001).onChange(function(e){
		killGlobal = e;
	}).listen();

	gui.add(controls, 'thresholdGlobal', 0.0, 1.0).step(0.0001).onChange(function(e){
		thresholdGlobal = e;
	}).listen();

	gui.add(controls, 'daGlobal', 0.0, 1.2).step(0.0001).onChange(function(e){
		daGlobal = e;
	}).listen();

	gui.add(controls, 'dbGlobal', 0.0, 1.2).step(0.0001).onChange(function(e){
		dbGlobal = e;
	}).listen();

	gui.add(controls, 'addCenterVal', false).onChange(function(e){
		addCenterVal = e;
	});

	gui.add(controls, 'enableBoundary', false).onChange(function(e){
		enableBoundary = e;
	});

	

	gui.add(controls, 'fcGlobal', 0.0, 1.0 / 6.0).onChange(function(e){
		fcGlobal = e;
	});

	gui.add(controls, 'scGlobal', 0.0, 1.0 / 6.0).onChange(function(e){
		scGlobal = e;
	});

	gui.add(controls, 'vcGlobal', 0.0, 1.0 / 6.0).onChange(function(e){
		vcGlobal = e;
	});

	gui.add(controls, 'dtGlobal', 0.0, 2.0).onChange(function(e){
		dtGlobal = e;
	});

	gui.add(controls, 'debug').onChange(function(e){
		controls.debug;
	});

	gui.add(controls, 'reset').onChange(function(e){
		controls.reset;
	});

	gui.add(controls, 'presets', ['Circles', 'Mitosis', 'Pastry']).onChange(function(e){
		switch (e){
			case 'Circles':
				setParameters(0.0303, 0.0557, 0.1714, 0.96, 0.1276);
				break;
			case 'Mitosis':
				setParameters(0.03, 0.062, 0.0738, 0.3747, 0.1536);
				break;
			case 'Pastry':
				setParameters(0.041, 0.0703, 0.2798, 0.5568, 0.0756);
				break;
		}
	});
	


	gui.close();

	
	render();

	function setParameters(f, k, t, da, db){
		feedGlobal = controls.feedGlobal = f;
		killGlobal = controls.killGlobal = k;
		thresholdGlobal = controls.thresholdGlobal = t;
		daGlobal = controls.daGlobal = da;
		dbGlobal = controls.dbGlobal = db;
	}

	function render(time){
		dirLight.position.set(camera.position.x, camera.position.y, camera.position.z);
		time *= 0.0001;
		step += 1;
		
		//stats.update();
		
		marchingCubes.updateCubes();
		swapGlobalVerticesValue();
		marchingCubes.updateShaderMaterial();

		//marchingCubes.getMesh().rotation.set(0, 0, time);

		
		
		//console.log(globalVerticesHashMap);

		
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
	

	function onMouseMove(){
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
       
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