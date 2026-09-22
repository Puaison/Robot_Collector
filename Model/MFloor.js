import {Ammo_environment} from './Ammo_environment';
import { floor_Width, floor_Height } from '../javascript_files/config';
import { MCube } from './MCube';
export class MFloor{
    static #instance = null;

    #mcubes=[];

    #floor_Ammo = null;

    constructor(){
        const ammo_environment = Ammo_environment.getInstance();
        const Ammo = ammo_environment.get_Ammo();
        //Create a Ammo-box with the same dimension of the visual floor in three.js
        const floor_Shape_Ammo = new Ammo.btBoxShape(new Ammo.btVector3(floor_Width/2,floor_Height/2,floor_Width/2));

        const floor_Transform_Ammo = new Ammo.btTransform(); 
        floor_Transform_Ammo.setIdentity();
        //set the upper part of the floor to be in the Y=0
        floor_Transform_Ammo.setOrigin(new Ammo.btVector3(0,-floor_Height/2,0));
        const floor_initial_Transform_Ammo = new Ammo.btDefaultMotionState(floor_Transform_Ammo); //this is the initial transformation of the flsoor

        const floor_inertia_Ammo = new Ammo.btVector3(0, 0, 0); // No inertia for the floor

        //floor_Shape_Ammo.calculateLocalInertia(1,floor_inertia_Ammo);

        const floor_info = new Ammo.btRigidBodyConstructionInfo( //Gathering Info for constructing the floor
            0,                  // mass = 0
            floor_initial_Transform_Ammo, //initial position
            floor_Shape_Ammo, // shape of the object
            floor_inertia_Ammo
        );

        this.#floor_Ammo = new Ammo.btRigidBody(floor_info); //Finally, create the rigid body with the info described above
        Ammo_environment.getInstance().get_World().addRigidBody(this.#floor_Ammo);
    }

    static getInstance() {
        if (MFloor.#instance === null) {
            MFloor.#instance = new MFloor();
            //MFloor.#instance.MFloor();
        }
        return MFloor.#instance;
    }

    get_Cubes(){
        return this.#mcubes;
    }

    get_Floor_Ammo(){
        return this.#floor_Ammo;
    }

    add_Cube(MCube){
        this.#mcubes.push(MCube);
    }

    remove_Cube(MCube){
        const index = this.#mcubes.indexOf(MCube);
        this.#mcubes.splice(index,1);
    }

    search_Cube(id){
        for (const MCube of this.#mcubes) {
            if (MCube.get_ID() === id)
                return MCube;
        }
        return null;
    }
}