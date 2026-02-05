// Minimal 2.5D sandbox using Three.js
(() => {
  const container = document.getElementById('canvas-container');

  // Scene, camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061221);

  const sizes = { width: container.clientWidth, height: container.clientHeight };
  const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 2000);
  camera.position.set(30, 35, 30);
  camera.lookAt(0, 0, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(sizes.width, sizes.height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Controls (orbit but locked to low polar angle for 2.5D feel)
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2.1; // don't go below plane too much
  controls.minPolarAngle = 0.2;
  controls.target.set(0, 0, 0);

  // Lights
  const ambient = new THREE.HemisphereLight(0xbfe3ff, 0x080820, 0.6);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(50, 80, 25);
  dir.castShadow = true;
  dir.shadow.camera.left = -60;
  dir.shadow.camera.right = 60;
  dir.shadow.camera.top = 60;
  dir.shadow.camera.bottom = -60;
  dir.shadow.mapSize.set(2048, 2048);
  scene.add(dir);

  // Plane (ground)
  const planeGeo = new THREE.PlaneGeometry(200, 200);
  const planeMat = new THREE.MeshStandardMaterial({ color: 0x0b1a24, metalness: 0.1, roughness: 0.75 });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  plane.name = "ground";
  scene.add(plane);

  // Grid helper for sandbox feel
  const grid = new THREE.GridHelper(200, 40, 0x234, 0x10202a);
  grid.material.opacity = 0.45;
  grid.material.transparent = true;
  scene.add(grid);

  // Basic environment reflection (soft)
  scene.environment = null; // placeholder if you load envMap later

  // Objects array and helper functions
  const objects = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selected = null;
  let dragOffset = new THREE.Vector3();
  let isDragging = false;
  let spawnType = 'box';

  function spawnAt(point) {
    const size = 2 + Math.random() * 3;
    let mesh;
    if (spawnType === 'box') {
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.6, 0.5), roughness: 0.4, metalness: 0.1 });
      mesh = new THREE.Mesh(geo, mat);
    } else {
      const geo = new THREE.SphereGeometry(size / 1.6, 24, 18);
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5), roughness: 0.45, metalness: 0.05 });
      mesh = new THREE.Mesh(geo, mat);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(point).add(new THREE.Vector3(0, (mesh.geometry.boundingBox ? mesh.geometry.boundingBox.max.y : size/1.5), 0));
    // ensure y above plane:
    mesh.position.y = size/2;
    mesh.userData.spawnSize = size;
    scene.add(mesh);
    objects.push(mesh);
  }

  // Pointer events
  function getIntersectPlane(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects([plane], false);
    return intersects.length ? intersects[0] : null;
  }

  function getIntersectObjects(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(objects, false);
    return hits.length ? hits[0] : null;
  }

  renderer.domElement.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    const hitObj = getIntersectObjects(ev.clientX, ev.clientY);
    if (hitObj) {
      selected = hitObj.object;
      isDragging = true;
      // compute offset between object's position and plane intersection
      const planeHit = getIntersectPlane(ev.clientX, ev.clientY);
      if (planeHit) {
        dragOffset.copy(selected.position).sub(planeHit.point);
      } else {
        dragOffset.set(0,0,0);
      }
      return;
    }
    const planeHit = getIntersectPlane(ev.clientX, ev.clientY);
    if (planeHit) {
      spawnAt(planeHit.point);
    }
  });

  renderer.domElement.addEventListener('pointermove', (ev) => {
    if (!isDragging || !selected) return;
    const planeHit = getIntersectPlane(ev.clientX, ev.clientY);
    if (planeHit) {
      const newPos = planeHit.point.clone().add(dragOffset);
      // snap optionally to grid of 0.5
      newPos.x = Math.round(newPos.x * 2) / 2;
      newPos.z = Math.round(newPos.z * 2) / 2;
      selected.position.x = newPos.x;
      selected.position.z = newPos.z;
      // keep y relative to size
      selected.position.y = selected.userData.spawnSize / 2;
    }
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
    selected = null;
  });

  // GUI controls (dat.GUI)
  const gui = new dat.GUI({ autoPlace: false, width: 260 });
  document.getElementById('gui').appendChild(gui.domElement);
  const params = {
    spawn: 'box',
    clearAll: () => {
      objects.forEach(o => scene.remove(o));
      objects.length = 0;
    },
    shadows: true,
    cameraAngle: 35,
    ambient: 0.6
  };
  gui.add(params, 'spawn', ['box', 'sphere']).name('Spawn type').onChange(v => spawnType = v);
  gui.add(params, 'clearAll').name('Clear objects');
  gui.add(params, 'shadows').name('Shadows').onChange(v => {
    renderer.shadowMap.enabled = v;
    dir.castShadow = v;
    objects.forEach(o => { o.castShadow = v; o.receiveShadow = v; });
    plane.receiveShadow = v;
  });
  gui.add(params, 'cameraAngle', 10, 80).name('Camera angle').onChange(v => {
    camera.position.set(Math.cos(THREE.Math.degToRad(v))*40, Math.sin(THREE.Math.degToRad(v))*40, 30);
    camera.lookAt(0,0,0);
  });
  gui.add(params, 'ambient', 0, 1).name('Ambient').onChange(v => ambient.intensity = v);

  // Resize handling
  function onResize() {
    sizes.width = container.clientWidth; sizes.height = container.clientHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
  }
  window.addEventListener('resize', onResize);

  // Animation loop
  const clock = new THREE.Clock();
  function animate() {
    const dt = clock.getDelta();
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Helpful: expose simple API to programmatically add high-res textures later
  window.RHFSandbox = { scene, spawnAt, objects, renderer };
})();
