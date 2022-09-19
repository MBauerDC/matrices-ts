import { GenericMutableMatrix, MutableColumn, MutableMatrix, MutableRow } from "./mutable";

type Dimension = number;
type MatrixContent = number|Array<MatrixContent>|Matrix<Dimension, Dimension, MatrixContent>;

type Adder<T extends MatrixContent> = (a: T, b: T) => T;
type Subtractor<T extends MatrixContent> = (a: T, b: T) => T;
type Multiplier<T extends MatrixContent> = (a: T, b: T) => T;
type Scaler<T extends MatrixContent> = (a: T, s: number) => T;

const numberAdder: Adder<number> = (a: number, b: number) => a + b;
const arrayAdder: Adder<Array<MatrixContent>> = <T extends MatrixContent>(a: Array<T>, b: Array<T>) => { a.push(...b); return a};
const matrixAdder: Adder<Matrix<Dimension, Dimension, MatrixContent>> = <N extends Dimension, M extends Dimension, T extends MatrixContent>(a: Matrix<N, M, T>, b: Matrix<N, M, T>) => a.withAdded(b);

const numberSubtractor: Subtractor<number> = (a: number, b: number) => a - b;
const arraySubtractor: Subtractor<Array<MatrixContent>> = <T extends MatrixContent>(a: Array<T>, b: Array<T>) => { const result = a.filter(x => !b.includes(x)); return result; };
const matrixSubtractor: Subtractor<Matrix<Dimension, Dimension, MatrixContent>> = <N extends Dimension, M extends Dimension, T extends MatrixContent>(a: Matrix<N, M, T>, b: Matrix<N, M, T>) => a.withSubtracted(b);

const numberMultiplier: Multiplier<number> = (a: number, b: number) => a * b;
const arrayMultiplier: Multiplier<Array<MatrixContent>> = <T extends MatrixContent>(a: Array<T>, b: Array<T>) => { const result: T[][] = []; for (let i = 0; i < a.length; i++) { result.push([a[i] as T, (b[i] ?? null) as T]); } return result; };
const matrixMultiplier: Multiplier<Matrix<Dimension, Dimension, MatrixContent>> = <N extends Dimension, M extends Dimension, O extends Dimension, T extends MatrixContent>(a: Matrix<N, M, T>, b: Matrix<M, O, T>) => a.getMultiplication(b);

const numberScaler: Scaler<number> = (a: number, s: number) => s * a;
const arrayScaler: Scaler<Array<MatrixContent>> = (a: Array<any>, s: number) => { const max = Math.max(0,s); const result: any[] = []; let i = 0; while (i < max) { result[i] = a; i++ } return result; };
const matrixScaler: Scaler<Matrix<Dimension, Dimension, MatrixContent>> = (a: Matrix<Dimension, Dimension, MatrixContent>, s: number) => a.getScaled(s);

const matrixContentAdder: <T extends MatrixContent>(a: T, b: T) => T = <T extends MatrixContent>(a: T, b: T) => {
    const result: MatrixContent = 
      typeof a === "number" ? 
        numberAdder(a, b as number)  : 
        Array.isArray(a) ?
          arrayAdder(a, b as Array<any>) :
          matrixAdder(a, b as Matrix<Dimension, Dimension, MatrixContent>);
    return result as T;
};

const matrixContentSubtractor: <T extends MatrixContent>(a: T, b: T) => T = <T extends MatrixContent>(a: T, b: T) => {
    const result = 
      typeof a === "number" ? 
        numberSubtractor(a, b as number) : 
        Array.isArray(a) ?
          arraySubtractor(a, b as Array<any>) :
          matrixSubtractor(a, b as Matrix<Dimension, Dimension, MatrixContent>);
    return result as T;
};

const matrixContentMultiplier: <T extends MatrixContent>(a: T, b: T) => T = <T extends MatrixContent>(a: T, b: T) => {
    const result = 
      typeof a === "number" ? 
        numberMultiplier(a, b as number) : 
        Array.isArray(a) ?
          arrayMultiplier(a, b as Array<any>) :
          matrixMultiplier(a, b as Matrix<Dimension, Dimension, MatrixContent>);
    return result as T;
};

const matrixContentScaler: <T extends MatrixContent>(a: T, s: number) => T = <T extends MatrixContent>(a: T, s: number) => {
    const result = 
      typeof a === "number" ? 
        numberScaler(a, s as number) : 
        Array.isArray(a) ?
          arrayScaler(a, s) :
          matrixScaler(a, s);
    return result as T;
};


interface Matrix<N extends Dimension, M extends Dimension, F extends MatrixContent> extends Iterable<F> {
    readonly n: N;
    readonly m: M;
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

    //If matrix is Nx1 or 1xM or 1x1, this will return a scalar - otherwise it will throw an error
    at(index: number): F;
}

type InternalMutableMatrixData<N extends Dimension, M extends Dimension, T extends MatrixContent> = {
            getValue(i: number, j: number): T,
            setValue(i: number, j: number, newValue: T): void,
            withNewValue(i: number, j: number, newValue: T): T[][]|Row<M, T>[]|Column<N, T>[],
            at(i: number): T[]|Row<M, T>|Column<N, T>
        };

class GenericMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> implements Matrix<N, M, T> {
  
    protected referenceData: InternalMutableMatrixData<N, M, T>;
    
    protected wrapArrayData(arrData: T[][], n: N, m: M): InternalMutableMatrixData<N, M, T> {
        return { 
                getValue(i: number, j: number): T {
                    if (i >= n || i < 0 || j >= m || j < 0) {
                        throw new Error('Invalid matrix index.');
                    }
                    return arrData[i][j];
                },
                setValue(i: number, j: number, newValue: T): void {
                    if (i >= n || i < 0 || j >= m || j < 0) {
                        throw new Error('Invalid matrix index.');
                    }
                    arrData[i][j] = newValue;
                },
                withNewValue(i: number, j: number, newValue: T): T[][] {
                    if (i >= n || i < 0 || j >= m || j < 0) {
                        throw new Error('Invalid matrix index.');
                    }
                    const result = arrData.slice();
                    result[i][j] = newValue;
                    return result;
                },
                at(i: number): T[] {
                    if (i >= n || i < 0) {
                        throw new Error('Invalid row index.');
                    }
                    return arrData[i];
                }
            };
    }

    protected wrapRowData(rowData: Row<M, T>[], n: N, m: M): InternalMutableMatrixData<N, M, T> {
        return { 
            getValue(i: number, j: number): T {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                return rowData[i].getValue(0, j);
            },
            setValue(i: number, j: number, newValue: T): void {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                const newRow = rowData[i].withValue(0, j, newValue);
                rowData[i] = newRow as Row<M, T>;
            },
            withNewValue(i: number, j: number, newValue: T): Row<M, T>[] {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                const result = rowData.slice();
                const newRow = rowData[i].withValue(0, j, newValue);
                result[i] = newRow as Row<M, T>;
                return result;
            },
            at(i: number): Row<M, T> {
                if (i >= n || i < 0) {
                    throw new Error('Invalid row index.');
                }
                return rowData[i];
            }
        };
    }

  protected wrapColumnData(columnData: Column<N, T>[], n: N, m: M): InternalMutableMatrixData<N, M, T> {
    return { 
      getValue(i: number, j: number): T {
        if (i >= n || i < 0 || j >= m || j < 0) {
          throw new Error('Invalid matrix index.');
        }
        return columnData[j].getValue(i,0);
      },
      setValue(i: number, j: number, newValue: T): void {
        if (i >= n || i < 0 || j >= m || j < 0) {
          throw new Error('Invalid matrix index.');
        }
        const newColumn = columnData[j].withValue(0, i, newValue);
        columnData[j] = newColumn as Column<N, T>;
      },
      withNewValue(i: number, j: number, newValue: T): Column<N, T>[] {
        if (i >= n || i < 0 || j >= m || j < 0) {
          throw new Error('Invalid matrix index.');
        }
        const result = columnData.slice();
        const newColumn = columnData[j].withValue(0, i, newValue);
        result[j] = newColumn as Column<N, T>;
        return result;
      },
      at(i: number): Column<N, T> {
        if (i >= m || i < 0) {
          throw new Error('Invalid column index.');
        }
        return columnData[i];
      }
    }
  }
    
  constructor(
    protected arrData: T[][]|null = [],
    protected rowData: Row<M, T>[]|null = [], 
    protected columnData: Column<N, T>[]|null = [],
    public readonly n: N, 
    public readonly m: M
  ) {
    let refData: InternalMutableMatrixData<N, M, T>|null = null;
    if (null !== arrData && arrData.length) {
        refData = this.wrapArrayData(arrData, n, m);
    } else if (null !== rowData && rowData.length === n) {
        refData = this.wrapRowData(rowData, n, m);
    } else if (null !== columnData && columnData.length === m) {
        refData = this.wrapColumnData(columnData, n, m);
    }
    if (null === refData) {
        throw new Error('Invalid data.');
    }
    this.referenceData = refData;
  }

  public getValue(i: number, j: number): T {
    if (i >= this.n || i < 0 || j >= this.m || j < 0) {
        throw new Error('Invalid matrix index.');
    }
    return this.referenceData.getValue(i, j);
  }


  public *generateRow(i: number): Generator<T> {
    if (i >= this.n || i < 0) {
        throw new Error('Invalid row index.');
    }
    for (let j = 0; j < this.m; j++) {
      yield this.referenceData.getValue(i, j);
    }
  }

  public *generateColumn(j: number): Generator<T> {
    if (j >= this.m || j < 0) {
        throw new Error('Invalid column index.');
    }
    for (let i = 0; i < this.n; i++) {
      yield this.referenceData.getValue(i, j);
    }
  }

  public getRow(i: number): Row<M, T> {
    if (i >= this.n || i < 0) {
        throw new Error('Invalid row index.');
    }
    const arr: T[] = [];
    for (let j = 0; j < this.m; j++) {
        arr.push(this.referenceData.getValue(i, j));
    }
    return new GenericRow<M, T>(arr, this.m);
  }

  public getColumn(j: number): Column<N, T> {
    if (j >= this.m || j < 0) {
        throw new Error('Invalid column index.');
    }
    const data: T[] = [];
    for (let i = 0; i < this.n; i++) {
      data.push(this.referenceData.getValue(i, j));
    }
    return new GenericColumn<N, T>(data, this.n);
  }

  public withValue(i: number, j: number, value: T): Matrix<N, M, T> {
    if (i >= this.n || i < 0 || j >= this.m || j < 0) {
      throw new Error('Invalid matrix index.');
    }
    const data: T[][] = [];
    for (let k = 0; k < this.n; k++) {
      const row: T[] = [];
      for (let l = 0; l < this.m; l++) {
        row.push(k === i && l === j ? value : this.referenceData.getValue(k, l));
      }
      data.push(row);
    }
    return new GenericMatrix<N, M, T>(data, null, null, this.n, this.m);
  }

  public withAdded(other: Matrix<N, M, T>): Matrix<N, M, T> {
    const data: T[][] = [];
    for (let i = 0; i < this.n; i++) {
      const row: T[] = [];
      for (let j = 0; j < this.m; j++) {
        row.push(matrixContentAdder(this.referenceData.getValue(i, j), other.getValue(i, j)!) as T);
      }
      data.push(row as T[]);
    }
    return new GenericMatrix<N, M, T>(data, null, null, this.n, this.m);
  }

  public withAddedScalar(other: T): Matrix<N,M,T> {
    const data: T[][] = [];
    for (let i = 0; i < this.n; i++) {
      const row: T[] = [];
      for (let j = 0; j < this.m; j++) {
        row.push(matrixContentAdder(this.referenceData.getValue(i, j), other) as T);
      }
      data.push(row as T[]);
    }
    return new GenericMatrix<N, M, T>(data, null, null, this.n, this.m);
  }

  public withSubtracted(other: Matrix<N, M, T>): Matrix<N, M, T> {
    const data: T[][] = [];
    for (let i = 0; i < this.n; i++) {
      const row: T[] = [];
      for (let j = 0; j < this.m; j++) {
        row.push(matrixContentSubtractor(this.referenceData.getValue(i, j), other.getValue(i,j)!) as T);
      }
      data.push(row as T[]);
    }
    return new GenericMatrix<N, M, T>(data, null, null, this.n, this.m);
  }

  public withSubtractedScalar(other: T): Matrix<N,M,T> {
    const data: T[][] = [];
    for (let i = 0; i < this.n; i++) {
      const row: T[] = [];
      for (let j = 0; j < this.m; j++) {
        row.push(matrixContentSubtractor(this.referenceData.getValue(i, j), other) as T);
      }
      data.push(row as T[]);
    }
    return new GenericMatrix<N, M, T>(data, null, null, this.n, this.m);
  }

  public getMultiplication<O extends Dimension>(right: Matrix<M, O, T>): Matrix<N, O, T> {
    const data: T[][] = [];
    for (let i = 0; i < this.n; i++) {
      const row: T[] = [];
      for (let j = 0; j < right.m; j++) {
        let sum: T = 0 as T;
        for (let k = 0; k < this.m; k++) {
          sum = matrixContentAdder<T>(sum, matrixContentMultiplier<T>(this.referenceData.getValue(i, k), right.getValue(k, j)) as T) as T;
        }
        row.push(sum);
      }
      data.push(row as T[]);
    }
    return new GenericMatrix<N, O, T>(data, null, null, this.n, right.m);
  }

  public getScaled(other: T): Matrix<N, M, T> {
    const data: T[][] = [];
    for (let i = 0; i < this.n; i++) {
      const row : T[] = [];
      for (let j = 0; j < this.m; j++) {
        row.push(matrixContentMultiplier(this.referenceData.getValue(i, j), other) as T);
      }
      data.push(row);
    }
    return new GenericMatrix<N, M, T>(data, null, null, this.n, this.m);
  }

  public getTranspose(): Matrix<M, N, T> {      
    const data: T[][] = [];
    for (let i = 0; i < this.m; i++) {
      const row: T[] = [];
      for (let j = 0; j < this.n; j++) {
        row.push(this.referenceData.getValue(j, i) as T);
      }
      data.push(row);
    }
    return new GenericMatrix<M, N, T>(data, null, null, this.m, this.n);
  }

  public mapped<G extends MatrixContent>(f: (value: T) => G): Matrix<N, M, G> {
    const data: G[][] = [];
    for (let i = 0; i < this.n; i++) {
      const row: G[] = [];
      for (let j = 0; j < this.m; j++) {
        row.push(f(this.referenceData.getValue(i, j)));
      }
      data.push(row);
    }
    return new GenericMatrix<N, M, G>(data, null, null, this.n, this.m);
  }  

  public withAddedRow<O extends Dimension>(newRow: Row<M, T>, atIdx: number): Matrix<O, M, T> {
      const rows: Row<M, T>[] = [];
      for (let i = 0; i < this.n; i++) {
        rows.push(this.getRow(i));
      }
      rows.splice(atIdx, 0, newRow);
      return new GenericMatrix<O, M, T>(null, rows, null, this.n + 1 as O, this.m);
  }

  public withAddedColumn<O extends Dimension>(newColumn: Column<N, T>, atIdx: number): Matrix<N, O, T> {
      const columns: Column<N, T>[] = [];
      for (let i = 0; i < this.m; i++) {
        columns.push(this.getColumn(i));
      }
      columns.splice(atIdx, 0, newColumn);
      return new GenericMatrix<N, O, T>(null, null, columns, this.n, this.m + 1 as O);
  }

  public withoutRow<O extends Dimension>(atIdx: number): Matrix<O, M, T> {
      const rows: Row<M, T>[] = [];
      for (let i = 0; i < this.n; i++) {
        rows.push(this.getRow(i));
      }
      rows.splice(atIdx, 1);
      return new GenericMatrix<O, M, T>(null, rows, null, this.n - 1 as O, this.m);
  }

  public withoutColumn<O extends Dimension>(atIdx: number): Matrix<N, O, T> {
      const columns: Column<N, T>[] = [];
      for (let i = 0; i < this.m; i++) {
        columns.push(this.getColumn(i));
      }
      columns.splice(atIdx, 1);
      return new GenericMatrix<N, O, T>(null, null, columns, this.n, this.m - 1 as O);
  }

  at(index: number): T {
      if (this.n === 1) {
        return this.referenceData.getValue(0, index);
      }
      if (this.m === 1) {
        return this.referenceData.getValue(index, 0);
      }
      throw new Error('Matrix must be Nx1, 1xM or 1x1 to use at().');
  }

  [Symbol.iterator](): Iterator<T> {
    if (this.n === 1) {
      return this.generateRow(0);
    }
    if (this.m === 1) {
      return this.generateColumn(0);
    }
    throw new Error('Matrix must be Nx1, 1xM or 1x1 to use iterator.');
  }
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
};

class GenericRow<M extends Dimension, T extends MatrixContent> extends GenericMatrix<1, M, T> implements Row<M, T> {
    
    constructor(
        arrData: T[] = [],
        m: M
    ) {
      super([arrData], null, null, 1, m);
    }

    public getTranspose(): Column<M, T> {
      const newData: T[] = [];
      for (let i = 0; i < this.m; i++) {
        newData.push(this.referenceData.getValue(0, i));
      }
      return new GenericColumn<M, T>(newData, this.m);
    }

    getRow(i: number): Row<M, T> {
      if (i !== 0) {
        throw new Error(`Row index out of bounds: ${i}`);
      }
      return this;
    }
    
    getColumn(j: number): Column<1, T> {
      if (j < 0 || j >= this.m) {
        throw new Error(`Column index out of bounds: ${j}`);
      }
      return new GenericColumn([this.referenceData.getValue(0, j)], 1);
    }

    withAdded(other: Row<M, T>): Row<M, T> {
        return super.withAdded(other) as Row<M, T>;
    }

    withAddedScalar(other: T): Row<M, T> {
        return super.withAddedScalar(other) as Row<M, T>;
    }

    withSubtracted(other: Row<M, T>): Row<M, T> {
        return super.withSubtracted(other) as Row<M, T>;
    }

    withSubtractedScalar(other: T): Row<M, T> {
        return super.withSubtractedScalar(other) as Row<M, T>;
    }

    getScaled(other: T): Row<M, T> {
        return super.getScaled(other) as Row<M, T>;
    }

    mapped<F extends MatrixContent>(f: (value: T) => F): Row<M, F> {
        return super.mapped(f) as Row<M, F>;
    }

    public at(index: number): T {
        if (index < 0 || index >= this.m) {
            throw new Error("Index out of bounds.");
        }
        const ref =  this.referenceData.at(0);
        return ref instanceof Array ? ref[index] : ref.at(index);
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

    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G {
        let acc = init;
        for (let i = 0; i < this.m; i++) {
            acc = f(acc, this.at(i));
        }
        return acc;
    }

    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G {
        let acc = init;
        for (let i = this.m - 1; i >= 0; i--) {
            acc = f(acc, this.at(i));
        }
        return acc;
    }
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
};


class GenericColumn<N extends Dimension, T extends MatrixContent> extends GenericMatrix<N, 1, T> implements Column<N, T> {
    constructor(
        arrData: T[] = [],
        n: N
    ) {
      super(arrData.map((v: T) => [v]), null, null, n, 1);
    }

    public getTranspose(): Row<N, T> {
      const newData: T[] = [];
      for (let i = 0; i < this.n; i++) {
        newData.push(this.referenceData.getValue(i, 0));
      }
      return new GenericRow<N, T>(newData, this.n);
    }

    withAdded(other: Column<N, T>): Column<N, T> {
        return super.withAdded(other) as Column<N, T>;
    }

    withAddedScalar(other: T): Column<N, T> {
        return super.withAddedScalar(other) as Column<N, T>;
    }

    withSubtracted(other: Column<N, T>): Column<N, T> {
        return super.withSubtracted(other) as Column<N, T>;
    }

    withSubtractedScalar(other: T): Column<N, T> {
        return super.withSubtractedScalar(other) as Column<N, T>;
    }

    getScaled(other: T): Column<N, T> {
        return super.getScaled(other) as Column<N, T>;
    }

    mapped<G extends MatrixContent>(f: (value: T) => G): Column<N, G> {
        return super.mapped(f) as Column<N, G>;
    }

    getRow(i: number): Row<1, T> {
        if (i < 0 || i >= this.n) {
            throw new Error("Index out of bounds.");
        }
        return new GenericRow<1, T>([this.getValue(i, 0)], 1);
    }

    public getColumn(j: number): Column<N, T> {
        if (j !== 0) {
            throw new Error(`Column index out of bounds: ${j}`);
        }
        return this;
    }

    public at(index: number): T {
        if (index < 0 || index >= this.n) {
            throw new Error("Index out of bounds.");
        }
        const ref = this.referenceData.at(index)
        return ref instanceof Array ? ref[0] : ref.at(0);
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

    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G {
      let acc = init;
      for (let i = 0; i < this.n; i++) {
          acc = f(acc, this.at(i));
      }
      return acc;
  }

    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G {
      let acc = init;
      for (let i = this.n - 1; i >= 0; i--) {
          acc = f(acc, this.at(i));
      }
      return acc;
  }
}

export { Dimension, MatrixContent, Matrix, Row, Column, GenericMatrix, GenericRow, GenericColumn, matrixContentAdder, matrixContentSubtractor, matrixContentScaler, matrixContentMultiplier };