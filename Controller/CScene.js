import { CChest } from "./CChest";
import { CCube } from "./CCube";
import { CRobot } from "./CRobot";
import { Ammo_environment } from "../Model/Ammo_environment";
import { VScene } from "../View/VScene";
import { normalize_angle_enhanced, shortest_angle_difference } from "../javascript_files/utils";
import { max_iterations,epsilon_position,epislon_orientation } from "../javascript_files/config";
import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { CFloor } from "./CFloor";
import { VFloor } from "../View/VFloor";
import GUI from 'lil-gui';

/**
 * This class is the controller of the whole Scene and coordinates all the objectes between Three.js and Ammo environment. It uses the Singleton Pattern.
 * 
 * Responsibility: It takes the inputs of the user; it setups/controls the scene and manages the animations of the robot and gripper.
 * @see CChest
 * @see VChest
 * @see CRobot
 * @see CCube
 * @see VFloor
 * @see CFloor
 * @see VScene
 * @see Ammo_environment
 */
export class CScene {
    /** @type {CScene} Singleton Instance of this class */
    static #instance = null;
    /** @type {Array_of_CChest} Array of CChests in the Scene */
    #cchests_array=[];
    /** @type {Array_of_VChest} Array of VChests in the Scene */
    #vchests_array=[];
    /** @type {CRobot} Controller of the robot in the scene */
    #robot=null;
    /** @type {boolean} Variable used to register if the robot has (coorectly) taken a cube */
    #object_collected=false;
    /** @type {boolean} Variable used to register if the robot is actually executing an animation */
    #executing_animation=false;
    /** @type {CCube} Cube selected by the user to be taken by the robot */
    #selected_cube=null;
    /** @type {CChest} Chest selected by the user where it will be placed the selected cube */
    #selected_chest=null;
    /** @type {TWEEN.Group} Tween Group used to create a tween that interpolates two joints configurations */
    #My_TWEEN_Group=null;
    /** @type {TWEEN.Tween} Current tween in execution */
    #current_tween=null;
    /** @type {THREE.Timer} Timer used to update the Ammo world */
    #timer=null;
    /** @type {int} Duration (in millisecond) of each primitive movement */
    animation_period = 750;
    /** @type {int} When the current_tween started (in millisecond) */
    tween_start_time=0;
    /** @type {int} Time (in millisecond) from the start of the scene */
    #actual_time;
    /**
     * Setup the scene with the written informations in this constructor. Also initialize the various tools (tween,timer,callbacks,GUI).
     */
    constructor() {
        // First Chest
        this.create_chest(1,[0.81,0,0]);

        // Second Chest
        this.create_chest(2,[-0.80,0,0]);

        // First cube
        const position_first_cube = [0.55,1.5,0.5];
        const RPY_first_cube = new THREE.Euler(
            0,
            -Math.PI/4,
            -Math.PI/2,
            'XYZ'
        );
        //The first value is the ID of the cube, the last value the color of the mesh in hexadecimal
        this.create_cube(1,position_first_cube,RPY_first_cube,0xf0fff0);

        // Second Cube
        const position_second_cube = [-0.45,1.5,0.5];
        const RPY_second_cube = new THREE.Euler(
            0,
            Math.PI/4,
            -Math.PI/2,
            'XYZ'
        );
        //The first value is the ID of the cube, the last value the color of the mesh in hexadecimal
        this.create_cube(2,position_second_cube,RPY_second_cube,0x00fff0);

        // Third Cube
        const position_third_cube = [-0.45,1.5,-0.5];
        const RPY_third_cube = new THREE.Euler(
            0,
            0,
            -Math.PI/2,
            'XYZ'
        );
        //The first value is the ID of the cube, the last value the color of the mesh in hexadecimal
        this.create_cube(3,position_third_cube,RPY_third_cube,0x00ff00);

        // Initialize the controller of the robot
        this.#robot = new CRobot();

        // Tween setup
        this.#My_TWEEN_Group = new TWEEN.Group();

        //add the callback function to the click mouse-event
        VScene.getInstance().get_renderer().domElement.addEventListener("click", (event) => this.register_mouse_clicked_input(event));

        // Create the timer
        this.#timer=new THREE.Timer();

        // GUI setup
        const lil_gui= new GUI();
        //event for changing the camera FOV
        lil_gui.add(VScene.getInstance().get_camera(), 'fov', 1, 180).name("Change FOV").onChange(() => this.animate());
        //event for changing the duration of the animations
        lil_gui.add(this, 'animation_period', 750, 5000).name("Change animation period").onChange(() => this.change_animation_period());
        
        //Button for generating new cubes
        const reset_cube_button = {new_cubes: () => {this.reset_cubes();}};
        lil_gui.add(reset_cube_button, "new_cubes").name("Reset cubes");
    }

    static async getInstance() {
        if (CScene.#instance === null) {
            CScene.#instance = new CScene();
            //Load the robot and the gripper (both Views and Models)
            await CScene.#instance.#robot.load_CRobot();
        }
        return CScene.#instance;
    }

    /**
     * Callback function invoked every time the "Reset cubes" button is pressed
     */
    reset_cubes(){
        // If the robot is executing an animation or has a cube in its gripper, ignore the event of the button
        if(!(this.#executing_animation) && !(this.#object_collected)){
            //For every cube on the floor
            for (const ccube of [...CFloor.getInstance().get_CCubes()]) {
                // Eliminate the mesh from the scene
                ccube.get_VCube().clear_mesh();
                // Eliminate the twin physical object in the Ammo Environment
                ccube.get_MCube().clear_Ammo();
                //Remove the Cube controller from the array of cubes on the floor
                CFloor.getInstance().remove_CCube(ccube);
            }
            // First cube
            const position_first_cube = [0.55,1.5,0.5];
            const RPY_first_cube = new THREE.Euler(
                0,
                -Math.PI/4,
                -Math.PI/2,
                'XYZ'
            );
            //The first value is the ID of the cube, the last value the color of the mesh in hexadecimal
            this.create_cube(1,position_first_cube,RPY_first_cube,0xf0fff0);

            // Second Cube
            const position_second_cube = [-0.45,1.5,0.5];
            const RPY_second_cube = new THREE.Euler(
                0,
                Math.PI/4,
                -Math.PI/2,
                'XYZ'
            );
            //The first value is the ID of the cube, the last value the color of the mesh in hexadecimal
            this.create_cube(2,position_second_cube,RPY_second_cube,0x00fff0);

            // Third Cube
            const position_third_cube = [-0.45,1.5,-0.5];
            const RPY_third_cube = new THREE.Euler(
                0,
                0,
                -Math.PI/2,
                'XYZ'
            );
            //The first value is the ID of the cube, the last value the color of the mesh in hexadecimal
            this.create_cube(3,position_third_cube,RPY_third_cube,0x00ff00);   
        }
    }
    
    /**
     * This method is called every time the value of the animation period is changed.
     * It re-scales the duration of the remaing part of the tween-animation proportionally to the animation period set
     */
    change_animation_period() {
        //If no active tween, interrupt the function
        if (this.#current_tween===null)
            return;

        //If there is an active tween, compute the new remaining time proportionally to the new animation duration and to the current tween's completion percentage 
        const elapsed_tween_time= this.#actual_time-this.tween_start_time;
        //Actual progress of the tween (in percentage) => 0.0 at the beginning, 0.50 robot in the middle, 1.0 at the end.
        const progress_tween= elapsed_tween_time/this.#current_tween._duration;
        // Scale the progress time w.r.t. the tween's percentage of completion and the new animation period
        const new_elapsed_tween_time= progress_tween*this.animation_period;
        // Compute the remainining time scaled to the new animation period
        const remaining_tween_time= this.animation_period-new_elapsed_tween_time;
        this.#current_tween.stop();
        this.#current_tween.duration(remaining_tween_time).start(this.#actual_time, true); //restart from the last conf
        this.tween_start_time = this.#actual_time;
    }

    /**
     * Method of the controller that effectively creates a cube in the scene (and adds it to the floor) with the following informations:
     * @param {int} id 
     * @param {Array_of_float} position of the center of the cube
     * @param {Array_of_float} rpy_orientation 
     * @param {int} color in hexadecimal
     */
    create_cube(id,position,rpy_orientation,color){
        // Convert XYZ -> quaternion
        const quaternion = new THREE.Quaternion().setFromEuler(rpy_orientation);
        const quaternion_array =[quaternion.x,quaternion.y,quaternion.z,quaternion.w];
        //Create the associated controller of the cube
        const ccube = new CCube(id,undefined,position,quaternion_array,color);
        //Add the cube to the floor 
        CFloor.getInstance().add_CCube(ccube);
    }
    /**
     * Method of the controller that effectively creates a chest in the scene with the following informations:
     * @param {int} id 
     * @param {Array_of_float} position 
     */
    create_chest(id,position){
        //Create the associated controller of the chest
        const cchest= new CChest(id,position);
        // Add the chest to the arrays that control it 
        this.#cchests_array.push(cchest);
        this.#vchests_array.push(cchest.get_VChest().get_Chest_mesh())
    }

    /**
     * Given the ID of two bodies in the Ammo environment, verify if the associated bodies in the Ammo world are in contact
     * @param {int} Id_object_Ammo_1 The id associated to the first queried body in the Ammo environment
     * @param {int} Id_object_Ammo_2 The id associated to the second queried body in the Ammo environment
     * @returns {boolean} True if the two queried bodies are in contact in at least one point, False otherwise.
     */
    detect_collisions_between(Id_object_Ammo_1, Id_object_Ammo_2){
        const dispatcher = Ammo_environment.getInstance().get_World().getDispatcher();
        // For each contact between two bodies in the ammo environment, Ammo creates a manifold that containes all the informations about that contact.
        const total_number_of_contacts = dispatcher.getNumManifolds(); // Total number of contacts in the Ammo environment.
        for (let i = 0; i < total_number_of_contacts; i++) { // For each contact-manifold:
            const manifold = dispatcher.getManifoldByIndexInternal(i);
            const Ammo_body_1 = manifold.getBody0(); //Get the first body involed in the i-th contact
            const Ammo_body_2 = manifold.getBody1(); //Get the second body involed in the i-th contact
            const Id_body_1 = Ammo_body_1.getUserIndex(); //Get the ID associated to the first body involved in the i-th contact
            const Id_body_2 = Ammo_body_2.getUserIndex(); //Get the ID associated to the second body involved in the i-th contact

            if(!((Id_body_1 == Id_object_Ammo_1 && Id_body_2 == Id_object_Ammo_2) || (Id_body_1 == Id_object_Ammo_2 && Id_body_2 == Id_object_Ammo_1))){
                continue; // If the two retrieved bodies in this contact-manifold are different from the queried bodies, just skip them
            }

            if (manifold.getNumContacts() > 0){ //If the two queried bodies touch themselves in at least 1 point, then they are in contact.
                return true; //The two bodies in the Ammo environment associated respectively to Id_object_Ammo_1 and Id_object_Ammo_2 are in contact
            }
        }
        return false; //No contact found for the two bodies in the Ammo environment associated respectively to Id_object_Ammo_1 and Id_object_Ammo_2
    }

    /**
     * This method manages all the control variables and the internal meshes/bodies for the robot use case "Collect cube".  
     */
    collect_cube(){
        this.#object_collected = true;
        //Remove the selected cube from the floor
        CFloor.getInstance().remove_CCube(this.#selected_cube);
        const selected_cube_mesh = this.#selected_cube.get_VCube().get_Cube_mesh();
        const selected_cube_Ammo = this.#selected_cube.get_MCube().get_Cube_Ammo();
        //Attach the selected_cube_mesh to the TCP of the gripper in the Three.js environment so that the selected cube will now be moved by the kinematic of the mesh-robot
        this.#robot.get_CGripper().get_VGripper().get_tcp().attach(selected_cube_mesh);
        selected_cube_mesh.position.set(0,0,0); //w.r.t the TCP in the Three.js env, the cube has no traslation...
        selected_cube_mesh.quaternion.identity(); // ...and no rotation
        selected_cube_Ammo.setCollisionFlags(selected_cube_Ammo.getCollisionFlags() | 2); //Necessary otherwise strange behaviour when releasing
    }

    /**
     * This method manages all the control variables and the internal meshes/bodies for the robot use case "Release cube".  
     */
    release_cube(){
        this.#object_collected = false;
        const selected_cube_mesh = this.#selected_cube.get_VCube().get_Cube_mesh();
        const selected_cube_Ammo = this.#selected_cube.get_MCube().get_Cube_Ammo();
        //Add the selected cube to the selected chest 
        this.#selected_chest.add_CCube(this.#selected_cube);
        //Remove the selected_cube_mesh from the TCP of the robot in the Three.js environment so that it can now move following its dynamic (gravity) 
        VScene.getInstance().get_scene().attach(selected_cube_mesh); // By adding the mesh of the cube to the scene, it will be disconnected by the robot chain
        selected_cube_Ammo.setCollisionFlags(selected_cube_Ammo.getCollisionFlags() & ~2); //Necessary otherwise strange behaviour when releasing
    }
    

    /**
     * This method returns a Promise that resolves when the tween finishes interpolating between two robot joints' configurations. 
     * @param {Array_of_float} q_initial Initial Robot joints' configuration
     * @param {Array_of_float} q_final Target Robot joints' configuration
     */
    move_Threejs_Robot(q_initial, q_final) {
        return new Promise((resolve) => {
            //Make a copy of the array as the tween will modify them
            const q_in = Array.from(q_initial);
            const q_fin = Array.from(q_final);
            //Being angles circular, find the shortest path betwenn q_in and q_fin configurations. Then sum it to q_in to obtain the final target 
            const target = q_in.map((angle, i) => angle + shortest_angle_difference(angle, q_fin[i]));
            this.tween_start_time = this.#actual_time;
            this.#current_tween = new TWEEN.Tween(q_in, this.#My_TWEEN_Group) //Start from q_in
                .to(target, this.animation_period) //It must reach target in this.animation_period milliseconds
                .easing(TWEEN.Easing.Sinusoidal.InOut) //More sweet animation at the start and at the end
                // Function called during the interpolation
                .onUpdate(() => { 
                    const temp_q = [
                        q_in[0],
                        q_in[1],
                        q_in[2], //tween will interpolate and save the intermediate results in q_in
                        q_in[3],
                        q_in[4],
                        q_in[5]
                    ];

                    //Normalize the intermediate result of the tween between -PI and PI
                    const current_q = temp_q.map(angle => normalize_angle_enhanced(angle));

                    //Update the internal values of the joints' configuration
                    this.#robot.get_VRobot().set_last_q_configuration(current_q); 
                    this.#robot.get_MRobot().set_last_q_configuration(current_q);

                    //Update, in the Three.js scene, the robot mesh to the intermediate configuration
                    //This will create the visual robot movement animation following the interpolation of tween
                    this.#robot.get_VRobot().update_Threejs_Robot_Joints(current_q);
                }) //Lines of code executed at the end of the interpolation-animation
                .onComplete(() => {
                    this.#current_tween=null;
                    //resolve the promise
                    resolve();
                })
                .start(this.#actual_time); //Let start the planned Tween
        });
    }

    /**
     * This method returns a Promise that resolves when the tween finishes interpolating between two gripper's aperture configurations
     * or when the gripper's contact sensors identify a collision with a cube in the center of the TCP
     * @param {float} initial_value of the gripper aperture. 0 correspond to the gripper fully open
     * @param {float} final_value of the gripper aperture.
     */
    open_close_Threejs_Gripper(initial_value, final_value) {
        return new Promise((resolve) => {
            //Make a copy of the initial value and insert it in an array (otherwise tween will not work)
            const current_value = [initial_value];
            this.tween_start_time = this.#actual_time;
            this.#current_tween = new TWEEN.Tween(current_value, this.#My_TWEEN_Group) //Start from current_value
                .to([final_value], this.animation_period) //It must reach target in this.animation_period milliseconds
                .easing(TWEEN.Easing.Sinusoidal.InOut) //More sweet animation at the start and at the end
                // Function called during the interpolation
                .onUpdate(() => {
                    //Update the internal values of the gripper aperture
                    this.#robot.get_CGripper().get_VGripper().set_last_gripper_value(current_value[0]);
                    this.#robot.get_CGripper().get_MGripper().set_last_gripper_value(current_value[0]);

                    //Update, in the Three.js scene, the gripper mesh to the intermediate configuration
                    //This will create the visual gripper open-close animation following the interpolation of tween
                    this.#robot.get_CGripper().get_VGripper().get_gripper_mesh().setJointValue('robotiq_85_left_knuckle_joint', current_value[0]);

                    // If the right contact sensor (with ID 3000 in ammo env) and the left contact sensor (with ID 2000 in ammo env)
                    // detect a collision with the cube selected by the user in the ammo env (and no object is currently in the gripper),
                    // the use case of "Collecting cube" is triggered.
                    if (this.detect_collisions_between(this.#selected_cube.get_ID(),3000) && this.detect_collisions_between(this.#selected_cube.get_ID(),2000) && !(this.#object_collected)){
                        this.#current_tween.stop();
                        console.log("Object collected");
                        // This method manages the use case "Collect cube"
                        this.collect_cube();
                        this.#current_tween=null;
                        //resolve the promise and interrupt the animation anticipately
                        resolve();
                    }
                    // If the right contact sensor (with ID 3000 in ammo env) and the left contact sensor (with ID 2000 in ammo env)
                    // are no more detecting a collision with the cube that the robot was previuosly trasnporting,
                    // the use case of "Release cube" is triggered.
                    if (!(this.detect_collisions_between(this.#selected_cube.get_ID(),3000)) && !(this.detect_collisions_between(this.#selected_cube.get_ID(),2000)) && this.#object_collected){
                        console.log("Object released");
                        // This method manages the use case "Release cube"
                        this.release_cube();
                    }
                })
                //Lines of code executed at the end of the interpolation-animation
                .onComplete(() => {
                    //The tween will call this piece of code only when the robot has released a cube at the end of the use case "Release cube" 
                    // or when it misses the cube during the "Collect cube" use case 
                    // In all the other cases it will resolve before executing this below.
                    this.#selected_cube= null; 
                    this.#selected_chest=null; 
                    this.#current_tween=null; 
                    //resolve the promise
                    resolve();
                })
                .start(this.#actual_time); //Let start the planned Tween
        });
    }
    /**
     * Method called each time the left mouse button is pressed. Accordingly to the interaction-state-machine, this method handles the input
     * and verify if the clicked object (recovered through a ray passing for the position of the mouse on the screen) can partecipate to the interaction 
     * @param {*} event 
     */
    register_mouse_clicked_input(event){
        // If the robot is executing an animation, ignore every selected object
        if (!this.#executing_animation){
            const raycaster = new THREE.Raycaster();
            const mouse_position = new THREE.Vector2();

            //position of the mouse on the screen in normalized coordinates between -1 and +1
            mouse_position.x = (event.clientX/window.innerWidth)*2 -1;
            mouse_position.y = (event.clientY/window.innerHeight)*-2 +1;

            //Generate a ray that starts from the camera position and pass through the screen plane in the position of the mouse
            raycaster.setFromCamera(mouse_position, VScene.getInstance().get_camera());
            // If the robot has not an object in its gripper yet:
            if(!(this.#object_collected)) {

                // Recover all the meshes of the cubes on the floor and push them in an array
                const cube_meshes_on_the_floor =[];
                for(const VCube of VFloor.getInstance().get_VCubes()) {
                    cube_meshes_on_the_floor.push(VCube.get_Cube_mesh());
                }

                // Verify if the ray intersects a cube mesh on the floor
                const intersections_with_cubes = raycaster.intersectObjects(cube_meshes_on_the_floor, false);

                // If the ray has intersected a cube, get the first. Otherwise interrupt the function
                if (intersections_with_cubes.length === 0) 
                    return;
                //Get the first intersected cube
                const clicked_cube = intersections_with_cubes[0].object;

                //recover the id of the clicked cube from the corresponding mesh
                const id_cube= clicked_cube.userData.id;

                //if the clicked cube is not on the floor (and then it is in a chest) interrupt the function
                if (CFloor.getInstance().search_CCube(id_cube) === null)
                    return;

                //Prepare the interaction-state-machine for the execution of the collect animation
                this.#executing_animation = true;

                //Get the pose of the cube
                const center_cube_position = new THREE.Vector3();
                clicked_cube.getWorldPosition(center_cube_position);
                const cube_quaternion = new THREE.Quaternion();
                clicked_cube.getWorldQuaternion(cube_quaternion);
                const cube_orientation = new THREE.Euler();
                cube_orientation.setFromQuaternion(cube_quaternion, 'XYZ');

                //Save the selected cube in this controller
                this.#selected_cube = CFloor.getInstance().search_CCube(id_cube);
    
                // Call the function for executing the animation of collecting the selected cube
                this.collect_animation(center_cube_position,cube_orientation);
            }
            else {// Instead, if the robot has a cube in its gripper:
                // Verify if the ray intersect a chest mesh
                const intersections_with_chests = raycaster.intersectObjects(this.#vchests_array, true);
                // If the ray has intersected a panel of a chest, get the whole mesh of the first intersected chest. Otherwise interrupt the function
                if (intersections_with_chests.length === 0)
                    return;

                //Prepare the interaction-state-machine for the execution of the release animation
                this.#executing_animation = true;

                //Get the first intersected chest's panel
                const first_intersected_child_panel = intersections_with_chests[0].object;

                //Recover the parent (the whole chest) of the intersected panel
                const clicked_chest = first_intersected_child_panel.parent;

                //Recover the id of the chest from the mesh and select the associated CChest object
                const id_chest = clicked_chest.userData.id;
                for (const CChest of this.#cchests_array) {
                    if (CChest.get_ID() === id_chest)
                        this.#selected_chest=CChest;
                }
                //Get the pose of the chest
                const center_chest_position = new THREE.Vector3();
                clicked_chest.getWorldPosition(center_chest_position);
                const chest_orientation = [-Math.PI/2,Math.PI/2,0];
    
                // Call the function for executing the animation of releasing the cube in the selected chest
                this.release_animation(center_chest_position,chest_orientation);
            }
        }
        else {
            return;
        }
    }

    /**
     * This method manages all the movements and inverse kinematics of the robot in order to create an animation that starting from the rest pose,
     * the robot goes upon the selected cube, takes the cube in the gripper and then it returns to the rest pose  
     */
    async collect_animation(center_cube_position, cube_orientation) {
        //Given the pose of the selected cube, the robot calculates a mid pose to align itself with the cube while maintaining a vertical offset of 0.2 m  
        const mid_pose = [center_cube_position.x,center_cube_position.y + 0.2,center_cube_position.z,cube_orientation.x,cube_orientation.y,cube_orientation.z];
        const mid_q = this.#robot.get_MRobot().inverse_Kinematics(mid_pose,this.#robot.get_MRobot().get_last_q_configuration(),max_iterations, epsilon_position, epislon_orientation);
        //Start the tween to move the robot from the rest pose to the mid pose upon the cube with a vertcial offset of 0.2m
        await this.move_Threejs_Robot(this.#robot.get_VRobot().get_last_q_configuration(),mid_q);

        //The robot calculates the final pose to align the the center of the gripper (TCP) with the cube
        const final_pose = [center_cube_position.x,center_cube_position.y,center_cube_position.z,cube_orientation.x,cube_orientation.y,cube_orientation.z];
        const final_q = this.#robot.get_MRobot().inverse_Kinematics(final_pose,this.#robot.get_MRobot().get_last_q_configuration(),max_iterations, epsilon_position, epislon_orientation);
        //Start the tween to move the robot so that the gripper goes down to align with the cube
        await this.move_Threejs_Robot(this.#robot.get_VRobot().get_last_q_configuration(),final_q);
        //Start the tween to close the gripper until the two contact sensors detect collision with the cube 
        await this.open_close_Threejs_Gripper(this.#robot.get_CGripper().get_VGripper().get_last_gripper_value(),0.6);
        //Start the tween to move the robot to the rest pose with the cube.
        await this.move_Threejs_Robot(this.#robot.get_VRobot().get_last_q_configuration(),this.#robot.get_rest_q());
        //Release the interaction-state-machine from the blocking animation
        this.#executing_animation = false;
    }

    /**
     * This method manages all the movements and inverse kinematics of the robot in order to create an animation that starting from the rest pose,
     * the robot goes upon the selected chest, releases the cube and then it returns to the rest pose.  
     */
    async release_animation(center_chest_position, chest_orientation){
        //Given the pose of the selected chest, the robot calculates the move pose to align itself with the chest while maintaining a vertical offset of 0.55 m 
        const move_pose = [center_chest_position.x,center_chest_position.y+0.55,center_chest_position.z,chest_orientation[0],chest_orientation[1],chest_orientation[2]];
        const move_q = this.#robot.get_MRobot().inverse_Kinematics(move_pose,this.#robot.get_MRobot().get_last_q_configuration(),max_iterations, epsilon_position, epislon_orientation);
        //Start the tween to move the robot from the rest pose to the move pose upon the chest with a vertcial offset of 0.55m
        await this.move_Threejs_Robot(this.#robot.get_VRobot().get_last_q_configuration(),move_q);
        //Start the tween to open the gripper and release the cube
        await this.open_close_Threejs_Gripper(this.#robot.get_CGripper().get_VGripper().get_last_gripper_value(),0.0);
        //Start the tween to move the robot to the rest pose without the cube.
        await this.move_Threejs_Robot(this.#robot.get_VRobot().get_last_q_configuration(),this.#robot.get_rest_q());
        //Release the interaction-state-machine from the blocking animation
        this.#executing_animation = false;
    
    }
    /**
     * Method called each frame by the renderer for drawing all the objects in the scene
     * @param {float} time 
     */
    animate(time){
        this.#actual_time=time;
        VScene.getInstance().get_renderer().setSize(window.innerWidth, window.innerHeight); // Command used to adapt the canvas and the scene to a resizing window
        VScene.getInstance().get_camera().aspect = window.innerWidth/window.innerHeight; // Command used to correctly update the projection of the scene after window resizing
        VScene.getInstance().get_camera().updateProjectionMatrix(); // Command used to correctly update the projection of the scene after window resizing
        VScene.getInstance().get_camera_controls().update();
        this.#My_TWEEN_Group.update(time); //Necessary for making tween works
        if (this.#robot.get_CGripper().get_MGripper().get_finger_contact_sensor_left_Ammo() && this.#robot.get_CGripper().get_MGripper().get_finger_contact_sensor_right_Ammo()) {
            //skip this if the finger sensors are not already initialized

            //Take the pose of each only-kinetic finger contact sensors mesh moved by the robot in Three.js scene
            // and syncronize it in the pose of the twin rigid body in the Ammo env. 
            this.#robot.get_CGripper().syncronize_finger_mesh_to_Ammo();
        }
        this.#timer.update();
        const elapsed_Time = this.#timer.getDelta();
        // Step the physical simulation of the Ammo env
        Ammo_environment.getInstance().get_World().stepSimulation(elapsed_Time,10);
        //#region Take the pose computed by the Ammo env for each cube on the floor and in the chests and syncronize the corresponding mesh.
        CFloor.getInstance().syncronize_Ammo_to_mesh();
        for (const CChest of this.#cchests_array) {
            CChest.syncronize_Ammo_to_mesh();
        }
        //#endregion

        //If there is a cube grasped by the robot, it will be only moved by the kinematics of the robot in the three.js env 
        // and syncronized it in the pose of the twin rigid body in the Ammo env.
        if (!(this.#selected_cube===null)){
            this.#selected_cube.syncronize_mesh_to_Ammo();
        }
        VScene.getInstance().get_renderer().render(
            VScene.getInstance().get_scene(), 
            VScene.getInstance().get_camera()
        );
    }
}