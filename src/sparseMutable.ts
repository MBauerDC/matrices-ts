import { Column, Dimension, GenericColumn, GenericMatrix, GenericRow, Matrix, MatrixContent, matrixContentAdder, matrixContentMultiplier, matrixContentSubtractor, Row} from "./matrix";
import {  GenericMutableColumn, GenericMutableMatrix, GenericMutableRow, MutableColumn, MutableMatrix, MutableRow } from "./mutable";
import { columnToSparseColumn, GenericSparseColumn, GenericSparseRow, rowToSparseRow, SparseData } from "./sparse";

export function createSparseMutableRow<M extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, m: M): SparseMutableRow<M, T> {
    return new GenericSparseMutableRow<M, T>(sparseData, m);
}

export function createSparseMutableColumn<N extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, n: N): SparseMutableColumn<N, T> {
    return new GenericSparseMutableColumn<N, T>(sparseData, n);   
 }

export interface SparseMutableRow<M extends Dimension, T extends MatrixContent> extends MutableRow<M, T> {
    getSparseData(): SparseData<T>;
    withValue(row: number, column: number, value: T): SparseMutableRow<M, T>;
};

export interface SparseMutableColumn<N extends Dimension, T extends MatrixContent> extends MutableColumn<N, T> {
    getSparseData(): SparseData<T>;
    withValue(row: number, column: number, value: T): SparseMutableColumn<N, T>;
};

export class GenericSparseMutableRow<M extends Dimension, T extends MatrixContent> extends GenericSparseRow<M, T> implements SparseMutableRow<M, T> {
    public readonly n: 1 = 1;
    
    public constructor(protected sparseData: SparseData<T>, public readonly m: M) {
        super(sparseData, m);
    }

    getTranspose(): SparseMutableColumn<M, T> {
        return createSparseMutableColumn(this.sparseData, this.m);
    }

    getRow(i: number): SparseMutableRow<M, T> {
        if (i !== 0) {
            throw new Error('Invalid row');
        }
        return this as SparseMutableRow<M, T>;
    }

    getColumn(j: number): MutableColumn<1, T> {
        return super.getColumn(j) as MutableColumn<1, T>;
    }

    getMultiplication<O extends Dimension>(right: Matrix<M, O, T>): MutableRow<O, T> {
        return super.getMultiplication(right) as MutableRow<O, T>;
    }

    getScaled(other: T): SparseMutableRow<M, T> {
       return super.getScaled(other) as SparseMutableRow<M, T>;
    }

    withValue(row: number, column: number, value: T): SparseMutableRow<M, T> {
       return super.withValue(row, column, value) as SparseMutableRow<M, T>;
    }

    withAdded(other: Matrix<1, M, T>): SparseMutableRow<M, T> {
       return super.withAdded(other) as SparseMutableRow<M, T>;
    }

    withAddedScalar(other: T): SparseMutableRow<M, T> {
       return super.withAddedScalar(other) as SparseMutableRow<M, T>;
    }

    withSubtracted(other: Matrix<1, M, T>): SparseMutableRow<M, T> {
       return super.withSubtracted(other) as SparseMutableRow<M, T>;
    }

    withSubtractedScalar(other: T): SparseMutableRow<M, T> {
       return super.withSubtractedScalar(other) as SparseMutableRow<M, T>;
    }

    mapped<G extends MatrixContent>(f: (value: T) => G): SparseMutableRow<M, G> {
       return super.mapped(f) as SparseMutableRow<M, G>;
    }

    setValue(i: number, j: number, newValue: T): void {
        if (i !== 0) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        this.sparseData[j] = newValue;
    }

    add(other: Matrix<1, M, T>): void {
        for (let j = 0; j < this.m; j++) {
            const currVal = (this.sparseData[j] || 0);
            const otherVal = other.getValue(0, j);
            const newVal = matrixContentAdder(currVal, otherVal);
            if (newVal !== currVal) {
                this.sparseData[j] = newVal as T;
            }
        }
    }

    addScalar(other: T): void {
        if (other !== 0) {
            for (const [col, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(col)] = matrixContentAdder(value as T, other) as T;
            }
        }  
    }

    subtract(other: Matrix<1, M, T>): void {
        for (let j = 0; j < this.m; j++) {
            const currVal = (this.sparseData[j] || 0);
            const otherVal = other.getValue(0, j);
            const newVal = matrixContentSubtractor(currVal, otherVal);
            if (newVal !== currVal) {
                this.sparseData[j] = newVal as T;
            }
        }
    }

    subtractScalar(other: T): void {
        if (other !== 0) {
            for (const [col, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(col)] = matrixContentSubtractor(value as T, other) as T;
            }
        }
    }

    scale(other: T): void {
        for (const [col, value] of Object.entries(this.sparseData)) {
            this.sparseData[parseInt(col)] = matrixContentMultiplier(value as T, other) as T;
        }
    }

    mapInPlace(mapper: (f: T) => T): void {
        for (const [col, value] of Object.entries(this.sparseData)) {
            const newVal = mapper(value as T);
            if (newVal !== value) {
                this.sparseData[parseInt(col)] = newVal as T;
            }
        }
    }

    toMutable(): SparseMutableRow<M, T> {
        return this as SparseMutableRow<M, T>;        
    }

    
    withAddedRow<O extends Dimension>(newRow: Row<M, T>, atIdx: number): SparseRowMatrix<O, M, T> {
        if (atIdx < 0 || atIdx > this.n) {
            throw new Error('Invalid row index');
        }
        const newRows: Array<SparseMutableRow<M, T>> = [];
        for (let i = 0; i < this.n; i++) {
            if (i === atIdx) {
                newRows.push(rowToSparseRow(newRow) as  SparseMutableRow<M, T>);
            }
            newRows.push(this.getRow(i));
        }
        return new SparseRowMatrix(newRows, 2 as O, this.m);
    }
    

    withAddedColumn<O extends Dimension>(newCol: Column<1, T>, atIdx: number): SparseMutableRow<O, T> {
        return super.withAddedColumn(newCol, atIdx) as SparseMutableRow<O, T>;  
    }

    
    withoutRow<O extends Dimension>(rowIdx: number): MutableMatrix<O, M, T> {
        return super.withoutRow(rowIdx) as Matrix<O, M, T> as MutableMatrix<O, M, T>;
    }
    

    withoutColumn<O extends Dimension>(colIdx: number): SparseMutableRow<O, T> {

       return super.withoutColumn(colIdx) as SparseMutableRow<O, T>;
    }

}


export class GenericSparseMutableColumn<N extends Dimension, T extends MatrixContent> extends GenericSparseColumn<N, T> implements SparseMutableColumn<N, T> {

    public constructor(protected sparseData: SparseData<T>, public readonly n: N) {
        super(sparseData, n);
    }
    
    getTranspose(): MutableMatrix<1, N, T> {
        return createSparseMutableRow(this.sparseData, this.n);
    }

    getRow(i: number): MutableRow<1, T> {
        return super.getRow(i) as MutableRow<1, T>;
    }

    getColumn(j: number): SparseMutableColumn<N, T> {
        return super.getColumn(j) as SparseMutableColumn<N, T>;
    }

    getMultiplication<O extends Dimension>(right: Matrix<1, O, T>): MutableMatrix<N, O, T> {
        return super.getMultiplication(right) as MutableMatrix<N, O, T>;
    }

    getScaled(other: T): SparseMutableColumn<N,T> {
        return super.getScaled(other) as SparseMutableColumn<N,T>;
    }

    withValue(row: number, column: number, value: T): SparseMutableColumn<N, T> {
        return super.withValue(row, column, value) as SparseMutableColumn<N, T>;
    }

    withAdded(other: Matrix<N, 1, T>): SparseMutableColumn<N, T> {
        return super.withAdded(other) as SparseMutableColumn<N, T>;
    }

    withAddedScalar(other: T): SparseMutableColumn<N, T> {
        return super.withAddedScalar(other) as SparseMutableColumn<N, T>;
    }

    withSubtracted(other: Matrix<N, 1, T>): SparseMutableColumn<N, T> {
        return super.withSubtracted(other) as SparseMutableColumn<N, T>;
    }

    withSubtractedScalar(other: T): SparseMutableColumn<N, T> {
        return super.withSubtractedScalar(other) as SparseMutableColumn<N, T>;
    }

    mapped<G extends MatrixContent>(mapper: (f: T) => G): SparseMutableColumn<N, G> {
        return super.mapped(mapper) as SparseMutableColumn<N, G>;
    }

    setValue(i: number, j: number, newValue: T): void {
        if (j !== 0) {
            throw new Error('Invalid column.');
        }
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row.');
        }
        this.sparseData[j] = newValue;
    }

    add(other: Matrix<N, 1, T>): void {
        for (let i = 0; i < this.n; i++) {
            const currVal = (this.sparseData[i] || 0);
            const otherVal = other.getValue(i, 0);
            const newVal = matrixContentAdder(currVal, otherVal);
            if (newVal !== currVal) {
                this.sparseData[i] = newVal as T;
            }
        }
    }

    addScalar(other: T): void {
        if (other !== 0) {
            for (const [row, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(row)] = matrixContentAdder(value as T, other) as T;
            }
        }  
    }

    subtract(other: Matrix<N, 1, T>): void {
        for (let i = 0; i < this.n; i++) {
            const currVal = (this.sparseData[i] || 0);
            const otherVal = other.getValue(i, 0);
            const newVal = matrixContentSubtractor(currVal, otherVal);
            if (newVal !== currVal) {
                this.sparseData[i] = newVal as T;
            }
        }
    }

    subtractScalar(other: T): void {
        if (other !== 0) {
            for (const [row, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(row)] = matrixContentSubtractor(value as T, other) as T;
            }
        }
    }

    scale(other: T): void {
        if (other !== 1) {
            for (const [row, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(row)] = matrixContentMultiplier(value as T, other) as T;
            }
        }
    }

    mapInPlace(mapper: (f: T) => T): void {
        for (const [row, value] of Object.entries(this.sparseData)) {
            this.sparseData[parseInt(row)] = mapper(value as T) as T;
        }
    }

    /*
    toMutable(): SparseMutableColumn<N, T> {
        return this as SparseMutableColumn<N, T>;
    }
    */

    withAddedRow<O extends number>(newRow: Row<1, T>, atIdx: number): SparseMutableColumn<O, T> {
        return super.withAddedRow(newRow, atIdx) as SparseMutableColumn<O, T>;
    }

    withAddedColumn<O extends number>(newColumn: Column<N, T>, atIdx: number): SparseColumnMatrix<N, O, T> {
        if (atIdx < 0 || atIdx > 1) {
            throw new Error('Invalid index.');
        }
        if (atIdx === 0) {
            return new SparseColumnMatrix<N, O, T>([columnToSparseColumn(newColumn).toMutable() as SparseMutableColumn<N, T>, this], this.n, 2 as O);
        } else {
            return new SparseColumnMatrix<N, O, T>([this, columnToSparseColumn(newColumn).toMutable() as SparseMutableColumn<N, T>], this.n, 2 as O);
        }
    }

    withoutRow<O extends number>(atIdx: number): SparseMutableColumn<O, T> {
        return super.withoutRow(atIdx) as SparseMutableColumn<O, T>;
    }

    withoutColumn<O extends number>(atIdx: number): MutableMatrix<any, any, T> {
        return super.withoutColumn(atIdx) as MutableMatrix<any, any, T>;
    }

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
                let sum: T = 0 as T;
                for (let k = 0; k < right.n; k++) {
                    sum = matrixContentAdder(sum, this.rows[i].getValue(0, k) * right.getValue(k, j));
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
        const rows: SparseMutableRow<O, T>[] = [];
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
        const rows: SparseMutableRow<M, T>[] = [];
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
                let sum: T = 0 as T;
                for (let k = 0; k < this.m; k++) {
                    sum = matrixContentAdder(sum, matrixContentMultiplier(this.columns[k].getValue(i, 0), right.getValue(k, j) as T) as T;
                }
                row.push(sum);
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