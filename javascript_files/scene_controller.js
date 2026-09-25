import { block_Height,robot_initial_joints_values,prova_inverse_kin, rest_q, floor_rows, floor_coloumns, floor_tile_size, floor_tile_height,max_iterations,epsilon_position,epislon_orientation } from './config.js';
import * as THREE from 'three';
import { LoadingManager } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import URDFLoader from 'urdf-loader';
import GUI from 'lil-gui';
import * as TWEEN from '@tweenjs/tween.js';
import { normalize_Angle, normalize_Angle_Tween } from './utils.js';
import { inverse_Kinematics } from './inverse_kinematics.js';

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
export let ur5tcp=null;
export let ur5gripper = null;
export let ur5finger_sensor_left_mesh = null;
export let ur5finger_sensor_right_mesh=null;
export let ur5finger_sensor_left_Ammo = null;
export let ur5finger_sensor_right_Ammo=null;

export let selected_cube_mesh = null;
export let selected_cube_Ammo = null;

export let object_collected = false;
export let last_gripper_value = 0.0;
let last_q_configuration = null;
const chest_meshes = [];
const collectable_cubes = [];
let executing_animation = false;

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
camera.position.set(-0.5, 2.7, 1);
//camera.lookAt(-5, -5, -5);



// GUI
const gui= new GUI();
gui.add(camera, 'fov', 1, 180).onChange(animate);



// RENDERER

export const renderer = new THREE.WebGLRenderer(); //it will also create a canvas
renderer.setSize(window.innerWidth, window.innerHeight); // define the size of the canvas
document.body.appendChild(renderer.domElement); // add the canvas to the DOM

// Controls of the camera
const camera_controls = new OrbitControls(camera, renderer.domElement);
camera_controls.enablePan=true; //enable translation of the camera
camera_controls.minDistance = 0.1;
camera_controls.maxDistance = 5;

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

//#region CHESTS
const chest_mesh_1 = create_chest();
chest_mesh_1.position.x =0.75;
chest_meshes.push(chest_mesh_1);
const chest_mesh_2 = create_chest();
chest_mesh_2.position.x =-0.75;
chest_meshes.push(chest_mesh_2);

//#endregion

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
                    last_q_configuration = rest_q;
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
            
                const finger_sensor_left_mesh= new THREE.Mesh(finger_sensor_geometry, finger_sensor_material);
                finger_sensor_left_mesh.position.set(0.025,0.0,0.0); //0.032
            
                const finger_sensor_right_mesh = new THREE.Mesh(finger_sensor_geometry, finger_sensor_material);
                finger_sensor_right_mesh.position.set(0.025,0.0,0.0);
            
                ur5gripper.links["robotiq_85_left_finger_tip_link"].add(finger_sensor_left_mesh);
                ur5gripper.links["robotiq_85_right_finger_tip_link"].add(finger_sensor_right_mesh);

                ur5finger_sensor_left_mesh=finger_sensor_left_mesh;
                ur5finger_sensor_right_mesh=finger_sensor_right_mesh;

                //Ammo syncronization for the two sensors
                ur5finger_sensor_left_Ammo = create_physical_finger_sensor(ur5finger_sensor_left_mesh);
                ur5finger_sensor_left_Ammo.setUserIndex(2000);

                ur5finger_sensor_right_Ammo = create_physical_finger_sensor(ur5finger_sensor_right_mesh);
                ur5finger_sensor_right_Ammo.setUserIndex(3000);

                world_with_Physics.addRigidBody(ur5finger_sensor_left_Ammo);
                world_with_Physics.addRigidBody(ur5finger_sensor_right_Ammo);

                ur5tcp=ur5gripper.links["dummy_center_indicator_link"];

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
    camera_controls.update();
    My_TWEEN.update(time);

    if (ur5finger_sensor_left_Ammo && ur5finger_sensor_right_Ammo) { //skip this if the finger sensors are not already created
        syncronize_finger_mesh_to_Ammo(ur5finger_sensor_left_mesh, ur5finger_sensor_left_Ammo);
        syncronize_finger_mesh_to_Ammo(ur5finger_sensor_right_mesh, ur5finger_sensor_right_Ammo);
    }
    timer.update();
    const elapsed_Time = timer.getDelta();
    // How to step the physical simulation
    world_with_Physics.stepSimulation(elapsed_Time,10);
    if (!object_collected){
        syncronize_Ammo_to_mesh();
    }
    else {
        syncronize_mesh_to_Ammo();
    }
    renderer.render(scene, camera);
}

export function update_Threejs_Robot_Joints(q,robot_ur5) {
    robot_ur5.setJointValue('shoulder_pan_joint', q[0]); //this rotate the base
    robot_ur5.setJointValue('shoulder_lift_joint', q[1]); // this make the robot up
    robot_ur5.setJointValue('elbow_joint', q[2]); // the "gomito"
    robot_ur5.setJointValue('wrist_1_joint', q[3]); 
    robot_ur5.setJointValue('wrist_2_joint', q[4]);
    robot_ur5.setJointValue('wrist_3_joint', q[5]); //rotation only of the tooltip
    //last_q_configuration = q; // If I update the last_q_configuration here and not in the tween it does not work (maybe depends on the normalization)
}

export function move_Threejs_Robot(q_initial, q_final, robot_ur5, duration = 5000) {
    return new Promise((resolve) => {
        const q = Array.from(q_initial.map(angle => normalize_Angle_Tween(angle)));
        const target = Array.from(q_final.map(angle => normalize_Angle_Tween(angle)));
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
                const current_q = temp_q.map(angle => normalize_Angle_Tween(angle));
                update_Threejs_Robot_Joints(current_q, robot_ur5);
            })
            .onComplete(() => {last_q_configuration=target; resolve();}) //Function called at the end of the animation
            .start(); //Let start the planned Tween
    });
}

export function open_close_Threejs_Gripper(initial_value, final_value, robotiq_85_gripper, duration = 5000) {
    return new Promise((resolve) => {
        const current_value = [initial_value];
        const gripper_tween = new TWEEN.Tween(current_value, My_TWEEN) //Start from current_value
            .to([final_value], duration) //It must reach target in these milliseconds
            .easing(TWEEN.Easing.Sinusoidal.InOut) //More sweet animation at the start and at the end
            .onUpdate(() => { // Function called during the animation
                if (detect_collisions_between(1,3000) && detect_collisions_between(1,2000) && !(object_collected)){
                    console.log("Stop grasping");
                    gripper_tween.stop();
                    collect_object();
                    resolve();
                }
                if (!detect_collisions_between(1,3000) && !detect_collisions_between(1,2000) && object_collected){
                    console.log("Release object");
                    release_object();
                }
                robotiq_85_gripper.setJointValue('robotiq_85_left_knuckle_joint', current_value[0]);
                last_gripper_value = current_value[0];
            })
            .onComplete(() => {resolve();}) //Function called at the end of the animation
            .start(); //Let start the planned Tween
    });
}

function create_physical_finger_sensor(finger_sensor_mesh) {
    const sensor_shape_Ammo = new My_Ammo.btBoxShape(new My_Ammo.btVector3(0.038/2, 0.0156/2, 0.022/2));
    const initial_transformation = new My_Ammo.btTransform();
    initial_transformation.setIdentity();
    const position_mesh = new THREE.Vector3();
    const quaternion_mesh = new THREE.Quaternion();
    finger_sensor_mesh.getWorldPosition(position_mesh);
    finger_sensor_mesh.getWorldQuaternion(quaternion_mesh);
    initial_transformation.setOrigin(new My_Ammo.btVector3(position_mesh.x,position_mesh.y,position_mesh.z));
    initial_transformation.setRotation(new My_Ammo.btQuaternion(quaternion_mesh.x,quaternion_mesh.y,quaternion_mesh.z,quaternion_mesh.w));
    const initial_state_Ammo= new My_Ammo.btDefaultMotionState(initial_transformation);
    const info_rigid_body_Ammo = new My_Ammo.btRigidBodyConstructionInfo(
        0, //mass
        initial_state_Ammo,
        sensor_shape_Ammo,
        new My_Ammo.btVector3(0, 0, 0)
    );
    const physical_finger_sensor = new My_Ammo.btRigidBody(info_rigid_body_Ammo);
    return physical_finger_sensor;
}

function syncronize_finger_mesh_to_Ammo(mesh, rigid_body){
    const position_mesh = new THREE.Vector3();
    const quaternion_mesh = new THREE.Quaternion();
    mesh.getWorldPosition(position_mesh);
    mesh.getWorldQuaternion(quaternion_mesh);

    const current_transformation = new My_Ammo.btTransform();
    current_transformation.setIdentity();
    current_transformation.setOrigin(new My_Ammo.btVector3(position_mesh.x,position_mesh.y,position_mesh.z));
    current_transformation.setRotation(new My_Ammo.btQuaternion(quaternion_mesh.x,quaternion_mesh.y,quaternion_mesh.z,quaternion_mesh.w));
    rigid_body.setWorldTransform(current_transformation);
    //Update the internal collision engine
    const motion_state = rigid_body.getMotionState();

    
    motion_state.setWorldTransform(current_transformation);
    world_with_Physics.updateSingleAabb(rigid_body);
}

export function create_collectable_object(position=[0.5,0.03,0.5]) {
    // NEW BLOCK TO GRASP
    const collectable_object_size = 0.047; //0.03
    const collectable_object_mass =1;
    const object_collectable_geometry = new THREE.BoxGeometry(
        collectable_object_size,
        collectable_object_size,
        collectable_object_size
    );

    const collectable_object_material = new THREE.MeshStandardMaterial({color: 0xffff44});
    const collectable_object_mesh = new THREE.Mesh(object_collectable_geometry,collectable_object_material);
    collectable_object_mesh.position.set(position[0], position[1], position[2]);
    collectable_object_mesh.userData.id=1;
    const eulerXYZ = new THREE.Euler(
        0,
        -Math.PI/4,
        -Math.PI/2,
        'XYZ'
    );
    // Convert XYZ -> quaternion
    const quaternion_to_write = new THREE.Quaternion().setFromEuler(eulerXYZ);
    console.log("Quaternion to write in the other file",quaternion_to_write);
    const RPY = new THREE.Euler();
    RPY.setFromQuaternion(quaternion_to_write, 'XYZ');
    console.log("Come vorrei che fosse orientato",RPY);

    collectable_object_mesh.rotation.z=-Math.PI/2;
    collectable_object_mesh.rotation.y=-Math.PI/4;
    scene.add(collectable_object_mesh);
    console.log("Come è orientato veramente",collectable_object_mesh.rotation);

    const collectable_object_shape_Ammo = new My_Ammo.btBoxShape(new My_Ammo.btVector3(collectable_object_size/2, collectable_object_size/2, collectable_object_size/2));
    const initial_transformation = new My_Ammo.btTransform();
    initial_transformation.setIdentity();
    initial_transformation.setOrigin(new My_Ammo.btVector3(position[0], position[1], position[2]));

    const quaternion = collectable_object_mesh.quaternion;
    initial_transformation.setRotation(new My_Ammo.btQuaternion(quaternion.x,quaternion.y,quaternion.z,quaternion.w));
    const initial_state_Ammo= new My_Ammo.btDefaultMotionState(initial_transformation);
    const collectable_object_inertia_Ammo=new My_Ammo.btVector3(0, 0, 0);
    collectable_object_shape_Ammo.calculateLocalInertia(collectable_object_mass,collectable_object_inertia_Ammo);
    const info_rigid_body_Ammo = new My_Ammo.btRigidBodyConstructionInfo(
        collectable_object_mass, //mass
        initial_state_Ammo,
        collectable_object_shape_Ammo,
        collectable_object_inertia_Ammo
    );
    const collectable_object_Ammo = new My_Ammo.btRigidBody(info_rigid_body_Ammo);
    collectable_object_Ammo.setActivationState(4); //otherwise after sometime Ammo will deactivate it
    world_with_Physics.addRigidBody(collectable_object_Ammo);

    return {mesh:collectable_object_mesh, Ammo:collectable_object_Ammo};
}

export function set_cube_mesh(mesh) {
    selected_cube_mesh = mesh;
}

export function set_cube_Ammo(object_Ammo) {
    selected_cube_Ammo = object_Ammo;
    selected_cube_Ammo.setUserIndex(1);
}

function syncronize_Ammo_to_mesh(){
    if (selected_cube_mesh && selected_cube_Ammo){
        const motion_state = selected_cube_Ammo.getMotionState();
        const Ammo_transformation = new My_Ammo.btTransform();
        motion_state.getWorldTransform(Ammo_transformation);

        const position = Ammo_transformation.getOrigin();
        const orientation = Ammo_transformation.getRotation();

        selected_cube_mesh.position.set(position.x(),position.y(),position.z());
        selected_cube_mesh.quaternion.set(orientation.x(), orientation.y(), orientation.z(), orientation.w());

    }
    else {
        return;
    }
}

function syncronize_mesh_to_Ammo(){
    if (selected_cube_mesh && selected_cube_Ammo){
        const position = new THREE.Vector3();
        const orientation = new THREE.Quaternion();
        selected_cube_mesh.getWorldPosition(position);
        selected_cube_mesh.getWorldQuaternion(orientation);

        const Ammo_transformation = new My_Ammo.btTransform();
        Ammo_transformation.setIdentity();

        const Ammo_position = Ammo_transformation.getOrigin();
        Ammo_position.setValue(position.x,position.y,position.z);

        Ammo_transformation.setRotation(new My_Ammo.btQuaternion(orientation.x,orientation.y,orientation.z,orientation.w));
        selected_cube_Ammo.setWorldTransform(Ammo_transformation);
        const motion_state = selected_cube_Ammo.getMotionState();

        
        motion_state.setWorldTransform(Ammo_transformation);
        world_with_Physics.updateSingleAabb(selected_cube_Ammo);

    }
    else {
        return;
    }
}

function detect_collisions_between(Id_object_Ammo_1, Id_object_Ammo_2){
    const dispatcher = world_with_Physics.getDispatcher();
    const num_manifolds = dispatcher.getNumManifolds();
    for (let i = 0; i < num_manifolds; i++) {
        const manifold = dispatcher.getManifoldByIndexInternal(i);
        const Ammo_body_1 = manifold.getBody0();
        const Ammo_body_2 = manifold.getBody1();
        const Id_body_1 = Ammo_body_1.getUserIndex();
        const Id_body_2 = Ammo_body_2.getUserIndex();

        if(!((Id_body_1 == Id_object_Ammo_1 && Id_body_2 == Id_object_Ammo_2) || (Id_body_1 == Id_object_Ammo_2 && Id_body_2 == Id_object_Ammo_1))){
            continue;
        }

        if (manifold.getNumContacts() > 0){
            return true;
        }
    }
    return false;
}

function collect_object(){
    object_collected = true;
    ur5tcp.attach(selected_cube_mesh);
    selected_cube_mesh.position.set(0,0,0);
    selected_cube_mesh.quaternion.identity();
    selected_cube_Ammo.setCollisionFlags(selected_cube_Ammo.getCollisionFlags() | 2); //Necessary otherwise strange behaviour when releasing
}

function release_object(){
    object_collected = false;
    scene.attach(selected_cube_mesh);
    selected_cube_Ammo.setCollisionFlags(selected_cube_Ammo.getCollisionFlags() & ~2); //Necessary otherwise strange behaviour when releasing
}

function create_chest() {
    const width_of_the_chest= 0.3; 
    const depth_of_the_chest= 0.3;
    const height_of_the_chest= 0.2;
    const thickness_of_panels= 0.005;
    const chest_mesh = new THREE.Group();
    const paper_material = new THREE.MeshStandardMaterial({color: 0xBA8940});
    
    const bottom_panel_geometry = new THREE.BoxGeometry(width_of_the_chest,thickness_of_panels,depth_of_the_chest);
    const bottom_panel = new THREE.Mesh(bottom_panel_geometry,paper_material);
    bottom_panel.position.y = thickness_of_panels/2;
    chest_mesh.add(bottom_panel);

    const lateral_panel_type_1_geometry = new THREE.BoxGeometry(width_of_the_chest,height_of_the_chest,thickness_of_panels);
    const lateral_panel_type_2_geometry = new THREE.BoxGeometry(thickness_of_panels,height_of_the_chest,depth_of_the_chest);

    const lateral_panel_type_1_1_mesh =  new THREE.Mesh(lateral_panel_type_1_geometry,paper_material);
    //lateral_panel_type_1_1_mesh.position.x= -width_of_the_chest/2;
    lateral_panel_type_1_1_mesh.position.y= height_of_the_chest/2;
    lateral_panel_type_1_1_mesh.position.z= -depth_of_the_chest/2;
    //lateral_panel_type_1_1_mesh.rotation.y = Math.PI/2;
    chest_mesh.add(lateral_panel_type_1_1_mesh);
    
    const lateral_panel_type_1_2_mesh =  new THREE.Mesh(lateral_panel_type_1_geometry,paper_material);
    //lateral_panel_type_1_2_mesh.position.x= width_of_the_chest/2;
    lateral_panel_type_1_2_mesh.position.y= height_of_the_chest/2;
    lateral_panel_type_1_2_mesh.position.z= depth_of_the_chest/2;
    //lateral_panel_type_1_2_mesh.rotation.y = Math.PI/2;
    chest_mesh.add(lateral_panel_type_1_2_mesh);

    const lateral_panel_type_2_1_mesh =  new THREE.Mesh(lateral_panel_type_2_geometry,paper_material);
    lateral_panel_type_2_1_mesh.position.x= -width_of_the_chest/2;
    lateral_panel_type_2_1_mesh.position.y= height_of_the_chest/2;
    //lateral_panel_type_2_1_mesh.position.z= -depth_of_the_chest/2;
    //lateral_panel_type_2_1_mesh.rotation.y = Math.PI/2;
    chest_mesh.add(lateral_panel_type_2_1_mesh);
    
    const lateral_panel_type_2_2_mesh =  new THREE.Mesh(lateral_panel_type_2_geometry,paper_material);
    lateral_panel_type_2_2_mesh.position.x= width_of_the_chest/2;
    lateral_panel_type_2_2_mesh.position.y= height_of_the_chest/2;
    //lateral_panel_type_2_2_mesh.position.z= depth_of_the_chest/2; 
    //lateral_panel_type_2_2_mesh.rotation.y = Math.PI/2;
    chest_mesh.add(lateral_panel_type_2_2_mesh);

    scene.add(chest_mesh);
    return chest_mesh;
}

renderer.domElement.addEventListener("click", mouse_clicked);

function mouse_clicked(event){
    if (!executing_animation){
        const raycaster = new THREE.Raycaster();
        const mouse_position = new THREE.Vector2();
        const rect = renderer.domElement.getBoundingClientRect();

        mouse_position.x = ((event.clientX-rect.left)/rect.width)*2 -1;

        mouse_position.y = ((event.clientY-rect.top)/rect.height)*-2 +1;
        raycaster.setFromCamera(mouse_position, camera);
        if(!object_collected) {
            const intersections_with_cubes = raycaster.intersectObject(selected_cube_mesh, true);
            if (intersections_with_cubes.length === 0) 
                return;
            executing_animation = true;
            const clicked_cube = intersections_with_cubes[0].object;

            const id_cube= clicked_cube.userData.id;
            const center_cube_position = new THREE.Vector3();
            clicked_cube.getWorldPosition(center_cube_position);
            const cube_quaternion = new THREE.Quaternion();
            clicked_cube.getWorldQuaternion(cube_quaternion);
            const cube_orientation = new THREE.Euler();
            cube_orientation.setFromQuaternion(cube_quaternion, 'XYZ');

            // Call the function for the animation of collecting the selected cube
            collect_animation(id_cube,center_cube_position,cube_orientation);
        }
        else {
            const intersections_with_chests = raycaster.intersectObjects(chest_meshes, true);

            if (intersections_with_chests.length === 0)
                return;
            executing_animation = true;
            const first_intersected_child_panel = intersections_with_chests[0].object;
            const clicked_chest = first_intersected_child_panel.parent;
            const center_chest_position = new THREE.Vector3();
            clicked_chest.getWorldPosition(center_chest_position);

            const chest_orientation = [-Math.PI/2,Math.PI/2,0];//[0,0,-Math.PI/2]

            // Call the function for the animation of releasing the cube in the selected chest
            release_animation(center_chest_position,chest_orientation);
        }
    }
    else {
        return;
    }
}

async function collect_animation(id, center_cube_position, cube_orientation) {
    const mid_pose = [center_cube_position.x,center_cube_position.y + 0.2,center_cube_position.z,cube_orientation.x,cube_orientation.y,cube_orientation.z];
    let temp_q =inverse_Kinematics(mid_pose,last_q_configuration,max_iterations, epsilon_position, epislon_orientation);
    const mid_q = temp_q.map(angle => normalize_Angle(angle));
    await move_Threejs_Robot(last_q_configuration,mid_q,ur5robot,1000);
    const final_pose = [center_cube_position.x,center_cube_position.y,center_cube_position.z,cube_orientation.x,cube_orientation.y,cube_orientation.z];
    temp_q=inverse_Kinematics(final_pose,last_q_configuration,max_iterations, epsilon_position, epislon_orientation);
    const final_q=temp_q.map(angle => normalize_Angle(angle));
    await move_Threejs_Robot(last_q_configuration,final_q,ur5robot,1000);
    await open_close_Threejs_Gripper(last_gripper_value,0.6,ur5gripper,1000);
    await move_Threejs_Robot(last_q_configuration,rest_q,ur5robot,1000);
    executing_animation = false;
}

async function release_animation(center_chest_position, chest_orientation){
    const move_pose = [center_chest_position.x,center_chest_position.y+0.55,center_chest_position.z,chest_orientation[0],chest_orientation[1],chest_orientation[2]];
    //const move_pose = [-0.85,0.55,0.0,-Math.PI/2,0.0,-Math.PI/2];
    let temp_q=inverse_Kinematics(move_pose,last_q_configuration,max_iterations+5000, epsilon_position, epislon_orientation);
    const move_q=temp_q.map(angle => normalize_Angle(angle));
    await move_Threejs_Robot(last_q_configuration,move_q,ur5robot,1000);
    await open_close_Threejs_Gripper(last_gripper_value,0.0,ur5gripper,2000);
    await move_Threejs_Robot(last_q_configuration,rest_q,ur5robot,1000);
    executing_animation = false;

}