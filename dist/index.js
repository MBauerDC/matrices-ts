"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
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
__exportStar(require("./matrix"), exports);
__exportStar(require("./mutable"), exports);
__exportStar(require("./sparse"), exports);
__exportStar(require("./sparseMutable"), exports);
