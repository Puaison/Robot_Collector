import * as THREE from 'three';
//import { MGripper } from './MGripper';
import { get_pose_Error,normalize_Angle } from '../javascript_files/utils';
import { block_Height, DH_A, DH_D,  DH_ALPHA } from "../javascript_files/config"
import { get_Tranpose_of_6x6_Matrix, get_Matrix_multiplication_6x6,get_Matrix_Vector_multiplication_6x1 } from "../javascript_files/matrix_operations";
import { Matrix,inverse } from 'ml-matrix';
export class MRobot{
    #fixed_transformations=null;
    #mgripper=null;
    #last_q_configuration = null;
    constructor(offset=block_Height){
        // Place the robot above the box
        const T_y = new THREE.Matrix4().makeTranslation(0, offset, 0);
        
        // The URDF follows REP-103 conventions. Thus, we need to apply a rotation correction to the last joint orientation obtained by forward kinematics based on the original DH conventions
        const T_z = new THREE.Matrix4().makeRotationZ(Math.PI);
    
        // Three.js mesh rotation around x-axis in order to have the robot standing on the floor
        const T_x = new THREE.Matrix4().makeRotationX(-Math.PI/2);

        this.#fixed_transformations = new THREE.Matrix4()
            .multiply(T_y)
            .multiply(T_x)
            .multiply(T_z);
    
    }

    set_last_q_configuration(q) {
        this.#last_q_configuration=q;
    }

    get_last_q_configuration() {
        return this.#last_q_configuration;
    }

    set_gripper(mgripper){
        this.#mgripper= mgripper;
    }

    get_gripper(){
        return this.#mgripper;
    }

    get_DH_Matrix(a, d, alpha, q_i){
        const cq = Math.cos(q_i);
        const sq = Math.sin(q_i);
        const ca = Math.cos(alpha);
        const sa = Math.sin(alpha);
        
        return new THREE.Matrix4().set(
            cq,      -sq * ca,   sq * sa,    a * cq,
            sq,       cq * ca,  -cq * sa,    a * sq,
             0,            sa,        ca,         d,
             0,             0,         0,          1
        );
    }

    get_homogeneous_coordinates(q){
        // Create the six DH matrices for each joint
        const T01 = this.get_DH_Matrix(
            DH_A[0],
            DH_D[0],
            DH_ALPHA[0],
            q[0]
        );
    
        const T12 = this.get_DH_Matrix(
            DH_A[1],
            DH_D[1],
            DH_ALPHA[1],
            q[1]
        );
    
        const T23 = this.get_DH_Matrix(
            DH_A[2],
            DH_D[2],
            DH_ALPHA[2],
            q[2]
        );
    
        const T34 = this.get_DH_Matrix(
            DH_A[3],
            DH_D[3],
            DH_ALPHA[3],
            q[3]
        );
    
        const T45 = this.get_DH_Matrix(
            DH_A[4],
            DH_D[4],
            DH_ALPHA[4],
            q[4]
        );
    
        const T56 = this.get_DH_Matrix(
            DH_A[5],
            DH_D[5],
            DH_ALPHA[5],
            q[5]
        );

        if(this.#mgripper === null) { 
            const T6G = new THREE.Matrix4();
        }
        else {
            const T6G = this.#mgripper.get_homogeneous_coordinates();
        }

        // Obtain the Final DH Canonical Transformation Matrix for the gripper
        
        const T0G = new THREE.Matrix4()
            .multiply(this.#fixed_transformations)
            .multiply(T01)
            .multiply(T12)
            .multiply(T23)
            .multiply(T34)
            .multiply(T45)
            .multiply(T56)
            .multiply(T6G);
        return T0G;
    }
    calculate_numerical_Jacobian(q, epsilon = 1e-4) {
        //const T_normal = extract_T_from_q(q);
    
        const T_plus_0 = this.get_homogeneous_coordinates(q.map((x, i) => i === 0 ? x + epsilon : x));
        const T_plus_1 = this.get_homogeneous_coordinates(q.map((x, i) => i === 1 ? x + epsilon : x));
        const T_plus_2 = this.get_homogeneous_coordinates(q.map((x, i) => i === 2 ? x + epsilon : x));
        const T_plus_3 = this.get_homogeneous_coordinates(q.map((x, i) => i === 3 ? x + epsilon : x));
        const T_plus_4 = this.get_homogeneous_coordinates(q.map((x, i) => i === 4 ? x + epsilon : x));
        const T_plus_5 = this.get_homogeneous_coordinates(q.map((x, i) => i === 5 ? x + epsilon : x));
    
        const T_minus_0 = this.get_homogeneous_coordinates(q.map((x, i) => i === 0 ? x - epsilon : x));
        const T_minus_1 = this.get_homogeneous_coordinates(q.map((x, i) => i === 1 ? x - epsilon : x));
        const T_minus_2 = this.get_homogeneous_coordinates(q.map((x, i) => i === 2 ? x - epsilon : x));
        const T_minus_3 = this.get_homogeneous_coordinates(q.map((x, i) => i === 3 ? x - epsilon : x));
        const T_minus_4 = this.get_homogeneous_coordinates(q.map((x, i) => i === 4 ? x - epsilon : x));
        const T_minus_5 = this.get_homogeneous_coordinates(q.map((x, i) => i === 5 ? x - epsilon : x));
    
        //const pose_normal = extract_pose_from_T(T_normal);
    
        const pose_plus_0 = this.extract_pose_from_T(T_plus_0);
        const pose_plus_1 = this.extract_pose_from_T(T_plus_1);
        const pose_plus_2 = this.extract_pose_from_T(T_plus_2);
        const pose_plus_3 = this.extract_pose_from_T(T_plus_3);
        const pose_plus_4 = this.extract_pose_from_T(T_plus_4);
        const pose_plus_5 = this.extract_pose_from_T(T_plus_5);
    
        const pose_minus_0 = this.extract_pose_from_T(T_minus_0);
        const pose_minus_1 = this.extract_pose_from_T(T_minus_1);
        const pose_minus_2 = this.extract_pose_from_T(T_minus_2);
        const pose_minus_3 = this.extract_pose_from_T(T_minus_3);
        const pose_minus_4 = this.extract_pose_from_T(T_minus_4);
        const pose_minus_5 = this.extract_pose_from_T(T_minus_5);
    
        let J = [
            [                pose_plus_0[0] - pose_minus_0[0],                 pose_plus_1[0] - pose_minus_1[0],                 pose_plus_2[0] - pose_minus_2[0],                 pose_plus_3[0] - pose_minus_3[0],                 pose_plus_4[0] - pose_minus_4[0],                 pose_plus_5[0] - pose_minus_5[0]],
            [                pose_plus_0[1] - pose_minus_0[1],                 pose_plus_1[1] - pose_minus_1[1],                 pose_plus_2[1] - pose_minus_2[1],                 pose_plus_3[1] - pose_minus_3[1],                 pose_plus_4[1] - pose_minus_4[1],                 pose_plus_5[1] - pose_minus_5[1]],
            [                pose_plus_0[2] - pose_minus_0[2],                 pose_plus_1[2] - pose_minus_1[2],                 pose_plus_2[2] - pose_minus_2[2],                 pose_plus_3[2] - pose_minus_3[2],                 pose_plus_4[2] - pose_minus_4[2],                 pose_plus_5[2] - pose_minus_5[2]],
            [normalize_Angle(pose_plus_0[3] - pose_minus_0[3]), normalize_Angle(pose_plus_1[3] - pose_minus_1[3]), normalize_Angle(pose_plus_2[3] - pose_minus_2[3]), normalize_Angle(pose_plus_3[3] - pose_minus_3[3]), normalize_Angle(pose_plus_4[3] - pose_minus_4[3]), normalize_Angle(pose_plus_5[3] - pose_minus_5[3])],
            [normalize_Angle(pose_plus_0[4] - pose_minus_0[4]), normalize_Angle(pose_plus_1[4] - pose_minus_1[4]), normalize_Angle(pose_plus_2[4] - pose_minus_2[4]), normalize_Angle(pose_plus_3[4] - pose_minus_3[4]), normalize_Angle(pose_plus_4[4] - pose_minus_4[4]), normalize_Angle(pose_plus_5[4] - pose_minus_5[4])],
            [normalize_Angle(pose_plus_0[5] - pose_minus_0[5]), normalize_Angle(pose_plus_1[5] - pose_minus_1[5]), normalize_Angle(pose_plus_2[5] - pose_minus_2[5]), normalize_Angle(pose_plus_3[5] - pose_minus_3[5]), normalize_Angle(pose_plus_4[5] - pose_minus_4[5]), normalize_Angle(pose_plus_5[5] - pose_minus_5[5])]
        ];
        J = J.map(row => row.map(x => x * (1/(2*epsilon))));
        return J;
    }

    extract_position_from_T(T){
        const x = T.elements[12];
        const y = T.elements[13];
        const z = T.elements[14];
        return {x, y, z};
    }
    
    extract_RPY_from_T(T){
        const R = new THREE.Matrix4().extractRotation(T);
        const RPY = new THREE.Euler();
        RPY.setFromRotationMatrix(R, 'ZYX');
        //RPY.setFromRotationMatrix(R, 'XYZ');
        const roll  = RPY.x;
        const pitch = RPY.y;
        const yaw   = RPY.z;
        return {roll, pitch, yaw};
    }
    
    extract_pose_from_T(T) {
        const position = this.extract_position_from_T(T);
        const RPY = this.extract_RPY_from_T(T);
        return [
            position.x,
            position.y,
            position.z,
            RPY.roll,
            RPY.pitch,
            RPY.yaw
        ];
    }
    dumped_Least_Square(q,error_vector, lambda =0.05){
        const J = this.calculate_numerical_Jacobian(q);
        const JT= get_Tranpose_of_6x6_Matrix(J);
        const JJT= get_Matrix_multiplication_6x6(J,JT);
        //const I= get_Identity_Matrix_6x6();
        for (let i = 0; i < 6; i++) {
            JJT[i][i] += lambda * lambda;
        }
    
        //const Inv = get_inverse_Matrix(JJT);
        const JJT_Matrix = new Matrix(JJT);
        const JJT_Matrix_inverse = inverse(JJT_Matrix);
        const Inv = JJT_Matrix_inverse.to2DArray();
    
        const temp= get_Matrix_Vector_multiplication_6x1(Inv,error_vector);
        const result = get_Matrix_Vector_multiplication_6x1(JT,temp);
        return result;
    }

    inverse_Kinematics(target_pose,initial_q, max_Iterations =100,position_tolerance=1e-4,orientation_tolerance=1e-4, lambda = 0.05){
        //const target_pose = extract_pose_from_T(target_T);
        let actual_q= [...initial_q];
        //let actual_q= initial_q;
        for(let it = 0; it < max_Iterations; it++){
            const actual_T= this.get_homogeneous_coordinates(actual_q);
            const actual_pose= this.extract_pose_from_T(actual_T);
            const pose_error = get_pose_Error(target_pose,actual_pose);
    
            const position_error = Math.sqrt(pose_error[0] ** 2 + pose_error[1] ** 2 + pose_error[2] ** 2);
    
            const orientation_error = Math.sqrt(pose_error[3] ** 2 + pose_error[4] ** 2 + pose_error[5] ** 2);
    
            if (position_error < position_tolerance && orientation_error < orientation_tolerance) {
                console.log("Inverse Kinematics converged in",it,"iterations");
    
                return actual_q;
            }
    
            const dq = this.dumped_Least_Square(actual_q,pose_error,lambda);
            for (let i = 0; i < 6; i++) {
                actual_q[i] += dq[i];
            }
        }
        console.warn("Inverse Kinematics did not converge");
    
        return actual_q;
    }
    
}