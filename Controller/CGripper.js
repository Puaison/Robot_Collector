import { MGripper } from "../Model/MGripper.js";
import { VGripper } from "../View/VGripper.js";
import { Ammo_environment } from "../Model/Ammo_environment.js";
import * as THREE from 'three';
/**
 * This class is the controller of the gripper. It assists the process of loading correctly the informations and syncronizing them between the View and Model Packages.
 * 
 * Responsibility: syncronizes the data and position/orientation from the visual contact sensors (meshes) to the physical kinetic bodies in the Ammo environment.
 * @see MGripper
 * @see VGripper
 */
export class CGripper{
    /** @type {MGripper} The MGripper object managed by this controller */
    #mgripper=null;
    /** @type {VGripper} The VGripper object managed by this controller */
    #vgripper=null;
    constructor(){

    }

    /**
     * Method that loads the URDF Mesh of the gripper and that syncronizes the contact sensors from the View to the Model Package
     * @param {URDFLoader} loader object that needs to be used to load the URDF mesh
     */
    async load_CGripper(loader) {
        this.#vgripper= new VGripper()
        // set the URDF loader used for the robot also for the gripper
        this.#vgripper.set_loader(loader);
        //Wait that the gripper's mesh and the contact sensors' meshes are correctly loaded
        await this.#vgripper.load_VGripper();
        // Create the physical rigid bodies twins of the contact sensors' meshes in the Model package 
        this.#mgripper= new MGripper(this.#vgripper.get_finger_contact_sensor_left_mesh(),this.#vgripper.get_finger_sensor_right_mesh());
    }

    get_VGripper(){
        return this.#vgripper;
    }

    get_MGripper(){
        return this.#mgripper;
    }

    /**
     * Takes the poses from the meshes of the contact sensors and copies them to the parallelepiped twins in the Ammo env.
     * The bodies of the contact sensors are only kinematic in the Ammo env
     */
    syncronize_finger_mesh_to_Ammo(){

        const ammo_environment = Ammo_environment.getInstance();
        const Ammo = ammo_environment.get_Ammo();

        //#region LEFT FINGER
        const left_position_mesh = new THREE.Vector3();
        const left_quaternion_mesh = new THREE.Quaternion();
        // Recover the pose of the left finger contact sensor from the Three.js scene
        this.#vgripper.get_finger_contact_sensor_left_mesh().getWorldPosition(left_position_mesh);
        this.#vgripper.get_finger_contact_sensor_left_mesh().getWorldQuaternion(left_quaternion_mesh);
        
        // Propagate the recovered pose to to the physical representation of the left contact sensor in the Ammo env.
        const left_current_transformation = new Ammo.btTransform();
        left_current_transformation.setIdentity();
        left_current_transformation.setOrigin(new Ammo.btVector3(left_position_mesh.x,left_position_mesh.y,left_position_mesh.z));
        left_current_transformation.setRotation(new Ammo.btQuaternion(left_quaternion_mesh.x,left_quaternion_mesh.y,left_quaternion_mesh.z,left_quaternion_mesh.w));
        this.#mgripper.get_finger_contact_sensor_left_Ammo().setWorldTransform(left_current_transformation);

        //Update the internal collision engine
        const left_motion_state = this.#mgripper.get_finger_contact_sensor_left_Ammo().getMotionState();
        left_motion_state.setWorldTransform(left_current_transformation);
        // Update also the Axis aligned bounding box of the contact sensor rigid body for correctly compute collisions
        Ammo_environment.getInstance().get_World().updateSingleAabb(this.#mgripper.get_finger_contact_sensor_left_Ammo());
        //#endregion

        //#region RIGHT FINGER
        const right_position_mesh = new THREE.Vector3();
        const right_quaternion_mesh = new THREE.Quaternion();
        // Recover the pose of the right finger contact sensor from the Three.js scene
        this.#vgripper.get_finger_sensor_right_mesh().getWorldPosition(right_position_mesh);
        this.#vgripper.get_finger_sensor_right_mesh().getWorldQuaternion(right_quaternion_mesh);
    
        // Propagate the recovered pose to to the physical representation of the right contact sensor in the Ammo env.
        const right_current_transformation = new Ammo.btTransform();
        right_current_transformation.setIdentity();
        right_current_transformation.setOrigin(new Ammo.btVector3(right_position_mesh.x,right_position_mesh.y,right_position_mesh.z));
        right_current_transformation.setRotation(new Ammo.btQuaternion(right_quaternion_mesh.x,right_quaternion_mesh.y,right_quaternion_mesh.z,right_quaternion_mesh.w));
        this.#mgripper.get_finger_contact_sensor_right_Ammo().setWorldTransform(right_current_transformation);
        
        //Update the internal collision engine
        const motion_state = this.#mgripper.get_finger_contact_sensor_right_Ammo().getMotionState();
        motion_state.setWorldTransform(right_current_transformation);
        // Update also the Axis aligned bounding box of the contact sensor rigid body for correctly compute collisions
        Ammo_environment.getInstance().get_World().updateSingleAabb(this.#mgripper.get_finger_contact_sensor_right_Ammo());
        //#endregion
    }
}