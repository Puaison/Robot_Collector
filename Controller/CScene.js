import { CChest } from "./CChest";
import { CCube } from "./CCube";
import { CRobot } from "./CRobot";
import { Ammo_environment } from "../Model/Ammo_environment";
import { VScene } from "../View/VScene";

export class CScene {
    static #instance = null;
    #cchests=[];
    #robot=null;
    #object_collected=false;
    #executing_animation=false;
    #selected_cube=null;
    constructor() {
        //Create the two chests
        const cchest_1= new CChest(position=[0.85,0,0]);
        this.#cchests.push(cchest_1);

        const cchest_2= new CChest(position=[-0.85,0,0]);
        this.#cchests.push(cchest_2);

        //Cube added to the floor, then it is recorded there
        //const ccube_1= new CCube();
        this.#selected_cube = new CCube();

        this.#robot = new CRobot();


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
        selected_cube_mesh = this.#selected_cube.get_vcube().get_Cube_mesh();
        selected_cube_Ammo = this.#selected_cube.get_mcube().get_Cube_Ammo();
        this.#robot.get_cgripper().get_vgripper().get_tcp().attach(selected_cube_mesh);
        //ur5tcp.attach(selected_cube_mesh);
        selected_cube_mesh.position.set(0,0,0);
        selected_cube_mesh.quaternion.identity();
        selected_cube_Ammo.setCollisionFlags(selected_cube_Ammo.getCollisionFlags() | 2); //Necessary otherwise strange behaviour when releasing
    }

    release_object(){
        this.#object_collected = false;
        selected_cube_mesh = this.#selected_cube.get_vcube().get_Cube_mesh();
        selected_cube_Ammo = this.#selected_cube.get_mcube().get_Cube_Ammo();
        VScene.getInstance().get_scene().attach(selected_cube_mesh);
        selected_cube_Ammo.setCollisionFlags(selected_cube_Ammo.getCollisionFlags() & ~2); //Necessary otherwise strange behaviour when releasing
    }
}