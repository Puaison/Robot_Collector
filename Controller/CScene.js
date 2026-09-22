import { CChest } from "./CChest";
import { CCube } from "./CCube";
import { CRobot } from "./CRobot";
import { Ammo_environment } from "../Model/Ammo_environment";
import { VScene } from "../View/VScene";
import { normalize_Angle } from "../javascript_files/utils";
import { rest_q,max_iterations,epsilon_position,epislon_orientation } from "../javascript_files/config";
import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { CFloor } from "./CFloor";

export class CScene {
    static #instance = null;
    #cchests=[];
    #vchests_array=[];
    #robot=null;
    #object_collected=false;
    #executing_animation=false;
    #selected_cube=null;
    #My_TWEEN=null;
    #timer=null;
    constructor() {
        //Create the two chests
        const cchest_1= new CChest([0.85,0,0]);
        this.#cchests.push(cchest_1);
        this.#vchests_array.push(cchest_1.get_VChest().get_Chest_mesh())

        const cchest_2= new CChest([-0.85,0,0]);
        this.#cchests.push(cchest_2);
        this.#vchests_array.push(cchest_2.get_VChest().get_Chest_mesh())

        // Create the Floor
        CFloor.getInstance();

        //Cube added to the floor, then it is recorded there
        //const ccube_1= new CCube();
        this.#selected_cube = new CCube();

        this.#robot = new CRobot();

        // Tween setup
        this.#My_TWEEN = new TWEEN.Group();

        VScene.getInstance().get_renderer().domElement.addEventListener("click", (event) => this.register_mouse_clicked_input(event));

        this.#timer=new THREE.Timer();


    }

    static async getInstance() {
        if (CScene.#instance === null) {
            CScene.#instance = new CScene();
            await CScene.#instance.#robot.load_CRobot();
        }
        return CScene.#instance;
    }

    detect_collisions_between(Id_object_Ammo_1, Id_object_Ammo_2){
        const dispatcher = Ammo_environment.getInstance().get_World().getDispatcher();
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

    //we need to give the id.
    collect_object(){
        this.#object_collected = true;
        const selected_cube_mesh = this.#selected_cube.get_VCube().get_Cube_mesh();
        const selected_cube_Ammo = this.#selected_cube.get_MCube().get_Cube_Ammo();
        this.#robot.get_cgripper().get_vgripper().get_tcp().attach(selected_cube_mesh);
        //ur5tcp.attach(selected_cube_mesh);
        selected_cube_mesh.position.set(0,0,0);
        selected_cube_mesh.quaternion.identity();
        selected_cube_Ammo.setCollisionFlags(selected_cube_Ammo.getCollisionFlags() | 2); //Necessary otherwise strange behaviour when releasing
    }

    release_object(){
        this.#object_collected = false;
        const selected_cube_mesh = this.#selected_cube.get_VCube().get_Cube_mesh();
        const selected_cube_Ammo = this.#selected_cube.get_MCube().get_Cube_Ammo();
        VScene.getInstance().get_scene().attach(selected_cube_mesh);
        selected_cube_Ammo.setCollisionFlags(selected_cube_Ammo.getCollisionFlags() & ~2); //Necessary otherwise strange behaviour when releasing
    }

    move_Threejs_Robot(q_initial, q_final, duration = 5000) {
        return new Promise((resolve) => {
            const q = Array.from(q_initial);
            const target = Array.from(q_final);
            new TWEEN.Tween(q, this.#My_TWEEN) //Start from q
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
                    this.#robot.get_vrobot().update_Threejs_Robot_Joints(current_q);
                })
                .onComplete(() => {this.#robot.get_vrobot().set_last_q_configuration(target); this.#robot.get_mrobot().set_last_q_configuration(target); resolve();}) //Function called at the end of the animation
                .start(); //Let start the planned Tween
        });
    }

    open_close_Threejs_Gripper(initial_value, final_value, duration = 5000) {
        return new Promise((resolve) => {
            const current_value = [initial_value];
            const gripper_tween = new TWEEN.Tween(current_value, this.#My_TWEEN) //Start from current_value
                .to([final_value], duration) //It must reach target in these milliseconds
                .easing(TWEEN.Easing.Sinusoidal.InOut) //More sweet animation at the start and at the end
                .onUpdate(() => { // Function called during the animation
                    if (this.detect_collisions_between(1,3000) && this.detect_collisions_between(1,2000) && !(this.#object_collected)){
                        console.log("Stop grasping");
                        gripper_tween.stop();
                        this.collect_object();
                        resolve();
                    }
                    if (!(this.detect_collisions_between(1,3000)) && !(this.detect_collisions_between(1,2000)) && this.#object_collected){
                        console.log("Release object");
                        this.release_object();
                    }
                    this.#robot.get_cgripper().get_vgripper().get_gripper_mesh().setJointValue('robotiq_85_left_knuckle_joint', current_value[0]);
                    //robotiq_85_gripper.setJointValue('robotiq_85_left_knuckle_joint', current_value[0]);
                    this.#robot.get_cgripper().get_vgripper().set_last_gripper_value(current_value[0]);
                    this.#robot.get_cgripper().get_mgripper().set_last_gripper_value(current_value[0]);
                })
                .onComplete(() => {resolve();}) //Function called at the end of the animation
                .start(); //Let start the planned Tween
        });
    }

    register_mouse_clicked_input(event){
        if (!this.#executing_animation){
            const raycaster = new THREE.Raycaster();
            const mouse_position = new THREE.Vector2();
            const rect = VScene.getInstance().get_renderer().domElement.getBoundingClientRect();
    
            mouse_position.x = ((event.clientX-rect.left)/rect.width)*2 -1;
    
            mouse_position.y = ((event.clientY-rect.top)/rect.height)*-2 +1;
            raycaster.setFromCamera(mouse_position, VScene.getInstance().get_camera());
            if(!(this.#object_collected)) {
                const intersections_with_cubes = raycaster.intersectObject(this.#selected_cube.get_VCube().get_Cube_mesh(), true);
                if (intersections_with_cubes.length === 0) 
                    return;
                this.#executing_animation = true;
                const clicked_cube = intersections_with_cubes[0].object;
    
                const id_cube= clicked_cube.userData.id;
                const center_cube_position = new THREE.Vector3();
                clicked_cube.getWorldPosition(center_cube_position);
                const cube_quaternion = new THREE.Quaternion();
                clicked_cube.getWorldQuaternion(cube_quaternion);
                const cube_orientation = new THREE.Euler();
                cube_orientation.setFromQuaternion(cube_quaternion, 'XYZ');
    
                // Call the function for the animation of collecting the selected cube
                this.collect_animation(id_cube,center_cube_position,cube_orientation);
            }
            else {
                const intersections_with_chests = raycaster.intersectObjects(this.#vchests_array, true);
    
                if (intersections_with_chests.length === 0)
                    return;
                this.#executing_animation = true;
                const first_intersected_child_panel = intersections_with_chests[0].object;
                const clicked_chest = first_intersected_child_panel.parent;
                const center_chest_position = new THREE.Vector3();
                clicked_chest.getWorldPosition(center_chest_position);
    
                const chest_orientation = [-Math.PI/2,0,-Math.PI/2];
    
                // Call the function for the animation of releasing the cube in the selected chest
                this.release_animation(center_chest_position,chest_orientation);
            }
        }
        else {
            return;
        }
    }

    async collect_animation(id, center_cube_position, cube_orientation) {
        const last_q_configuration = this.#robot.get_mrobot().get_last_q_configuration();
        const mid_pose = [center_cube_position.x,center_cube_position.y + 0.2,center_cube_position.z,cube_orientation.x,cube_orientation.y,cube_orientation.z];
        let temp_q = this.#robot.get_mrobot().inverse_Kinematics(mid_pose,this.#robot.get_mrobot().get_last_q_configuration(),max_iterations, epsilon_position, epislon_orientation);
        //let temp_q =inverse_Kinematics(mid_pose,last_q_configuration,max_iterations, epsilon_position, epislon_orientation);
        const mid_q = temp_q.map(angle => normalize_Angle(angle));
        await this.move_Threejs_Robot(this.#robot.get_vrobot().get_last_q_configuration(),mid_q,1000);
        const final_pose = [center_cube_position.x,center_cube_position.y,center_cube_position.z,cube_orientation.x,cube_orientation.y,cube_orientation.z];
        temp_q = this.#robot.get_mrobot().inverse_Kinematics(final_pose,this.#robot.get_mrobot().get_last_q_configuration(),max_iterations, epsilon_position, epislon_orientation);
        //temp_q=inverse_Kinematics(final_pose,this.#robot.get_mrobot().get_last_q_configuration(),max_iterations, epsilon_position, epislon_orientation);
        const final_q=temp_q.map(angle => normalize_Angle(angle));
        await this.move_Threejs_Robot(this.#robot.get_vrobot().get_last_q_configuration(),final_q,1000);
        await this.open_close_Threejs_Gripper(this.#robot.get_cgripper().get_vgripper().get_last_gripper_value(),0.6,1000);
        await this.move_Threejs_Robot(this.#robot.get_vrobot().get_last_q_configuration(),rest_q,1000);
        this.#executing_animation = false;
    }

    async release_animation(center_chest_position, chest_orientation){
        const move_pose = [center_chest_position.x,center_chest_position.y+0.55,center_chest_position.z,chest_orientation[0],chest_orientation[1],chest_orientation[2]];
        //const move_pose = [-0.85,0.55,0.0,-Math.PI/2,0.0,-Math.PI/2];
        let temp_q = this.#robot.get_mrobot().inverse_Kinematics(move_pose,this.#robot.get_mrobot().get_last_q_configuration(),max_iterations, epsilon_position, epislon_orientation);
        //let temp_q=inverse_Kinematics(move_pose,last_q_configuration,max_iterations+5000, epsilon_position, epislon_orientation);
        const move_q=temp_q.map(angle => normalize_Angle(angle));
        await this.move_Threejs_Robot(this.#robot.get_vrobot().get_last_q_configuration(),move_q,1000);
        await this.open_close_Threejs_Gripper(this.#robot.get_cgripper().get_vgripper().get_last_gripper_value(),0.0,2000);
        await this.move_Threejs_Robot(this.#robot.get_vrobot().get_last_q_configuration(),rest_q,1000);
        this.#executing_animation = false;
    
    }

    animate(time){
        const ammo_environment = Ammo_environment.getInstance();
        const Ammo = ammo_environment.get_Ammo();
        

        VScene.getInstance().get_renderer().setSize(window.innerWidth, window.innerHeight);
        VScene.getInstance().get_camera().aspect = window.innerWidth/window.innerHeight;
        VScene.getInstance().get_camera().updateProjectionMatrix();
        VScene.getInstance().get_camera_controls().update();
        this.#My_TWEEN.update(time);
        if (this.#robot.get_cgripper().get_mgripper().get_finger_contact_sensor_left_Ammo() && this.#robot.get_cgripper().get_mgripper().get_finger_contact_sensor_right_Ammo()) { //skip this if the finger sensors are not already created
            this.#robot.get_cgripper().syncronize_finger_mesh_to_Ammo();
        }
        this.#timer.update();
        const elapsed_Time = this.#timer.getDelta();
        // How to step the physical simulation
        Ammo_environment.getInstance().get_World().stepSimulation(elapsed_Time,10);
        if (!this.#object_collected){
            if (this.#selected_cube.get_VCube().get_Cube_mesh() && this.#selected_cube.get_MCube().get_Cube_Ammo()){
                const motion_state = this.#selected_cube.get_MCube().get_Cube_Ammo().getMotionState();
                const Ammo_transformation = new Ammo.btTransform();
                motion_state.getWorldTransform(Ammo_transformation);
        
                const position = Ammo_transformation.getOrigin();
                const orientation = Ammo_transformation.getRotation();
        
                this.#selected_cube.get_VCube().get_Cube_mesh().position.set(position.x(),position.y(),position.z());
                this.#selected_cube.get_VCube().get_Cube_mesh().quaternion.set(orientation.x(), orientation.y(), orientation.z(), orientation.w());
        
            }
            //syncronize_Ammo_to_mesh();
        }
        else {
            if (this.#selected_cube.get_VCube().get_Cube_mesh() && this.#selected_cube.get_MCube().get_Cube_Ammo()){
                    const position = new THREE.Vector3();
                    const orientation = new THREE.Quaternion();
                    this.#selected_cube.get_VCube().get_Cube_mesh().getWorldPosition(position);
                    this.#selected_cube.get_VCube().get_Cube_mesh().getWorldQuaternion(orientation);
            
                    const Ammo_transformation = new Ammo.btTransform();
                    Ammo_transformation.setIdentity();
            
                    const Ammo_position = Ammo_transformation.getOrigin();
                    Ammo_position.setValue(position.x,position.y,position.z);
            
                    Ammo_transformation.setRotation(new Ammo.btQuaternion(orientation.x,orientation.y,orientation.z,orientation.w));
                    this.#selected_cube.get_MCube().get_Cube_Ammo().setWorldTransform(Ammo_transformation);
                    const motion_state = this.#selected_cube.get_MCube().get_Cube_Ammo().getMotionState();
            
                    
                    motion_state.setWorldTransform(Ammo_transformation);
                    Ammo_environment.getInstance().get_World().updateSingleAabb(this.#selected_cube.get_MCube().get_Cube_Ammo());
            
                }
            //syncronize_mesh_to_Ammo();
        }
        VScene.getInstance().get_renderer().render(VScene.getInstance().get_scene(), VScene.getInstance().get_camera());
    }
}