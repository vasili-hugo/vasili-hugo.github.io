import * as THREE from 'three';

import { OrbitControls }
from 'three/addons/controls/OrbitControls.js';

import { GLTFLoader }
from 'three/addons/loaders/GLTFLoader.js';

const viewer = document.getElementById('viewer');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3f3f3);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(3, 2, 3);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(
  camera,
  renderer.domElement
);

controls.enableDamping = true;

/* iluminación técnica */

scene.add(
  new THREE.AmbientLight(
    0xffffff,
    1.2
  )
);

const light1 =
  new THREE.DirectionalLight(
    0xffffff,
    1.2
  );

light1.position.set(5,5,5);

scene.add(light1);

const light2 =
  new THREE.DirectionalLight(
    0xffffff,
    0.6
  );

light2.position.set(-5,3,-5);

scene.add(light2);

/* ejes discretos */

const axes =
  new THREE.AxesHelper(1);

axes.position.set(-2,-2,-2);

scene.add(axes);

/* carga de modelos */

const loader = new GLTFLoader();

let currentModel = null;
let edgeLines = null;

function buildSelector() {

  const sel =
    document.getElementById('modelSelect');

  for(let i=0;i<=24;i++){

    const id =
      String(i).padStart(3,'0');

    const opt =
      document.createElement('option');

    opt.value=id;
    opt.textContent=`Pieza ${id}`;

    sel.appendChild(opt);
  }
}

buildSelector();

function loadModel(id){

  const path =
    `models/pieza_${id}.glb`;

  loader.load(path,gltf=>{

    if(currentModel)
      scene.remove(currentModel);

    if(edgeLines)
      scene.remove(edgeLines);

    currentModel = gltf.scene;

    scene.add(currentModel);

    centerModel();
    buildEdges();
    updateViewMode();
  });
}

function centerModel(){

  const box =
    new THREE.Box3()
      .setFromObject(currentModel);

  const center =
    box.getCenter(
      new THREE.Vector3()
    );

  currentModel.position.sub(center);

  const size =
    box.getSize(
      new THREE.Vector3()
    ).length();

  const dist = size * 1.5;

  camera.position.set(
    dist,
    dist * .7,
    dist
  );

  controls.update();
}

function buildEdges(){

  const group =
    new THREE.Group();

  currentModel.traverse(obj=>{

    if(!obj.isMesh) return;

    const edges =
      new THREE.EdgesGeometry(
        obj.geometry,
        25
      );

    const lines =
      new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color:0x222222
        })
      );

    lines.position.copy(obj.position);
    lines.rotation.copy(obj.rotation);
    lines.scale.copy(obj.scale);

    group.add(lines);
  });

  edgeLines = group;
  scene.add(edgeLines);
}

/* visualización */

function updateViewMode(){

  const mode =
    document.getElementById(
      'viewMode'
    ).value;

  if(!currentModel) return;

  currentModel.visible =
    mode !== 'wire';

  edgeLines.visible =
    mode !== 'solid';
}

document
.getElementById('viewMode')
.addEventListener(
  'change',
  updateViewMode
);

/* selector */

document
.getElementById('modelSelect')
.addEventListener(
  'change',
  e => loadModel(e.target.value)
);

/* escala */

document
.getElementById('scaleSlider')
.addEventListener(
  'input',
  e => {

    if(!currentModel) return;

    const s =
      parseFloat(
        e.target.value
      );

    currentModel.scale.setScalar(s);

    if(edgeLines)
      edgeLines.scale.setScalar(s);
  }
);

/* fullscreen */

document
.getElementById(
  'fullscreenBtn'
)
.addEventListener(
  'click',
  ()=>{

    document.body
      .requestFullscreen();
  }
);

/* autorotación */

let autoRotate = true;
let t = 0;

document
.getElementById('autoBtn')
.onclick = ()=> autoRotate=true;

document
.getElementById('pauseBtn')
.onclick = ()=> autoRotate=false;

controls.addEventListener(
  'start',
  ()=> autoRotate=false
);

function animate(){

  requestAnimationFrame(
    animate
  );

  if(
    currentModel &&
    autoRotate
  ){

    t += 0.01;

    currentModel.rotation.y += 0.005;

    currentModel.rotation.x =
      Math.sin(t*0.5)*0.25;

    if(edgeLines){

      edgeLines.rotation.y =
        currentModel.rotation.y;

      edgeLines.rotation.x =
        currentModel.rotation.x;
    }
  }

  controls.update();

  renderer.render(
    scene,
    camera
  );
}

animate();

loadModel('000');

window.addEventListener(
  'resize',
  ()=>{

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);