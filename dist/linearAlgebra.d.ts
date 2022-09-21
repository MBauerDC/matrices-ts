import { Dimension, Matrix, MatrixContent } from "./matrix";
declare function dotProduct<N extends Dimension, T extends MatrixContent, R extends Matrix<1, N, T>, C extends Matrix<N, 1, T>>(a: R | C, b: R | C): T;
declare function trace<N extends Dimension, T extends number>(matrix: Matrix<N, N, T>): T;
declare function determinant<N extends Dimension, T extends number>(matrix: Matrix<N, N, T>): T;
declare function cofactor<N extends Dimension, T extends number>(matrix: Matrix<N, N, T>, i: number, j: number): T;
declare function power<N extends Dimension, T extends number, X extends Matrix<N, N, T>>(matrix: X, p: number): X;
interface ElementaryRowOperation<N extends Dimension> {
    apply<M extends Dimension, T extends number>(matrix: Matrix<N, M, T>): Matrix<N, M, T>;
    getTransformationMatrix<T extends number>(): Matrix<N, N, T>;
}
declare class SwapRows<N extends Dimension> implements ElementaryRowOperation<N> {
    readonly i: number;
    readonly j: number;
    readonly dimension: N;
    protected memoizedTransformationMatrix: Matrix<N, N, any>;
    constructor(i: number, j: number, dimension: N);
    getTransformationMatrix<T extends number>(): Matrix<N, N, T>;
    apply<M extends Dimension, T extends number>(matrix: Matrix<N, M, T>): Matrix<N, M, T>;
}
declare class ScaleRow<N extends Dimension> implements ElementaryRowOperation<N> {
    readonly i: number;
    readonly factor: number;
    readonly dimension: N;
    protected memoizedTransformationMatrix: Matrix<N, N, any>;
    constructor(i: number, factor: number, dimension: N);
    getTransformationMatrix<T extends number>(): Matrix<N, N, T>;
    apply<M extends Dimension, T extends number>(matrix: Matrix<N, M, T>): Matrix<N, M, T>;
    withFactor(factor: number): ScaleRow<N>;
}
declare class AddScaledRow<N extends Dimension> implements ElementaryRowOperation<N> {
    readonly i: number;
    readonly j: number;
    readonly factor: number;
    readonly dimension: N;
    protected memoizedTransformationMatrix: Matrix<N, N, any>;
    constructor(i: number, j: number, factor: number, dimension: N);
    getTransformationMatrix<T extends number>(): Matrix<N, N, T>;
    apply<M extends Dimension, T extends number>(matrix: Matrix<N, M, T>): Matrix<N, M, T>;
    withFactor(factor: number): AddScaledRow<N>;
}
declare class ElementaryRowOperations {
    protected static memo: Record<string, ElementaryRowOperation<any>>;
    static getSwapOperation<N extends Dimension>(i: number, j: number, dimension: N): SwapRows<N>;
    static swap<N extends Dimension, M extends Dimension, X extends Matrix<N, M, any>>(matrix: X, i: number, j: number): X;
    static getScaleOperation<N extends Dimension>(i: number, factor: number, dimension: N): ScaleRow<N>;
    static scale<N extends Dimension, M extends Dimension, X extends Matrix<N, M, any>>(matrix: X, i: number, factor: number): X;
    static getAddScaledOperation<N extends Dimension>(i: number, j: number, factor: number, dimension: N): AddScaledRow<N>;
    static addScaled<N extends Dimension, M extends Dimension, X extends Matrix<N, M, any>>(matrix: X, i: number, j: number, factor: number): X;
}
declare function reducedRowEchelonForm<N extends Dimension, M extends Dimension, T extends number>(matrix: Matrix<N, M, T>): Matrix<N, M, T>;
declare class Id {
    static memoized: Map<number, Matrix<number, number, any>>;
    static of<N extends Dimension, T extends number>(n: N): Matrix<N, N, T>;
}
export { dotProduct, trace, determinant, cofactor, power, reducedRowEchelonForm, ElementaryRowOperation, SwapRows, ScaleRow, AddScaledRow, ElementaryRowOperations, Id };
