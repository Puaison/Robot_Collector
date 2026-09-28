import * as THREE from 'three';
import {support_robot_base_block_height} from '../javascript_files/config'
import { LoadingManager } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import URDFLoader from 'urdf-loader';
import GUI from 'lil-gui';

/**
 * This class represents the scene in the Three.js environment with all its components. It uses the Singleton Pattern.
 * 
 * Responsibility: It manages all the fundamental components for the correct visualization of the scene
 */
export class VScene{
    /** @type {VScene} Singleton Instance of this class */
    static #instance = null;
    /** @type {THREE.Scene} Three.js scene environment*/
    #scene = null;
    /** @type {THREE.PerspectiveCamera} Three.js camera */
    #camera = null;
    /** @type {THREE.WebGLRenderer} Three.js renderer */
    #renderer = null;
    /** @type {OrbitControls} camera controls */
    #camera_controls = null;
    constructor(){
        // SCENE

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0x1E2228);

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



        // RENDERER

        this.#renderer = new THREE.WebGLRenderer(); //it will also create a canvas
        this.#renderer.setSize(window.innerWidth, window.innerHeight); // define the size of the canvas
        document.body.appendChild(this.#renderer.domElement); // add the canvas to the DOM

        // Controls of the this.#camera
        this.#camera_controls = new OrbitControls(this.#camera, this.#renderer.domElement);
        this.#camera_controls.enablePan=true; //enable translation of the this.#camera
        this.#camera_controls.minDistance = 0.1;
        this.#camera_controls.maxDistance = 5;

        // Support robot base BLOCK where the robot is placed
        const geometry_support_robot_base_block = new THREE.BoxGeometry(0.15, support_robot_base_block_height, 0.15);
        const material_support_robot_base_block = new THREE.MeshStandardMaterial({ color: 0xC5AA4A });
        const support_robot_base_block = new THREE.Mesh(geometry_support_robot_base_block, material_support_robot_base_block);
        support_robot_base_block.position.set(0, support_robot_base_block_height/2, 0);
        this.#scene.add(support_robot_base_block);
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