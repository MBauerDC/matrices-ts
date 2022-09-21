"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Id = exports.ElementaryRowOperations = exports.AddScaledRow = exports.ScaleRow = exports.SwapRows = exports.reducedRowEchelonForm = exports.power = exports.cofactor = exports.determinant = exports.trace = exports.dotProduct = void 0;
const matrix_1 = require("./matrix");
const sparse_1 = require("./sparse");
function dotProduct(a, b) {
    let result = 0;
    const aIsColumn = a.m === 1;
    const bIsColumn = b.m === 1;
    const aSize = aIsColumn ? a.n : a.m;
    const bSize = bIsColumn ? b.n : b.m;
    if (aSize !== bSize) {
        throw new Error("Cannot calculate dot product of vectors of different sizes");
    }
    const aGetter = aIsColumn ? (i) => a.getValue(i, 0) : (i) => a.getValue(0, i);
    const bGetter = bIsColumn ? (i) => b.getValue(i, 0) : (i) => b.getValue(0, i);
    for (let i = 0; i < aSize; i++) {
        result = (0, matrix_1.matrixContentAdder)(result, (0, matrix_1.matrixContentMultiplier)(aGetter(i), bGetter(i)));
    }
    return result;
}
exports.dotProduct = dotProduct;
function trace(matrix) {
    let result = 0;
    for (let i = 0; i < matrix.n; i++) {
        result = (result + matrix.getValue(i, i));
    }
    return result;
}
exports.trace = trace;
function determinant(matrix) {
    if (matrix.n === 1) {
        return matrix.getValue(0, 0);
    }
    if (matrix.n === 2) {
        return (matrix.getValue(0, 0) * matrix.getValue(1, 1)) - (matrix.getValue(0, 1) * matrix.getValue(1, 0));
    }
    let result = 0;
    for (let i = 0; i < matrix.n; i++) {
        result = (result + (matrix.getValue(i, 0) * this.cofactor(matrix, i, 0)));
    }
    return result;
}
exports.determinant = determinant;
function cofactor(matrix, i, j) {
    return (Math.pow(-1, i + j) * this.determinant(matrix.withoutRow(i).withoutColumn(j)));
}
exports.cofactor = cofactor;
function power(matrix, p) {
    if (p < 2) {
        return matrix;
    }
    let result = matrix;
    for (let i = 2; i <= p; i++) {
        result = result.getMultiplication(matrix);
    }
    return result;
}
exports.power = power;
class SwapRows {
    i;
    j;
    dimension;
    memoizedTransformationMatrix;
    constructor(i, j, dimension) {
        this.i = i;
        this.j = j;
        this.dimension = dimension;
        if (dimension <= i || dimension <= j) {
            throw new Error('Dimension and indices are incompatible.');
        }
        const rows = [];
        for (let k = 0; k < dimension; k++) {
            if (k === i) {
                rows.push(new sparse_1.GenericSparseRow({ [j]: 1 }, dimension));
            }
            else if (k === j) {
                rows.push(new sparse_1.GenericSparseRow({ [i]: 1 }, dimension));
            }
            else {
                rows.push(new sparse_1.GenericSparseRow({ [k]: 1 }, dimension));
            }
        }
        this.memoizedTransformationMatrix = new matrix_1.GenericMatrix(null, rows, null, dimension, dimension);
    }
    getTransformationMatrix() {
        return this.memoizedTransformationMatrix;
    }
    apply(matrix) {
        return this.getTransformationMatrix().getMultiplication(matrix);
    }
}
exports.SwapRows = SwapRows;
class ScaleRow {
    i;
    factor;
    dimension;
    memoizedTransformationMatrix;
    constructor(i, factor, dimension) {
        this.i = i;
        this.factor = factor;
        this.dimension = dimension;
        if (dimension <= i) {
            throw new Error('Dimension and indices are incompatible.');
        }
        const rows = [];
        for (let k = 0; k < dimension; k++) {
            if (k === i) {
                rows.push(new sparse_1.GenericSparseRow({ [i]: factor }, dimension));
            }
            else {
                rows.push(new sparse_1.GenericSparseRow({ [k]: 1 }, dimension));
            }
        }
        this.memoizedTransformationMatrix = new matrix_1.GenericMatrix(null, rows, null, dimension, dimension);
    }
    getTransformationMatrix() {
        return this.memoizedTransformationMatrix;
    }
    apply(matrix) {
        return this.getTransformationMatrix().getMultiplication(matrix);
    }
    withFactor(factor) {
        return new ScaleRow(this.i, factor, this.dimension);
    }
}
exports.ScaleRow = ScaleRow;
class AddScaledRow {
    i;
    j;
    factor;
    dimension;
    memoizedTransformationMatrix;
    constructor(i, j, factor, dimension) {
        this.i = i;
        this.j = j;
        this.factor = factor;
        this.dimension = dimension;
        if (dimension <= i || dimension <= j) {
            throw new Error('Dimension and indices are incompatible.');
        }
        const rows = [];
        for (let k = 0; k < dimension; k++) {
            if (k === i) {
                rows.push(new sparse_1.GenericSparseRow({ [i]: 1, [j]: factor }, dimension));
            }
            else {
                rows.push(new sparse_1.GenericSparseRow({ [k]: 1 }, dimension));
            }
        }
        this.memoizedTransformationMatrix = new matrix_1.GenericMatrix(null, rows, null, dimension, dimension);
    }
    getTransformationMatrix() {
        return this.memoizedTransformationMatrix;
    }
    apply(matrix) {
        return this.getTransformationMatrix().getMultiplication(matrix);
    }
    withFactor(factor) {
        return new AddScaledRow(this.i, this.j, factor, this.dimension);
    }
}
exports.AddScaledRow = AddScaledRow;
class ElementaryRowOperations {
    static memo = {};
    static getSwapOperation(i, j, dimension) {
        const key = `swap(${i}, ${j}, ${dimension})`;
        if (this.memo[key]) {
            return this.memo[key];
        }
        const operation = new SwapRows(i, j, dimension);
        this.memo[key] = operation;
        return operation;
    }
    static swap(matrix, i, j) {
        const key = `swap(${i}, ${j}, ${matrix.n})`;
        if (this.memo[key]) {
            return this.memo[key].apply(matrix);
        }
        const operation = new SwapRows(i, j, matrix.n);
        this.memo[key] = operation;
        return operation.apply(matrix);
    }
    static getScaleOperation(i, factor, dimension) {
        const key = `scale(${i}, ${dimension})`;
        if (this.memo[key]) {
            return this.memo[key];
        }
        const operation = new ScaleRow(i, 1, dimension);
        this.memo[key] = operation;
        return operation.withFactor(factor);
    }
    static scale(matrix, i, factor) {
        const key = `scale(${i}, ${matrix.n})`;
        if (this.memo[key]) {
            return this.memo[key].withFactor(factor).apply(matrix);
        }
        const operation = new ScaleRow(i, 1, matrix.n);
        this.memo[key] = operation;
        return operation.withFactor(factor).apply(matrix);
    }
    static getAddScaledOperation(i, j, factor, dimension) {
        const key = `addScaled(${i}, ${j}, ${dimension})`;
        if (this.memo[key]) {
            return this.memo[key];
        }
        const operation = new AddScaledRow(i, j, 1, dimension);
        this.memo[key] = operation;
        return operation.withFactor(factor);
    }
    static addScaled(matrix, i, j, factor) {
        const key = `addScaled(${i}, ${j}, ${matrix.n})`;
        if (this.memo[key]) {
            return this.memo[key].withFactor(factor).apply(matrix);
        }
        const operation = new AddScaledRow(i, j, 1, matrix.n);
        this.memo[key] = operation;
        return operation.withFactor(factor).apply(matrix);
    }
}
exports.ElementaryRowOperations = ElementaryRowOperations;
function reducedRowEchelonForm(matrix) {
    const rowCount = matrix.n;
    const columnCount = matrix.m;
    const rows = [];
    for (let i = 0; i < rowCount; i++) {
        rows.push(matrix.getRow(i));
    }
    let result = matrix;
    let pivotColumn = 0;
    for (let r = 0; r < rowCount; r++) {
        if (pivotColumn >= columnCount) {
            break;
        }
        let i = r;
        while (rows[i].getValue(0, pivotColumn) === 0) {
            i = i + 1;
            if (i === rowCount) {
                i = r;
                pivotColumn = pivotColumn + 1;
                if (pivotColumn === columnCount) {
                    break;
                }
            }
        }
        if (i !== r) {
            result = ElementaryRowOperations.swap(result, i, r);
        }
        result = ElementaryRowOperations.scale(result, r, 1 / result.getValue(r, pivotColumn));
        result = result.withValue(r, pivotColumn, 1);
        for (let j = 0; j < rowCount; j++) {
            if (j !== r) {
                result = ElementaryRowOperations.addScaled(result, j, r, -result.getValue(j, pivotColumn));
            }
        }
        pivotColumn = pivotColumn + 1;
    }
    return result;
}
exports.reducedRowEchelonForm = reducedRowEchelonForm;
function id(n) {
    const rows = [];
    for (let i = 0; i < n; i++) {
        const row = new sparse_1.GenericSparseRow({ [i]: 1 }, n);
        rows.push(row);
    }
    return new matrix_1.GenericMatrix(null, rows, null, n, n);
}
class Id {
    static memoized = new Map();
    static of(n) {
        if (Id.memoized.has(n)) {
            return Id.memoized.get(n);
        }
        const matrix = id(n);
        Id.memoized.set(n, matrix);
        return matrix;
    }
}
exports.Id = Id;
