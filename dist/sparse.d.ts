import { Column, Dimension, Matrix, MatrixContent, Row } from "./matrix";
declare type SparseData<T extends MatrixContent> = Record<number, T>;
interface SparseRow<M extends Dimension, T extends MatrixContent> extends Row<M, T> {
    readonly n: 1;
    isSparse: true;
    getSparseData(): SparseData<T>;
    withValue(row: number, column: number, value: T): SparseRow<M, T>;
}
interface SparseColumn<N extends Dimension, T extends MatrixContent> extends Column<N, T> {
    readonly m: 1;
    isSparse: true;
    getSparseData(): SparseData<T>;
    withValue(row: number, column: number, value: T): SparseColumn<N, T>;
}
declare class GenericSparseRow<M extends Dimension, T extends MatrixContent> implements SparseRow<M, T> {
    protected sparseData: SparseData<T>;
    readonly m: M;
    isSparse: true;
    readonly n: 1;
    constructor(sparseData: SparseData<T>, m: M);
    getAsArray(): T[][];
    getSparseData(): SparseData<T>;
    getValue(i: number, j: number): T;
    at(index: number): T;
    getTranspose(): SparseColumn<M, T>;
    generateRow(i: number): Generator<T>;
    generateColumn(j: number): Generator<T>;
    getRow(i: number): SparseRow<M, T>;
    getColumn(j: number): Column<1, T>;
    getMultiplication<O extends Dimension>(right: Matrix<M, O, T>): Row<O, T>;
    getScaled(other: T): SparseRow<M, T>;
    withValue(row: number, column: number, value: T): SparseRow<M, T>;
    withAdded(other: Row<M, T>): SparseRow<M, T>;
    withAddedScalar(other: T): SparseRow<M, T>;
    withSubtracted(other: Matrix<1, M, T>): SparseRow<M, T>;
    withSubtractedScalar(other: T): SparseRow<M, T>;
    mapped<G extends MatrixContent>(mapper: (f: T) => G): SparseRow<M, G>;
    withAddedRow<O extends Dimension>(newRow: Row<M, T>, atIdx: number): Matrix<O, M, T>;
    withAddedColumn<O extends Dimension>(newColumn: Column<1, T>, atIdx: number): Matrix<1, O, T>;
    withoutRow<O extends number>(atIdx: number): Matrix<O, M, T>;
    withoutColumn<O extends number>(atIdx: number): Matrix<1, O, T>;
    [Symbol.iterator](): Iterator<T>;
    foldLeft<G extends any>(fn: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends unknown>(f: (acc: G, value: T) => G, init: G): G;
}
declare class GenericSparseColumn<N extends Dimension, T extends MatrixContent> implements SparseColumn<N, T> {
    protected sparseData: SparseData<T>;
    readonly n: N;
    isSparse: true;
    readonly m: 1;
    constructor(sparseData: SparseData<T>, n: N);
    getAsArray(): T[][];
    getSparseData(): SparseData<T>;
    getValue(i: number, j: number): T;
    at(index: number): T;
    getTranspose(): SparseRow<N, T>;
    generateRow(i: number): Generator<T>;
    generateColumn(j: number): Generator<T>;
    getRow(i: number): Row<1, T>;
    getColumn(j: number): Column<N, T>;
    getMultiplication<O extends Dimension>(right: Matrix<1, O, T>): Matrix<N, O, T>;
    getScaled(other: T): SparseColumn<N, T>;
    withValue(row: number, column: number, value: T): SparseColumn<N, T>;
    withAdded(other: Matrix<N, 1, T>): SparseColumn<N, T>;
    withAddedScalar(other: T): SparseColumn<N, T>;
    withSubtracted(other: Matrix<N, 1, T>): SparseColumn<N, T>;
    withSubtractedScalar(other: T): SparseColumn<N, T>;
    mapped<G extends MatrixContent>(f: (x: T) => G): SparseColumn<N, G>;
    withAddedRow<O extends number>(newRow: Row<1, T>, atIdx: number): SparseColumn<O, T>;
    withAddedColumn<O extends number>(newColumn: Column<N, T>, atIdx: number): Matrix<N, O, T>;
    withoutRow<O extends number>(atIdx: number): Matrix<O, 1, T>;
    withoutColumn<O extends number>(atIdx: number): Matrix<any, any, T>;
    [Symbol.iterator](): Iterator<T>;
    foldLeft<G extends any>(fn: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends unknown>(f: (acc: G, value: T) => G, init: G): G;
}
declare class SparseRowImmutableMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> implements Matrix<N, M, T> {
    protected rows: SparseRow<M, T>[];
    readonly n: N;
    readonly m: M;
    isSparse: true;
    constructor(rows: SparseRow<M, T>[], n: N, m: M);
    getAsArray(): T[][];
    at(idx: number): T;
    [Symbol.iterator](): Iterator<T>;
    getValue(i: number, j: number): T;
    getTranspose(): SparseColumnImmutableMatrix<M, N, T>;
    generateRow(i: number): Generator<T>;
    generateColumn(j: number): Generator<T>;
    getRow(i: number): SparseRow<M, T>;
    getColumn(j: number): Column<N, T>;
    getMultiplication<O extends Dimension>(right: Matrix<M, O, T>): SparseRowImmutableMatrix<N, O, T>;
    getScaled(other: T): SparseRowImmutableMatrix<N, M, T>;
    withValue(i: number, j: number, value: T): SparseRowImmutableMatrix<N, M, T>;
    withAdded(other: Matrix<N, M, T>): SparseRowImmutableMatrix<N, M, T>;
    withAddedScalar(other: T): SparseRowImmutableMatrix<N, M, T>;
    withSubtracted(other: Matrix<N, M, T>): SparseRowImmutableMatrix<N, M, T>;
    withSubtractedScalar(other: T): SparseRowImmutableMatrix<N, M, T>;
    mapped<G extends MatrixContent>(mapper: (value: T) => G): SparseRowImmutableMatrix<N, M, G>;
    withAddedRow<O extends number>(newRow: Row<M, T>, atIdx: number): SparseRowImmutableMatrix<O, M, T>;
    withAddedColumn<O extends number>(newColumn: Column<N, T>, atIdx: number): SparseRowImmutableMatrix<N, O, T>;
    withoutRow<O extends number>(atIdx: number): SparseRowImmutableMatrix<O, M, T>;
    withoutColumn<O extends number>(atIdx: number): SparseRowImmutableMatrix<N, O, T>;
}
declare function createSparseRow<M extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, m: M): SparseRow<M, T>;
declare function sparseRowToRow<M extends Dimension, T extends MatrixContent>(sparseRow: SparseRow<M, T>): Row<M, T>;
declare function rowToSparseRow<M extends Dimension, T extends MatrixContent>(row: Row<M, T>): SparseRow<M, T>;
declare function sparseColumnToColumn<N extends Dimension, T extends MatrixContent>(sparseColumn: SparseColumn<N, T>): Column<N, T>;
declare function columnToSparseColumn<N extends Dimension, T extends MatrixContent>(column: Column<N, T>): SparseColumn<N, T>;
declare function createSparseColumn<N extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, n: N): SparseColumn<N, T>;
declare class SparseColumnImmutableMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> implements Matrix<N, M, T> {
    protected columns: SparseColumn<N, T>[];
    readonly n: N;
    readonly m: M;
    isSparse: true;
    constructor(columns: SparseColumn<N, T>[], n: N, m: M);
    getAsArray(): T[][];
    at(idx: number): T;
    [Symbol.iterator](): Iterator<T>;
    getValue(i: number, j: number): T;
    getTranspose(): SparseRowImmutableMatrix<M, N, T>;
    generateRow(i: number): Generator<T>;
    generateColumn(j: number): Generator<T>;
    getRow(i: number): Row<M, T>;
    getColumn(j: number): SparseColumn<N, T>;
    getMultiplication<O extends Dimension>(right: Matrix<M, O, T>): Matrix<N, O, T>;
    getScaled(other: T): SparseColumnImmutableMatrix<N, M, T>;
    withValue(i: number, j: number, value: T): SparseColumnImmutableMatrix<N, M, T>;
    withAdded(other: Matrix<N, M, T>): SparseColumnImmutableMatrix<N, M, T>;
    withAddedScalar(other: T): SparseColumnImmutableMatrix<N, M, T>;
    withSubtracted(other: Matrix<N, M, T>): SparseColumnImmutableMatrix<N, M, T>;
    withSubtractedScalar(other: T): SparseColumnImmutableMatrix<N, M, T>;
    mapped<G extends MatrixContent>(f: (value: T) => G): SparseColumnImmutableMatrix<N, M, G>;
    withAddedRow<O extends number>(newRow: Row<M, T>, atIdx: number): SparseColumnImmutableMatrix<O, M, T>;
    withAddedColumn<O extends number>(newColumn: Column<N, T>, atIdx: number): SparseColumnImmutableMatrix<N, O, T>;
    withoutRow<O extends number>(atIdx: number): SparseColumnImmutableMatrix<O, M, T>;
    withoutColumn<O extends number>(atIdx: number): SparseColumnImmutableMatrix<N, O, T>;
}
export { SparseRow, SparseColumn, SparseData, GenericSparseRow, GenericSparseColumn, SparseRowImmutableMatrix, SparseColumnImmutableMatrix, createSparseRow, createSparseColumn, sparseRowToRow, rowToSparseRow, sparseColumnToColumn, columnToSparseColumn };