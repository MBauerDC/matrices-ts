import { Column, Dimension, GenericMatrix, Matrix, MatrixContent, Row } from "./matrix";
interface MutableMatrix<N extends Dimension, M extends Dimension, F extends MatrixContent> extends Matrix<N, M, F> {
    setValue(i: number, j: number, newValue: F): void;
    add(other: Matrix<N, M, F>): void;
    addScalar(other: F): void;
    subtract(other: Matrix<N, M, F>): void;
    subtractScalar(other: F): void;
    scale(other: F): void;
    mapInPlace(mapper: (f: F) => F): void;
    getScaled(other: F): MutableMatrix<N, M, F>;
    getRow(i: number): MutableRow<M, F>;
    getColumn(j: number): MutableColumn<N, F>;
    withValue(i: number, j: number, value: F): MutableMatrix<N, M, F>;
    withAdded(other: Matrix<N, M, F>): MutableMatrix<N, M, F>;
    withAddedScalar(other: F): MutableMatrix<N, M, F>;
    withSubtracted(other: Matrix<N, M, F>): MutableMatrix<N, M, F>;
    withSubtractedScalar(other: F): MutableMatrix<N, M, F>;
    mapped<G extends MatrixContent>(mapper: (value: F) => G): MutableMatrix<N, M, G>;
    getMultiplication<O extends Dimension>(right: Matrix<M, O, F>): MutableMatrix<N, O, F>;
    getTranspose(): MutableMatrix<M, N, F>;
    withAddedRow<O extends Dimension>(newRow: Row<M, F>, atIdx: number): MutableMatrix<O, M, F>;
    withoutRow<O extends Dimension>(atIdx: number): MutableMatrix<O, M, F>;
    withAddedColumn<O extends Dimension>(newColumn: Column<N, F>, atIdx: number): MutableMatrix<N, O, F>;
    withoutColumn<O extends Dimension>(atIdx: number): MutableMatrix<N, O, F>;
}
declare class GenericMutableMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> extends GenericMatrix<N, M, T> implements MutableMatrix<N, M, T> {
    constructor(arrData: T[][] | null, rowData: MutableRow<M, T>[] | null, columnData: MutableColumn<N, T>[] | null, n: N, m: M);
    setValue(row: number, col: number, value: T): void;
    getMultiplication<O extends number>(right: Matrix<M, O, T>): MutableMatrix<N, O, T>;
    getTranspose(): MutableMatrix<M, N, T>;
    withAdded(other: Matrix<N, M, T>): MutableMatrix<N, M, T>;
    withAddedScalar(other: T): MutableMatrix<N, M, T>;
    withSubtracted(other: Matrix<N, M, T>): MutableMatrix<N, M, T>;
    withSubtractedScalar(other: T): MutableMatrix<N, M, T>;
    getScaled(other: T): MutableMatrix<N, M, T>;
    getRow(i: number): MutableRow<M, T>;
    getColumn(j: number): MutableColumn<N, T>;
    withAddedRow<O extends Dimension>(newRow: Row<M, T>, atIdx: number): MutableMatrix<O, M, T>;
    withAddedColumn<O extends Dimension>(newColumn: Column<N, T>, atIdx: number): MutableMatrix<N, O, T>;
    withoutRow<O extends Dimension>(atIdx: number): MutableMatrix<O, M, T>;
    withoutColumn<O extends Dimension>(atIdx: number): MutableMatrix<N, O, T>;
    withValue(i: number, j: number, value: T): MutableMatrix<N, M, T>;
    mapped<G extends MatrixContent>(f: (value: T) => G): MutableMatrix<N, M, G>;
    add(other: Matrix<N, M, T>): void;
    addScalar(other: T): void;
    subtract(other: Matrix<N, M, T>): void;
    subtractScalar(other: T): void;
    scale(other: T): void;
    mapInPlace(mapper: (f: T) => T): void;
}
interface MutableRow<M extends Dimension, T extends MatrixContent> extends MutableMatrix<1, M, T> {
    getTranspose(): MutableColumn<M, T>;
    getRow(i: number): MutableRow<M, T>;
    getColumn(j: number): MutableColumn<1, T>;
    withAdded(other: Row<M, T>): MutableRow<M, T>;
    withAddedScalar(other: T): MutableRow<M, T>;
    withSubtracted(other: Row<M, T>): MutableRow<M, T>;
    withSubtractedScalar(other: T): MutableRow<M, T>;
    getScaled(other: T): MutableRow<M, T>;
    mapped<G extends MatrixContent>(f: (value: T) => G): MutableRow<M, G>;
    withAddedRow(row: Row<M, T>, atIdx: number): MutableMatrix<2, M, T>;
    withAddedColumn<O extends Dimension>(column: Column<1, T>, atIdx: number): MutableRow<O, T>;
    withoutRow(atIdx: number): MutableMatrix<0, M, T>;
    withoutColumn<O extends Dimension>(atIdx: number): MutableRow<O, T>;
    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G;
}
declare class GenericMutableRow<M extends Dimension, T extends MatrixContent> extends GenericMutableMatrix<1, M, T> implements MutableRow<M, T> {
    constructor(arrData: T[], m: M);
    withAdded(other: Row<M, T>): MutableRow<M, T>;
    withAddedScalar(other: T): MutableRow<M, T>;
    withSubtracted(other: Row<M, T>): MutableRow<M, T>;
    withSubtractedScalar(other: T): MutableRow<M, T>;
    getScaled(other: T): MutableRow<M, T>;
    mapped<F extends MatrixContent>(f: (value: T) => F): MutableRow<M, F>;
    getTranspose(): MutableColumn<M, T>;
    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    at(index: number): T;
    [Symbol.iterator](): Iterator<T>;
    withAddedRow(row: Row<M, T>, atIdx: number): MutableMatrix<2, M, T>;
    withAddedColumn<O extends Dimension>(column: Column<1, T>, atIdx: number): MutableRow<O, T>;
    withoutRow(atIdx: number): MutableMatrix<0, M, T>;
    withoutColumn<O extends Dimension>(atIdx: number): MutableRow<O, T>;
}
interface MutableColumn<N extends Dimension, T extends MatrixContent> extends MutableMatrix<N, 1, T> {
    getTranspose(): MutableRow<N, T>;
    getRow(i: number): MutableRow<1, T>;
    getColumn(j: number): MutableColumn<N, T>;
    withAdded(other: Column<N, T>): MutableColumn<N, T>;
    withAddedScalar(other: T): MutableColumn<N, T>;
    withSubtracted(other: Column<N, T>): MutableColumn<N, T>;
    withSubtractedScalar(other: T): MutableColumn<N, T>;
    getScaled(other: T): MutableColumn<N, T>;
    mapped<G extends MatrixContent>(mapper: (f: T) => G): MutableColumn<N, G>;
    withAddedRow<O extends Dimension>(row: Row<1, T>, atIdx: number): MutableColumn<O, T>;
    withAddedColumn(column: Column<N, T>, atIdx: number): MutableMatrix<N, 2, T>;
    withoutRow<O extends Dimension>(atIdx: number): MutableColumn<O, T>;
    withoutColumn(atIdx: number): MutableMatrix<N, 0, T>;
    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G;
}
declare class GenericMutableColumn<N extends Dimension, T extends MatrixContent> extends GenericMutableMatrix<N, 1, T> implements MutableColumn<N, T> {
    constructor(arrData: T[], n: N);
    withAdded(other: Column<N, T>): MutableColumn<N, T>;
    withAddedScalar(other: T): MutableColumn<N, T>;
    withSubtracted(other: Column<N, T>): MutableColumn<N, T>;
    withSubtractedScalar(other: T): MutableColumn<N, T>;
    getScaled(other: T): MutableColumn<N, T>;
    mapped<G extends MatrixContent>(f: (value: T) => G): MutableColumn<N, G>;
    getTranspose(): MutableRow<N, T>;
    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    getRow(i: number): MutableRow<1, T>;
    getColumn(j: number): MutableColumn<N, T>;
    at(index: number): T;
    [Symbol.iterator](): Iterator<T>;
    withAddedRow<O extends Dimension>(row: Row<1, T>, atIdx: number): MutableColumn<O, T>;
    withAddedColumn(column: Column<N, T>, atIdx: number): MutableMatrix<N, 2, T>;
    withoutRow<O extends Dimension>(atIdx: number): MutableColumn<O, T>;
    withoutColumn(atIdx: number): MutableMatrix<N, 0, T>;
}
export { MutableMatrix, GenericMutableMatrix, MutableRow, GenericMutableRow, MutableColumn, GenericMutableColumn };
