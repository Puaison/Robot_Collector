import * as THREE from 'three';
import { LoadingManager } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import URDFLoader from 'urdf-loader';
import GUI from 'lil-gui';


// SCENE


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x112200);

// LIGHTS


const light = new THREE.DirectionalLight(0xffffff,2); //2 is the intensity of the light
light.position.set(1, 1, 1);
scene.add(light);


// CAMERA


const camera = new THREE.PerspectiveCamera(
    45, //fov
    window.innerWidth / window.innerHeight, //aspect
    0.01, //near
    500 //far
);
camera.position.set(1, 1, 1);
camera.lookAt(0, 0, 0);



// GUI
const gui= new GUI();
gui.add(camera, 'fov', 1, 180).onChange(animate);



// RENDERER

const renderer = new THREE.WebGLRenderer(); //it will also create a canvas
renderer.setSize(window.innerWidth, window.innerHeight); // define the size of the canvas
document.body.appendChild(renderer.domElement); // add the canvas to the DOM

// Controls of the camera
const cameracontrols = new OrbitControls(camera, renderer.domElement);
cameracontrols.minDistance = 0.1;
cameracontrols.maxDistance = 10;

// LOADING UR5


const manager = new LoadingManager();
const loader = new URDFLoader(manager);
loader.packages = {
    ur_description: '/ur5/'
};

loader.load(
    '/ur5/ur5.urdf',
    robot => {
        scene.add(robot);
        //console.log(robot.joints);
        robot.setJointValue('shoulder_pan_joint', (3/2)*Math.PI);
        robot.setJointValue('shoulder_lift_joint', 0);
        robot.setJointValue('elbow_joint', Math.PI/2);
        robot.setJointValue('wrist_1_joint', Math.PI/2);
        robot.setJointValue('wrist_2_joint', Math.PI/2);
        robot.setJointValue('wrist_3_joint', Math.PI/2);
        console.log('UR5 loaded!', robot);

        const box = new THREE.Box3().setFromObject(robot);
        const center = box.getCenter(new THREE.Vector3());


        // Robot in the center of the scene
        robot.position.sub(center);
    },
    undefined,
    error => {
        console.error('Error in the loading', error);
    }
);



function animate(time) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  cameracontrols.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
