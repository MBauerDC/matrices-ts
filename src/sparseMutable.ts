import { Column, Dimension, GenericColumn, GenericMatrix, GenericRow, Matrix, MatrixContent, Row} from "./matrix";
import {  GenericMutableColumn, GenericMutableMatrix, GenericMutableRow, MutableColumn, MutableMatrix, MutableRow } from "./mutable";

export function createSparseMutableRow<M extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, m: M): SparseMutableRow<M, T> {
    return new GenericSparseMutableRow(sparseData, m);
}

export function createSparseMutableColumn<N extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, n: N): SparseMutableColumn<N, T> {
    return new GenericSparseMutableColumn<N, T>(sparseData, n);   
 }

export class SparseRowMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> implements MutableMatrix<N, M, T> {
    constructor(protected rows: SparseMutableRow<M, T>[], public readonly n: N, public readonly m: M) {
        if (rows.length !== n) {
            throw new Error('Invalid number of rows');
        }
    }

    at(idx: number): T {
        if (this.n === 1) {
            return this.getValue(0, idx);
        }
        if (this.m === 1) {
            return this.getValue(idx, 0);
        }
        throw new Error("Matrix must be Nx1, 1xM or 1x1 in order to use the at method.");
    }

    [Symbol.iterator](): Iterator<T> {
        if (this.n === 1) {
            return this.getRow(0)[Symbol.iterator]();
        }
        if (this.m === 1) {
            return this.getColumn(0)[Symbol.iterator]();
        }
        throw new Error("Matrix must be Nx1, 1xM or 1x1 in order to use the at method.");
    }

    getValue(i: number, j: number): T {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        return this.rows[i].getValue(0, j) as T;
    }

    getTranspose(): SparseColumnMatrix<M, N, T> {
        const columns = [];
        for (let i = 0; i < this.n; i++) {
            columns.push(new GenericSparseMutableColumn(this.rows[i].getSparseData(), this.m));
        }
        return new SparseColumnMatrix(columns, this.m, this.n);
    }

    *generateRow(i: number): Generator<T> {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        yield* this.rows[i].generateRow(0);
    }

    *generateColumn(j: number): Generator<T> {
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        for (let i = 0; i < this.n; i++) {
            yield this.rows[i].getValue(0, j);
        }
    }

    getRow(i: number): SparseMutableRow<M, T> {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        return this.rows[i];
    }

    getColumn(j: number): MutableColumn<N, T> {
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        const data: T[] = [];
        for (let i = 0; i < this.n; i++) {
            data.push(this.rows[i].getValue(0, j) as T);
        }
        return new GenericMutableColumn(data, this.n);
    }

    getMultiplication<O extends Dimension>(right: Matrix<M, O, T>): MutableMatrix<N, O, T> {
        const rows: Row<O, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            const newRowData = [];
            for (let j = 0; j < right.m; j++) {
                let sum = 0;
                for (let k = 0; k < right.n; k++) {
                    sum += this.rows[i].getValue(0, k) * right.getValue(k, j);
                }
                newRowData.push(sum as T);
            }
            rows.push(new GenericRow(newRowData, right.m));
        }
        return new GenericMutableMatrix(null, rows, null, this.n, right.m);
    }

    getScaled(other: T): SparseRowMatrix<N, M, T> {
        const rows: SparseMutableRow<M, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].getScaled(other) as SparseMutableRow<M, T>);
        }
        return new SparseRowMatrix(rows, this.n, this.m);
    }

    withValue(i: number, j: number, value: T): SparseRowMatrix<N, M, T> {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        const rows = [...this.rows];
        rows[i] = rows[i].withValue(0, j, value);
        return new SparseRowMatrix(rows, this.n, this.m);
    }

    withAdded(other: Matrix<N, M, T>): MutableMatrix<N, M, T> {
        const rows: SparseMutableRow<M, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withAdded(other.getRow(i)) as SparseMutableRow<M, T>);
        }
        return new SparseRowMatrix(rows, this.n, this.m);
    }

    withAddedScalar(other: T): MutableMatrix<N, M, T> {
        const rows: SparseMutableRow<M, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withAddedScalar(other) as SparseMutableRow<M, T>);
        }
        return new SparseRowMatrix(rows, this.n, this.m);
    }

    withSubtracted(other: Matrix<N, M, T>): MutableMatrix<N, M, T> {
        const rows: SparseMutableRow<M, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withSubtracted(other.getRow(i)) as SparseMutableRow<M, T>);
        }
        return new SparseRowMatrix(rows, this.n, this.m);
    }

    withSubtractedScalar(other: T): MutableMatrix<N, M, T> {
        const rows: SparseMutableRow<M, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withSubtractedScalar(other) as SparseMutableRow<M, T>);
        }
        return new SparseRowMatrix(rows, this.n, this.m);
    }

    mapped<G extends MatrixContent>(mapper: (value: T) => G): MutableMatrix<N, M, G> {
        const rows: SparseMutableRow<M, G>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].mapped(mapper) as SparseMutableRow<M, G>);
        }
        return new SparseRowMatrix<N, M, G>(rows, this.n, this.m);
    }

    setValue(i: number, j: number, newValue: T): void {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        this.rows[i].setValue(0, j, newValue);
    }

    add(other: Matrix<N,M,T>): void {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].add(other.getRow(i));
        }
    }

    addScalar(other: T): void {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].addScalar(other);
        }
    }

    subtract(other: Matrix<N,M,T>): void {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].subtract(other.getRow(i));
        }
    }

    subtractScalar(other: T): void {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].subtractScalar(other);
        }
    }

    scale(other: T): void {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].scale(other);
        }
    }

    mapInPlace(mapper: (f: T) => T): void {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].mapInPlace(mapper);
        }
    }

    toMutable(): MutableMatrix<N, M, T> {
        return this;
    }

    withAddedRow<O extends number>(newRow: Row<M, T>, atIdx: number): MutableMatrix<O, M, T> {
        const rows = [...this.rows];
        rows.splice(atIdx, 0, newRow as SparseMutableRow<M, T>);
        return new SparseRowMatrix(rows, (this.n + 1) as O, this.m);
    }

    withAddedColumn<O extends number>(newColumn: Column<N, T>, atIdx: number): MutableMatrix<N, O, T> {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            const valToAdd = newColumn.getValue(i, 0);
            rows.push(this.rows[i].withAddedColumn(new GenericColumn([valToAdd], 1), atIdx) as SparseMutableRow<O, T>);
        }
        return new SparseRowMatrix<N, O, T>(rows, this.n, (this.m + 1) as O);
    }

    withoutRow<O extends number>(atIdx: number): MutableMatrix<O, M, T> {
        const rows = [...this.rows];
        rows.splice(atIdx, 1);
        return new SparseRowMatrix(rows, (this.n - 1) as O, this.m);
    }

    withoutColumn<O extends number>(atIdx: number): MutableMatrix<N, O, T> {
        const rows: SparseMutableRow<O, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withoutColumn(atIdx) as SparseMutableRow<O, T>);
        }
        return new SparseRowMatrix(rows, this.n, (this.m - 1) as O);
    }
}


export class SparseColumnMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> implements MutableMatrix<N, M, T> {
    constructor(protected columns: SparseMutableColumn<N, T>[], public readonly n: N, public readonly m: M) {
        if (columns.length !== m) {
            throw new Error('Invalid number of columns.');
        }
    }

    at(idx: number): T {
        if (this.n === 1) {
            return this.getValue(0, idx);
        }
        if (this.m === 1) {
            return this.getValue(idx, 0);
        }
        throw new Error("Matrix must be Nx1, 1xM or 1x1 in order to use the at method.");
    }

    [Symbol.iterator](): Iterator<T> {
        if (this.n === 1) {
            return this.getRow(0)[Symbol.iterator]();
        }
        if (this.m === 1) {
            return this.getColumn(0)[Symbol.iterator]();
        }
        throw new Error("Matrix must be Nx1, 1xM or 1x1 in order to use the at method.");
    }

    getValue(i: number, j: number): T {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        return this.columns[j].getValue(i, 0) as T;
    }

    getTranspose(): SparseRowMatrix<M, N, T> {
        const rows = [];
        for (let j = 0; j < this.m; j++) {
            rows.push(new GenericSparseMutableRow(this.columns[j].getSparseData(), this.n));
        }
        return new SparseRowMatrix(rows, this.m, this.n);
    }

    *generateRow(i: number): Generator<T> {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        for (let j = 0; j < this.m; j++) {
            yield this.columns[j].getValue(i, 0);
        }
    }

    *generateColumn(j: number): Generator<T> {
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        yield* this.columns[j].generateColumn(0);
    }

    getRow(i: number): MutableRow<M, T> {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        const data: T[] = [];
        for (let j = 0; j < this.m; j++) {
            data.push(this.columns[j].getValue(i, 0) as T);
        }
        return new GenericMutableRow(data, this.m);
    }

    getColumn(j: number): MutableColumn<N, T> {
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        return this.columns[j];
    }

    getMultiplication<O extends Dimension>(right: Matrix<M, O, T>): MutableMatrix<N, O, T> {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            const row: T[] = [];
            for (let j = 0; j < right.m; j++) {
                let sum = 0;
                for (let k = 0; k < this.m; k++) {
                    sum += this.columns[k].getValue(i, 0) * right.getValue(k, j);
                }
                row.push(sum as T);
            }
            rows.push(row);
        }
        return new GenericMutableMatrix(rows, null, null, this.n, right.m);
    }

    getScaled(other: T): SparseColumnMatrix<N, M, T> {
        if (other !== 1) {
            const columns: SparseMutableColumn<N, T>[] = [];
            for (let j = 0; j < this.m; j++) {
                columns.push(this.columns[j].getScaled(other) as SparseMutableColumn<N, T>);
            }
            return new SparseColumnMatrix(columns, this.n, this.m);
        }
        return this;
    }

    withValue(i: number, j: number, value: T): MutableMatrix<N, M, T> {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        const columns: SparseMutableColumn<N, T>[] = [];
        for (let k = 0; k < this.m; k++) {
            const newColumn = k !== j ? this.columns[k] : this.columns[k].withValue(i, 0, value);
            columns.push(newColumn);
        }
        return new SparseColumnMatrix(columns, this.n, this.m);
    }

    withAdded(other: Matrix<N, M, T>): MutableMatrix<N, M, T> {
        const columns: SparseMutableColumn<N, T>[] = [];
        for (let j = 0; j < this.m; j++) {
            columns.push(this.columns[j].withAdded(other.getColumn(j)) as SparseMutableColumn<N, T>);
        }
        return new SparseColumnMatrix(columns, this.n, this.m);
    }

    withAddedScalar(other: T): MutableMatrix<N, M, T> {
        const columns: SparseMutableColumn<N, T>[] = [];
        for (let j = 0; j < this.m; j++) {
            columns.push(this.columns[j].withAddedScalar(other) as SparseMutableColumn<N, T>);
        }
        return new SparseColumnMatrix(columns, this.n, this.m);
    }

    withSubtracted(other: Matrix<N, M, T>): MutableMatrix<N, M, T> {
        const columns: SparseMutableColumn<N, T>[] = [];
        for (let j = 0; j < this.m; j++) {
            columns.push(this.columns[j].withSubtracted(other.getColumn(j)) as SparseMutableColumn<N, T>);
        }
        return new SparseColumnMatrix(columns, this.n, this.m);
    }

    withSubtractedScalar(other: T): MutableMatrix<N, M, T> {
        const columns: SparseMutableColumn<N, T>[] = [];
        for (let j = 0; j < this.m; j++) {
            columns.push(this.columns[j].withSubtractedScalar(other) as SparseMutableColumn<N, T>);
        }
        return new SparseColumnMatrix(columns, this.n, this.m);
    }

    mapped<G extends MatrixContent>(f: (value: T) => G): MutableMatrix<N, M, G> {
        const columns: SparseMutableColumn<N, G>[] = [];
        for (const currColumn of this.columns) {
            columns.push(currColumn.mapped(f) as SparseMutableColumn<N, G>);
        }
        return new SparseColumnMatrix<N, M, G>(columns, this.n, this.m);
    }

    setValue(i: number, j: number, newValue: T): void {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        this.columns[j].setValue(i, 0, newValue);
    }

    add(other: Matrix<N,M,T>): void {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].add(other.getColumn(j));
        }
    }

    addScalar(other: T): void {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].addScalar(other);
        }
    }

    subtract(other: Matrix<N,M,T>): void {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].subtract(other.getColumn(j));
        }
    }

    subtractScalar(other: T): void {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].subtractScalar(other);
        }
    }

    scale(other: T): void {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].scale(other);
        }
    }

    mapInPlace(mapper: (f: T) => T): void {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].mapInPlace(mapper);
        }
    }

    toMutable(): MutableMatrix<N, M, T> {
        return this;
    }

    withAddedRow<O extends number>(newRow: Row<M, T>, atIdx: number): MutableMatrix<O, M, T> {
        if (atIdx < 0 || atIdx > this.n) {
            throw new Error('Invalid row index');
        }
        const columns: SparseMutableColumn<O, T>[] = [];
        for (let j = 0; j < this.m; j++) {
            const currColumn: SparseMutableColumn<N, T> = this.columns[j];
            const newColumn = currColumn.withAddedRow(new GenericRow<1, T>([newRow.getValue(0, j)], 1), atIdx) as SparseMutableColumn<O, T>;
            columns.push(newColumn);
        }
        return new SparseColumnMatrix(columns, (this.n + 1) as O, this.m);
    }

    withAddedColumn<O extends number>(newColumn: Column<N, T>, atIdx: number): MutableMatrix<N, O, T> {
        if (atIdx < 0 || atIdx > this.m) {
            throw new Error('Invalid column index');
        }
        const newSparseColumn = columnToSparseColumn(newColumn).toMutable() as SparseMutableColumn<N, T>;
        const columns: SparseMutableColumn<N, T>[] = [];
        for (let j = (this.m - 1); j >= 0; j--) {
            if (j >= atIdx) {
                columns[j + 1] = this.columns[j];;
            } else {
                columns[j] = this.columns[j];
            }
        }
        columns[atIdx] = newSparseColumn;
        return new SparseColumnMatrix(columns, this.n, (this.m + 1) as O);
    }

    withoutRow<O extends number>(atIdx: number): MutableMatrix<O, M, T> {
        if (atIdx < 0 || atIdx >= this.n) {
            throw new Error('Invalid row index');
        }
        const columns: SparseMutableColumn<O, T>[] = [];
        for (let j = 0; j < this.m; j++) {
            const currColumn: SparseMutableColumn<N, T> = this.columns[j];
            const newColumn = currColumn.withoutRow(atIdx) as SparseMutableColumn<O, T>;
            columns.push(newColumn);
        }
        return new SparseColumnMatrix(columns, (this.n - 1) as O, this.m);
    }

    withoutColumn<O extends number>(atIdx: number): MutableMatrix<N, O, T> {
        if (atIdx < 0 || atIdx >= this.m) {
            throw new Error('Invalid column index');
        }
        const columns: SparseMutableColumn<N, T>[] = [];
        for (let j = (this.m - 1); j >= 0; j--) {
            if (j > atIdx) {
                columns[j - 1] = this.columns[j];
            } else if (j < atIdx) {
                columns[j] = this.columns[j];
            }
        }
        return new SparseColumnMatrix(columns, this.n, (this.m - 1) as O);
    }
}