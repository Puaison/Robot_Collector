/**
 * This function creates a 6x6 Identity matrix 
 * @returns {Array_of_Array} 6x6 Vector
 */
export function get_Identity_Matrix_6x6(){
    const I = [
        [1,0,0,0,0,0],
        [0,1,0,0,0,0],
        [0,0,1,0,0,0],
        [0,0,0,1,0,0],
        [0,0,0,0,1,0],
        [0,0,0,0,0,1]
    ];
    return I
}

/**
 * Given an Array, this function returns its transpose
 * @param {Array_of_Array} J 6x6 Vector
 * @returns {Array_of_Array} 6x6 Vector
 */
export function get_Tranpose_of_6x6_Matrix(J){
    const J_transpose = get_Identity_Matrix_6x6();
    for(let i=0; i<6; i++) {
        for(let j=0; j<6; j++){
            J_transpose[i][j]=J[j][i]
        }
    }
    return J_transpose
}
/**
 * Given two matrices, this function returns their matrix multiplication
 * @param {Array_of_Array} A 6x6 Vector
 * @param {Array_of_Array} B 6x6 Vector
 * @returns {Array_of_Array} 6x6 Vector A*B
 */
export function get_Matrix_multiplication_6x6(A,B){
    const C = get_Identity_Matrix_6x6();
    C[0][0]=0;
    C[1][1]=0;
    C[2][2]=0;
    C[3][3]=0;
    C[4][4]=0;
    C[5][5]=0;

    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            for (let k = 0; k < 6; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    
    return C;
}
/**
 * Given a matrix and a vector, this function returns their matrix multiplication
 * @param {Array_of_Array} A 6x6 Vector
 * @param {Array_of_float} v 6x1 Vector
 * @returns {Array_of_float} 6x1 Vector A*v
 */
export function get_Matrix_Vector_multiplication_6x1(A,v){
    const result = [0,0,0,0,0,0];
    for (let i =0; i<6; i++){
        for(let j=0; j<6; j++){
            result[i] += A[i][j]*v[j];
        }
    }
    return result;
}

export function get_Matrix_sum_6x6(A,B){
    const C = get_Identity_Matrix_6x6();
    C[0][0]=0;
    C[1][1]=0;
    C[2][2]=0;
    C[3][3]=0;
    C[4][4]=0;
    C[5][5]=0;

    for(let i=0; i<6; i++){
        for(let j=0; j<6;j++){
            C[i][j] = A[i][j] + B[i][j];
        }
    }
    return C;
}