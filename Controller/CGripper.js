import { MGripper } from "../Model/MGripper";
import { VGripper } from "../View/VGripper";
import { VScene } from "../View/VScene";
import { Ammo_environment } from "../Model/Ammo_environment";
import * as THREE from 'three';

export class CGripper{
    #mgripper=null;
    #vgripper=null;
    constructor(){

    }

    async load_CGripper(loader) {
        this.#vgripper= new VGripper()
        this.#vgripper.set_loader(loader);
        await this.#vgripper.load_Gripper();
        //VScene.getInstance().add_mesh(this.#vgripper.get_gripper_mesh());
        this.#mgripper= new MGripper(this.#vgripper.get_finger_sensor_left_mesh(),this.#vgripper.get_finger_sensor_right_mesh());
    }

    get_vgripper(){
        return this.#vgripper;
    }

    get_mgripper(){
        return this.#mgripper;
    }

    syncronize_finger_mesh_to_Ammo(){

        const ammo_environment = Ammo_environment.getInstance();
        const Ammo = ammo_environment.get_Ammo();
        //LEFT FINGER
        const left_position_mesh = new THREE.Vector3();
        const left_quaternion_mesh = new THREE.Quaternion();
        this.#vgripper.get_finger_sensor_left_mesh().getWorldPosition(left_position_mesh);
        this.#vgripper.get_finger_sensor_left_mesh().getWorldQuaternion(left_quaternion_mesh);
    
        const left_current_transformation = new Ammo.btTransform();
        left_current_transformation.setIdentity();
        left_current_transformation.setOrigin(new Ammo.btVector3(left_position_mesh.x,left_position_mesh.y,left_position_mesh.z));
        left_current_transformation.setRotation(new Ammo.btQuaternion(left_quaternion_mesh.x,left_quaternion_mesh.y,left_quaternion_mesh.z,left_quaternion_mesh.w));
        this.#mgripper.get_finger_contact_sensor_left_Ammo().setWorldTransform(left_current_transformation);
        //Update the internal collision engine
        const left_motion_state = this.#mgripper.get_finger_contact_sensor_left_Ammo().getMotionState();
    
        
        left_motion_state.setWorldTransform(left_current_transformation);
        Ammo_environment.getInstance().get_World().updateSingleAabb(this.#mgripper.get_finger_contact_sensor_left_Ammo());

        //RIGHT FINGER
        const right_position_mesh = new THREE.Vector3();
        const right_quaternion_mesh = new THREE.Quaternion();
        this.#vgripper.get_finger_sensor_right_mesh().getWorldPosition(right_position_mesh);
        this.#vgripper.get_finger_sensor_right_mesh().getWorldQuaternion(right_quaternion_mesh);
    
        const right_current_transformation = new Ammo.btTransform();
        right_current_transformation.setIdentity();
        right_current_transformation.setOrigin(new Ammo.btVector3(right_position_mesh.x,right_position_mesh.y,right_position_mesh.z));
        right_current_transformation.setRotation(new Ammo.btQuaternion(right_quaternion_mesh.x,right_quaternion_mesh.y,right_quaternion_mesh.z,right_quaternion_mesh.w));
        this.#mgripper.get_finger_contact_sensor_right_Ammo().setWorldTransform(right_current_transformation);
        //Update the internal collision engine
        const motion_state = this.#mgripper.get_finger_contact_sensor_right_Ammo().getMotionState();
    
        
        motion_state.setWorldTransform(right_current_transformation);
        Ammo_environment.getInstance().get_World().updateSingleAabb(this.#mgripper.get_finger_contact_sensor_right_Ammo());
    }
}