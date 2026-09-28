import { floor_rows, floor_coloumns, floor_tile_size, floor_tile_height } from '../javascript_files/config.js';
import * as THREE from 'three';
/**
 * This class represents the mesh floor in the Three.js environment. It is a Singleton class as only one floor can be present.
 * 
 * Responsibility: It models the mesh of the floor. It also remebers which cubes are placed on it.
 * @see VCube
 */
export class VFloor{
    /** @type {VFloor} Singleton Instance of this class */
    static #instance = null;
    /** @type {Array_of_VCube} Cubes on the floor */
    #vcubes=[];
    /** @type {THREE.Mesh} Mesh of the Floor*/
    #floor_mesh = null;

    constructor() {
        this.#floor_mesh = new THREE.Group();
        
        for (let i = 0; i < floor_rows; i++) {
            for (let j = 0; j < floor_coloumns; j++) {
        
                const tile_geometry = new THREE.BoxGeometry(
                    floor_tile_size,
                    floor_tile_height,
                    floor_tile_size
                );
        
                let tile_color;
                if ((i + j)%2 == 0) {
                    tile_color = new THREE.MeshStandardMaterial({color: 0x000000}); 
                }
                else {
                    tile_color = new THREE.MeshStandardMaterial({color: 0xF5AA4A}); 
                }
        
                const tile = new THREE.Mesh(tile_geometry, tile_color);
        
                tile.position.set(
                    (j - floor_coloumns/2 + 0.5) * floor_tile_size,
                    -floor_tile_height/2 ,
                    (i - floor_rows/2 + 0.5) * floor_tile_size
                );
        
                this.#floor_mesh.add(tile);
            }
        }
    }

    static getInstance() {
        if (VFloor.#instance === null) {
            VFloor.#instance = new VFloor();
            //MFloor.#instance.MFloor();
        }
        return VFloor.#instance;
    }

    get_VCubes(){
        return this.#vcubes;
    }

    get_Floor_mesh(){
        return this.#floor_mesh;
    }

    add_VCube(VCube){
        this.#vcubes.push(VCube);
    }

    remove_VCube(VCube){
        const index = this.#vcubes.indexOf(VCube);
        this.#vcubes.splice(index,1);
    }

    search_VCube(id){
        for (const VCube of this.#vcubes) {
            if (VCube.get_ID() === id)
                return VCube;
        }
        return null;
    }
}