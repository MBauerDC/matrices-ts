import { Column, Dimension, GenericMatrix, Matrix, MatrixContent, matrixContentAdder, matrixContentMultiplier, matrixContentSubtractor, Row } from "./matrix";

interface MutableMatrix<N extends Dimension, M extends Dimension, F extends MatrixContent> extends Matrix<N, M, F> {
    setValue(i: number, j: number, newValue: F): void;
    add(other: Matrix<N,M,F>): void;
    addScalar(other: F): void;
    subtract(other: Matrix<N,M,F>): void;
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

class GenericMutableMatrix<N extends Dimension, M extends Dimension, T extends MatrixContent> extends GenericMatrix<N, M, T> implements MutableMatrix<N, M, T> {

    constructor(
        arrData: T[][] | null,
        rowData: MutableRow<M, T>[] | null,
        columnData: MutableColumn<N, T>[] | null,
        n: N,
        m: M
    ) {
        super(arrData, rowData as Row<M, T>[], columnData as Column<N, T>[], n, m);
    }

    public setValue(row: number, col: number, value: T): void {
      this.referenceData.setValue(row, col, value);
    }
    
    public getMultiplication<O extends number>(right: Matrix<M, O, T>): MutableMatrix<N, O, T> {
      return super.getMultiplication(right) as MutableMatrix<N, O, T>;
    }
  
    public getTranspose(): MutableMatrix<M, N, T> {
      return super.getTranspose() as MutableMatrix<M, N, T>;
    }
  
    public withAdded(other: Matrix<N, M, T>): MutableMatrix<N, M, T> {
      return super.withAdded(other) as MutableMatrix<N, M, T>;
    }
  
    public withAddedScalar(other: T): MutableMatrix<N, M, T> {
      return super.withAddedScalar(other) as MutableMatrix<N, M, T>;
    }
  
    public withSubtracted(other: Matrix<N, M, T>): MutableMatrix<N, M, T> {
      return super.withSubtracted(other) as MutableMatrix<N, M, T>;
    }
  
    public withSubtractedScalar(other: T): MutableMatrix<N, M, T> {
      return super.withSubtractedScalar(other) as MutableMatrix<N, M, T>;
    }
  
    public getScaled(other: T): MutableMatrix<N, M, T> {
      return super.getScaled(other) as MutableMatrix<N, M, T>;
    }
  
    public getRow(i: number): MutableRow<M, T> {
      return super.getRow(i) as MutableRow<M, T>;
    }
  
    public getColumn(j: number): MutableColumn<N, T> {
      return super.getColumn(j) as MutableColumn<N, T>;
    }
  
    public withAddedRow<O extends Dimension>(newRow: Row<M, T>, atIdx: number): MutableMatrix<O, M, T> {
      return super.withAddedRow(newRow, atIdx) as MutableMatrix<O, M, T>;
    }
  
    public withAddedColumn<O extends Dimension>(newColumn: Column<N, T>, atIdx: number): MutableMatrix<N, O, T> {
      return super.withAddedColumn(newColumn, atIdx) as MutableMatrix<N, O, T>;
    }
  
    public withoutRow<O extends Dimension>(atIdx: number): MutableMatrix<O, M, T> {
      return super.withoutRow(atIdx) as MutableMatrix<O, M, T>;
    }
  
    public withoutColumn<O extends Dimension>(atIdx: number): MutableMatrix<N, O, T> {
      return super.withoutColumn(atIdx) as MutableMatrix<N, O, T>;
    }
  
    public withValue(i: number, j: number, value: T): MutableMatrix<N, M, T> {
      this.setValue(i, j, value);
      return this;
    }
  
    public mapped<G extends MatrixContent>(f: (value: T) => G): MutableMatrix<N, M, G> {
      return super.mapped(f) as MutableMatrix<N, M, G>;
    }
  
    public add(other: Matrix<N, M, T>): void {
      for (let i = 0; i < this.n; i++) {
        for (let j = 0; j < this.m; j++) {
          const otherVal = other.getValue(i, j);
          if (0 !== otherVal) {
            this.referenceData.setValue(
              i, 
              j, 
              matrixContentAdder(this.referenceData.getValue(i, j), otherVal) as T
            );
          }
        }
      }
    }
    
    public addScalar(other: T): void {
      if (other !== 0) {
        for (let i = 0; i < this.n; i++) {
          for (let j = 0; j < this.m; j++) {
            this.referenceData.setValue(
              i, 
              j, 
              matrixContentAdder(this.referenceData.getValue(i, j), other) as T
            );
          }
        }
      }
    }
  
    public subtract(other: Matrix<N, M, T>): void {
      for (let i = 0; i < this.n; i++) {
        for (let j = 0; j < this.m; j++) {
          const otherVal = other.getValue(i, j);
          if (0 !== otherVal) {
            this.referenceData.setValue(
              i, 
              j, 
              matrixContentSubtractor(this.referenceData.getValue(i, j), otherVal) as T
            );
          }
        }
      }
    }
    
    public subtractScalar(other: T): void {
      if (other !== 0) {
        for (let i = 0; i < this.n; i++) {
          for (let j = 0; j < this.m; j++) {
            this.referenceData.setValue(
              i, 
              j, 
              matrixContentSubtractor(this.referenceData.getValue(i, j), other) as T
            );
          }
        }
      }
    }
  
    public scale(other: T): void {
      if (other !== 1) {
        for (let i = 0; i < this.n; i++) {
          for (let j = 0; j < this.m; j++) {
            const currVal = this.referenceData.getValue(i, j);
            if (0 !== currVal) {
              this.referenceData.setValue(
                i, 
                j, 
                matrixContentMultiplier(currVal, other) as T
              );
            }
          }
        }
      }
    }
  
    public mapInPlace(mapper: (f: T) => T): void {
      for (let i = 0; i < this.n; i++) {
        for (let j = 0; j < this.m; j++) {
          this.referenceData.setValue(
            i, 
            j, 
            mapper(this.referenceData.getValue(i, j))
          );
        }
      }
    }  
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
    withAddedRow<O extends Dimension = 2>(row: Row<M, T>, atIdx: number): MutableMatrix<O, M, T>;
    withAddedColumn<O extends Dimension>(column: Column<1, T>, atIdx: number): MutableRow<O, T>;
    withoutRow<O extends Dimension = 0>(atIdx: number): MutableMatrix<O, M, T>;
    withoutColumn<O extends Dimension>(atIdx: number): MutableRow<O, T>;
    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G;
};


class GenericMutableRow<M extends Dimension, T extends MatrixContent> extends GenericMutableMatrix<1, M, T> implements MutableRow<M, T> {
  constructor(
    arrData: T[] = [],
    m: M
  ) {
    super([arrData], null, null, 1, m);
  }

  withAdded(other: Row<M, T>): MutableRow<M, T> {
      return super.withAdded(other) as MutableRow<M, T>;
  }

  withAddedScalar(other: T): MutableRow<M, T> {
      return super.withAddedScalar(other) as MutableRow<M, T>;
  }

  withSubtracted(other: Row<M, T>): MutableRow<M, T> {
      return super.withSubtracted(other) as MutableRow<M, T>;
  }

  withSubtractedScalar(other: T): MutableRow<M, T> {
      return super.withSubtractedScalar(other) as MutableRow<M, T>;
  }

  getScaled(other: T): MutableRow<M, T> {
      return super.getScaled(other) as MutableRow<M, T>;
  }

  mapped<F extends MatrixContent>(f: (value: T) => F): MutableRow<M, F> {
      return super.mapped(f) as MutableRow<M, F>;
  }

  public getTranspose(): MutableColumn<M, T> {
    const newData: T[] = [];
    for (let i = 0; i < this.m; i++) {
      newData.push(this.referenceData.getValue(0, i));
    }
    return new GenericMutableColumn(newData, this.m);
  }

  public foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G {
    let acc = init;
    for (let i = 0; i < this.m; i++) {
      acc = f(acc, this.referenceData.getValue(0, i));
    }
    return acc;
  }

  public foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G {
    let acc = init;
    for (let i = this.m - 1; i >= 0; i--) {
      acc = f(acc, this.referenceData.getValue(0, i));
    }
    return acc;
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

  withAddedRow<O extends Dimension = 2>(row: Row<M, T>, atIdx: number): MutableMatrix<O, M, T> {
    return super.withAddedRow(row, atIdx) as MutableMatrix<O, M, T>;
  }

  withAddedColumn<O extends Dimension>(column: Column<1, T>, atIdx: number): MutableRow<O, T> {
    return super.withAddedColumn(column, atIdx) as MutableRow<O, T>;
  }

  withoutRow<O extends Dimension = 0>(atIdx: number): MutableMatrix<O, M, T> {
    return super.withoutRow(atIdx) as MutableMatrix<O, M, T>;
  }

  withoutColumn<O extends Dimension>(atIdx: number): MutableRow<O, T> {
    return super.withoutColumn(atIdx) as MutableRow<O, T>;
  }
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
    withAddedColumn<O extends Dimension = 2>(column: Column<N, T>, atIdx: number): MutableMatrix<N, O, T>;
    withoutRow<O extends Dimension>(atIdx: number): MutableColumn<O, T>;
    withoutColumn<O extends Dimension = 0>(atIdx: number): MutableMatrix<N, O, T>;
    foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G;
    foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G;
}

class GenericMutableColumn<N extends Dimension, T extends MatrixContent> extends GenericMutableMatrix<N, 1, T> implements MutableColumn<N, T> {
    constructor(
        arrData: T[] = [],
        n: N
    ) {
      super(arrData.map((v: T) => [v]), null, null, n, 1);
    }

  withAdded(other: Column<N, T>): MutableColumn<N, T> {
      return super.withAdded(other) as MutableColumn<N, T>;
  }

  withAddedScalar(other: T): MutableColumn<N, T> {
      return super.withAddedScalar(other) as MutableColumn<N, T>;
  }

  withSubtracted(other: Column<N, T>): MutableColumn<N, T> {
      return super.withSubtracted(other) as MutableColumn<N, T>;
  }

  withSubtractedScalar(other: T): MutableColumn<N, T> {
      return super.withSubtractedScalar(other) as MutableColumn<N, T>;
  }

  getScaled(other: T): MutableColumn<N, T> {
      return super.getScaled(other) as MutableColumn<N, T>;
  }

  mapped<G extends MatrixContent>(f: (value: T) => G): MutableColumn<N, G> {
      return super.mapped(f) as MutableColumn<N, G>;
  }

  public getTranspose(): MutableRow<N, T> {
    const newData: T[] = [];
    for (let i = 0; i < this.n; i++) {
      newData.push(this.referenceData.getValue(i, 0));
    }
    return new GenericMutableRow<N, T>(newData, this.n);
  }

  public foldLeft<G extends any>(f: (acc: G, value: T) => G, init: G): G {
    let acc = init;
    for (let i = 0; i < this.n; i++) {
      acc = f(acc, this.referenceData.getValue(i, 0));
    }
    return acc;
  }

  public foldRight<G extends any>(f: (acc: G, value: T) => G, init: G): G {
    let acc = init;
    for (let i = this.n - 1; i >= 0; i--) {
      acc = f(acc, this.referenceData.getValue(i, 0));
    }
    return acc;
  }

  public getRow(i: number): MutableRow<1, T> {
      if (i < 0 || i >= this.n) {
          throw new Error("Index out of bounds.");
      }
      return new GenericMutableRow([this.referenceData.getValue(i, 0)], 1);
  }

  public getColumn(j: number): MutableColumn<N, T> {
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

  withAddedRow<O extends Dimension>(row: Row<1, T>, atIdx: number): MutableColumn<O, T> {
    return super.withAddedRow(row, atIdx) as MutableColumn<O, T>;
  }

  withAddedColumn<O extends Dimension = 2>(column: Column<N, T>, atIdx: number): MutableMatrix<N, O, T> {
    return super.withAddedColumn(column, atIdx) as MutableMatrix<N, O, T>;
  }

  withoutRow<O extends Dimension>(atIdx: number): MutableColumn<O, T> {
    return super.withoutRow(atIdx) as MutableColumn<O, T>;
  }

  withoutColumn<O extends Dimension = 0>(atIdx: number): MutableMatrix<N, O, T> {
    return super.withoutColumn(atIdx) as MutableMatrix<N, O, T>;
  }

}

export { MutableMatrix, GenericMutableMatrix, MutableRow, GenericMutableRow, MutableColumn, GenericMutableColumn };