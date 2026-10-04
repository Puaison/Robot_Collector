import { MCube } from "../Model/MCube.js";
import { VCube } from "../View/VCube.js";
import { VScene } from "../View/VScene.js";
import { Ammo_environment } from "../Model/Ammo_environment.js";
import * as THREE from 'three';
/**
 * This class is the controller of a particular Cube object and it is responsible to add the cube-mesh to the scene.
 * 
 * Responsibility: syncronizes the data, transformations and operations between the visual part (mesh) and the physical part of the same cube in the Ammo environment.
 * @see MCube
 * @see VCube
 * @see VScene
 */
export class CCube{
    /** @type {int} Identifier of the Cube*/
    #ID = null;
    /** @type {VCube} The VCube object managed by this controller */
    #vcube = null;
    /** @type {MCube} The MCube object managed by this controller */
    #mcube = null;

    constructor(id=1, dim=0.047, position=[0.5,0.03,0.5],quaternion=[-0.5,-0.5,-0.5,0.5],color =0xffff44){
        this.#ID =id;
        // Create the visual representation of the cube (the mesh) and add it to the scene
        this.#vcube= new VCube(id,dim,position,quaternion,color);
        VScene.getInstance().add_mesh(this.#vcube.get_Cube_mesh());

        // Create the physical representation of the cube (the rigid body)
        this.#mcube= new MCube(id,dim,position,quaternion);
    }
    /**
     * Takes the info from the rigid body of the cube in the Ammo env. and copies them to the mesh in the scene.
     * Used when the cube is not grasped by the robot (cube dynamic)
     */
    syncronize_Ammo_to_mesh(){
        // if the cube's mesh and rigid body are already initialized:
        if (this.#vcube.get_Cube_mesh() && this.#mcube.get_Cube_Ammo()){
            const ammo_environment = Ammo_environment.getInstance();
            const Ammo = ammo_environment.get_Ammo();

            // Recover the pose of the cube from the Ammo env.
            const motion_state = this.#mcube.get_Cube_Ammo().getMotionState();
            const Ammo_transformation = new Ammo.btTransform();
            motion_state.getWorldTransform(Ammo_transformation);
    
            const position = Ammo_transformation.getOrigin();
            const orientation = Ammo_transformation.getRotation();
            
            // Propagate the recovered pose to the visual representation of the cube in the Three.js scene
            this.#vcube.get_Cube_mesh().position.set(position.x(),position.y(),position.z());
            this.#vcube.get_Cube_mesh().quaternion.set(orientation.x(), orientation.y(), orientation.z(), orientation.w());
    
        }
        else {
            return;
        }
    }

    /**
     * Takes the info from the mesh of the cube and copies them to the rigid body in the Ammo env. 
     * Used when the robot has grasped the cube (cube only kinematic)
     */
    syncronize_mesh_to_Ammo(){
        // if the cube's mesh and rigid body are already initialized:
        if (this.#vcube.get_Cube_mesh() && this.#mcube.get_Cube_Ammo()){
            const ammo_environment = Ammo_environment.getInstance();
            const Ammo = ammo_environment.get_Ammo();
            const position = new THREE.Vector3();
            const orientation = new THREE.Quaternion();
            // Recover the pose of the cube from the Three.js scene
            this.#vcube.get_Cube_mesh().getWorldPosition(position);
            this.#vcube.get_Cube_mesh().getWorldQuaternion(orientation);
    
            const Ammo_transformation = new Ammo.btTransform();
            Ammo_transformation.setIdentity();
            const Ammo_position = Ammo_transformation.getOrigin();

            // Propagate the recovered pose to the physical representation of the cube in the Ammo env.
            Ammo_position.setValue(position.x,position.y,position.z);
            Ammo_transformation.setRotation(new Ammo.btQuaternion(orientation.x,orientation.y,orientation.z,orientation.w));
            this.#mcube.get_Cube_Ammo().setWorldTransform(Ammo_transformation);
            const motion_state = this.#mcube.get_Cube_Ammo().getMotionState();        
            motion_state.setWorldTransform(Ammo_transformation);
            // Update also the Axis aligned bounding box of the cube rigid body for correctly compute collisions
            Ammo_environment.getInstance().get_World().updateSingleAabb(this.#mcube.get_Cube_Ammo());
    
        }
        else {
            return;
        }
    }

    get_VCube() {
        return this.#vcube;
    }

    get_MCube() {
        return this.#mcube
    }

    get_ID() {
        return this.#ID;
    }
}