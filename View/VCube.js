import * as THREE from 'three';
import { VScene } from './VScene.js';
/**
 * This class represents the mesh cube in the Three.js environment that can be collected by the robot.
 * 
 * Responsibility: It models the mesh of a specific cube and recovers informations like position and orientation from the mesh in the scene.
 */
export class VCube{
    /** @type {int} Identifier of the Cube*/
    #ID;
    /** @type {float} Dimension of the cube */
    #dimenions;

    /** @type {THREE.Mesh} This is the body of the cube in the three.js environment and represents its mesh.*/
    #body_mesh=null;

    constructor(id=1, dim=0.047, position=[0.5,0.03,0.5],quaternion=[-0.5,-0.5,-0.5,0.5],color=0xffff44){
        const cube_collectable_geometry = new THREE.BoxGeometry(dim,dim,dim);
        this.#dimenions=dim;
    
        const cube_collectable_material = new THREE.MeshStandardMaterial({color: color});
        this.#body_mesh = new THREE.Mesh(cube_collectable_geometry,cube_collectable_material);
        this.#body_mesh.position.set(position[0], position[1], position[2]);
        this.#body_mesh.userData.id=id;
        const quaternion_temp = new THREE.Quaternion(quaternion[0],quaternion[1],quaternion[2],quaternion[3]);
        const RPY = new THREE.Euler();
        RPY.setFromQuaternion(quaternion_temp, 'XYZ');
        this.#body_mesh.rotation.z=RPY.z;
        this.#body_mesh.rotation.y=-RPY.y;
        this.#body_mesh.rotation.x=-RPY.x;
    }

    get_position(){
        const center_cube_position = new THREE.Vector3();
        this.#body_mesh.getWorldPosition(center_cube_position);
        return center_cube_position;
    }

    get_quaternion(){
        const cube_quaternion = new THREE.Quaternion();
        this.#body_mesh.getWorldQuaternion(cube_quaternion);
        return cube_quaternion;
    }

    get_orientation(){
        const cube_quaternion = new THREE.Quaternion();
        this.#body_mesh.getWorldQuaternion(cube_quaternion);
        const cube_orientation = new THREE.Euler();
        cube_orientation.setFromQuaternion(cube_quaternion, 'XYZ');
        return cube_orientation;
    }

    set_pose(position,orientation){
        //not yet implemented
    }

    get_ID() {
        return this.#ID;
    }

    get_Cube_mesh() {
        return this.#body_mesh;
    }

    clear_mesh(){
        VScene.getInstance().get_scene().remove(this.#body_mesh);
    }
}