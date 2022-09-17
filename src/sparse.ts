import { Column, Dimension, GenericColumn, GenericMatrix, GenericRow, Matrix, MatrixContent, Row, matrixContentAdder, matrixContentSubtractor, matrixContentMultiplier, matrixContentScaler} from "./matrix";
import { MutableColumn, MutableMatrix, MutableRow } from "./mutable";

export type SparseData<T extends MatrixContent> = Record<number, T>;
export interface SparseRow<M extends Dimension, T extends MatrixContent> extends Row<M, T> {
    getSparseData(): SparseData<T>;
    withValue(row: number, column: number, value: T): SparseRow<M, T>;
};
export interface SparseColumn<N extends Dimension, T extends MatrixContent> extends Column<N, T> {
    getSparseData(): SparseData<T>;
    withValue(row: number, column: number, value: T): SparseColumn<N, T>;
};

export class GenericSparseRow<M extends Dimension, T extends MatrixContent> implements SparseRow<M, T> {
    public readonly n: 1 = 1;
    public constructor(protected sparseData: SparseData<T>, public readonly m: M) {}
    
    getSparseData(): SparseData<T> {
        return this.sparseData;
    }

    getValue(i: number, j: number): T {
        if (i !== 0) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        return this.sparseData[j] || 0 as T;
    }

    at(index: number): T {
        if (index < 0 || index >= this.m) {
            throw new Error('Invalid column');
        }
        return this.sparseData[index] || 0 as T;
    }
    
    getTranspose(): SparseColumn<M, T> {
        return createSparseColumn(this.sparseData, this.m);
    }

    *generateRow(i: number): Generator<T> {
        if (i !== 0) {
            throw new Error('Invalid row');
        }
        for (let j = 0; j < this.m; j++) {
            yield this.sparseData[j] || 0 as T;
        }
    }

    *generateColumn(j: number): Generator<T> {
        if (j !== 0) {
            throw new Error('Invalid column');
        }
        return this.sparseData[0] || 0;
    }

    getRow(i: number): SparseRow<M, T> {
        if (i !== 0) {
            throw new Error('Invalid row');
        }
        return this as SparseRow<M, T>;
    }

    getColumn(j: number): Column<1, T> {
        if (j !== 0) {
            throw new Error('Invalid column');
        }
        return new GenericColumn([this.sparseData[0] || 0 as T], 1);
    }

    getMultiplication<O extends Dimension>(right: Matrix<M, O, T>): Row<O, T> {
        const data: T[] = [];
        for (let j = 0; j < right.m; j++) {
            let sum = 0;
            for (let k = 0; k < right.n; k++) {
                sum += matrixContentMultiplier(this.sparseData[k], right.getValue(k, j));
            }
            data.push(sum as T);
        }
        return new GenericRow(data, right.m);
    }

    getScaled(other: T): SparseRow<M, T> {
        const data: Record<number, T> = {};
        for (const [col, value] of Object.entries(this.sparseData)) {
            data[parseInt(col)] = matrixContentMultiplier(value as T, other) as T;
        }
        return createSparseRow(data, this.m);
    }

    withValue(row: number, column: number, value: T): SparseRow<M, T> {
      if (row !== 0) {
        throw new Error('Invalid row.');
      }
      if(column < 0 || column >= this.m) {
        throw new Error('Invalid column.');
      }
      const data: Record<number, T> = {...this.sparseData};
      data[column] = value;
      return new GenericSparseRow(data, this.m);
    }

    withAdded(other: Row<M, T>): SparseRow<M, T> {
        const data: Record<number, T> = {};
        for (let j = 0; j < this.m; j++) {
            const newVal = matrixContentAdder(this.sparseData[j] || 0, other.getValue(0, j));
            if (0 < newVal || 0 > newVal) { 
                data[j] = newVal as T;
            }
        }
        return createSparseRow(data, this.m);
    }

    withAddedScalar(other: T): SparseRow<M, T> {
        const data: Record<number, T> = {};
        for (let j = 0; j < this.m; j++) {
            const newVal = matrixContentAdder((this.sparseData[j] || 0), other);
            if (0 < newVal || 0 > newVal) {
              data[j] = newVal as T;
            }
        }
        return createSparseRow(data, this.m);
    }

    withSubtracted(other: Matrix<1, M, T>): SparseRow<M, T> {
        const data: Record<number, T> = {};
        for (let j = 0; j < this.m; j++) {
            const newVal = matrixContentSubtractor((this.sparseData[j] || 0), other.getValue(0, j));
            if (0 < newVal || 0 > newVal) { 
                data[j] = newVal as T;
            }
        }
        return createSparseRow(data, this.m);
    }

    withSubtractedScalar(other: T): SparseRow<M, T> {
        const newRec: Record<number, T> = {};
        for (let j = 0; j < this.m; j++) {
            const newVal = matrixContentSubtractor((this.sparseData[j] || 0), other);
            if (0 < newVal || 0 > newVal) { 
                newRec[j] = newVal as T;
            }
        }
        const newRecWithLength: Record<M, T> = newRec;
        return createSparseRow(newRecWithLength, this.m);
    }

    mapped<G extends MatrixContent>(mapper: (f: T) => G): SparseRow<M, G> {
        const data: Record<number, G> = {};
        for (const [col, value] of Object.entries(this.sparseData)) {
            const newVal = mapper(value as T);
            data[parseInt(col)] = newVal as G;
            
        }
        return createSparseRow(data, this.m);
    }

    /*
    toMutable(): SparseMutableRow<M, T> {
        return new GenericSparseMutableRow(this.sparseData, this.m);
    }
    */

    withAddedRow<O extends Dimension>(newRow: Row<M, T>, atIdx: number): Matrix<O, M, T> {
        if (atIdx < 0 || atIdx > 1) {
            throw new Error('Invalid row.');
        }
        const newSparseRow = rowToSparseRow(newRow);
        return atIdx == 0 ? 
          new SparseRowMatrix<O, M, T>([newSparseRow.toMutable() as SparseMutableRow<M, T>, this.toMutable()], 2 as O, this.m) :
          new SparseRowMatrix<O, M, T>([this.toMutable(), newSparseRow.toMutable() as SparseMutableRow<M, T>], 2 as O, this.m);
    }

    withAddedColumn<O extends Dimension>(newColumn: Column<1, T>, atIdx: number): Matrix<1, O, T> {
        if (atIdx < 0 || atIdx > this.m) {
            throw new Error('Invalid column.');
        }
        const valueToAdd = newColumn.getValue(0,0);
        const sparseData:Record<number, T> = {};
        const keys = Object.keys(this.sparseData).map(i => parseInt(i)).sort((a, b) => b - a);
        for (const key of keys) {
            if (key >= atIdx) {
                sparseData[key + 1] = this.sparseData[key];
            } else {
                sparseData[key] = this.sparseData[key];
            }
        }
        sparseData[atIdx] = valueToAdd;
        const newSparseRow = new GenericSparseRow(sparseData, (this.m + 1) as O);
        return newSparseRow;
    }

    withoutRow<O extends number>(atIdx: number): Matrix<O, M, T> {
        if (atIdx !== 0) {
            throw new Error('Invalid row.');
        }
        return new GenericMatrix([], null, null, 0 as O, this.m);
    }

    withoutColumn<O extends number>(atIdx: number): Matrix<1, O, T> {
        if (atIdx < 0 || atIdx > this.m) {
            throw new Error('Invalid column.');
        }
        
        const newSparseData:Record<number, T> = {};
        const keys = 
            Object.keys(this.sparseData)
            .map(i => parseInt(i)).sort((a, b) => a - b)
            .filter((n: number, _) => n !== atIdx);
        for (const key of keys) {
            if (key >= atIdx) {
                newSparseData[key + 1] = this.sparseData[key];
            } else {
                newSparseData[key] = this.sparseData[key];
            }
        }        
        const newSparseRow = new GenericSparseRow(newSparseData, this.m -1 as O);
        return newSparseRow;
    }

    public [Symbol.iterator](): Iterator<T> {
        return new class implements Iterator<T> {
            protected index: number = 0;
            constructor(protected row: Row<M, T>) {}
            public next(): IteratorResult<T> {
                if (this.index < this.row.m) {
                    return {value: this.row.at(this.index++), done: false};
                }
                return {value: null, done: true};
            }
        }(this)
    }
}

export class GenericSparseColumn<N extends Dimension, T extends MatrixContent> implements SparseColumn<N, T> {
    public readonly m: 1 = 1;
    public constructor(protected sparseData: SparseData<T>, public readonly n: N) {}
    
    getSparseData(): SparseData<T> {
        return this.sparseData;
    }

    getValue(i: number, j: number): T {
        if (j !== 0) {
            throw new Error('Invalid column.');
        }
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row.');
        }
        return this.sparseData[i] || 0 as T;
    }

    at(index: number): T {
        if (index < 0 || index >= this.n) {
            throw new Error('Invalid row.');
        }
        return this.sparseData[index] || 0 as T;
    }
    
    getTranspose(): Matrix<1, N, T> {
        return createSparseRow(this.sparseData, this.n);
    }

    *generateRow(i: number): Generator<T> {
        if (i !== 0) {
            throw new Error('Invalid row.');
        }
        return this.sparseData[0] || 0;
    }

    *generateColumn(j: number): Generator<T> {
        if (j !== 0) {
            throw new Error('Invalid column.');
        }
        for (let i = 0; i < this.n; i++) {
            yield this.sparseData[i] || 0 as T;
        }
    }

    getRow(i: number): Row<1, T> {
        if (i !== 0) {
            throw new Error('Invalid row.');
        }
        return new GenericRow([this.sparseData[0] || 0 as T], 1);
    }

    getColumn(j: number): Column<N, T> {
        if (j !== 0) {
            throw new Error('Invalid column');
        }
        return this as Column<N, T>;
    }

    getMultiplication<O extends Dimension>(right: Matrix<1, O, T>): Matrix<N, O, T> {
        const data: T[] = [];
        for (let j = 0; j < right.m; j++) {
            let sum = 0;
            for (let k = 0; k < right.n; k++) {
                sum += this.sparseData[k] * right.getValue(k, j);
            }
            data.push(sum as T);
        }
        return new GenericMatrix([data], null, null, this.n, right.m);
    }

    getScaled(other: T): SparseColumn<N,T> {
        const data: Record<number, T> = {};
        for (const [col, value] of Object.entries(this.sparseData)) {
            data[parseInt(col)] = (value as T * other) as T;
        }
        return createSparseColumn(data, this.n);
    }

    withValue(row: number, column: number, value: T): SparseColumn<N, T> {
        if (row < 0 || row >= this.n) {
            throw new Error('Invalid row.');
        }
        if (column !== 0) {
            throw new Error("Invalid column.");
        }
        const data: Record<number, T> = {...this.sparseData};
        data[row] = value as T;
        return createSparseColumn(data, this.n);
    }

    withAdded(other: Matrix<N, 1, T>): Matrix<N, 1, T> {
        const data: Record<number, T> = {};
        for (let j = 0; j < this.n; j++) {
            const newVal = matrixContentAdder((this.sparseData[j] || 0), other.getValue(j, 0));
            if (0 < newVal || 0 > newVal) { 
                data[j] = newVal as T;
            }
        }
        return createSparseColumn(data, this.n);
    }

    withAddedScalar(other: T): Matrix<N, 1, T> {
        const data: Record<number, T> = {};
        for (let j = 0; j < this.n; j++) {
            const newVal = matrixContentAdder((this.sparseData[j] || 0), other);
            if (0 < newVal || 0 > newVal) {
              data[j] = newVal as T;
            }
        }
        return createSparseColumn(data, this.n);
    }

    withSubtracted(other: Matrix<N, 1, T>): Matrix<N, 1, T> {
        const data: Record<number, T> = {};
        for (let j = 0; j < this.n; j++) {
            const newVal = matrixContentAdder((this.sparseData[j] || 0), other.getValue(j, 0));
            if (0 < newVal || 0 > newVal) { 
                data[j] = newVal as T;
            }
        }
        return createSparseColumn(data, this.n);
    }

    withSubtractedScalar(other: T): SparseColumn<N, T> {
        const newRec: Record<number, T> = {};
        for (let j = 0; j < this.n; j++) {
            const newVal = matrixContentAdder((this.sparseData[j] || 0), other);
            if (0 < newVal || 0 > newVal) { 
                newRec[j] = newVal as T;
            }
        }
        const newRecWithLength: Record<N, T> = newRec;
        return createSparseColumn(newRecWithLength, this.n);
    }

    mapped<G extends MatrixContent>(f: (x: T) => G): SparseColumn<N, G> {
        const data: Record<number, G> = {};
        for (const [col, value] of Object.entries(this.sparseData)) {
            data[parseInt(col)] = f(value as T) as G;
        }
        return createSparseColumn(data, this.n);
    }

    /*
    toMutable(): SparseMutableColumn<N, T> {
        return new GenericSparseMutableColumn(this.sparseData, this.n);
    }
    */

    withAddedRow<O extends number>(newRow: Row<1, T>, atIdx: number): SparseColumn<O, T> {
        if (atIdx < 0 || atIdx > this.n) {
            throw new Error('Invalid row.');
        }
        const newSparseData:Record<number, T> = {};
        const keys = Object.keys(this.sparseData).map(x => parseInt(x)).sort((a, b) => b - a);
        for (const key of keys) {
            if (key < atIdx) {
                newSparseData[key] = this.sparseData[key];
            } else {
                newSparseData[key + 1] = this.sparseData[key];
            }
        }
        newSparseData[atIdx] = newRow.getValue(0, 0);
        return createSparseColumn(newSparseData, (this.n + 1) as O);
    }

    withAddedColumn<O extends number>(newColumn: Column<N, T>, atIdx: number): Matrix<N, O, T> {
        if (atIdx < 0 || atIdx > 1) {
            throw new Error('Invalid column.');
        }
        return atIdx === 0 ?
          new SparseColumnMatrix<N, O, T>([columnToSparseColumn(newColumn).toMutable() as SparseMutableColumn<N, T>, this.toMutable()], this.n, 2 as O) :
          new SparseColumnMatrix<N, O, T>([this.toMutable(), columnToSparseColumn(newColumn).toMutable() as SparseMutableColumn<N, T>], this.n, 2 as O);
    }

    withoutRow<O extends number>(atIdx: number): Matrix<O, 1, T> {
        if (atIdx < 0 || atIdx >= this.n) {
            throw new Error('Invalid row.');
        }
        const newSparseData:Record<number, T> = {};
        const keys = Object.keys(this.sparseData).map(x => parseInt(x)).sort((a, b) => a - b);
        for (const key of keys) {
            if (key < atIdx) {
                newSparseData[key] = this.sparseData[key];
            } else if (key > atIdx) {
                newSparseData[key - 1] = this.sparseData[key];
            }
        }
        return createSparseColumn(newSparseData, (this.n - 1) as O);
    }

    withoutColumn<O extends number>(atIdx: number): Matrix<any, any, T> {
        if (atIdx !== 0) {
            throw new Error('Invalid column.');
        }
        return new SparseRowMatrix<O, O, T>([], 0 as O, 0 as O);
    }

    public [Symbol.iterator](): Iterator<T> {
        return new class implements Iterator<T> {
            protected index: number = 0;
            constructor(protected column: Column<N, T>) {}
            public next(): IteratorResult<T> {
                if (this.index < this.column.n) {
                    return {value: this.column.at(this.index++), done: false};
                }
                return {value: null, done: true};
            }
        }(this)
    }

}



export function createSparseRow<M extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, m: M): SparseRow<M, T> {
    return new GenericSparseRow(sparseData, m);
}


export function sparseRowToRow<M extends Dimension, T extends MatrixContent>(sparseRow: SparseRow<M, T>): Row<M, T> {
    return new GenericRow(Array.from(sparseRow.generateRow(0)), sparseRow.m);
}


export function rowToSparseRow<M extends Dimension, T extends MatrixContent>(row: Row<M, T>): SparseRow<M, T> {
    const data: Record<number, T> = {};
    for (let i = 0; i < row.m; i++) {
        const currVal = row.getValue(0, i);
        if (0 < currVal || 0 > currVal) {
          data[i] = row.getValue(0, i);
        }
    }
    return createSparseRow(data, row.m);
}

export function sparseColumnToColumn<N extends Dimension, T extends MatrixContent>(sparseColumn: SparseColumn<N, T>): Column<N, T> {
    return new GenericColumn(Array.from(sparseColumn.generateColumn(0)), sparseColumn.n);
}

export function columnToSparseColumn<N extends Dimension, T extends MatrixContent>(column: Column<N, T>): SparseColumn<N, T> {
    const data: Record<number, T> = {};
    for (let i = 0; i < column.n; i++) {
        const currVal = column.getValue(i, 0);
        if (0 < currVal || 0 > currVal) {
          data[i] = column.getValue(i, 0);
        }
    }
    return createSparseColumn(data, column.n);
}
export function createSparseColumn<N extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, n: N): SparseColumn<N, T> {
   return new GenericSparseMutableColumn(sparseData, n);   
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
            const newVal = currVal + otherVal;
            if (newVal !== currVal) {
                this.sparseData[j] = newVal as T;
            }
        }
    }

    addScalar(other: T): void {
        if (other !== 0) {
            for (const [col, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(col)] = (value as T + other) as T;
            }
        }  
    }

    subtract(other: Matrix<1, M, T>): void {
        for (let j = 0; j < this.m; j++) {
            const currVal = (this.sparseData[j] || 0);
            const otherVal = other.getValue(0, j);
            const newVal = currVal - otherVal;
            if (newVal !== currVal) {
                this.sparseData[j] = newVal as T;
            }
        }
    }

    subtractScalar(other: T): void {
        if (other !== 0) {
            for (const [col, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(col)] = (value as T - other) as T;
            }
        }
    }

    scale(other: T): void {
        for (const [col, value] of Object.entries(this.sparseData)) {
            this.sparseData[parseInt(col)] = (value as T * other) as T;
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

    
    withoutRow<O extends Dimension, P extends Dimension>(rowIdx: number): MutableMatrix<O, M, T> {
        return (super.withoutRow(rowIdx) as Matrix<O, M, T>).toMutable() as MutableMatrix<O, M, T>;
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
            const newVal = currVal + otherVal;
            if (newVal !== currVal) {
                this.sparseData[i] = newVal as T;
            }
        }
    }

    addScalar(other: T): void {
        if (other !== 0) {
            for (const [row, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(row)] = (value as T + other) as T;
            }
        }  
    }

    subtract(other: Matrix<N, 1, T>): void {
        for (let i = 0; i < this.n; i++) {
            const currVal = (this.sparseData[i] || 0);
            const otherVal = other.getValue(i, 0);
            const newVal = currVal - otherVal;
            if (newVal !== currVal) {
                this.sparseData[i] = newVal as T;
            }
        }
    }

    subtractScalar(other: T): void {
        if (other !== 0) {
            for (const [row, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(row)] = (value as T - other) as T;
            }
        }
    }

    scale(other: T): void {
        if (other !== 1) {
            for (const [row, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(row)] = (value as T * other) as T;
            }
        }
    }

    mapInPlace(mapper: (f: T) => T): void {
        for (const [row, value] of Object.entries(this.sparseData)) {
            this.sparseData[parseInt(row)] = mapper(value as T) as T;
        }
    }

    toMutable(): SparseMutableColumn<N, T> {
        return this as SparseMutableColumn<N, T>;
    }

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

