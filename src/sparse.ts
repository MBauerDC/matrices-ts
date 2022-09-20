import { Column, Dimension, GenericColumn, GenericMatrix, GenericRow, Matrix, MatrixContent, Row, matrixContentAdder, matrixContentSubtractor, matrixContentMultiplier, matrixContentScaler} from "./matrix";

type SparseData<T extends MatrixContent> = Record<number, T>;
interface SparseRow<M extends Dimension, T extends MatrixContent> extends Row<M, T> {
    readonly n: 1;
    isSparse: true;
    getSparseData(): SparseData<T>;
    withValue(row: number, column: number, value: T): SparseRow<M, T>;
};
interface SparseColumn<N extends Dimension, T extends MatrixContent> extends Column<N, T> {
    readonly m: 1;
    isSparse: true;
    getSparseData(): SparseData<T>;
    withValue(row: number, column: number, value: T): SparseColumn<N, T>;
};

class GenericSparseRow<M extends Dimension, T extends MatrixContent> implements SparseRow<M, T> {
    isSparse: true = true;
    readonly n: 1 = 1;
    public constructor(protected sparseData: SparseData<T>, public readonly m: M) {}

    getAsArray(): T[][] {
        const data: T[][] = [[]];
        for (let j = 0; j < this.m; j++) {
            data[0].push(this.sparseData[j] || 0 as T);
        }
        return data;
    }
    
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
            let sum: T = 0 as T;
            for (let k = 0; k < right.n; k++) {
                sum = matrixContentAdder<T>(sum, matrixContentMultiplier<T>(this.sparseData[k], right.getValue(k, j)) as T) as T;
            }
            data.push(sum);
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

    withAddedRow<O extends Dimension>(newRow: Row<M, T>, atIdx: number): Matrix<O, M, T> {
        if (atIdx < 0 || atIdx > 1) {
            throw new Error('Invalid row.');
        }
        const newSparseRow = rowToSparseRow(newRow);
        return atIdx == 0 ? 
          new SparseRowImmutableMatrix<O, M, T>([newSparseRow, this], 2 as O, this.m) :
          new SparseRowImmutableMatrix<O, M, T>([this, newSparseRow], 2 as O, this.m);
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

    foldLeft<G extends any>(fn: (acc: G, value: T) => G, init: G): G {
        let acc = init;
        for (const value of this) {
            acc = fn(acc, value);
        }
        return acc;
    }

    foldRight<G extends unknown>(f: (acc: G, value: T) => G, init: G): G {
        let acc = init;
        const arr: T[] = Array.from(this.generateRow(0));
        for (let i = arr.length - 1; i >= 0; i--) {
            acc = f(acc, arr[i]);
        }
        return acc;
    }
}

class GenericSparseColumn<N extends Dimension, T extends MatrixContent> implements SparseColumn<N, T> {
    isSparse: true = true;
    readonly m: 1 = 1;
    public constructor(protected sparseData: SparseData<T>, public readonly n: N) {}

    getAsArray(): T[][] {
        const arr: T[][] = [];
        for (let i = 0; i < this.n; i++) {
            arr[i] = [this.sparseData[i] || 0 as T];
        }
        return arr;
    }
    
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
    
    getTranspose(): SparseRow<N, T> {
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
            let sum: T = 0 as T;
            for (let k = 0; k < right.n; k++) {
                sum = matrixContentAdder(sum, matrixContentMultiplier(this.sparseData[k], right.getValue(k, j)) as T) as T;
            }
            data.push(sum);
        }
        return new GenericMatrix([data], null, null, this.n, right.m);
    }

    getScaled(other: T): SparseColumn<N,T> {
        const data: Record<number, T> = {};
        for (const [col, value] of Object.entries(this.sparseData)) {
            data[parseInt(col)] = matrixContentMultiplier(value as T, other) as T;
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

    withAdded(other: Matrix<N, 1, T>): SparseColumn<N, T> {
        const data: Record<number, T> = {};
        for (let j = 0; j < this.n; j++) {
            const newVal = matrixContentAdder((this.sparseData[j] || 0), other.getValue(j, 0));
            if (0 < newVal || 0 > newVal) { 
                data[j] = newVal as T;
            }
        }
        return createSparseColumn(data, this.n);
    }

    withAddedScalar(other: T): SparseColumn<N, T> {
        const data: Record<number, T> = {};
        for (let j = 0; j < this.n; j++) {
            const newVal = matrixContentAdder((this.sparseData[j] || 0), other);
            if (0 < newVal || 0 > newVal) {
              data[j] = newVal as T;
            }
        }
        return createSparseColumn(data, this.n);
    }

    withSubtracted(other: Matrix<N, 1, T>): SparseColumn<N, T> {
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
          new SparseColumnImmutableMatrix<N, O, T>([columnToSparseColumn(newColumn), this], this.n, 2 as O) :
          new SparseColumnImmutableMatrix<N, O, T>([this, columnToSparseColumn(newColumn)], this.n, 2 as O);
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
        return new SparseRowImmutableMatrix<O, O, T>([], 0 as O, 0 as O);
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

    foldLeft<G extends any>(fn: (acc: G, value: T) => G, init: G): G {
        let acc = init;
        for (const value of this) {
            acc = fn(acc, value);
        }
        return acc;
    }

    foldRight<G extends unknown>(f: (acc: G, value: T) => G, init: G): G {
        let acc = init;
        const arr: T[] = Array.from(this.generateColumn(0));
        for (let i = arr.length - 1; i >= 0; i--) {
            acc = f(acc, arr[i]);
        }
        return acc;
    }

}

class SparseRowImmutableMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> implements Matrix<N, M, T> {
    isSparse: true;
    constructor(protected rows: SparseRow<M, T>[], public readonly n: N, public readonly m: M) {
        if (rows.length !== n) {
            throw new Error('Invalid number of rows');
        }
        this.n = n;
        this.m = m;
    }

    getAsArray(): T[][] {
        return this.rows.map(row => row.getAsArray()[0]);
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

    getTranspose(): SparseColumnImmutableMatrix<M, N, T> {
        const sparseColumns: SparseColumn<M, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            sparseColumns.push(new GenericSparseColumn<M, T>(this.rows[i].getSparseData(), this.m));
        }
        return new SparseColumnImmutableMatrix<M, N, T>(sparseColumns, this.m, this.n);
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

    getRow(i: number): SparseRow<M, T> {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        return this.rows[i];
    }

    getColumn(j: number): Column<N, T> {
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        const data: T[] = [];
        for (let i = 0; i < this.n; i++) {
            data.push(this.rows[i].getValue(0, j) as T);
        }
        return new GenericColumn(data, this.n);
    }

    getMultiplication<O extends Dimension>(right: Matrix<M, O, T>): SparseRowImmutableMatrix<N, O, T> {
        
        const rows: GenericSparseRow<O, T>[] = [];        
        for (let i = 0; i < this.n; i++) {
            const newRow: Record<number, T> = {};
            const currRow: SparseRow<M, T> = this.rows[i];
            const currRowData: SparseData<T> = currRow.getSparseData();
            for (let j = 0; j < right.m; j++) {
                let sum: T = 0 as T;
                for (let k = 0; k < right.n; k++) {
                    const leftValue = currRowData[k];
                    const rightValue = right.getValue(k, j);
                    if (leftValue !== 0 && typeof leftValue !== "undefined" && rightValue !== 0 && typeof rightValue !== "undefined") {
                        sum = matrixContentAdder<T>(sum, matrixContentMultiplier<T>(leftValue, rightValue));    
                        if (sum !== 0) {
                            newRow[j] = sum as T;
                        }
                    }
                }
            }
            rows.push(new GenericSparseRow(newRow, right.m));
        }
        return new SparseRowImmutableMatrix(rows, this.n, right.m);
    }

    getScaled(other: T): SparseRowImmutableMatrix<N, M, T> {
        const rows: SparseRow<M, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].getScaled(other) as SparseRow<M, T>);
        }
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }

    withValue(i: number, j: number, value: T): SparseRowImmutableMatrix<N, M, T> {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        const rows = [...this.rows];
        rows[i] = rows[i].withValue(0, j, value);
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }

    withAdded(other: Matrix<N, M, T>): SparseRowImmutableMatrix<N, M, T> {
        const rows: SparseRow<M, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withAdded(other.getRow(i)) as SparseRow<M, T>);
        }
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }

    withAddedScalar(other: T): SparseRowImmutableMatrix<N, M, T> {
        const rows: SparseRow<M, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withAddedScalar(other) as SparseRow<M, T>);
        }
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }

    withSubtracted(other: Matrix<N, M, T>): SparseRowImmutableMatrix<N, M, T> {
        const rows: SparseRow<M, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withSubtracted(other.getRow(i)) as SparseRow<M, T>);
        }
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }

    withSubtractedScalar(other: T): SparseRowImmutableMatrix<N, M, T> {
        const rows: SparseRow<M, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withSubtractedScalar(other) as SparseRow<M, T>);
        }
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }

    mapped<G extends MatrixContent>(mapper: (value: T) => G): SparseRowImmutableMatrix<N, M, G> {
        const rows: SparseRow<M, G>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].mapped(mapper) as SparseRow<M, G>);
        }
        return new SparseRowImmutableMatrix<N, M, G>(rows, this.n, this.m);
    }

    withAddedRow<O extends number>(newRow: Row<M, T>, atIdx: number): SparseRowImmutableMatrix<O, M, T> {
        const rows = [...this.rows];
        rows.splice(atIdx, 0, newRow as SparseRow<M, T>);
        return new SparseRowImmutableMatrix(rows, (this.n + 1) as O, this.m);
    }

    withAddedColumn<O extends number>(newColumn: Column<N, T>, atIdx: number): SparseRowImmutableMatrix<N, O, T> {
        const rows: SparseRow<O, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            const valToAdd = newColumn.getValue(i, 0);
            rows.push(this.rows[i].withAddedColumn(new GenericSparseColumn([valToAdd], 1), atIdx) as SparseRow<O, T>);
        }
        return new SparseRowImmutableMatrix<N, O, T>(rows, this.n, (this.m + 1) as O);
    }

    withoutRow<O extends number>(atIdx: number): SparseRowImmutableMatrix<O, M, T> {
        const rows = [...this.rows];
        rows.splice(atIdx, 1);
        return new SparseRowImmutableMatrix(rows, (this.n - 1) as O, this.m);
    }

    withoutColumn<O extends number>(atIdx: number): SparseRowImmutableMatrix<N, O, T> {
        const rows: SparseRow<O, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withoutColumn(atIdx) as SparseRow<O, T>);
        }
        return new SparseRowImmutableMatrix(rows, this.n, (this.m - 1) as O);
    }
}

function createSparseRow<M extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, m: M): SparseRow<M, T> {
    return new GenericSparseRow(sparseData, m);
}


function sparseRowToRow<M extends Dimension, T extends MatrixContent>(sparseRow: SparseRow<M, T>): Row<M, T> {
    return new GenericRow(Array.from(sparseRow.generateRow(0)), sparseRow.m);
}

function rowToSparseRow<M extends Dimension, T extends MatrixContent>(row: Row<M, T>): SparseRow<M, T> {
    if (row.hasOwnProperty("isSparse")) {
        return row as SparseRow<M, T>;
    }
    const data: Record<number, T> = {};
    for (let i = 0; i < row.m; i++) {
        const currVal = row.getValue(0, i);
        if (0 < currVal || 0 > currVal) {
          data[i] = row.getValue(0, i);
        }
    }
    return createSparseRow(data, row.m);
}

function sparseColumnToColumn<N extends Dimension, T extends MatrixContent>(sparseColumn: SparseColumn<N, T>): Column<N, T> {
    return new GenericColumn(Array.from(sparseColumn.generateColumn(0)), sparseColumn.n);
}

function columnToSparseColumn<N extends Dimension, T extends MatrixContent>(column: Column<N, T>): SparseColumn<N, T> {
    if (column.hasOwnProperty("isSparse")) {
        return column as SparseColumn<N, T>;
    }
    const data: Record<number, T> = {};
    for (let i = 0; i < column.n; i++) {
        const currVal = column.getValue(i, 0);
        if (0 < currVal || 0 > currVal) {
          data[i] = column.getValue(i, 0);
        }
    }
    return createSparseColumn(data, column.n);
}

function createSparseColumn<N extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, n: N): SparseColumn<N, T> {
   return new GenericSparseColumn(sparseData, n);   
}

class SparseColumnImmutableMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> implements Matrix<N, M, T> {
    isSparse: true;
    constructor(protected columns: SparseColumn<N, T>[], public readonly n: N, public readonly m: M) {
        if (columns.length !== m) {
            throw new Error('Invalid number of columns.');
        }
    }

    
    getAsArray(): T[][] {
        const rows: T[][] = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(Array.from(this.generateRow(i)))
        }
        return rows;
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
    
    getTranspose(): SparseRowImmutableMatrix<M, N, T> {
        const rows: SparseRow<N, T>[] = [];
        for (let j = 0; j < this.m; j++) {
            rows.push(new GenericSparseRow<N, T>(this.columns[j].getSparseData(), this.n));
        }
        return new SparseRowImmutableMatrix<M, N, T>(rows, this.m, this.n);
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
    
    getRow(i: number): Row<M, T> {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        const data: T[] = [];
        for (let j = 0; j < this.m; j++) {
            data.push(this.columns[j].getValue(i, 0) as T);
        }
        return new GenericRow(data, this.m);
    }
    
    getColumn(j: number): SparseColumn<N, T> {
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        return this.columns[j];
    }
    
    getMultiplication<O extends Dimension>(right: Matrix<M, O, T>): Matrix<N, O, T> {
        const rows: SparseRow<O, T>[] = [];
        for (let i = 0; i < this.n; i++) {
            const row: T[] = [];
            for (let j = 0; j < right.m; j++) {
                let sum: T = 0 as T;
                for (let k = 0; k < this.m; k++) {
                    sum = matrixContentAdder(sum, matrixContentMultiplier(this.columns[k].getValue(i, 0), right.getValue(k, j)) as T) as T;
                }
                row.push(sum);
            }
            rows.push(new GenericSparseRow(row, right.m));
        }
        return new SparseRowImmutableMatrix(rows, this.n, right.m);
    }
    
    getScaled(other: T): SparseColumnImmutableMatrix<N, M, T> {
        if (other !== 1) {
            const columns: SparseColumn<N, T>[] = [];
            for (let j = 0; j < this.m; j++) {
                columns.push(this.columns[j].getScaled(other) as SparseColumn<N, T>);
            }
            return new SparseColumnImmutableMatrix(columns, this.n, this.m);
        }
        return this;
    }
    
    withValue(i: number, j: number, value: T): SparseColumnImmutableMatrix<N, M, T> {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        const columns: SparseColumn<N, T>[] = [];
        for (let k = 0; k < this.m; k++) {
            const newColumn = k !== j ? this.columns[k] : this.columns[k].withValue(i, 0, value);
            columns.push(newColumn);
        }
        return new SparseColumnImmutableMatrix(columns, this.n, this.m);
    }
    
    withAdded(other: Matrix<N, M, T>): SparseColumnImmutableMatrix<N, M, T> {
        const columns: SparseColumn<N, T>[] = [];
        for (let j = 0; j < this.m; j++) {
            columns.push(this.columns[j].withAdded(other.getColumn(j)) as SparseColumn<N, T>);
        }
        return new SparseColumnImmutableMatrix(columns, this.n, this.m);
    }
    
        withAddedScalar(other: T): SparseColumnImmutableMatrix<N, M, T> {
            const columns: SparseColumn<N, T>[] = [];
            for (let j = 0; j < this.m; j++) {
                columns.push(this.columns[j].withAddedScalar(other) as SparseColumn<N, T>);
            }
            return new SparseColumnImmutableMatrix(columns, this.n, this.m);
        }
    
        withSubtracted(other: Matrix<N, M, T>): SparseColumnImmutableMatrix<N, M, T> {
            const columns: SparseColumn<N, T>[] = [];
            for (let j = 0; j < this.m; j++) {
                columns.push(this.columns[j].withSubtracted(other.getColumn(j)) as SparseColumn<N, T>);
            }
            return new SparseColumnImmutableMatrix(columns, this.n, this.m);
        }
    
        withSubtractedScalar(other: T): SparseColumnImmutableMatrix<N, M, T> {
            const columns: SparseColumn<N, T>[] = [];
            for (let j = 0; j < this.m; j++) {
                columns.push(this.columns[j].withSubtractedScalar(other) as SparseColumn<N, T>);
            }
            return new SparseColumnImmutableMatrix(columns, this.n, this.m);
        }
    
        mapped<G extends MatrixContent>(f: (value: T) => G): SparseColumnImmutableMatrix<N, M, G> {
            const columns: SparseColumn<N, G>[] = [];
            for (const currColumn of this.columns) {
                columns.push(currColumn.mapped(f) as SparseColumn<N, G>);
            }
            return new SparseColumnImmutableMatrix<N, M, G>(columns, this.n, this.m);
        }
        withAddedRow<O extends number>(newRow: Row<M, T>, atIdx: number): SparseColumnImmutableMatrix<O, M, T> {
            if (atIdx < 0 || atIdx > this.n) {
                throw new Error('Invalid row index');
            }
            const columns: SparseColumn<O, T>[] = [];
            for (let j = 0; j < this.m; j++) {
                const currColumn: SparseColumn<N, T> = this.columns[j];
                const newColumn = currColumn.withAddedRow(new GenericRow<1, T>([newRow.getValue(0, j)], 1), atIdx) as SparseColumn<O, T>;
                columns.push(newColumn);
            }
            return new SparseColumnImmutableMatrix(columns, (this.n + 1) as O, this.m);
        }
    
        withAddedColumn<O extends number>(newColumn: Column<N, T>, atIdx: number): SparseColumnImmutableMatrix<N, O, T> {
            if (atIdx < 0 || atIdx > this.m) {
                throw new Error('Invalid column index');
            }
            const newSparseColumn = columnToSparseColumn(newColumn);
            const columns: SparseColumn<N, T>[] = [];
            for (let j = (this.m - 1); j >= 0; j--) {
                if (j >= atIdx) {
                    columns[j + 1] = this.columns[j];;
                } else {
                    columns[j] = this.columns[j];
                }
            }
            columns[atIdx] = newSparseColumn;
            return new SparseColumnImmutableMatrix(columns, this.n, (this.m + 1) as O);
        }
    
        withoutRow<O extends number>(atIdx: number): SparseColumnImmutableMatrix<O, M, T> {
            if (atIdx < 0 || atIdx >= this.n) {
                throw new Error('Invalid row index');
            }
            const columns: SparseColumn<O, T>[] = [];
            for (let j = 0; j < this.m; j++) {
                const currColumn: SparseColumn<N, T> = this.columns[j];
                const newColumn = currColumn.withoutRow(atIdx) as SparseColumn<O, T>;
                columns.push(newColumn);
            }
            return new SparseColumnImmutableMatrix(columns, (this.n - 1) as O, this.m);
        }
    
        withoutColumn<O extends number>(atIdx: number): SparseColumnImmutableMatrix<N, O, T> {
            if (atIdx < 0 || atIdx >= this.m) {
                throw new Error('Invalid column index');
            }
            const columns: SparseColumn<N, T>[] = [...this.columns];
            return new SparseColumnImmutableMatrix(columns.splice(atIdx, 1), this.n, (this.m - 1) as O);
        }
    
}

export { SparseRow, SparseColumn, SparseData, GenericSparseRow, GenericSparseColumn, SparseRowImmutableMatrix, SparseColumnImmutableMatrix, createSparseRow, createSparseColumn, sparseRowToRow, rowToSparseRow, sparseColumnToColumn, columnToSparseColumn };