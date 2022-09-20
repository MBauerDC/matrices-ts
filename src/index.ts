import * as LinearAlgebra from "./linearAlgebra";
import * as Matrix from "./matrix";
import * as MutableMatrix from "./mutable";
import * as SparseMatrix from "./sparse";
import * as SparseMutableMatrix from "./sparseMutable";
/*
console.log("Hello, world!");

type FunctionTiming = <T extends any|void>(fn: () => T) => [T, number];
const fnTimer: FunctionTiming = <T extends any|void>(fn) => {
    const start = performance.now();
    const result: T = fn();
    const end = performance.now();
    return [result, end - start];
};

const createSparseRandomRow = <D extends Matrix.Dimension>(rowLength: D, density: number, rangeMin: number, rangeMax: number) => {
    const rangeIsIntegers = Number.isInteger(rangeMin) && Number.isInteger(rangeMax);
    const limitedDensity = Math.max(1, Math.min(density, 0));
    const exampleSparseData: Record<number, number> = {};
    const randomNumberBetween = (min: number, max: number) => Math.random() * (max - min + 1) + min;
    const randomIntBetween = (min: number, max: number) => Math.floor(randomNumberBetween(min, max));
    const randomOnesIdxs = Array.from({length: Math.floor(rowLength * limitedDensity)}, () => randomIntBetween(0, rowLength - 1));
    for (const randInt of randomOnesIdxs) {
        exampleSparseData[randInt] = rangeIsIntegers ? randomIntBetween(rangeMin, rangeMax) : randomNumberBetween(rangeMin, rangeMax);
    }
    return new SparseMutableMatrix.GenericSparseMutableRow<D, number>(exampleSparseData, rowLength);
};

const initialization: () => [SparseMutableMatrix.SparseRowMutableMatrix<800, 1000, number>, SparseMutableMatrix.SparseRowMutableMatrix<1000, 400, number>] = () => {
  const rows: SparseMutableMatrix.SparseMutableRow<1000, number>[] = Array.from({length: 800}, () => createSparseRandomRow<1000>(1000, 0.05, -1000, 1000));
  const matrix = new SparseMutableMatrix.SparseRowMutableMatrix<800, 1000, number>(rows, 800, 1000);
  const rows2: SparseMutableMatrix.SparseMutableRow<400, number>[] = Array.from({length: 1000}, () => createSparseRandomRow<400>(400, 0.05, -1000, 1000));
  const matrix2 = new SparseMutableMatrix.SparseRowMutableMatrix<1000, 400, number>(rows2, 1000, 400);
  return [matrix, matrix2];
}
const result1 = fnTimer(initialization);
const matrix1: SparseMutableMatrix.SparseRowMutableMatrix<800, 1000, number> = result1[0][0];
const matrix2: SparseMutableMatrix.SparseRowMutableMatrix<1000, 400, number> = result1[0][1];
const initializationDuration:number = result1[1];
const [multiplicationResult, multiplicationDuration] = fnTimer(() => Matrix.multiplyMatrices(matrix1, matrix2));
console.log(`Time (ms) initialization: ${initializationDuration}. Time (ms) multiplication: ${multiplicationDuration}`);
*/
export * from "./matrix";
export * from "./mutable";
export * from "./sparse";
export * from "./sparseMutable";
