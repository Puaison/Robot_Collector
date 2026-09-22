import { floor_rows, floor_coloumns, floor_tile_size, floor_tile_height } from '../javascript_files/config';
import * as THREE from 'three';
export class VFloor{
    static #instance = null;

    #vcubes=[];

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
                    tile_color = new THREE.MeshStandardMaterial({color: 0xC5AA4A}); 
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

    get_Cubes(){
        return this.#vcubes;
    }

    get_Floor_mesh(){
        return this.#floor_mesh;
    }

    add_Cube(VCube){
        this.#vcubes.push(VCube);
    }

    remove_Cube(VCube){
        const index = this.#vcubes.indexOf(VCube);
        this.#vcubes.splice(index,1);
    }

    search_Cube(id){
        for (const VCube of this.#vcubes) {
            if (VCube.get_ID() === id)
                return VCube;
        }
        return null;
    }
}