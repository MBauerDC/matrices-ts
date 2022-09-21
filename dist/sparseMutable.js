"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMutable = exports.createSparseMutableRow = exports.createSparseMutableColumn = exports.GenericSparseMutableColumn = exports.GenericSparseMutableRow = exports.SparseRowMutableMatrix = exports.SparseColumnMutableMatrix = void 0;
const matrix_1 = require("./matrix");
const mutable_1 = require("./mutable");
const sparse_1 = require("./sparse");
function createSparseMutableRow(sparseData, m) {
    return new GenericSparseMutableRow(sparseData, m);
}
exports.createSparseMutableRow = createSparseMutableRow;
function createSparseMutableColumn(sparseData, n) {
    return new GenericSparseMutableColumn(sparseData, n);
}
exports.createSparseMutableColumn = createSparseMutableColumn;
;
;
class GenericSparseMutableRow extends sparse_1.GenericSparseRow {
    sparseData;
    m;
    constructor(sparseData, m) {
        super(sparseData, m);
        this.sparseData = sparseData;
        this.m = m;
    }
    getTranspose() {
        return createSparseMutableColumn(this.sparseData, this.m);
    }
    getRow(i) {
        if (i !== 0) {
            throw new Error('Invalid row');
        }
        return this;
    }
    getColumn(idx) {
        return (0, sparse_1.columnToSparseColumn)(super.getColumn(j));
    }
    getMultiplication(right) {
        return super.getMultiplication(right);
    }
    getScaled(other) {
        return super.getScaled(other);
    }
    withValue(row, column, value) {
        return super.withValue(row, column, value);
    }
    withAdded(other) {
        return super.withAdded(other);
    }
    withAddedScalar(other) {
        return super.withAddedScalar(other);
    }
    withSubtracted(other) {
        return super.withSubtracted(other);
    }
    withSubtractedScalar(other) {
        return super.withSubtractedScalar(other);
    }
    mapped(f) {
        return super.mapped(f);
    }
    setValue(i, j, newValue) {
        if (i !== 0) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        this.sparseData[j] = newValue;
    }
    add(other) {
        for (let j = 0; j < this.m; j++) {
            const currVal = (this.sparseData[j] || 0);
            const otherVal = other.getValue(0, j);
            const newVal = (0, matrix_1.matrixContentAdder)(currVal, otherVal);
            if (newVal !== currVal) {
                this.sparseData[j] = newVal;
            }
        }
    }
    addScalar(other) {
        if (other !== 0) {
            for (const [col, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(col)] = (0, matrix_1.matrixContentAdder)(value, other);
            }
        }
    }
    subtract(other) {
        for (let j = 0; j < this.m; j++) {
            const currVal = (this.sparseData[j] || 0);
            const otherVal = other.getValue(0, j);
            const newVal = (0, matrix_1.matrixContentSubtractor)(currVal, otherVal);
            if (newVal !== currVal) {
                this.sparseData[j] = newVal;
            }
        }
    }
    subtractScalar(other) {
        if (other !== 0) {
            for (const [col, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(col)] = (0, matrix_1.matrixContentSubtractor)(value, other);
            }
        }
    }
    scale(other) {
        for (const [col, value] of Object.entries(this.sparseData)) {
            this.sparseData[parseInt(col)] = (0, matrix_1.matrixContentMultiplier)(value, other);
        }
    }
    mapInPlace(mapper) {
        for (const [col, value] of Object.entries(this.sparseData)) {
            const newVal = mapper(value);
            if (newVal !== value) {
                this.sparseData[parseInt(col)] = newVal;
            }
        }
    }
    withAddedRow(newRow, atIdx) {
        if (atIdx < 0 || atIdx > 1) {
            throw new Error('Invalid row index');
        }
        const newRows = [];
        for (let i = 0; i <= 1; i++) {
            if (i === atIdx) {
                newRows.push(toMutable((0, sparse_1.rowToSparseRow)(newRow)));
            }
            else {
                newRows.push(this.getRow(i));
            }
        }
        return new SparseRowMutableMatrix(newRows, 2, this.m);
    }
    withAddedColumn(newColumn, atIdx) {
        return super.withAddedColumn(newColumn, atIdx);
    }
    withoutRow(atIdx) {
        return super.withoutRow(atIdx);
    }
    withoutColumn(colIdx) {
        return super.withoutColumn(colIdx);
    }
}
exports.GenericSparseMutableRow = GenericSparseMutableRow;
class GenericSparseMutableColumn extends sparse_1.GenericSparseColumn {
    sparseData;
    n;
    constructor(sparseData, n) {
        super(sparseData, n);
        this.sparseData = sparseData;
        this.n = n;
    }
    getTranspose() {
        return createSparseMutableRow(this.sparseData, this.n);
    }
    getRow(i) {
        return (0, sparse_1.rowToSparseRow)(super.getRow(i));
    }
    getColumn(j) {
        return super.getColumn(j);
    }
    getMultiplication(right) {
        return super.getMultiplication(right);
    }
    getScaled(other) {
        return super.getScaled(other);
    }
    withValue(row, column, value) {
        return super.withValue(row, column, value);
    }
    withAdded(other) {
        return super.withAdded(other);
    }
    withAddedScalar(other) {
        return super.withAddedScalar(other);
    }
    withSubtracted(other) {
        return super.withSubtracted(other);
    }
    withSubtractedScalar(other) {
        return super.withSubtractedScalar(other);
    }
    mapped(mapper) {
        return super.mapped(mapper);
    }
    setValue(i, j, newValue) {
        if (j !== 0) {
            throw new Error('Invalid column.');
        }
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row.');
        }
        this.sparseData[j] = newValue;
    }
    add(other) {
        for (let i = 0; i < this.n; i++) {
            const currVal = (this.sparseData[i] || 0);
            const otherVal = other.getValue(i, 0);
            const newVal = (0, matrix_1.matrixContentAdder)(currVal, otherVal);
            if (newVal !== currVal) {
                this.sparseData[i] = newVal;
            }
        }
    }
    addScalar(other) {
        if (other !== 0) {
            for (const [row, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(row)] = (0, matrix_1.matrixContentAdder)(value, other);
            }
        }
    }
    subtract(other) {
        for (let i = 0; i < this.n; i++) {
            const currVal = (this.sparseData[i] || 0);
            const otherVal = other.getValue(i, 0);
            const newVal = (0, matrix_1.matrixContentSubtractor)(currVal, otherVal);
            if (newVal !== currVal) {
                this.sparseData[i] = newVal;
            }
        }
    }
    subtractScalar(other) {
        if (other !== 0) {
            for (const [row, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(row)] = (0, matrix_1.matrixContentSubtractor)(value, other);
            }
        }
    }
    scale(other) {
        if (other !== 1) {
            for (const [row, value] of Object.entries(this.sparseData)) {
                this.sparseData[parseInt(row)] = (0, matrix_1.matrixContentMultiplier)(value, other);
            }
        }
    }
    mapInPlace(mapper) {
        for (const [row, value] of Object.entries(this.sparseData)) {
            this.sparseData[parseInt(row)] = mapper(value);
        }
    }
    withAddedRow(newRow, atIdx) {
        return super.withAddedRow(newRow, atIdx);
    }
    withAddedColumn(newColumn, atIdx) {
        if (atIdx < 0 || atIdx > 1) {
            throw new Error('Invalid index.');
        }
        return atIdx === 0 ?
            new SparseColumnMutableMatrix([toMutable((0, sparse_1.columnToSparseColumn)(newColumn)), this], this.n, 2) :
            new SparseColumnMutableMatrix([this, toMutable((0, sparse_1.columnToSparseColumn)(newColumn))], this.n, 2);
    }
    withoutRow(atIdx) {
        return super.withoutRow(atIdx);
    }
    withoutColumn(atIdx) {
        return super.withoutColumn(atIdx);
    }
}
exports.GenericSparseMutableColumn = GenericSparseMutableColumn;
class SparseRowMutableMatrix extends sparse_1.SparseRowImmutableMatrix {
    rows;
    n;
    m;
    constructor(rows, n, m) {
        super(rows, n, m);
        this.rows = rows;
        this.n = n;
        this.m = m;
    }
    getTranspose() {
        return super.getTranspose();
    }
    getRow(i) {
        return super.getRow(i);
    }
    getColumn(j) {
        return super.getColumn(j);
    }
    setValue(i, j, newValue) {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        this.rows[i].setValue(0, j, newValue);
    }
    add(other) {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].add(other.getRow(i));
        }
    }
    addScalar(other) {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].addScalar(other);
        }
    }
    subtract(other) {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].subtract(other.getRow(i));
        }
    }
    subtractScalar(other) {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].subtractScalar(other);
        }
    }
    scale(other) {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].scale(other);
        }
    }
    mapInPlace(mapper) {
        for (let i = 0; i < this.n; i++) {
            this.rows[i].mapInPlace(mapper);
        }
    }
    withAddedRow(newRow, atIdx) {
        return super.withAddedRow(newRow, atIdx);
    }
    withAddedColumn(newColumn, atIdx) {
        return super.withAddedColumn(newColumn, atIdx);
    }
    withoutRow(atIdx) {
        return super.withoutRow(atIdx);
    }
    withoutColumn(atIdx) {
        return super.withoutColumn(atIdx);
    }
    getScaled(other) {
        const newRows = this.rows.map(row => row.getScaled(other));
        return new SparseRowMutableMatrix(newRows, this.n, this.m);
    }
}
exports.SparseRowMutableMatrix = SparseRowMutableMatrix;
class SparseColumnMutableMatrix extends sparse_1.SparseColumnImmutableMatrix {
    columns;
    n;
    m;
    constructor(columns, n, m) {
        super(columns, n, m);
        this.columns = columns;
        this.n = n;
        this.m = m;
    }
    getTranspose() {
        return super.getTranspose();
    }
    getRow(i) {
        return super.getRow(i);
    }
    getColumn(j) {
        return super.getColumn(j);
    }
    setValue(i, j, newValue) {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        this.columns[j].setValue(i, 0, newValue);
    }
    add(other) {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].add(other.getColumn(j));
        }
    }
    addScalar(other) {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].addScalar(other);
        }
    }
    subtract(other) {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].subtract(other.getColumn(j));
        }
    }
    subtractScalar(other) {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].subtractScalar(other);
        }
    }
    scale(other) {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].scale(other);
        }
    }
    mapInPlace(mapper) {
        for (let j = 0; j < this.m; j++) {
            this.columns[j].mapInPlace(mapper);
        }
    }
    withAddedRow(newRow, atIdx) {
        return super.withAddedRow(newRow, atIdx);
    }
    withAddedColumn(newColumn, atIdx) {
        return super.withAddedColumn(newColumn, atIdx);
    }
    withoutRow(atIdx) {
        return super.withoutRow(atIdx);
    }
    withoutColumn(atIdx) {
        return super.withoutColumn(atIdx);
    }
    getScaled(other) {
        const newCols = this.columns.map(col => col.getScaled(other));
        return new SparseColumnMutableMatrix(newCols, this.n, this.m);
    }
}
exports.SparseColumnMutableMatrix = SparseColumnMutableMatrix;
function isSparse(m) {
    return m.hasOwnProperty("isSparse");
}
function isSparseRow(m) {
    return isSparse(m) && m.n === 1;
}
function isSparseColumn(m) {
    return isSparse(m) && m.m === 1;
}
function toMutable(matrix) {
    const [isRow, isColumn, mIsSparse] = [matrix.n === 1, matrix.m === 1, isSparse(matrix)];
    const builder = mIsSparse ?
        (isRow || isColumn) ?
            (data) => isRow ? createSparseMutableRow(data, matrix.m) : createSparseMutableColumn(data, matrix.n) :
            (data) => matrix :
        (data) => new mutable_1.GenericMutableMatrix(data, null, null, matrix.n, matrix.m);
    let data = null;
    if (isRow || isColumn) {
        const recordOrArray = mIsSparse ? {} : [];
        const it = isRow ? matrix.generateRow(0) : matrix.generateColumn(0);
        let itResult = it.next();
        let i = 0;
        while (!itResult.done) {
            const value = itResult.value;
            if (!mIsSparse || value !== 0) {
                recordOrArray[i] = value;
            }
            itResult = it.next();
            i++;
        }
        data = recordOrArray;
        return builder(data);
    }
    const iterativeSetter = (matrix, data) => {
        for (let i = 0; i < matrix.n; i++) {
            for (let j = 0; j < matrix.m; j++) {
                data[i][j] = matrix.getValue(i, j);
            }
        }
        return data;
    };
    if (mIsSparse) {
        return builder(null);
    }
    data = [];
    iterativeSetter(matrix, data);
    return builder(data);
}
exports.toMutable = toMutable;
