import {Ammo_environment} from './Ammo_environment.js';
import * as THREE from 'three';
/**
 * This class represents one gripper with its contact sensors in the Ammo environment.
 * 
 * Responsibility: it gathers informations necessary for managing and modelling the rigid bodies of contact sensors for a specific gripper in the Singleton Ammo physics world
 */
export class MGripper{
    /** @type {btRigidBody} This is the rigid body of the left finger contact sensor in the Singleton Ammo physics world. Used for detecting collisions. Only kinetic, not dynamic */
    #finger_contact_sensor_left_Ammo=null;
    /** @type {btRigidBody} This is the rigid body of the right finger contact sensor in the Singleton Ammo physics world. Used for detecting collisions. Only kinetic, not dynamic */
    #finger_contact_sensor_right_Ammo=null;

    /** @type {THREE.Matrix4} This is the homogeneous transformation caused by the installation of the gripper on the robot that has to be applied to the end of the kinematic chain of the robot  */
    #homogeneous_coordinates=null;

    /** @type {float} The current value of the joint that manages the closure of the gripper */
    #last_gripper_value = 0.0;

    /**
     * Given the paralleliped meshes used for representing the contact sensors, create the respective twins in the Ammo environment (Only kinetic, not dynamic)
     * @param {THREE.Mesh} finger_contact_sensor_left_mesh The parallelepiped mesh used to represent the left contact sensors in the Three.js environment
     * @param {THREE.Mesh} finger_contact_sensor_right_mesh The parallelepiped mesh used to represent the right contact sensors in the Three.js environment
     */
    constructor(finger_contact_sensor_left_mesh,finger_contact_sensor_right_mesh){
        this.#finger_contact_sensor_left_Ammo=this.create_physical_finger_contact_sensor(finger_contact_sensor_left_mesh);
        this.#finger_contact_sensor_left_Ammo.setUserIndex(2000); //ID assigned to the left sensor in the Ammo environment
        Ammo_environment.getInstance().get_World().addRigidBody(this.#finger_contact_sensor_left_Ammo);

        this.#finger_contact_sensor_right_Ammo=this.create_physical_finger_contact_sensor(finger_contact_sensor_right_mesh);
        this.#finger_contact_sensor_right_Ammo.setUserIndex(3000); //ID assigned to the right sensor in the Ammo environment
        Ammo_environment.getInstance().get_World().addRigidBody(this.#finger_contact_sensor_right_Ammo);

        //Transformation that must be applied to the gripper's frame in order to attach it to the robot
        this.#homogeneous_coordinates=new THREE.Matrix4().makeRotationY(-Math.PI/2);
        this.#homogeneous_coordinates.setPosition(0,0,0.137);
    }

    /**
     * Create the physical twin of the given Mesh in the Ammo environment. It will not be moved by the other bodies in the Ammo environment after a collision or by the gravity.
     * It is moved kinematically by the movement of the robot in the Three.js environment and it is used for computing collisions with other bodies.  
     * @param {THREE.Mesh} finger_contact_sensor_mesh 
     * @returns {btRigidBody}
     */
    create_physical_finger_contact_sensor(finger_contact_sensor_mesh) {
        const ammo_environment = Ammo_environment.getInstance();
        const Ammo = ammo_environment.get_Ammo();
        const sensor_shape_Ammo = new Ammo.btBoxShape(new Ammo.btVector3(0.038/2, 0.0156/2, 0.022/2));
        const initial_transformation = new Ammo.btTransform();
        initial_transformation.setIdentity();
        const position_mesh = new THREE.Vector3();
        const quaternion_mesh = new THREE.Quaternion();
        //Get the pose of the finger contact sensor in the Three.js env
        finger_contact_sensor_mesh.getWorldPosition(position_mesh);
        finger_contact_sensor_mesh.getWorldQuaternion(quaternion_mesh);

        //Create the physical finger contact sensor with the same pose of the corresponind three.js twin mesh
        initial_transformation.setOrigin(new Ammo.btVector3(position_mesh.x,position_mesh.y,position_mesh.z));
        initial_transformation.setRotation(new Ammo.btQuaternion(quaternion_mesh.x,quaternion_mesh.y,quaternion_mesh.z,quaternion_mesh.w));
        const initial_state_Ammo= new Ammo.btDefaultMotionState(initial_transformation);
        const info_rigid_body_Ammo = new Ammo.btRigidBodyConstructionInfo(
            0, //mass. so this is a static body that is not influnced by gravity and collisions
            initial_state_Ammo,
            sensor_shape_Ammo,
            new Ammo.btVector3(0, 0, 0)
        );
        const physical_finger_sensor = new Ammo.btRigidBody(info_rigid_body_Ammo);
        return physical_finger_sensor;
    }

    get_homogeneous_coordinates(){
        return this.#homogeneous_coordinates;
    }
    /**
     * Get the rigid body of the left sensor of this specific gripper in the Singleton Ammo physics world
     * @returns {btRigidBody} the parallelepiped that represents the left sensor in the Singleton Ammo physics world
     */
    get_finger_contact_sensor_left_Ammo() {
        return this.#finger_contact_sensor_left_Ammo;
    }

    /**
     * Get the rigid body of the right sensor of this specific gripper in the Singleton Ammo physics world
     * @returns {btRigidBody} the parallelepiped that represents the right sensor in the Singleton Ammo physics world
     */
    get_finger_contact_sensor_right_Ammo() {
        return this.#finger_contact_sensor_right_Ammo;
    }

    get_last_gripper_value() {
        return this.#last_gripper_value;
    }

    set_last_gripper_value(value) {
        this.#last_gripper_value=value;
    }
}