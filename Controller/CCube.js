import { MCube } from "../Model/MCube";
import { VCube } from "../View/VCube";
import { VScene } from "../View/VScene";
import { VFloor } from "../View/VFloor";
import { MFloor } from "../Model/MFloor";
import { Ammo_environment } from "../Model/Ammo_environment";
/**
 * This class is the controller of a particular Cube object and it is responsible to add the cube-mesh to the scene.
 * 
 * Responsibility: syncronizes the data, transformations and operations between the visual part (mesh) and the physical part of the same cube in the Ammo environment.
 */
export class CCube{
    #ID = null;
    #vcube = null;
    #mcube = null;

    constructor(id=1, dim=0.047, position=[0.5,0.03,0.5],quaternion=[-0.5,-0.5,-0.5,0.5]){
        this.#ID =id;
        this.#vcube= new VCube(id,dim,position,quaternion);
        VScene.getInstance().add_mesh(this.#vcube.get_Cube_mesh());
        VFloor.getInstance().add_VCube(this.#vcube);

        this.#mcube= new MCube(id,dim,position,quaternion);
        MFloor.getInstance().add_MCube(this.#mcube);
    }
    /**
     * Takes the info from the rigid body of the cube in the Ammo env and copies them to the mesh in the scene.
     * Used when the cube is not grasped by the robot (cube dynamic)
     */
    syncronize_Ammo_to_mesh(){
        if (this.#vcube.get_Cube_mesh() && this.#mcube.get_Cube_Ammo()){
            const motion_state = this.#mcube.get_Cube_Ammo().getMotionState();
            const Ammo_transformation = new Ammo_environment.getInstance().get_Ammo().btTransform();
            motion_state.getWorldTransform(Ammo_transformation);
    
            const position = Ammo_transformation.getOrigin();
            const orientation = Ammo_transformation.getRotation();
    
            this.#vcube.get_Cube_mesh().position.set(position.x(),position.y(),position.z());
            this.#vcube.get_Cube_mesh().quaternion.set(orientation.x(), orientation.y(), orientation.z(), orientation.w());
    
        }
        else {
            return;
        }
    }

    /**
     * Takes the info from the mesh of the cube and copies them to the rigid body in the Ammo env 
     * Used when the robot has grasped the cube (cube only kinetic)
     */
    syncronize_mesh_to_Ammo(){
        if (this.#vcube.get_Cube_mesh() && this.#mcube.get_Cube_Ammo()){
            const position = new THREE.Vector3();
            const orientation = new THREE.Quaternion();
            this.#vcube.get_Cube_mesh().getWorldPosition(position);
            this.#vcube.get_Cube_mesh().getWorldQuaternion(orientation);
    
            const Ammo_transformation = new Ammo_environment.getInstance().get_Ammo().btTransform();
            Ammo_transformation.setIdentity();
    
            const Ammo_position = Ammo_transformation.getOrigin();
            Ammo_position.setValue(position.x,position.y,position.z);
    
            Ammo_transformation.setRotation(new Ammo_environment.getInstance().get_Ammo().btQuaternion(orientation.x,orientation.y,orientation.z,orientation.w));
            this.#mcube.get_Cube_Ammo().setWorldTransform(Ammo_transformation);
            const motion_state = this.#mcube.get_Cube_Ammo().getMotionState();
    
            
            motion_state.setWorldTransform(Ammo_transformation);
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