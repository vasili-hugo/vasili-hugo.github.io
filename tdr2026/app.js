import * as THREE from 'three';

import { OrbitControls }
  from 'three/addons/controls/OrbitControls.js';

import { GLTFLoader }
  from 'three/addons/loaders/GLTFLoader.js';

const viewer = document.getElementById('viewer');

/* -------------------------------------------------- */
/* ESCENA */
/* -------------------------------------------------- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3f3f3);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.setPixelRatio(
  window.devicePixelRatio
);

viewer.appendChild(
  renderer.domElement
);

/* -------------------------------------------------- */
/* CONTROLES */
/* -------------------------------------------------- */

const controls = new OrbitControls(
  camera,
  renderer.domElement
);

controls.enableDamping = true;

/* -------------------------------------------------- */
/* ILUMINACIÓN */
/* -------------------------------------------------- */

scene.add(
  new THREE.AmbientLight(
    0xffffff,
    1.4
  )
);

const light1 =
  new THREE.DirectionalLight(
    0xffffff,
    1.2
  );

light1.position.set(
  5,
  5,
  5
);

scene.add(light1);

const light2 =
  new THREE.DirectionalLight(
    0xffffff,
    0.8
  );

light2.position.set(
  -5,
  3,
  -5
);

scene.add(light2);

/* pivot central */

/* -------------------------------------------------- */
/* PIVOT */
/* -------------------------------------------------- */

const pivot =
  new THREE.Group();

scene.add(pivot);

/* -------------------------------------------------- */
/* EJES */
/* -------------------------------------------------- */

const axes =
  new THREE.AxesHelper(1);

pivot.add(axes);

/* -------------------------------------------------- */
/* MODELOS */
/* -------------------------------------------------- */

const loader =
  new GLTFLoader();

let currentModel = null;
let edgeLines = null;



/* -------------------------------------------------- */
/* SELECTOR */
/* -------------------------------------------------- */

const modelSelect =
  document.getElementById(
    'modelSelect'
  );

for (let i = 0; i <= 24; i++) {

  const id =
    String(i).padStart(
      3,
      '0'
    );

  const opt =
    document.createElement(
      'option'
    );

  opt.value = id;
  opt.textContent =
    `Pieza ${id}`;

  modelSelect.appendChild(
    opt
  );
}

/* -------------------------------------------------- */
/* CARGA */
/* -------------------------------------------------- */

function loadModel(id) {

  const path =
    `models/pieza_${id}.glb`;

  loader.load(

    path,

    (gltf) => {

      pivot.rotation.set(
        0,
        0,
        0
      );

      pivot.scale.set(
        1,
        1,
        1
      );

      if (currentModel)
        pivot.remove(
          currentModel
        );

      if (edgeLines)
        pivot.remove(
          edgeLines
        );

      currentModel =
        gltf.scene;

      centerModel();

      pivot.add(
        currentModel
      );

      buildEdges();

      updateViewMode();
    },

    undefined,

    (err) => {
      console.error(err);
    }
  );
}

/* -------------------------------------------------- */
/* CENTRADO */
/* -------------------------------------------------- */

function centerModel() {

  const box =
    new THREE.Box3()
      .setFromObject(
        currentModel
      );

  const center =
    box.getCenter(
      new THREE.Vector3()
    );

  currentModel.position.sub(
    center
  );

  const size =
    box.getSize(
      new THREE.Vector3()
    );

  const radius =
    size.length();

  camera.position.set(
    radius * 1.5,
    radius,
    radius * 1.5
  );

  camera.lookAt(
    0,
    0,
    0
  );

  controls.target.set(
    0,
    0,
    0
  );

  controls.update();
}

/* -------------------------------------------------- */
/* ARISTAS */
/* -------------------------------------------------- */

function buildEdges() {

  currentModel.traverse((obj) => {

    if (!obj.isMesh) return;

    const edges =
      new THREE.EdgesGeometry(
        obj.geometry,
        40
      );

    const edgeLines =
      new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: 0x111111
        })
      );

    obj.add(edgeLines);

    obj.userData.edgeLines =
      edgeLines;
  });
}
function applyMaterialMode(mode) {

  currentModel.traverse((obj) => {

    if (!obj.isMesh) return;

    if (mode === "solid") {

      obj.material = new THREE.MeshStandardMaterial({

        color: 0xd8d8d8,

        transparent: false,
        opacity: 1
      });

      obj.userData.edgeLines.visible =
        false;
    }

    else if (mode === "mixed") {

      obj.material = new THREE.MeshStandardMaterial({

        color: 0xd8d8d8,

        transparent: true,
        opacity: 0.10
      });

      obj.userData.edgeLines.visible =
        true;
    }

    else if (mode === "wire") {

      obj.material.visible = false;

      obj.userData.edgeLines.visible =
        true;
    }

    else if (mode === "orientation") {

      const geom =
        obj.geometry;

      geom.computeVertexNormals();

      const normals =
        geom.attributes.normal;

      const colors = [];

      for (let i = 0; i < normals.count; i++) {

        const nx =
          Math.abs(
            normals.getX(i)
          );

        const ny =
          Math.abs(
            normals.getY(i)
          );

        const nz =
          Math.abs(
            normals.getZ(i)
          );

        colors.push(
          nx,
          ny,
          nz
        );
      }

      geom.setAttribute(

        'color',

        new THREE.Float32BufferAttribute(
          colors,
          3
        )
      );

      obj.material =
        new THREE.MeshStandardMaterial({

          vertexColors: true,

          transparent: true,

          opacity: 0.35
        });

      obj.userData.edgeLines.visible =
        true;
    }
  });
}


/* -------------------------------------------------- */
/* MODOS */
/* -------------------------------------------------- */

function updateViewMode() {

  if (!currentModel) return;

  const mode =
    document.getElementById(
      'viewMode'
    ).value;

  applyMaterialMode(mode);
}

document
  .getElementById(
    'viewMode'
  )
  .addEventListener(
    'change',
    updateViewMode
  );

/* -------------------------------------------------- */
/* ESCALA */
/* -------------------------------------------------- */

document
  .getElementById(
    'scaleSlider'
  )
  .addEventListener(
    'input',
    (e) => {

      const s =
        parseFloat(
          e.target.value
        );

      pivot.scale.setScalar(
        s
      );
    }
  );

/* -------------------------------------------------- */
/* FULLSCREEN */
/* -------------------------------------------------- */

document
  .getElementById(
    'fullscreenBtn'
  )
  .addEventListener(
    'click',
    () => {

      if (
        !document.fullscreenElement
      ) {

        document.body
          .requestFullscreen();

      } else {

        document
          .exitFullscreen();
      }
    }
  );

/* -------------------------------------------------- */
/* AUTO ROTACIÓN */
/* -------------------------------------------------- */

let autoRotate = true;

let rotationMode = 'y';

let accumulated = 0;

const ROT_SPEED = 0.01;

let resumeTimeout;

document
  .getElementById(
    'autoBtn'
  )
  .onclick =
  () => autoRotate = true;

document
  .getElementById(
    'pauseBtn'
  )
  .onclick =
  () => autoRotate = false;

controls.addEventListener(
  'start',
  () => {

    autoRotate = false;

    clearTimeout(
      resumeTimeout
    );
  }
);

controls.addEventListener(
  'end',
  () => {

    clearTimeout(
      resumeTimeout
    );

    resumeTimeout =
      setTimeout(
        () => {
          autoRotate = true;
        },
        5000
      );
  }
);

/* -------------------------------------------------- */
/* ANIMACIÓN */
/* -------------------------------------------------- */

function animate() {

  requestAnimationFrame(
    animate
  );

  if (
    currentModel &&
    autoRotate
  ) {

    if (
      rotationMode === 'y'
    ) {

      pivot.rotation.y +=
        ROT_SPEED;

      accumulated +=
        ROT_SPEED;

      if (
        accumulated >=
        Math.PI * 2
      ) {

        accumulated = 0;

        rotationMode = 'x';
      }

    } else {

      pivot.rotation.x +=
        ROT_SPEED;

      accumulated +=
        ROT_SPEED;

      if (
        accumulated >=
        Math.PI * 2
      ) {

        accumulated = 0;

        rotationMode = 'y';
      }
    }
  }

  controls.update();

  renderer.render(
    scene,
    camera
  );
}

animate();

/* -------------------------------------------------- */
/* EVENTOS */
/* -------------------------------------------------- */

modelSelect.addEventListener(
  'change',
  (e) => {

    loadModel(
      e.target.value
    );
  }
);

window.addEventListener(
  'resize',
  () => {

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

/* -------------------------------------------------- */
/* INICIO */
/* -------------------------------------------------- */

loadModel('000');