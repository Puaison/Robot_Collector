export class VGripper {
    #finger_sensor_left_mesh=null;
    #finger_sensor_right_mesh=null;
    #ur5tcp=null;
    #ur5gripper=null;
    #loader = null;
    #last_gripper_value = 0.0;

    constructor(){

    }
    set_loader(loader){
        this.#loader=loader;
    }

    load_Gripper() {
        return new Promise((resolve, reject) => {
            this.#loader.load(
                '/ur5/robotiq_85_gripper_simple.urdf',
                gripper => {
                    this.#ur5gripper = gripper;
                    const finger_sensor_geometry = new THREE.BoxGeometry(0.038, 0.0156, 0.022);
                    const finger_sensor_material = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });
                
                    const finger_sensor_left_mesh= new THREE.Mesh(finger_sensor_geometry, finger_sensor_material);
                    finger_sensor_left_mesh.position.set(0.025,0.0,0.0); //0.032
                
                    const finger_sensor_right_mesh = new THREE.Mesh(finger_sensor_geometry, finger_sensor_material);
                    finger_sensor_right_mesh.position.set(0.025,0.0,0.0);
                
                    this.#ur5gripper.links["robotiq_85_left_finger_tip_link"].add(finger_sensor_left_mesh);
                    this.#ur5gripper.links["robotiq_85_right_finger_tip_link"].add(finger_sensor_right_mesh);
    
                    this.#finger_sensor_left_mesh=finger_sensor_left_mesh;
                    this.#finger_sensor_right_mesh=finger_sensor_right_mesh;
    
                    this.#ur5tcp=this.#ur5gripper.links["dummy_center_indicator_link"];
    
                    // Mesh setup for the gripper
                    gripper.position.set(0, 0.0, 0.137);
                    gripper.rotation.y = -Math.PI/2;
    
                    //ur5robot.joints["wrist_3_joint"].add(gripper);
                    resolve();
                },
                undefined,
                reject
            );
        });
    }

    get_tcp(){
        return this.#ur5tcp;
    }

    get_finger_sensor_left_mesh(){
        return this.#finger_sensor_left_mesh;
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