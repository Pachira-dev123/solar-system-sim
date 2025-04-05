import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// --- Texture Loader ---
const textureLoader = new THREE.TextureLoader();

// --- Basic Setup ---
const scene = new THREE.Scene();
const canvas = document.getElementById('solarSystemCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// --- CSS2D Renderer Setup ---
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.getElementById('label-container').appendChild(labelRenderer.domElement);

const camera = new THREE.PerspectiveCamera(
    75, // Field of View
    window.innerWidth / window.innerHeight, // Aspect Ratio
    0.1, // Near clipping plane
    2000 // Far clipping plane
);
camera.position.set(0, 150, 400); // Start position
camera.lookAt(0, 0, 0);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooths camera movement
controls.dampingFactor = 0.05;

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x333333); // Soft ambient light
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xFFFFFF, 3, 500); // Sun light
scene.add(pointLight); // Light originates from the center (like the sun)

// --- Celestial Body Data (Relative values for demonstration) ---
const solarSystemData = [
    { name: 'Sun', radius: 20, color: 0xFFFF00, isSun: true },
    { name: 'Mercury', radius: 2, color: 0xAAAAAA, orbitalRadius: 50, orbitalSpeed: 0.04, rotationSpeed: 0.01 },
    { name: 'Venus', radius: 4, color: 0xFFE4B5, orbitalRadius: 80, orbitalSpeed: 0.025, rotationSpeed: 0.005 },
    { name: 'Earth', radius: 4.5, color: 0x4682B4, orbitalRadius: 120, orbitalSpeed: 0.015, rotationSpeed: 0.02 },
    { name: 'Mars', radius: 3, color: 0xFF4500, orbitalRadius: 160, orbitalSpeed: 0.01, rotationSpeed: 0.018 },
    { name: 'Jupiter', radius: 12, color: 0xD2B48C, orbitalRadius: 220, orbitalSpeed: 0.005, rotationSpeed: 0.04 },
    { name: 'Saturn', radius: 10, color: 0xF4A460, orbitalRadius: 280, orbitalSpeed: 0.003, rotationSpeed: 0.035, hasRing: true },
    { name: 'Uranus', radius: 7, color: 0xAFEEEE, orbitalRadius: 340, orbitalSpeed: 0.002, rotationSpeed: 0.025 },
    { name: 'Neptune', radius: 6.5, color: 0x4169E1, orbitalRadius: 390, orbitalSpeed: 0.001, rotationSpeed: 0.023 },
];

const celestialObjects = []; // To store meshes and pivots for animation

// --- Create Celestial Bodies ---
solarSystemData.forEach(data => {
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);

    let material;
    if (data.isSun) {
        // Sun should emit light, basic material works well here
        material = new THREE.MeshBasicMaterial({ color: data.color, wireframe: false });
    } else {
        // Planets reflect light
        material = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.8, metalness: 0.2, wireframe: false });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = data.name; // Assign name for potential future reference

    // --- Create Label ---
    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
    labelDiv.textContent = data.name;
    const label = new CSS2DObject(labelDiv);
    // Position the label slightly above the planet
    label.position.set(0, data.radius * 1.5, 0); // Adjust Y offset as needed
    mesh.add(label); // Add label as a child of the mesh

    // --- Click Listener for Focusing ---
    labelDiv.addEventListener('click', () => {
        focusOnObject(mesh); // Call focus function when label is clicked
    });

    if (data.isSun) {
        scene.add(mesh);
        celestialObjects.push({ mesh: mesh, data: data }); // Sun doesn't orbit or rotate in this simple model relative to itself
    } else {
        // Create an Orbit Pivot: An invisible object at the center (sun's position)
        // The planet will be a child of this pivot. Rotating the pivot makes the planet orbit.
        const orbitPivot = new THREE.Object3D();
        scene.add(orbitPivot);

        // Position the planet relative to the pivot
        mesh.position.x = data.orbitalRadius;

        // Add the planet mesh to the pivot
        orbitPivot.add(mesh);

        // Optional: Add Rings for Saturn
        if (data.hasRing) {
            const ringGeometry = new THREE.RingGeometry(data.radius * 1.3, data.radius * 2, 64);
            // Make ring material slightly transparent and distinct color
            const ringMaterial = new THREE.MeshBasicMaterial({
                 color: 0x888888,
                 side: THREE.DoubleSide,
                 opacity: 0.6,
                 transparent: true
                });
            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            // Rotate the ring to be flat relative to the orbit
            ringMesh.rotation.x = Math.PI / 2;
            mesh.add(ringMesh); // Add ring directly to the planet mesh
        }

        // Store the mesh and its pivot for animation
        celestialObjects.push({ mesh: mesh, pivot: orbitPivot, data: data });
    }
});

// --- Create Theo ---
const theoTexture = textureLoader.load('images/image.jpg');
const theoGeometry = new THREE.PlaneGeometry(30, 30); // Make him reasonably large
const theoMaterial = new THREE.MeshBasicMaterial({ 
    map: theoTexture, 
    side: THREE.DoubleSide, // Visible from both sides
    transparent: true,     // Allow transparency
    // alphaTest: 0.1      // Optional: only render pixels above a certain alpha threshold
});
const theoMesh = new THREE.Mesh(theoGeometry, theoMaterial);
theoMesh.name = "Theo";
scene.add(theoMesh);

// Add Theo to objects array for potential interaction (like focus), but handle animation separately
celestialObjects.push({ mesh: theoMesh, data: { name: 'Theo' }, isTheo: true }); 


// --- Animation Loop ---
const clock = new THREE.Clock(); // For more consistent animation speed (optional but good)

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Time elapsed since last frame
    const elapsedTime = clock.getElapsedTime(); // Total time elapsed

    // Update celestial objects
    celestialObjects.forEach(obj => {
        if (obj.isTheo) {
            // --- Theo's Cool Animation ---
            const orbitRadiusX = 300; // Wider than Neptune
            const orbitRadiusZ = 200;
            const speed = 0.1; // How fast he moves
            const tiltAngle = Math.PI / 6; // Tilt the orbit 30 degrees

            // Calculate position in a tilted ellipse
            const angle = elapsedTime * speed;
            const x = Math.cos(angle) * orbitRadiusX;
            let z = Math.sin(angle) * orbitRadiusZ;
            let y = Math.sin(angle) * orbitRadiusZ * Math.sin(tiltAngle); // Apply tilt to Y
            z = z * Math.cos(tiltAngle); // Adjust Z based on tilt

            obj.mesh.position.set(x, y, z);

            // Gentle spin
            obj.mesh.rotation.z += 0.005; 

            // Make Theo always face the camera (Billboard effect)
            obj.mesh.lookAt(camera.position);

        } else {
            // --- Existing Planet Animation ---
            // Rotation (Spinning on axis)
            if (obj.data.rotationSpeed) {
                obj.mesh.rotation.y += obj.data.rotationSpeed; // Simple Y-axis rotation
            }

            // Orbit (Revolving around the sun)
            if (obj.pivot && obj.data.orbitalSpeed) {
                obj.pivot.rotation.y += obj.data.orbitalSpeed * 0.5; // Slow down orbit slightly
            }
        }
    });

    // Update controls
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera); // Render labels
}

// --- Function to Focus Camera ---
const targetPosition = new THREE.Vector3();
function focusOnObject(object) {
    // Get the world position of the object
    object.getWorldPosition(targetPosition);

    // Tell OrbitControls to target this position
    controls.target.copy(targetPosition);

    // Optional: You might want to move the camera closer or adjust its distance
    // This requires more complex calculations based on object size and current camera position
    // For simplicity, we'll just change the look-at point for now.
}

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    labelRenderer.setSize(window.innerWidth, window.innerHeight); // Update label renderer size
});

// --- Start Animation ---
animate(); 