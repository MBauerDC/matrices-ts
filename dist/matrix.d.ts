declare type Dimension = number;
declare type MatrixContent = number | Array<MatrixContent> | Matrix<Dimension, Dimension, MatrixContent>;
declare const matrixContentAdder: <T extends MatrixContent>(a: T, b: T) => T;
declare const matrixContentSubtractor: <T extends MatrixContent>(a: T, b: T) => T;
declare const matrixContentMultiplier: <T extends MatrixContent>(a: T, b: T) => T;
declare const matrixContentScaler: <T extends MatrixContent>(a: T, s: number) => T;
interface Matrix<N extends Dimension, M extends Dimension, F extends MatrixContent> extends Iterable<F> {
    readonly n: N;
    readonly m: M;
    getAsArray(): F[][];
    getValue(i: number, j: number): F;
    getTranspose(): Matrix<M, N, F>;
    generateRow(i: number): Generator<F>;
    generateColumn(j: number): Generator<F>;
    getRow(i: number): Row<M, F>;
    getColumn(j: number): Column<N, F>;
    getMultiplication<O extends Dimension>(right: Matrix<M, O, F>): Matrix<N, O, F>;
    getScaled(other: F): Matrix<N, M, F>;
    withValue(i: number, j: number, value: F): Matrix<N, M, F>;
    withAdded(other: Matrix<N, M, F>): Matrix<N, M, F>;
    withAddedScalar(other: F): Matrix<N, M, F>;
    withSubtracted(other: Matrix<N, M, F>): Matrix<N, M, F>;
    withSubtractedScalar(other: F): Matrix<N, M, F>;
    mapped<G extends MatrixContent>(mapper: (value: F) => G): Matrix<N, M, G>;
    withAddedRow<O extends Dimension>(newRow: Row<M, F>, atIdx: number): Matrix<O, M, F>;
    withoutRow<O extends Dimension>(atIdx: number): Matrix<O, M, F>;
    withAddedColumn<O extends Dimension>(newColumn: Column<N, F>, atIdx: number): Matrix<N, O, F>;
    withoutColumn<O extends Dimension>(atIdx: number): Matrix<N, O, F>;
    at(index: number): F;
}
declare type InternalMutableMatrixData<N extends Dimension, M extends Dimension, T extends MatrixContent> = {
    getValue(i: number, j: number): T;
    setValue(i: number, j: number, newValue: T): void;
    withNewValue(i: number, j: number, newValue: T): T[][] | Row<M, T>[] | Column<N, T>[];
    at(i: number): T[] | Row<M, T> | Column<N, T>;
    getArrayData(): T[][];
};
declare class GenericMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> implements Matrix<N, M, T> {
    protected arrData: T[][] | null;
    protected rowData: Row<M, T>[] | null;
    protected columnData: Column<N, T>[] | null;
    readonly n: N;
    readonly m: M;
    protected referenceData: InternalMutableMatrixData<N, M, T>;
    protected wrapArrayData(arrData: T[][], n: N, m: M): InternalMutableMatrixData<N, M, T>;
    protected wrapRowData(rowData: Row<M, T>[], n: N, m: M): InternalMutableMatrixData<N, M, T>;
    protected wrapColumnData(columnData: Column<N, T>[], n: N, m: M): InternalMutableMatrixData<N, M, T>;
    constructor(arrData: T[][] | null, rowData: Row<M, T>[] | null, columnData: Column<N, T>[] | null, n: N, m: M);
    getAsArray(): T[][];
    getValue(i: number, j: number): T;
    generateRow(i: number): Generator<T>;
    generateColumn(j: number): Generator<T>;
    getRow(i: number): Row<M, T>;
    getColumn(j: number): Column<N, T>;
    withValue(i: number, j: number, value: T): Matrix<N, M, T>;
    withAdded(other: Matrix<N, M, T>): Matrix<N, M, T>;
    withAddedScalar(other: T): Matrix<N, M, T>;
    withSubtracted(other: Matrix<N, M, T>): Matrix<N, M, T>;
    withSubtractedScalar(other: T): Matrix<N, M, T>;
    getMultiplication<O extends Dimension>(right: Matrix<M, O, T>): Matrix<N, O, T>;
    getScaled(other: T): Matrix<N, M, T>;
    getTranspose(): Matrix<M, N, T>;
    mapped<G extends MatrixContent>(f: (value: T) => G): Matrix<N, M, G>;
    withAddedRow<O extends Dimension>(newRow: Row<M, T>, atIdx: number): Matrix<O, M, T>;
    withAddedColumn<O extends Dimension>(newColumn: Column<N, T>, atIdx: number): Matrix<N, O, T>;
    withoutRow<O extends Dimension>(atIdx: number): Matrix<O, M, T>;
    withoutColumn<O extends Dimension>(atIdx: number): Matrix<N, O, T>;
    at(index: number): T;
    [Symbol.iterator](): Iterator<T>;
}
interface Row<M extends Dimension, T extends MatrixContent> extends Matrix<1, M, T> {
    readonly n: 1;
    readonly m: M;
    getTranspose(): Column<M, T>;
    getRow(i: number): Row<M, T>;
    getColumn(j: number): Column<1, T>;
    withAdded(other: Row<M, T>): Row<M, T>;
    withAddedScalar(other: T): Row<M, T>;
    withSubtracted(other: Row<M, T>): Row<M, T>;
    withSubtractedScalar(other: T): Row<M, T>;
    getScaled(other: T): Row<M, T>;
    mapped<G extends MatrixContent>(f: (value: T) => G): Row<M, G>;
    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G;
}
declare class GenericRow<M extends Dimension, T extends MatrixContent> extends GenericMatrix<1, M, T> implements Row<M, T> {
    constructor(arrData: T[], m: M);
    getTranspose(): Column<M, T>;
    getRow(i: number): Row<M, T>;
    getColumn(j: number): Column<1, T>;
    withAdded(other: Row<M, T>): Row<M, T>;
    withAddedScalar(other: T): Row<M, T>;
    withSubtracted(other: Row<M, T>): Row<M, T>;
    withSubtractedScalar(other: T): Row<M, T>;
    getScaled(other: T): Row<M, T>;
    mapped<F extends MatrixContent>(f: (value: T) => F): Row<M, F>;
    at(index: number): T;
    [Symbol.iterator](): Iterator<T>;
    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G;
}
interface Column<N extends Dimension, T extends MatrixContent> extends Matrix<N, 1, T> {
    readonly n: N;
    readonly m: 1;
    getTranspose(): Row<N, T>;
    getRow(i: number): Row<1, T>;
    getColumn(j: number): Column<N, T>;
    withAdded(other: Column<N, T>): Column<N, T>;
    withAddedScalar(other: T): Column<N, T>;
    withSubtracted(other: Column<N, T>): Column<N, T>;
    withSubtractedScalar(other: T): Column<N, T>;
    getScaled(other: T): Column<N, T>;
    mapped<G extends MatrixContent>(mapper: (f: T) => G): Column<N, G>;
    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G;
}
declare class GenericColumn<N extends Dimension, T extends MatrixContent> extends GenericMatrix<N, 1, T> implements Column<N, T> {
    constructor(arrData: T[], n: N);
    getTranspose(): Row<N, T>;
    withAdded(other: Column<N, T>): Column<N, T>;
    withAddedScalar(other: T): Column<N, T>;
    withSubtracted(other: Column<N, T>): Column<N, T>;
    withSubtractedScalar(other: T): Column<N, T>;
    getScaled(other: T): Column<N, T>;
    mapped<G extends MatrixContent>(f: (value: T) => G): Column<N, G>;
    getRow(i: number): Row<1, T>;
    getColumn(j: number): Column<N, T>;
    at(index: number): T;
    [Symbol.iterator](): Iterator<T>;
    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G;
}
declare function multiplyMatrices<N extends Dimension, M extends Dimension, O extends Dimension, T extends MatrixContent>(a: Matrix<N, M, T>, b: Matrix<M, O, T>): Matrix<N, O, T>;
export { Dimension, MatrixContent, Matrix, Row, Column, GenericMatrix, GenericRow, GenericColumn, matrixContentAdder, matrixContentSubtractor, matrixContentScaler, matrixContentMultiplier, multiplyMatrices };
