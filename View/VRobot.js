import { LoadingManager } from 'three';
import URDFLoader from 'urdf-loader';
import { block_Height } from '../javascript_files/config';
/**
 * This class represents the mesh robot in the Three.js environment.
 * 
 * Responsibility: It loads the URDF mesh of the UR5 robot.
 */
export class VRobot {
    //#vgripper = null;
    /** @type {URDFLoader} Loader object that can be used to load URDF meshes*/
    #loader = null;
    /** @type {THREE.Mesh} Mesh of the robot*/
    #ur5robot = null;
    /** @type {Array_of_Float} The current value of the joints of the robot */
    #last_q_configuration = null;
    /** @type {Float} The distance of the base's center of the robot from floor */
    #offset=0;
    
    constructor(offset = block_Height) {
        const manager = new LoadingManager();
        this.#loader = new URDFLoader(manager);
        this.#loader.packages = {
            ur_description: '/ur5/',
            robotiq_85_description: '/ur5/'
        };
        this.#offset=offset;
    }

    set_last_q_configuration(q) {
        this.#last_q_configuration=q;
        //Maybe call here the update_Threejs_Robot_Joints
    }

    get_last_q_configuration() {
        return this.#last_q_configuration;
    }
    //Maybe this it is not necessary
    // async set_gripper(vgripper){
    //     this.#vgripper= vgripper;
    //     this.#vgripper.set_loader(this.#loader);
    //     await this.#vgripper.load_VGripper();
    // }

    // get_gripper(){
    //     return this.#vgripper;
    // }

    load_VRobot() {
        return new Promise((resolve, reject) => {
            this.#loader.load(
                '/ur5/ur5.urdf',
                robot => {
                    this.#ur5robot = robot;
                    //scene.add(robot);
                    this.update_Threejs_Robot_Joints(this.#last_q_configuration);
    
                    // Rotatation of the mesh in order to stand on the floor
                    robot.rotation.x = -Math.PI/2;
                    // Robot in the center of the scene above the box
                    robot.position.set(0, this.#offset, 0);
                    resolve();
                },
                undefined,
                reject
            );
        });
    }

    get_loader(){
        return this.#loader;
    }
    /**
     * This method changes the value of the joints directly in the mesh
     * @param {Array_of_Float} q The joints' values
     */
    update_Threejs_Robot_Joints(q) {
        this.#ur5robot.setJointValue('shoulder_pan_joint', q[0]); //this rotate the base
        this.#ur5robot.setJointValue('shoulder_lift_joint', q[1]); // this make the robot up
        this.#ur5robot.setJointValue('elbow_joint', q[2]); // the "gomito"
        this.#ur5robot.setJointValue('wrist_1_joint', q[3]); 
        this.#ur5robot.setJointValue('wrist_2_joint', q[4]);
        this.#ur5robot.setJointValue('wrist_3_joint', q[5]); //rotation only of the tooltip
        //last_q_configuration = q; // If I update the last_q_configuration here and not in the tween it does not work (maybe depends on the normalization)
    }

    get_robot_mesh(){
        return this.#ur5robot;
    }
}