import {Ammo_environment} from './Ammo_environment';

export class MCube {
    #ID;

    #dimenions;
    
    //This is the body of the cube in the Ammo environment and contains all the physical informations about the cube (like position and orientation)
    #body_Ammo=null;

    constructor(id=1, dim, position=[0.5,0.03,0.5],quaternion=[-0.5,-0.5,-0.5,0.5]){
        this.#ID=id;
        this.#dimenions=dim;

        const ammo_environment = Ammo_environment.getInstance();
        const Ammo = ammo_environment.get_Ammo();

        const collectable_object_shape_Ammo = new Ammo.btBoxShape(new Ammo.btVector3(dim/2, dim/2, dim/2));
        const initial_transformation = new Ammo.btTransform();
        initial_transformation.setIdentity();
        initial_transformation.setOrigin(new Ammo.btVector3(position[0], position[1], position[2]));

        initial_transformation.setRotation(new Ammo.btQuaternion(quaternion[0],quaternion[1],quaternion[2],quaternion[3]));
        const initial_state_Ammo= new Ammo.btDefaultMotionState(initial_transformation);
        const collectable_object_inertia_Ammo=new Ammo.btVector3(0, 0, 0);
        collectable_object_shape_Ammo.calculateLocalInertia(1,collectable_object_inertia_Ammo);
        const info_rigid_body_Ammo = new Ammo.btRigidBodyConstructionInfo(
            1, //mass
            initial_state_Ammo,
            collectable_object_shape_Ammo,
            collectable_object_inertia_Ammo
        );
        this.#body_Ammo = new Ammo.btRigidBody(info_rigid_body_Ammo);
        this.#body_Ammo.setUserIndex(id);
        this.#body_Ammo.setActivationState(4); //otherwise after sometime Ammo will deactivate it
        Ammo_environment.getInstance().get_World().addRigidBody(this.#body_Ammo);
    }

    get_position(){

        const ammo_environment = Ammo_environment.getInstance();
        const Ammo = ammo_environment.get_Ammo();
        const motion_state = this.#body_Ammo.getMotionState();
        const Ammo_transformation = new Ammo.btTransform();
        motion_state.getWorldTransform(Ammo_transformation);
        return Ammo_transformation.getOrigin();
    }

    get_quaternion(){
        const ammo_environment = Ammo_environment.getInstance();
        const Ammo = ammo_environment.get_Ammo();
        const motion_state = this.#body_Ammo.getMotionState();
        const Ammo_transformation = new Ammo.btTransform();
        motion_state.getWorldTransform(Ammo_transformation);
        return Ammo_transformation.getRotation();
    }

    set_pose(position,orientation){
        const ammo_environment = Ammo_environment.getInstance();
        const Ammo = ammo_environment.get_Ammo();
        const Ammo_transformation = new Ammo.btTransform();
        Ammo_transformation.setIdentity();

        const Ammo_position = Ammo_transformation.getOrigin();
        Ammo_position.setValue(position.x,position.y,position.z);

        Ammo_transformation.setRotation(new Ammo.btQuaternion(orientation.x,orientation.y,orientation.z,orientation.w));
        this.#body_Ammo.setWorldTransform(Ammo_transformation);
        const motion_state = this.#body_Ammo.getMotionState();
        
        motion_state.setWorldTransform(Ammo_transformation);
        Ammo_environment.getInstance().get_World().updateSingleAabb(this.#body_Ammo);
    }

    get_ID() {
        return this.#ID;
    }

    get_Cube_Ammo() {
        return this.#body_Ammo;
    }

    deactivate(){
        this.#body_Ammo.setActivationState(5);
    }
}