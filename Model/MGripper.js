import {Ammo_environment} from './Ammo_environment';
import * as THREE from 'three';
export class MGripper{
    #finger_sensor_left_Ammo=null;
    #finger_sensor_right_Ammo=null;
    #homogeneous_coordinates=null;
    #last_gripper_value = 0.0;

    constructor(finger_sensor_mesh_left,finger_sensor_mesh_right){
        this.#finger_sensor_left_Ammo=create_physical_finger_sensor(finger_sensor_mesh_left);
        this.#finger_sensor_left_Ammo.setUserIndex(2000);
        Ammo_environment.getInstance().get_World().addRigidBody(this.#finger_sensor_left_Ammo);

        this.#finger_sensor_right_Ammo=create_physical_finger_sensor(finger_sensor_mesh_right);
        this.#finger_sensor_right_Ammo.setUserIndex(3000);
        Ammo_environment.getInstance().get_World().addRigidBody(this.#finger_sensor_right_Ammo);

        //Rotation of the frame of the gripper to attach it to the robot
        this.#homogeneous_coordinates=new THREE.Matrix4().makeRotationY(-Math.PI/2);
        this.#homogeneous_coordinates.setPosition(0,0,0.137);
    }

    get_homogeneous_coordinates(){
        return this.#homogeneous_coordinates;
    }

    get_finger_sensor_left_Ammo() {
        return this.#finger_sensor_left_Ammo;
    }

    get_finger_sensor_right_Ammo() {
        return this.#finger_sensor_right_Ammo;
    }

    get_last_gripper_value() {
        return this.#last_gripper_value;
    }

    set_last_gripper_value(value) {
        this.#last_gripper_value=value;
    }
}
export function syncronize_finger_mesh_to_Ammo(mesh, rigid_body){
    const position_mesh = new THREE.Vector3();
    const quaternion_mesh = new THREE.Quaternion();
    mesh.getWorldPosition(position_mesh);
    mesh.getWorldQuaternion(quaternion_mesh);

    const current_transformation = new Ammo_environment.getInstance().get_World().btTransform();
    current_transformation.setIdentity();
    current_transformation.setOrigin(new Ammo_environment.getInstance().get_World().btVector3(position_mesh.x,position_mesh.y,position_mesh.z));
    current_transformation.setRotation(new Ammo_environment.getInstance().get_World().btQuaternion(quaternion_mesh.x,quaternion_mesh.y,quaternion_mesh.z,quaternion_mesh.w));
    rigid_body.setWorldTransform(current_transformation);
    //Update the internal collision engine
    const motion_state = rigid_body.getMotionState();

    
    motion_state.setWorldTransform(current_transformation);
    Ammo_environment.getInstance().get_World().updateSingleAabb(rigid_body);
}

function create_physical_finger_sensor(finger_sensor_mesh) {
    const sensor_shape_Ammo = new Ammo_environment.getInstance().get_Ammo().btBoxShape(new Ammo_environment.getInstance().get_Ammo().btVector3(0.038/2, 0.0156/2, 0.022/2));
    const initial_transformation = new Ammo_environment.getInstance().get_Ammo().btTransform();
    initial_transformation.setIdentity();
    const position_mesh = new THREE.Vector3();
    const quaternion_mesh = new THREE.Quaternion();
    finger_sensor_mesh.getWorldPosition(position_mesh);
    finger_sensor_mesh.getWorldQuaternion(quaternion_mesh);
    initial_transformation.setOrigin(new Ammo_environment.getInstance().get_Ammo().btVector3(position_mesh.x,position_mesh.y,position_mesh.z));
    initial_transformation.setRotation(new Ammo_environment.getInstance().get_Ammo().btQuaternion(quaternion_mesh.x,quaternion_mesh.y,quaternion_mesh.z,quaternion_mesh.w));
    const initial_state_Ammo= new Ammo_environment.getInstance().get_Ammo().btDefaultMotionState(initial_transformation);
    const info_rigid_body_Ammo = new Ammo_environment.getInstance().get_Ammo().btRigidBodyConstructionInfo(
        0, //mass
        initial_state_Ammo,
        sensor_shape_Ammo,
        new Ammo_environment.getInstance().get_Ammo().btVector3(0, 0, 0)
    );
    const physical_finger_sensor = new Ammo_environment.getInstance().get_Ammo().btRigidBody(info_rigid_body_Ammo);
    return physical_finger_sensor;
}