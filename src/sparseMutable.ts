import { Column, Dimension, GenericColumn, GenericRow, Matrix, MatrixContent, matrixContentAdder, matrixContentMultiplier, matrixContentSubtractor, Row} from "./matrix";
import { GenericMutableColumn, GenericMutableMatrix, GenericMutableRow, MutableColumn, MutableMatrix, MutableRow } from "./mutable";
import { columnToSparseColumn, GenericSparseColumn, GenericSparseRow, SparseRowImmutableMatrix, SparseColumnImmutableMatrix, rowToSparseRow, SparseColumn, SparseData, SparseRow } from "./sparse";

function createSparseMutableRow<M extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, m: M): SparseMutableRow<M, T> {
    return new GenericSparseMutableRow<M, T>(sparseData, m);
}

function createSparseMutableColumn<N extends Dimension, T extends MatrixContent>(sparseData: SparseData<T>, n: N): SparseMutableColumn<N, T> {
    return new GenericSparseMutableColumn<N, T>(sparseData, n);   
 }
 
interface SparseMutableRow<M extends Dimension, T extends MatrixContent> extends MutableRow<M, T> {
    isSparse: true;
    getSparseData(): SparseData<T>;
    withValue(row: number, column: number, value: T): SparseMutableRow<M, T>;
};

interface SparseMutableColumn<N extends Dimension, T extends MatrixContent> extends MutableColumn<N, T> {
    isSparse: true;
    getSparseData(): SparseData<T>;
    withValue(row: number, column: number, value: T): SparseMutableColumn<N, T>;
};

class GenericSparseMutableRow<M extends Dimension, T extends MatrixContent> extends GenericSparseRow<M, T> implements SparseMutableRow<M, T> {
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

    
    withAddedRow<O extends Dimension>(newRow: Row<M, T>, atIdx: number): SparseRowMutableMatrix<O, M, T> {
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
        return new SparseRowMutableMatrix(newRows, 2 as O, this.m);
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


class GenericSparseMutableColumn<N extends Dimension, T extends MatrixContent> extends GenericSparseColumn<N, T> implements SparseMutableColumn<N, T> {

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

    
    toMutable(): SparseMutableColumn<N, T> {
        return this as SparseMutableColumn<N, T>;
    }
    

    withAddedRow<O extends number>(newRow: Row<1, T>, atIdx: number): SparseMutableColumn<O, T> {
        return super.withAddedRow(newRow, atIdx) as SparseMutableColumn<O, T>;
    }

    withAddedColumn<O extends number>(newColumn: Column<N, T>, atIdx: number): SparseColumnMutableMatrix<N, O, T> {
        if (atIdx < 0 || atIdx > 1) {
            throw new Error('Invalid index.');
        }
        return atIdx === 0 ?
          new SparseColumnMutableMatrix<N, O, T>([toMutable(columnToSparseColumn(newColumn)) as SparseMutableColumn<N, T>, this], this.n, 2 as O) :
          new SparseColumnMutableMatrix<N, O, T>([this, toMutable(columnToSparseColumn(newColumn))as SparseMutableColumn<N, T>], this.n, 2 as O);        
    }

    withoutRow<O extends number>(atIdx: number): SparseMutableColumn<O, T> {
        return super.withoutRow(atIdx) as SparseMutableColumn<O, T>;
    }

    withoutColumn<O extends number>(atIdx: number): MutableMatrix<any, any, T> {
        return super.withoutColumn(atIdx) as MutableMatrix<any, any, T>;
    }

}

class SparseRowMutableMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> extends SparseRowImmutableMatrix<N, M, T> {
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
}


class SparseColumnMutableMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> extends SparseColumnImmutableMatrix<N, M, T> {
    
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
}

type SparseMatrixType = 
  | SparseRow<Dimension, MatrixContent> 
  | SparseColumn<Dimension, MatrixContent> 
  | SparseRowMutableMatrix<Dimension, Dimension, MatrixContent> 
  | SparseColumnMutableMatrix<Dimension, Dimension, MatrixContent>;

function isSparse(m: Matrix<Dimension, Dimension, MatrixContent>): m is SparseMatrixType {
  return m.hasOwnProperty("isSparse");
}

function isSparseRow(m: Matrix<Dimension, Dimension, MatrixContent>): m is SparseRow<Dimension, MatrixContent> {
  return isSparse(m) && m.n === 1;
}

function isSparseColumn(m: Matrix<Dimension, Dimension, MatrixContent>): m is SparseColumn<Dimension, MatrixContent> {
  return isSparse(m) && m.m === 1;
}

function toMutable<N extends Dimension, M extends Dimension, T extends MatrixContent>(matrix: Matrix<N, M, T>): MutableMatrix<N, M, T> | SparseMutableRow<M, T> | SparseMutableColumn<N, T> | SparseRowMutableMatrix<N, M, T> | SparseColumnMutableMatrix<N, M, T> {
  const [isRow, isColumn, mIsSparse] = [matrix.n === 1, matrix.m === 1, isSparse(matrix)];
  
  const builder = 
    mIsSparse ? 
      (isRow || isColumn) ?
        (data: Record<number, T>) => isRow ? createSparseMutableRow(data, matrix.m) : createSparseMutableColumn(data, matrix.n)  :
        (data: any) => matrix as (SparseRowMutableMatrix<N, M, T> | SparseColumnMutableMatrix<N, M, T>) :
      (data: T[][]) => new GenericMutableMatrix<N, M, T>(data, null, null, matrix.n, matrix.m);
  let data: any = null;
  if (isRow || isColumn) {
    const recordOrArray: Record<number, T>|Array<T> = mIsSparse ? {} : [];
    const it = isRow ? matrix.generateRow(0) : matrix.generateColumn(0);
    let itResult = it.next();
    let i = 0;
    while (!itResult.done) {
      const value  = itResult.value;
      if (!mIsSparse || value !== 0) {
        recordOrArray[i] = value;
      }
      itResult = it.next();
      i++;
    }
    data = recordOrArray as Record<number, T>|Array<T>;
    return builder(data as Record<number, T>|Array<T>) as MutableMatrix<N, M, T>;
  }
  const iterativeSetter = (matrix: Matrix<N, M, T>, data: T[][]) => {
    for (let i = 0; i < matrix.n; i++) {
      for (let j = 0; j < matrix.m; j++) {
        data[i][j] = matrix.getValue(i, j);
      }
    }
    return data;
  };
  if (mIsSparse) {
    return builder(null) as (SparseRowMutableMatrix<N, M, T> | SparseColumnMutableMatrix<N, M, T>);
  }
  data = [] as T[][];
  iterativeSetter(matrix, data);
  return builder(data as T[][]) as MutableMatrix<N, M, T>;
}

export { SparseMutableColumn, SparseMutableRow, SparseColumnMutableMatrix as SparseColumnMatrix, SparseRowMutableMatrix as SparseRowMatrix, GenericSparseMutableRow, GenericSparseMutableColumn,  createSparseMutableColumn, createSparseMutableRow, toMutable };