import { block_Height,robot_initial_joints_values,prova_inverse_kin, rest_q, floor_rows, floor_coloumns, floor_tile_size, floor_tile_height } from './config.js';
import * as THREE from 'three';
import { LoadingManager } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import URDFLoader from 'urdf-loader';
import GUI from 'lil-gui';
import * as TWEEN from '@tweenjs/tween.js';
import { normalize_Angle } from './utils.js';

//#region AMMO Setup
const My_Ammo = await Ammo();

const collision_confinguration= new My_Ammo.btDefaultCollisionConfiguration();
const collision_dispatcher =new My_Ammo.btCollisionDispatcher(collision_confinguration);
const dbvt_Broadphase = new My_Ammo.btDbvtBroadphase();
const solver =new My_Ammo.btSequentialImpulseConstraintSolver();
const world_with_Physics = new My_Ammo.btDiscreteDynamicsWorld(
    collision_dispatcher,
    dbvt_Broadphase,
    solver,
    collision_confinguration
);

world_with_Physics.setGravity(new My_Ammo.btVector3(0, -9.0, 0));
//#endregion

//#region scene setup

export let ur5robot = null;
export let ur5gripper = null;

// Tween setup
const My_TWEEN = new TWEEN.Group();

// SCENE

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xC5A643);

// LIGHTS


const light1 = new THREE.DirectionalLight(0xffffff,2); //2 is the intensity of the light
const light2 = new THREE.DirectionalLight(0xffffff,2);
const light3 = new THREE.DirectionalLight(0xffffff,2);
const light4 = new THREE.DirectionalLight(0xffffff,2);
light1.position.set(-1, 1, -1);
light2.position.set(1, 1, -1);
light3.position.set(-1, 1, 1);
light4.position.set(1, 1, 1);
scene.add(light1);
scene.add(light2);
scene.add(light3);
scene.add(light4);


// CAMERA


const camera = new THREE.PerspectiveCamera(
    45, //fov
    window.innerWidth / window.innerHeight, //aspect
    0.01, //near
    500 //far
);
camera.position.set(1, 2, 2);
//camera.lookAt(-5, -5, -5);



// GUI
const gui= new GUI();
gui.add(camera, 'fov', 1, 180).onChange(animate);



// RENDERER

export const renderer = new THREE.WebGLRenderer(); //it will also create a canvas
renderer.setSize(window.innerWidth, window.innerHeight); // define the size of the canvas
document.body.appendChild(renderer.domElement); // add the canvas to the DOM

// Controls of the camera
const cameracontrols = new OrbitControls(camera, renderer.domElement);
cameracontrols.minDistance = 0.1;
cameracontrols.maxDistance = 5;

//#region FLOOR Setup
//#region Visual Floor description (IN Three.js)
export const floor_Visual = new THREE.Group();

for (let i = 0; i < floor_rows; i++) {
    for (let j = 0; j < floor_coloumns; j++) {

        const tile_geometry = new THREE.BoxGeometry(
            floor_tile_size,
            floor_tile_height,
            floor_tile_size
        );

        let tile_color;
        if ((i + j)%2 == 0) {
            tile_color = new THREE.MeshStandardMaterial({color: 0x000000}); 
        }
        else {
            tile_color = new THREE.MeshStandardMaterial({color: 0xC5AA4A}); 
        }

        const tile = new THREE.Mesh(tile_geometry, tile_color);

        tile.position.set(
            (j - floor_coloumns/2 + 0.5) * floor_tile_size,
            -floor_tile_height/2 ,
            (i - floor_rows/2 + 0.5) * floor_tile_size
        );

        floor_Visual.add(tile);
    }
}
scene.add(floor_Visual);
//#endregion

//#region Physical Floor description (for Ammo environment)

const floor_Width = floor_coloumns * floor_tile_size;   // 2.0
const floor_Height = floor_tile_size;       // 0.05

//Create a Ammo-box with the same dimension of the visual floor in three.js
const floor_Shape_Ammo = new My_Ammo.btBoxShape(new My_Ammo.btVector3(floor_Width/2,floor_Height/2,floor_Width/2));

const floor_Transform_Ammo = new My_Ammo.btTransform(); 
floor_Transform_Ammo.setIdentity();
//set the upper part of the floor to be in the Y=0
floor_Transform_Ammo.setOrigin(new My_Ammo.btVector3(0,-floor_Height/2,0));
const floor_initial_Transform_Ammo = new My_Ammo.btDefaultMotionState(floor_Transform_Ammo); //this is the initial transformation of the flsoor

const floor_inertia_Ammo = new My_Ammo.btVector3(0, 0, 0); // No inertia for the floor

//floor_Shape_Ammo.calculateLocalInertia(1,floor_inertia_Ammo);

const floor_info = new My_Ammo.btRigidBodyConstructionInfo( //Gathering Info for constructing the floor
    0,                  // mass = 0
    floor_initial_Transform_Ammo, //initial position
    floor_Shape_Ammo, // shape of the object
    floor_inertia_Ammo
);

const floor_Physical = new My_Ammo.btRigidBody(floor_info); //Finally, create the rigid body with the info described above
world_with_Physics.addRigidBody(floor_Physical);
//#endregion
//#endregion


// BLOCK FOR THE ROBOT
const geometry_block = new THREE.BoxGeometry(0.15, block_Height, 0.15);
const material_block = new THREE.MeshStandardMaterial({ color: 0xC5AA4A });
const block = new THREE.Mesh(geometry_block, material_block);
block.position.set(0, block_Height/2, 0);
scene.add(block);

// LOADING UR5

const manager = new LoadingManager();
const loader = new URDFLoader(manager);
loader.packages = {
    ur_description: '/ur5/',
    robotiq_85_description: '/ur5/'
};

export function load_Robot() {
    return new Promise((resolve, reject) => {
        loader.load(
            '/ur5/ur5.urdf',
            robot => {
                ur5robot = robot;
                scene.add(robot);

                if (prova_inverse_kin) {
                    update_Threejs_Robot_Joints(rest_q,robot);
                    console.log('UR5 loaded in IK!', robot);
                } else {
                    update_Threejs_Robot_Joints(robot_initial_joints_values,robot);
                    console.log('UR5 loaded normally!', robot);
                }

                // Rotatation of the mesh in order to stand on the floor
                robot.rotation.x = -Math.PI/2;
                // Robot in the center of the scene above the box
                robot.position.set(0, 0.4 , 0);
                resolve();
            },
            undefined,
            reject
        );
    });
}

export function load_Gripper() {
    return new Promise((resolve, reject) => {
        loader.load(
            '/ur5/robotiq_85_gripper_simple.urdf',
            gripper => {
                ur5gripper = gripper;
                const finger_sensor_geometry = new THREE.BoxGeometry(0.038, 0.0156, 0.022);
                const finger_sensor_material = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });
            
                const finger_sensor_left = new THREE.Mesh(finger_sensor_geometry, finger_sensor_material);
                finger_sensor_left.position.set(0.025,0.0,0.0); //0.032
            
                const finger_sensor_right = new THREE.Mesh(finger_sensor_geometry, finger_sensor_material);
                finger_sensor_right.position.set(0.025,0.0,0.0);
            
                ur5gripper.links["robotiq_85_left_finger_tip_link"].add(finger_sensor_left);
                ur5gripper.links["robotiq_85_right_finger_tip_link"].add(finger_sensor_right);


                //ur5gripper.setJointValue('robotiq_85_left_knuckle_joint', 0.5); // the first
                //gripper.setJointValue('robotiq_85_right_knuckle_joint', 0.5);
                //gripper.setJointValue('robotiq_85_left_finger_joint', 10); // it does not work
                //gripper.setJointValue('robotiq_85_left_inner_knuckle_joint', 0.7); // it works strange but not specular
                //gripper.setJointValue('robotiq_85_left_finger_tip_joint', 0.7); // it works strange but not specular

                // Mesh setup for the gripper
                gripper.position.set(0, 0.0, 0.137);
                gripper.rotation.y = -Math.PI/2;

                ur5robot.joints["wrist_3_joint"].add(gripper);
                resolve();
            },
            undefined,
            reject
        );
    });
}

//#endregion
const timer = new THREE.Timer();

export function animate(time) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    cameracontrols.update();
    My_TWEEN.update(time);
    timer.update();
    const elapsed_Time = timer.getDelta();

    // How to step the physical simulation
    world_with_Physics.stepSimulation(elapsed_Time,10);
    renderer.render(scene, camera);
}

export function update_Threejs_Robot_Joints(q,robot_ur5) {
    robot_ur5.setJointValue('shoulder_pan_joint', q[0]); //this rotate the base
    robot_ur5.setJointValue('shoulder_lift_joint', q[1]); // this make the robot up
    robot_ur5.setJointValue('elbow_joint', q[2]); // the "gomito"
    robot_ur5.setJointValue('wrist_1_joint', q[3]); 
    robot_ur5.setJointValue('wrist_2_joint', q[4]);
    robot_ur5.setJointValue('wrist_3_joint', q[5]); //rotation only of the tooltip
}

export function move_Threejs_Robot(q_initial, q_final, robot_ur5, duration = 3000) {
    return new Promise((resolve) => {
        const q = Array.from(q_initial);
        const target = Array.from(q_final);
        new TWEEN.Tween(q, My_TWEEN) //Start from q
            .to(target, duration) //It must reach target in these milliseconds
            .easing(TWEEN.Easing.Sinusoidal.InOut) //More sweet animation at the start and at the end
            .onUpdate(() => { // Function called during the animation
                const temp_q = [
                    q[0],
                    q[1],
                    q[2],
                    q[3],
                    q[4],
                    q[5]
                ];
                const current_q = temp_q.map(angle => normalize_Angle(angle));
                update_Threejs_Robot_Joints(current_q, robot_ur5);
            })
            .onComplete(() => {resolve();}) //Function called at the end of the animation
            .start(); //Let start the planned Tween
    });
}

export function open_close_Threejs_Gripper(initial_value, final_value, robotiq_85_gripper, duration = 3000) {
    return new Promise((resolve) => {
        const current_value = [initial_value];
        new TWEEN.Tween(current_value, My_TWEEN) //Start from q
            .to([final_value], duration) //It must reach target in these milliseconds
            .easing(TWEEN.Easing.Sinusoidal.InOut) //More sweet animation at the start and at the end
            .onUpdate(() => { // Function called during the animation
                robotiq_85_gripper.setJointValue('robotiq_85_left_knuckle_joint', current_value[0]);
            })
            .onComplete(() => {resolve();}) //Function called at the end of the animation
            .start(); //Let start the planned Tween
    });
}