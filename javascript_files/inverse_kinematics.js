import { extract_T_from_q, extract_pose_from_T } from "./direct_kinematics";
import { normalize_Angle,get_pose_Error,normalize_angle_enhanced,shortest_angle_difference } from "./utils";
import { get_Tranpose_of_6x6_Matrix, get_Matrix_multiplication_6x6,get_Matrix_Vector_multiplication_6x1 } from "./matrix_operations";
import { Matrix,inverse } from 'ml-matrix';

export function calculate_numerical_Jacobian(q, epsilon = 1e-4) {
    //const T_normal = extract_T_from_q(q);

    const T_plus_0 = extract_T_from_q(q.map((x, i) => i === 0 ? x + epsilon : x));
    const T_plus_1 = extract_T_from_q(q.map((x, i) => i === 1 ? x + epsilon : x));
    const T_plus_2 = extract_T_from_q(q.map((x, i) => i === 2 ? x + epsilon : x));
    const T_plus_3 = extract_T_from_q(q.map((x, i) => i === 3 ? x + epsilon : x));
    const T_plus_4 = extract_T_from_q(q.map((x, i) => i === 4 ? x + epsilon : x));
    const T_plus_5 = extract_T_from_q(q.map((x, i) => i === 5 ? x + epsilon : x));

    const T_minus_0 = extract_T_from_q(q.map((x, i) => i === 0 ? x - epsilon : x));
    const T_minus_1 = extract_T_from_q(q.map((x, i) => i === 1 ? x - epsilon : x));
    const T_minus_2 = extract_T_from_q(q.map((x, i) => i === 2 ? x - epsilon : x));
    const T_minus_3 = extract_T_from_q(q.map((x, i) => i === 3 ? x - epsilon : x));
    const T_minus_4 = extract_T_from_q(q.map((x, i) => i === 4 ? x - epsilon : x));
    const T_minus_5 = extract_T_from_q(q.map((x, i) => i === 5 ? x - epsilon : x));

    //const pose_normal = extract_pose_from_T(T_normal);

    const pose_plus_0 = extract_pose_from_T(T_plus_0);
    const pose_plus_1 = extract_pose_from_T(T_plus_1);
    const pose_plus_2 = extract_pose_from_T(T_plus_2);
    const pose_plus_3 = extract_pose_from_T(T_plus_3);
    const pose_plus_4 = extract_pose_from_T(T_plus_4);
    const pose_plus_5 = extract_pose_from_T(T_plus_5);

    const pose_minus_0 = extract_pose_from_T(T_minus_0);
    const pose_minus_1 = extract_pose_from_T(T_minus_1);
    const pose_minus_2 = extract_pose_from_T(T_minus_2);
    const pose_minus_3 = extract_pose_from_T(T_minus_3);
    const pose_minus_4 = extract_pose_from_T(T_minus_4);
    const pose_minus_5 = extract_pose_from_T(T_minus_5);

    let J = [
        [                pose_plus_0[0] - pose_minus_0[0],                 pose_plus_1[0] - pose_minus_1[0],                 pose_plus_2[0] - pose_minus_2[0],                 pose_plus_3[0] - pose_minus_3[0],                 pose_plus_4[0] - pose_minus_4[0],                 pose_plus_5[0] - pose_minus_5[0]],
        [                pose_plus_0[1] - pose_minus_0[1],                 pose_plus_1[1] - pose_minus_1[1],                 pose_plus_2[1] - pose_minus_2[1],                 pose_plus_3[1] - pose_minus_3[1],                 pose_plus_4[1] - pose_minus_4[1],                 pose_plus_5[1] - pose_minus_5[1]],
        [                pose_plus_0[2] - pose_minus_0[2],                 pose_plus_1[2] - pose_minus_1[2],                 pose_plus_2[2] - pose_minus_2[2],                 pose_plus_3[2] - pose_minus_3[2],                 pose_plus_4[2] - pose_minus_4[2],                 pose_plus_5[2] - pose_minus_5[2]],
        [shortest_angle_difference(pose_minus_0[3],pose_plus_0[3]), shortest_angle_difference(pose_minus_1[3],pose_plus_1[3]), shortest_angle_difference(pose_minus_2[3],pose_plus_2[3] ), shortest_angle_difference(pose_minus_3[3],pose_plus_3[3] ), shortest_angle_difference(pose_minus_4[3],pose_plus_4[3]), shortest_angle_difference(pose_minus_5[3],pose_plus_5[3])],
        [shortest_angle_difference(pose_minus_0[4],pose_plus_0[4]), shortest_angle_difference(pose_minus_1[4],pose_plus_1[4] ), shortest_angle_difference(pose_minus_2[4],pose_plus_2[4]), shortest_angle_difference(pose_minus_3[4],pose_plus_3[4]), shortest_angle_difference(pose_minus_4[4],pose_plus_4[4]), shortest_angle_difference(pose_minus_5[4],pose_plus_5[4])],
        [shortest_angle_difference(pose_minus_0[5],pose_plus_0[5]), shortest_angle_difference(pose_minus_1[5],pose_plus_1[5]), shortest_angle_difference(pose_minus_2[5],pose_plus_2[5]), shortest_angle_difference(pose_minus_3[5],pose_plus_3[5]), shortest_angle_difference(pose_minus_4[5],pose_plus_4[5]), shortest_angle_difference(pose_minus_5[5],pose_plus_5[5])]
    ];
    J = J.map(row => row.map(x => x * (1/(2*epsilon))));
    return J;
}

export function dumped_Least_Square(q,error_vector, lambda =0.05){
    const J = calculate_numerical_Jacobian(q);
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

export function inverse_Kinematics(target_pose,initial_q, max_Iterations =100,position_tolerance=1e-4,orientation_tolerance=1e-4, lambda = 0.05){
    //const target_pose = extract_pose_from_T(target_T);
    let actual_q= [...initial_q];
    //let actual_q= initial_q;
    for(let it = 0; it < max_Iterations; it++){
        const actual_T= extract_T_from_q(actual_q);
        const actual_pose= extract_pose_from_T(actual_T);
        const pose_error = get_pose_Error(target_pose,actual_pose);

        const position_error = Math.sqrt(pose_error[0] ** 2 + pose_error[1] ** 2 + pose_error[2] ** 2);

        const orientation_error = Math.sqrt(pose_error[3] ** 2 + pose_error[4] ** 2 + pose_error[5] ** 2);

        if (position_error < position_tolerance && orientation_error < orientation_tolerance) {
            console.log("Inverse Kinematics converged in",it,"iterations");

            return actual_q;
        }

        const dq = dumped_Least_Square(actual_q,pose_error,lambda);
        for (let i = 0; i < 6; i++) {
            actual_q[i] += dq[i];
        }
        actual_q=actual_q.map(angle => normalize_angle_enhanced(angle));
    }
    console.warn("Inverse Kinematics did not converge");

    return actual_q;
}