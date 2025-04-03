import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Basic Setup ---
const scene = new THREE.Scene();
const canvas = document.getElementById('solarSystemCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

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


// --- Animation Loop ---
const clock = new THREE.Clock(); // For more consistent animation speed (optional but good)

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Time elapsed since last frame

    // Update celestial objects
    celestialObjects.forEach(obj => {
        // Rotation (Spinning on axis)
        if (obj.data.rotationSpeed) {
            obj.mesh.rotation.y += obj.data.rotationSpeed; // Simple Y-axis rotation
            // For more realism, you could introduce axial tilt here:
            // obj.mesh.rotateOnAxis(new THREE.Vector3(tiltX, tiltY, tiltZ).normalize(), obj.data.rotationSpeed);
        }

        // Orbit (Revolving around the sun)
        if (obj.pivot && obj.data.orbitalSpeed) {
            obj.pivot.rotation.y += obj.data.orbitalSpeed * 0.5; // Slow down orbit slightly for visual clarity
        }
    });

    // Update controls
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
});

// --- Start Animation ---
animate(); 