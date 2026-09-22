import * as THREE from 'three';
import {block_Height} from '../javascript_files/config'
import { LoadingManager } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import URDFLoader from 'urdf-loader';
import GUI from 'lil-gui';

/**
 * This class represents the scene in the Three.js environment with all its components. It uses the Singleton Pattern
 * 
 * Responsibility: It manages all the fundamental components for the correct visualization of the scene
 */
export class VScene{
    static #instance = null;
    #scene = null;
    #camera = null;
    #renderer = null;
    #camera_controls = null;
    constructor(){
        // SCENE

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0xC5A643);

        // LIGHTS


        const light1 = new THREE.DirectionalLight(0xffffff,2); //2 is the intensity of the light
        const light2 = new THREE.DirectionalLight(0xffffff,2);
        const light3 = new THREE.DirectionalLight(0xffffff,2);
        const light4 = new THREE.DirectionalLight(0xffffff,2);
        light1.position.set(-1, 1, -1);
        light2.position.set(1, 1, -1);
        light3.position.set(-1, 1, 1);
        light4.position.set(1, 1, 1);
        this.#scene.add(light1);
        this.#scene.add(light2);
        this.#scene.add(light3);
        this.#scene.add(light4);


        // CAMERA


        this.#camera = new THREE.PerspectiveCamera(
            45, //fov
            window.innerWidth / window.innerHeight, //aspect
            0.01, //near
            500 //far
        );
        this.#camera.position.set(-0.5, 2.7, 1);
        //this.#camera.lookAt(-5, -5, -5);



        // // GUI
        // const gui= new GUI();
        // gui.add(this.#camera, 'fov', 1, 180).onChange(animate);



        // RENDERER

        this.#renderer = new THREE.WebGLRenderer(); //it will also create a canvas
        this.#renderer.setSize(window.innerWidth, window.innerHeight); // define the size of the canvas
        document.body.appendChild(this.#renderer.domElement); // add the canvas to the DOM

        // Controls of the this.#camera
        this.#camera_controls = new OrbitControls(this.#camera, this.#renderer.domElement);
        this.#camera_controls.enablePan=true; //enable translation of the this.#camera
        this.#camera_controls.minDistance = 0.1;
        this.#camera_controls.maxDistance = 5;

        // BLOCK where the robot is placed
        const geometry_block = new THREE.BoxGeometry(0.15, block_Height, 0.15);
        const material_block = new THREE.MeshStandardMaterial({ color: 0xC5AA4A });
        const block = new THREE.Mesh(geometry_block, material_block);
        block.position.set(0, block_Height/2, 0);
        this.#scene.add(block);
    }

    static getInstance() {
        if (VScene.#instance === null) {
            VScene.#instance = new VScene();
        }
        return VScene.#instance;
    }

    add_mesh(mesh) {
        this.#scene.add(mesh);
    }

    get_scene(){
        return this.#scene;
    }

    get_renderer() {
        return this.#renderer;
    }

    get_camera(){
        return this.#camera;
    }

    get_camera_controls(){
        return this.#camera_controls;
    }
}