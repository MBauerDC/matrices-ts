import { Dimension, GenericMatrix, Matrix, Row } from "./matrix";
import { GenericSparseRow } from "./sparse";
import { SparseRowMatrix } from "./sparseMutable";

export module LinearAlgebra {

    export function dotProduct<N extends Dimension, M extends Matrix<1, N, number>|Matrix<N, 1, number>>(a: M, b: M): number {
        let result = 0;
        const areColumns = a.m === 1;
        const size = areColumns ? a.n : a.m;
        const aGetter = areColumns ? (i: number) => a.getValue(i, 0) : (i: number) => a.getValue(0, i);
        const bGetter = areColumns ? (i: number) => b.getValue(i, 0) : (i: number) => b.getValue(0, i);
        for (let i = 0; i < size; i++) {
            result += aGetter(i) * bGetter(i);
        }
        return result;
    }

    export function trace<N extends Dimension, T extends number>(matrix: Matrix<N, N, T>): T {
        let result = 0 as T;
        for (let i = 0; i < matrix.n; i++) {
            result = (result + matrix.getValue(i, i)) as T;
        }
        return result;
    }

    export function determinant<N extends Dimension, T extends number>(matrix: Matrix<N, N, T>): T {
        if (matrix.n === 1) {
            return matrix.getValue(0, 0);
        }
        if (matrix.n === 2) {
            return (matrix.getValue(0, 0) * matrix.getValue(1, 1)) - (matrix.getValue(0, 1) * matrix.getValue(1, 0)) as T;
        }
        let result = 0 as T;
        for (let i = 0; i < matrix.n; i++) {
            result = (result + (matrix.getValue(i, 0) * this.cofactor(matrix, i, 0))) as T;
        }
        return result;
    }

    export function cofactor<N extends Dimension, T extends number>(matrix: Matrix<N, N, T>, i: number, j: number): T {
        return (Math.pow(-1, i + j) * this.determinant(matrix.withoutRow(i).withoutColumn(j))) as T;
    }

    export function power<N extends Dimension, T extends number, X extends Matrix<N, N, T>>(matrix: X, p: number): X {
        if (p < 2) {
            return matrix;
        }
        let result = matrix;
        for (let i = 2; i <= p; i++) {
            result = result.getMultiplication(matrix) as X;
        }
        return result;
    }

    export interface ElementaryRowOperation<N extends Dimension> {
        apply<M extends Dimension, T extends number>(matrix: Matrix<N, M, T>): Matrix<N, M, T>;
        getTransformationMatrix<T extends number>(): Matrix<N, N, T>;
    }
    
    export class SwapRows<N extends Dimension> implements ElementaryRowOperation<N> {
        protected memoizedTransformationMatrix: Matrix<N, N, any>;
        constructor(public readonly i: number, public readonly j: number, public readonly dimension: N) {
            if (dimension <= i || dimension <= j) {
                throw new Error('Dimension and indices are incompatible.');
            }
            const rows: GenericSparseRow<N, any>[] = [];
            for (let k = 0; k < dimension; k++) {
                if (k === i) {
                    rows.push(new GenericSparseRow<N, any>({[j]: 1}, dimension));
                } else if (k === j) {
                    rows.push(new GenericSparseRow<N, any>({[i]: 1}, dimension));
                } else {
                    rows.push(new GenericSparseRow<N, any>({[k]: 1}, dimension));
                }
            }
            this.memoizedTransformationMatrix = new GenericMatrix<N, N, any>(null, rows, null, dimension, dimension);
        }
        getTransformationMatrix<T extends number>(): Matrix<N, N, T> {
            return this.memoizedTransformationMatrix;
        }
        apply<M extends Dimension, T extends number>(matrix: Matrix<N, M, T>): Matrix<N, M, T> {
            return this.getTransformationMatrix<T>().getMultiplication(matrix);
        }
    }
    
    
    export class ScaleRow<N extends Dimension> implements ElementaryRowOperation<N> {
        protected memoizedTransformationMatrix: Matrix<N, N, any>;
        constructor(public readonly i: number, public readonly factor: number, public readonly dimension: N) {
            if (dimension <= i) {
                throw new Error('Dimension and indices are incompatible.');
            }
            const rows: GenericSparseRow<N, any>[] = [];
            for (let k = 0; k < dimension; k++) {
                if (k === i) {
                    rows.push(new GenericSparseRow<N, any>({[i]: factor}, dimension));
                } else {
                    rows.push(new GenericSparseRow<N, any>({[k]: 1}, dimension));
                }
            }
            this.memoizedTransformationMatrix = new GenericMatrix<N, N, any>(null, rows, null, dimension, dimension);
        }
        getTransformationMatrix<T extends number>(): Matrix<N, N, T> {
            return this.memoizedTransformationMatrix;
        }
        apply<M extends Dimension, T extends number>(matrix: Matrix<N, M, T>): Matrix<N, M, T> {
            return this.getTransformationMatrix<T>().getMultiplication(matrix);
        }
        withFactor(factor: number): ScaleRow<N> {
            return new ScaleRow<N>(this.i, factor, this.dimension);
        }
    }
    
    export class AddScaledRow<N extends Dimension> implements ElementaryRowOperation<N> {
        protected memoizedTransformationMatrix: Matrix<N, N, any>;
        constructor(public readonly i: number, public readonly j: number, public readonly factor: number, public readonly dimension: N) {
            if (dimension <= i || dimension <= j) {
                throw new Error('Dimension and indices are incompatible.');
            }
            const rows: GenericSparseRow<N, any>[] = [];
            for (let k = 0; k < dimension; k++) {
                if (k === i) {
                    rows.push(new GenericSparseRow<N, any>({[i]: 1, [j]: factor}, dimension));
                } else {
                    rows.push(new GenericSparseRow<N, any>({[k]: 1}, dimension));
                }
            }
            this.memoizedTransformationMatrix = new GenericMatrix<N, N, any>(null, rows, null, dimension, dimension);
        }
        getTransformationMatrix<T extends number>(): Matrix<N, N, T> {
            return this.memoizedTransformationMatrix;
        }
        apply<M extends Dimension, T extends number>(matrix: Matrix<N, M, T>): Matrix<N, M, T> {
            return this.getTransformationMatrix<T>().getMultiplication(matrix);
        }
        withFactor(factor: number): AddScaledRow<N> {
            return new AddScaledRow<N>(this.i, this.j, factor, this.dimension);
        }
    }
    
    export class ElementaryRowOperations {
        
        protected static memo: Record<string, ElementaryRowOperation<any>> = {};
    
        static getSwapOperation<N extends Dimension>(i: number, j: number, dimension: N): SwapRows<N> {
            const key = `swap(${i}, ${j}, ${dimension})`;
            if (this.memo[key]) {
                return this.memo[key] as SwapRows<N>;
            }
            const operation = new SwapRows(i, j, dimension);
            this.memo[key] = operation;
            return operation;
        }

        static swap<N extends Dimension, M extends Dimension, X extends Matrix<N, M, any>>(matrix: X, i: number, j: number): X {
            const key = `swap(${i}, ${j}, ${matrix.n})`;
            if (this.memo[key]) {
                return this.memo[key].apply(matrix) as X;
            }
            const operation = new SwapRows(i, j, matrix.n);
            this.memo[key] = operation;
            return operation.apply(matrix) as X;
        }
    
        static getScaleOperation<N extends Dimension>(i: number, factor: number, dimension: N): ScaleRow<N> {
            const key = `scale(${i}, ${dimension})`;
            if (this.memo[key]) {
                return this.memo[key] as ScaleRow<N>;
            }
            const operation = new ScaleRow(i, 1, dimension);
            this.memo[key] = operation;
            return operation.withFactor(factor);
        }

        static scale<N extends Dimension, M extends Dimension, X extends Matrix<N, M, any>>(matrix: X, i: number, factor: number): X {
            const key = `scale(${i}, ${matrix.n})`;
            if (this.memo[key]) {
                return (this.memo[key] as ScaleRow<N>).withFactor(factor).apply(matrix) as X;
            }
            const operation = new ScaleRow(i, 1, matrix.n);
            this.memo[key] = operation;
            return operation.withFactor(factor).apply(matrix) as X;
        }
    
        static getAddScaledOperation<N extends Dimension>(i: number, j: number, factor: number, dimension: N): AddScaledRow<N> {
            const key = `addScaled(${i}, ${j}, ${dimension})`;
            if (this.memo[key]) {
                return this.memo[key] as AddScaledRow<N>;
            }
            const operation = new AddScaledRow(i, j, 1, dimension);
            this.memo[key] = operation;
            return operation.withFactor(factor);
        }

        static addScaled<N extends Dimension, M extends Dimension, X extends Matrix<N, M, any>>(matrix: X, i: number, j: number, factor: number): X {
            const key = `addScaled(${i}, ${j}, ${matrix.n})`;
            if (this.memo[key]) {
                return (this.memo[key] as AddScaledRow<N>).withFactor(factor).apply(matrix) as X;
            }
            const operation = new AddScaledRow(i, j, 1, matrix.n);
            this.memo[key] = operation;
            return operation.withFactor(factor).apply(matrix) as X;
        }
        
    }

    export function reducedRowEchelonForm<N extends Dimension, M extends Dimension, T extends number>(matrix: Matrix<N, M, T>): Matrix<N, M, T> {
        const rowCount = matrix.n;
        const columnCount = matrix.m;
        const rows: Row<M, T>[] = [];
        for (let i = 0; i < rowCount; i++) {
            rows.push(matrix.getRow(i));
        }
        let result = matrix as Matrix<N, M, T>;
        let pivotColumn = 0;
        for (let r = 0; r < rowCount; r++) {
            if (pivotColumn >= columnCount) {
                break;
            }
            let i = r;
            while (rows[i].getValue(0, pivotColumn) === 0) {
                i = i + 1;
                if (i === rowCount) {
                    i = r;
                    pivotColumn = pivotColumn + 1;
                    if (pivotColumn === columnCount) {
                        break;
                    }
                }
            }
            if (i !== r) {
                result = ElementaryRowOperations.swap(result, i, r);
            }
            result = ElementaryRowOperations.scale(result, r, 1 / result.getValue(r, pivotColumn))
            result = result.withValue(r, pivotColumn, 1 as T);
            for (let j = 0; j < rowCount; j++) {
                if (j !== r) {
                    result = ElementaryRowOperations.addScaled(result, j, r, -result.getValue(j, pivotColumn));
                }
            }
            pivotColumn = pivotColumn + 1;
        }
    
        return result;
    }

    export function id<N extends Dimension, T extends number>(n: N): Matrix<N, N, T> {    
        const rows: GenericSparseRow<N, T>[] = [];
        for (let i = 0; i < n; i++) {
            const row = new GenericSparseRow({[i]: 1 as T}, n);
            rows.push(row);
        }
        return new GenericMatrix<N, N, T>(null, rows, null, n, n);
    }
    
    export class Id {
        static memoized = new Map<number, Matrix<Dimension, Dimension, any>>();
        static of<N extends Dimension, T extends number>(n: N): Matrix<N, N, T> {
            if (Id.memoized.has(n)) {
                return Id.memoized.get(n) as Matrix<N, N, T>;
            }
            const matrix = id<N, T>(n);
            Id.memoized.set(n, matrix);
            return matrix;
        }
    }    

}