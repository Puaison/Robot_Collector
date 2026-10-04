import * as THREE from 'three';
/**
 * This class represents the mesh gripper in the Three.js environment with its two contact sensors.
 * 
 * Responsibility: It loads the URDF mesh of the Robotiq85 gripper. It adds also the contact sensor parallelepiped meshes to the fingers of the gripper-mesh and it also recovers informations from the Three.js scene like the tcp.
 */
export class VGripper {
    /** @type {THREE.Mesh} Mesh of the contact sensor of the left finger of the gripper*/
    #finger_contact_sensor_left_mesh=null;
    /** @type {THREE.Mesh} Mesh of the contact sensor of the right finger of the gripper*/
    #finger_sensor_right_mesh=null;
    /** @type {THREE.Mesh} Mesh in the scene of the Tool Center Point of the gripper*/
    #ur5tcp=null;
    /** @type {THREE.Mesh} Mesh of the gripper*/
    #ur5gripper=null;
    /** @type {URDFLoader} Loader object that can be used to load URDF meshes*/
    #loader = null;
    /** @type {Float} The current value of the joint that manages the closure of the gripper */
    #last_gripper_value = 0.0;

    constructor(){

    }
    set_loader(loader){
        this.#loader=loader;
    }

    /**
     * Method that loads the URDF Mesh of the gripper and correctly attachs it to the mesh of the robot
     */
    load_VGripper() {
        return new Promise((resolve, reject) => {
            this.#loader.load(
                './public/ur5/robotiq_85_gripper_simple.urdf',
                gripper => {
                    this.#ur5gripper = gripper;
                    //Create the structure of the parallelepiped mesh that represents the finger contact sensor
                    const finger_sensor_geometry = new THREE.BoxGeometry(0.038, 0.0156, 0.022);
                    const finger_sensor_material = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });
                    
                    //Create the left finger contact sensor mesh and traslate its center to align correctly with the left finger
                    const finger_contact_sensor_left_mesh= new THREE.Mesh(finger_sensor_geometry, finger_sensor_material);
                    finger_contact_sensor_left_mesh.position.set(0.025,0.0,0.0); //0.032
                    
                    //Create the right finger contact sensor mesh and traslate its center to align correctly with the right finger
                    const finger_sensor_right_mesh = new THREE.Mesh(finger_sensor_geometry, finger_sensor_material);
                    finger_sensor_right_mesh.position.set(0.025,0.0,0.0);
                
                    //Add the two finger contact sensors to the three.js robot hierarchical model (and overlap the two fingers' meshes) 
                    this.#ur5gripper.links["robotiq_85_left_finger_tip_link"].add(finger_contact_sensor_left_mesh);
                    this.#ur5gripper.links["robotiq_85_right_finger_tip_link"].add(finger_sensor_right_mesh);
    
                    this.#finger_contact_sensor_left_mesh=finger_contact_sensor_left_mesh;
                    this.#finger_sensor_right_mesh=finger_sensor_right_mesh;
                    
                    //Save a reference to the Tool Center Point of the gripper 
                    this.#ur5tcp=this.#ur5gripper.links["dummy_center_indicator_link"];
    
                    // Translation and rotation applied to the gripper in order to attach it to the robot's mesh 
                    gripper.position.set(0, 0.0, 0.137);
                    gripper.rotation.y = -Math.PI/2;
    
                    resolve();
                },
                undefined,
                reject
            );
        });
    }
    /**
     * 
     * @returns {THREE.Mesh} The mesh body in three.js that represents the Tool Center Point
     */
    get_tcp(){
        return this.#ur5tcp;
    }

    get_finger_contact_sensor_left_mesh(){
        return this.#finger_contact_sensor_left_mesh;
    }

    get_gripper_mesh(){
        return this.#ur5gripper;
    }

    get_finger_sensor_right_mesh() {
        return this.#finger_sensor_right_mesh;
    }

    get_last_gripper_value() {
        return this.#last_gripper_value;
    }

    set_last_gripper_value(value) {
        this.#last_gripper_value=value;
    } 
}