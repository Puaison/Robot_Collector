import * as THREE from 'three';
export class VCubes{
    #ID;

    #dimenions;

    //This is the body of the cube in the three.js environment and represents its mesh.
    #body_mesh;

    constructor(id, dim=0.047, position=[0.5,0.03,0.5],quaternion=[-0.5,-0.5,-0.5,0.5]){
        const cube_collectable_geometry = new THREE.BoxGeometry(dim,dim,dim);
        this.#dimenions=dim;
    
        const collectable_object_material = new THREE.MeshStandardMaterial({color: 0xffff44});
        this.#body_mesh = new THREE.Mesh(object_collectable_geometry,collectable_object_material);
        this.#body_mesh.position.set(position[0], position[1], position[2]);
        this.#body_mesh.userData.id=1;
        this.#body_mesh.rotation.z=-Math.PI/2;
        this.#body_mesh.rotation.x=-Math.PI/2;
        //scene.add(collectable_object_mesh);
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
}