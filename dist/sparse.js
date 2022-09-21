"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.columnToSparseColumn = exports.sparseColumnToColumn = exports.rowToSparseRow = exports.sparseRowToRow = exports.createSparseColumn = exports.createSparseRow = exports.SparseColumnImmutableMatrix = exports.SparseRowImmutableMatrix = exports.GenericSparseColumn = exports.GenericSparseRow = void 0;
const matrix_1 = require("./matrix");
;
;
class GenericSparseRow {
    sparseData;
    m;
    isSparse = true;
    n = 1;
    constructor(sparseData, m) {
        this.sparseData = sparseData;
        this.m = m;
    }
    getAsArray() {
        const data = [[]];
        for (let j = 0; j < this.m; j++) {
            data[0].push(this.sparseData[j] || 0);
        }
        return data;
    }
    getSparseData() {
        return this.sparseData;
    }
    getValue(i, j) {
        if (i !== 0) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        return this.sparseData[j] || 0;
    }
    at(index) {
        if (index < 0 || index >= this.m) {
            throw new Error('Invalid column');
        }
        return this.sparseData[index] || 0;
    }
    getTranspose() {
        return createSparseColumn(this.sparseData, this.m);
    }
    *generateRow(i) {
        if (i !== 0) {
            throw new Error('Invalid row');
        }
        for (let j = 0; j < this.m; j++) {
            yield this.sparseData[j] || 0;
        }
    }
    *generateColumn(j) {
        if (j !== 0) {
            throw new Error('Invalid column');
        }
        return this.sparseData[0] || 0;
    }
    getRow(i) {
        if (i !== 0) {
            throw new Error('Invalid row');
        }
        return this;
    }
    getColumn(j) {
        if (j !== 0) {
            throw new Error('Invalid column');
        }
        return new matrix_1.GenericColumn([this.sparseData[0] || 0], 1);
    }
    getMultiplication(right) {
        const data = [];
        for (let j = 0; j < right.m; j++) {
            let sum = 0;
            for (let k = 0; k < right.n; k++) {
                sum = (0, matrix_1.matrixContentAdder)(sum, (0, matrix_1.matrixContentMultiplier)(this.sparseData[k], right.getValue(k, j)));
            }
            data.push(sum);
        }
        return new matrix_1.GenericRow(data, right.m);
    }
    getScaled(other) {
        const data = {};
        for (const [col, value] of Object.entries(this.sparseData)) {
            data[parseInt(col)] = (0, matrix_1.matrixContentMultiplier)(value, other);
        }
        return createSparseRow(data, this.m);
    }
    withValue(row, column, value) {
        if (row !== 0) {
            throw new Error('Invalid row.');
        }
        if (column < 0 || column >= this.m) {
            throw new Error('Invalid column.');
        }
        const data = { ...this.sparseData };
        data[column] = value;
        return new GenericSparseRow(data, this.m);
    }
    withAdded(other) {
        const data = {};
        for (let j = 0; j < this.m; j++) {
            const newVal = (0, matrix_1.matrixContentAdder)(this.sparseData[j] || 0, other.getValue(0, j));
            if (0 < newVal || 0 > newVal) {
                data[j] = newVal;
            }
        }
        return createSparseRow(data, this.m);
    }
    withAddedScalar(other) {
        const data = {};
        for (let j = 0; j < this.m; j++) {
            const newVal = (0, matrix_1.matrixContentAdder)((this.sparseData[j] || 0), other);
            if (0 < newVal || 0 > newVal) {
                data[j] = newVal;
            }
        }
        return createSparseRow(data, this.m);
    }
    withSubtracted(other) {
        const data = {};
        for (let j = 0; j < this.m; j++) {
            const newVal = (0, matrix_1.matrixContentSubtractor)((this.sparseData[j] || 0), other.getValue(0, j));
            if (0 < newVal || 0 > newVal) {
                data[j] = newVal;
            }
        }
        return createSparseRow(data, this.m);
    }
    withSubtractedScalar(other) {
        const newRec = {};
        for (let j = 0; j < this.m; j++) {
            const newVal = (0, matrix_1.matrixContentSubtractor)((this.sparseData[j] || 0), other);
            if (0 < newVal || 0 > newVal) {
                newRec[j] = newVal;
            }
        }
        const newRecWithLength = newRec;
        return createSparseRow(newRecWithLength, this.m);
    }
    mapped(mapper) {
        const data = {};
        for (const [col, value] of Object.entries(this.sparseData)) {
            const newVal = mapper(value);
            data[parseInt(col)] = newVal;
        }
        return createSparseRow(data, this.m);
    }
    withAddedRow(newRow, atIdx) {
        if (atIdx < 0 || atIdx > 1) {
            throw new Error('Invalid row.');
        }
        const newSparseRow = rowToSparseRow(newRow);
        return atIdx == 0 ?
            new SparseRowImmutableMatrix([newSparseRow, this], 2, this.m) :
            new SparseRowImmutableMatrix([this, newSparseRow], 2, this.m);
    }
    withAddedColumn(newColumn, atIdx) {
        if (atIdx < 0 || atIdx > this.m) {
            throw new Error('Invalid column.');
        }
        const valueToAdd = newColumn.getValue(0, 0);
        const sparseData = {};
        const keys = Object.keys(this.sparseData).map(i => parseInt(i)).sort((a, b) => b - a);
        for (const key of keys) {
            if (key >= atIdx) {
                sparseData[key + 1] = this.sparseData[key];
            }
            else {
                sparseData[key] = this.sparseData[key];
            }
        }
        sparseData[atIdx] = valueToAdd;
        const newSparseRow = new GenericSparseRow(sparseData, (this.m + 1));
        return newSparseRow;
    }
    withoutRow(atIdx) {
        if (atIdx !== 0) {
            throw new Error('Invalid row.');
        }
        return new matrix_1.GenericMatrix([], null, null, 0, this.m);
    }
    withoutColumn(atIdx) {
        if (atIdx < 0 || atIdx > this.m) {
            throw new Error('Invalid column.');
        }
        const newSparseData = {};
        const keys = Object.keys(this.sparseData)
            .map(i => parseInt(i)).sort((a, b) => a - b)
            .filter((n, _) => n !== atIdx);
        for (const key of keys) {
            if (key >= atIdx) {
                newSparseData[key + 1] = this.sparseData[key];
            }
            else {
                newSparseData[key] = this.sparseData[key];
            }
        }
        const newSparseRow = new GenericSparseRow(newSparseData, this.m - 1);
        return newSparseRow;
    }
    [Symbol.iterator]() {
        return new class {
            row;
            index = 0;
            constructor(row) {
                this.row = row;
            }
            next() {
                if (this.index < this.row.m) {
                    return { value: this.row.at(this.index++), done: false };
                }
                return { value: null, done: true };
            }
        }(this);
    }
    foldLeft(fn, init) {
        let acc = init;
        for (const value of this) {
            acc = fn(acc, value);
        }
        return acc;
    }
    foldRight(f, init) {
        let acc = init;
        const arr = Array.from(this.generateRow(0));
        for (let i = arr.length - 1; i >= 0; i--) {
            acc = f(acc, arr[i]);
        }
        return acc;
    }
}
exports.GenericSparseRow = GenericSparseRow;
class GenericSparseColumn {
    sparseData;
    n;
    isSparse = true;
    m = 1;
    constructor(sparseData, n) {
        this.sparseData = sparseData;
        this.n = n;
    }
    getAsArray() {
        const arr = [];
        for (let i = 0; i < this.n; i++) {
            arr[i] = [this.sparseData[i] || 0];
        }
        return arr;
    }
    getSparseData() {
        return this.sparseData;
    }
    getValue(i, j) {
        if (j !== 0) {
            throw new Error('Invalid column.');
        }
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row.');
        }
        return this.sparseData[i] || 0;
    }
    at(index) {
        if (index < 0 || index >= this.n) {
            throw new Error('Invalid row.');
        }
        return this.sparseData[index] || 0;
    }
    getTranspose() {
        return createSparseRow(this.sparseData, this.n);
    }
    *generateRow(i) {
        if (i !== 0) {
            throw new Error('Invalid row.');
        }
        return this.sparseData[0] || 0;
    }
    *generateColumn(j) {
        if (j !== 0) {
            throw new Error('Invalid column.');
        }
        for (let i = 0; i < this.n; i++) {
            yield this.sparseData[i] || 0;
        }
    }
    getRow(i) {
        if (i !== 0) {
            throw new Error('Invalid row.');
        }
        return new matrix_1.GenericRow([this.sparseData[0] || 0], 1);
    }
    getColumn(j) {
        if (j !== 0) {
            throw new Error('Invalid column');
        }
        return this;
    }
    getMultiplication(right) {
        const data = [];
        for (let j = 0; j < right.m; j++) {
            let sum = 0;
            for (let k = 0; k < right.n; k++) {
                sum = (0, matrix_1.matrixContentAdder)(sum, (0, matrix_1.matrixContentMultiplier)(this.sparseData[k], right.getValue(k, j)));
            }
            data.push(sum);
        }
        return new matrix_1.GenericMatrix([data], null, null, this.n, right.m);
    }
    getScaled(other) {
        const data = {};
        for (const [col, value] of Object.entries(this.sparseData)) {
            data[parseInt(col)] = (0, matrix_1.matrixContentMultiplier)(value, other);
        }
        return createSparseColumn(data, this.n);
    }
    withValue(row, column, value) {
        if (row < 0 || row >= this.n) {
            throw new Error('Invalid row.');
        }
        if (column !== 0) {
            throw new Error("Invalid column.");
        }
        const data = { ...this.sparseData };
        data[row] = value;
        return createSparseColumn(data, this.n);
    }
    withAdded(other) {
        const data = {};
        for (let j = 0; j < this.n; j++) {
            const newVal = (0, matrix_1.matrixContentAdder)((this.sparseData[j] || 0), other.getValue(j, 0));
            if (0 < newVal || 0 > newVal) {
                data[j] = newVal;
            }
        }
        return createSparseColumn(data, this.n);
    }
    withAddedScalar(other) {
        const data = {};
        for (let j = 0; j < this.n; j++) {
            const newVal = (0, matrix_1.matrixContentAdder)((this.sparseData[j] || 0), other);
            if (0 < newVal || 0 > newVal) {
                data[j] = newVal;
            }
        }
        return createSparseColumn(data, this.n);
    }
    withSubtracted(other) {
        const data = {};
        for (let j = 0; j < this.n; j++) {
            const newVal = (0, matrix_1.matrixContentAdder)((this.sparseData[j] || 0), other.getValue(j, 0));
            if (0 < newVal || 0 > newVal) {
                data[j] = newVal;
            }
        }
        return createSparseColumn(data, this.n);
    }
    withSubtractedScalar(other) {
        const newRec = {};
        for (let j = 0; j < this.n; j++) {
            const newVal = (0, matrix_1.matrixContentAdder)((this.sparseData[j] || 0), other);
            if (0 < newVal || 0 > newVal) {
                newRec[j] = newVal;
            }
        }
        const newRecWithLength = newRec;
        return createSparseColumn(newRecWithLength, this.n);
    }
    mapped(f) {
        const data = {};
        for (const [col, value] of Object.entries(this.sparseData)) {
            data[parseInt(col)] = f(value);
        }
        return createSparseColumn(data, this.n);
    }
    withAddedRow(newRow, atIdx) {
        if (atIdx < 0 || atIdx > this.n) {
            throw new Error('Invalid row.');
        }
        const newSparseData = {};
        const keys = Object.keys(this.sparseData).map(x => parseInt(x)).sort((a, b) => b - a);
        for (const key of keys) {
            if (key < atIdx) {
                newSparseData[key] = this.sparseData[key];
            }
            else {
                newSparseData[key + 1] = this.sparseData[key];
            }
        }
        newSparseData[atIdx] = newRow.getValue(0, 0);
        return createSparseColumn(newSparseData, (this.n + 1));
    }
    withAddedColumn(newColumn, atIdx) {
        if (atIdx < 0 || atIdx > 1) {
            throw new Error('Invalid column.');
        }
        return atIdx === 0 ?
            new SparseColumnImmutableMatrix([columnToSparseColumn(newColumn), this], this.n, 2) :
            new SparseColumnImmutableMatrix([this, columnToSparseColumn(newColumn)], this.n, 2);
    }
    withoutRow(atIdx) {
        if (atIdx < 0 || atIdx >= this.n) {
            throw new Error('Invalid row.');
        }
        const newSparseData = {};
        const keys = Object.keys(this.sparseData).map(x => parseInt(x)).sort((a, b) => a - b);
        for (const key of keys) {
            if (key < atIdx) {
                newSparseData[key] = this.sparseData[key];
            }
            else if (key > atIdx) {
                newSparseData[key - 1] = this.sparseData[key];
            }
        }
        return createSparseColumn(newSparseData, (this.n - 1));
    }
    withoutColumn(atIdx) {
        if (atIdx !== 0) {
            throw new Error('Invalid column.');
        }
        return new SparseRowImmutableMatrix([], 0, 0);
    }
    [Symbol.iterator]() {
        return new class {
            column;
            index = 0;
            constructor(column) {
                this.column = column;
            }
            next() {
                if (this.index < this.column.n) {
                    return { value: this.column.at(this.index++), done: false };
                }
                return { value: null, done: true };
            }
        }(this);
    }
    foldLeft(fn, init) {
        let acc = init;
        for (const value of this) {
            acc = fn(acc, value);
        }
        return acc;
    }
    foldRight(f, init) {
        let acc = init;
        const arr = Array.from(this.generateColumn(0));
        for (let i = arr.length - 1; i >= 0; i--) {
            acc = f(acc, arr[i]);
        }
        return acc;
    }
}
exports.GenericSparseColumn = GenericSparseColumn;
class SparseRowImmutableMatrix {
    rows;
    n;
    m;
    isSparse;
    constructor(rows, n, m) {
        this.rows = rows;
        this.n = n;
        this.m = m;
        if (rows.length !== n) {
            throw new Error('Invalid number of rows');
        }
        this.n = n;
        this.m = m;
    }
    getAsArray() {
        return this.rows.map(row => row.getAsArray()[0]);
    }
    at(idx) {
        if (this.n === 1) {
            return this.getValue(0, idx);
        }
        if (this.m === 1) {
            return this.getValue(idx, 0);
        }
        throw new Error("Matrix must be Nx1, 1xM or 1x1 in order to use the at method.");
    }
    [Symbol.iterator]() {
        if (this.n === 1) {
            return this.getRow(0)[Symbol.iterator]();
        }
        if (this.m === 1) {
            return this.getColumn(0)[Symbol.iterator]();
        }
        throw new Error("Matrix must be Nx1, 1xM or 1x1 in order to use the at method.");
    }
    getValue(i, j) {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        return this.rows[i].getValue(0, j);
    }
    getTranspose() {
        const sparseColumns = [];
        for (let i = 0; i < this.n; i++) {
            sparseColumns.push(new GenericSparseColumn(this.rows[i].getSparseData(), this.m));
        }
        return new SparseColumnImmutableMatrix(sparseColumns, this.m, this.n);
    }
    *generateRow(i) {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        yield* this.rows[i].generateRow(0);
    }
    *generateColumn(j) {
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        for (let i = 0; i < this.n; i++) {
            yield this.rows[i].getValue(0, j);
        }
    }
    getRow(i) {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        return this.rows[i];
    }
    getColumn(j) {
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        const data = [];
        for (let i = 0; i < this.n; i++) {
            data.push(this.rows[i].getValue(0, j));
        }
        return new matrix_1.GenericColumn(data, this.n);
    }
    getMultiplication(right) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            const newRow = {};
            const currRow = this.rows[i];
            const currRowData = currRow.getSparseData();
            for (let j = 0; j < right.m; j++) {
                let sum = 0;
                for (let k = 0; k < right.n; k++) {
                    const leftValue = currRowData[k];
                    const rightValue = right.getValue(k, j);
                    if (leftValue !== 0 && typeof leftValue !== "undefined" && rightValue !== 0 && typeof rightValue !== "undefined") {
                        sum = (0, matrix_1.matrixContentAdder)(sum, (0, matrix_1.matrixContentMultiplier)(leftValue, rightValue));
                        if (sum !== 0) {
                            newRow[j] = sum;
                        }
                    }
                }
            }
            rows.push(new GenericSparseRow(newRow, right.m));
        }
        return new SparseRowImmutableMatrix(rows, this.n, right.m);
    }
    getScaled(other) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].getScaled(other));
        }
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }
    withValue(i, j, value) {
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
    withAdded(other) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withAdded(other.getRow(i)));
        }
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }
    withAddedScalar(other) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withAddedScalar(other));
        }
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }
    withSubtracted(other) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withSubtracted(other.getRow(i)));
        }
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }
    withSubtractedScalar(other) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withSubtractedScalar(other));
        }
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }
    mapped(mapper) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].mapped(mapper));
        }
        return new SparseRowImmutableMatrix(rows, this.n, this.m);
    }
    withAddedRow(newRow, atIdx) {
        const rows = [...this.rows];
        rows.splice(atIdx, 0, newRow);
        return new SparseRowImmutableMatrix(rows, (this.n + 1), this.m);
    }
    withAddedColumn(newColumn, atIdx) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            const valToAdd = newColumn.getValue(i, 0);
            rows.push(this.rows[i].withAddedColumn(new GenericSparseColumn([valToAdd], 1), atIdx));
        }
        return new SparseRowImmutableMatrix(rows, this.n, (this.m + 1));
    }
    withoutRow(atIdx) {
        const rows = [...this.rows];
        rows.splice(atIdx, 1);
        return new SparseRowImmutableMatrix(rows, (this.n - 1), this.m);
    }
    withoutColumn(atIdx) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.rows[i].withoutColumn(atIdx));
        }
        return new SparseRowImmutableMatrix(rows, this.n, (this.m - 1));
    }
}
exports.SparseRowImmutableMatrix = SparseRowImmutableMatrix;
function createSparseRow(sparseData, m) {
    return new GenericSparseRow(sparseData, m);
}
exports.createSparseRow = createSparseRow;
function sparseRowToRow(sparseRow) {
    return new matrix_1.GenericRow(Array.from(sparseRow.generateRow(0)), sparseRow.m);
}
exports.sparseRowToRow = sparseRowToRow;
function rowToSparseRow(row) {
    if (row.hasOwnProperty("isSparse")) {
        return row;
    }
    const data = {};
    for (let i = 0; i < row.m; i++) {
        const currVal = row.getValue(0, i);
        if (0 < currVal || 0 > currVal) {
            data[i] = row.getValue(0, i);
        }
    }
    return createSparseRow(data, row.m);
}
exports.rowToSparseRow = rowToSparseRow;
function sparseColumnToColumn(sparseColumn) {
    return new matrix_1.GenericColumn(Array.from(sparseColumn.generateColumn(0)), sparseColumn.n);
}
exports.sparseColumnToColumn = sparseColumnToColumn;
function columnToSparseColumn(column) {
    if (column.hasOwnProperty("isSparse")) {
        return column;
    }
    const data = {};
    for (let i = 0; i < column.n; i++) {
        const currVal = column.getValue(i, 0);
        if (0 < currVal || 0 > currVal) {
            data[i] = column.getValue(i, 0);
        }
    }
    return createSparseColumn(data, column.n);
}
exports.columnToSparseColumn = columnToSparseColumn;
function createSparseColumn(sparseData, n) {
    return new GenericSparseColumn(sparseData, n);
}
exports.createSparseColumn = createSparseColumn;
class SparseColumnImmutableMatrix {
    columns;
    n;
    m;
    isSparse;
    constructor(columns, n, m) {
        this.columns = columns;
        this.n = n;
        this.m = m;
        if (columns.length !== m) {
            throw new Error('Invalid number of columns.');
        }
    }
    getAsArray() {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(Array.from(this.generateRow(i)));
        }
        return rows;
    }
    at(idx) {
        if (this.n === 1) {
            return this.getValue(0, idx);
        }
        if (this.m === 1) {
            return this.getValue(idx, 0);
        }
        throw new Error("Matrix must be Nx1, 1xM or 1x1 in order to use the at method.");
    }
    [Symbol.iterator]() {
        if (this.n === 1) {
            return this.getRow(0)[Symbol.iterator]();
        }
        if (this.m === 1) {
            return this.getColumn(0)[Symbol.iterator]();
        }
        throw new Error("Matrix must be Nx1, 1xM or 1x1 in order to use the at method.");
    }
    getValue(i, j) {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        return this.columns[j].getValue(i, 0);
    }
    getTranspose() {
        const rows = [];
        for (let j = 0; j < this.m; j++) {
            rows.push(new GenericSparseRow(this.columns[j].getSparseData(), this.n));
        }
        return new SparseRowImmutableMatrix(rows, this.m, this.n);
    }
    *generateRow(i) {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        for (let j = 0; j < this.m; j++) {
            yield this.columns[j].getValue(i, 0);
        }
    }
    *generateColumn(j) {
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        yield* this.columns[j].generateColumn(0);
    }
    getRow(i) {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        const data = [];
        for (let j = 0; j < this.m; j++) {
            data.push(this.columns[j].getValue(i, 0));
        }
        return new matrix_1.GenericRow(data, this.m);
    }
    getColumn(j) {
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        return this.columns[j];
    }
    getMultiplication(right) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            const row = [];
            for (let j = 0; j < right.m; j++) {
                let sum = 0;
                for (let k = 0; k < this.m; k++) {
                    sum = (0, matrix_1.matrixContentAdder)(sum, (0, matrix_1.matrixContentMultiplier)(this.columns[k].getValue(i, 0), right.getValue(k, j)));
                }
                row.push(sum);
            }
            rows.push(new GenericSparseRow(row, right.m));
        }
        return new SparseRowImmutableMatrix(rows, this.n, right.m);
    }
    getScaled(other) {
        if (other !== 1) {
            const columns = [];
            for (let j = 0; j < this.m; j++) {
                columns.push(this.columns[j].getScaled(other));
            }
            return new SparseColumnImmutableMatrix(columns, this.n, this.m);
        }
        return this;
    }
    withValue(i, j, value) {
        if (i < 0 || i >= this.n) {
            throw new Error('Invalid row');
        }
        if (j < 0 || j >= this.m) {
            throw new Error('Invalid column');
        }
        const columns = [];
        for (let k = 0; k < this.m; k++) {
            const newColumn = k !== j ? this.columns[k] : this.columns[k].withValue(i, 0, value);
            columns.push(newColumn);
        }
        return new SparseColumnImmutableMatrix(columns, this.n, this.m);
    }
    withAdded(other) {
        const columns = [];
        for (let j = 0; j < this.m; j++) {
            columns.push(this.columns[j].withAdded(other.getColumn(j)));
        }
        return new SparseColumnImmutableMatrix(columns, this.n, this.m);
    }
    withAddedScalar(other) {
        const columns = [];
        for (let j = 0; j < this.m; j++) {
            columns.push(this.columns[j].withAddedScalar(other));
        }
        return new SparseColumnImmutableMatrix(columns, this.n, this.m);
    }
    withSubtracted(other) {
        const columns = [];
        for (let j = 0; j < this.m; j++) {
            columns.push(this.columns[j].withSubtracted(other.getColumn(j)));
        }
        return new SparseColumnImmutableMatrix(columns, this.n, this.m);
    }
    withSubtractedScalar(other) {
        const columns = [];
        for (let j = 0; j < this.m; j++) {
            columns.push(this.columns[j].withSubtractedScalar(other));
        }
        return new SparseColumnImmutableMatrix(columns, this.n, this.m);
    }
    mapped(f) {
        const columns = [];
        for (const currColumn of this.columns) {
            columns.push(currColumn.mapped(f));
        }
        return new SparseColumnImmutableMatrix(columns, this.n, this.m);
    }
    withAddedRow(newRow, atIdx) {
        if (atIdx < 0 || atIdx > this.n) {
            throw new Error('Invalid row index');
        }
        const columns = [];
        for (let j = 0; j < this.m; j++) {
            const currColumn = this.columns[j];
            const newColumn = currColumn.withAddedRow(new matrix_1.GenericRow([newRow.getValue(0, j)], 1), atIdx);
            columns.push(newColumn);
        }
        return new SparseColumnImmutableMatrix(columns, (this.n + 1), this.m);
    }
    withAddedColumn(newColumn, atIdx) {
        if (atIdx < 0 || atIdx > this.m) {
            throw new Error('Invalid column index');
        }
        const newSparseColumn = columnToSparseColumn(newColumn);
        const columns = [];
        for (let j = (this.m - 1); j >= 0; j--) {
            if (j >= atIdx) {
                columns[j + 1] = this.columns[j];
                ;
            }
            else {
                columns[j] = this.columns[j];
            }
        }
        columns[atIdx] = newSparseColumn;
        return new SparseColumnImmutableMatrix(columns, this.n, (this.m + 1));
    }
    withoutRow(atIdx) {
        if (atIdx < 0 || atIdx >= this.n) {
            throw new Error('Invalid row index');
        }
        const columns = [];
        for (let j = 0; j < this.m; j++) {
            const currColumn = this.columns[j];
            const newColumn = currColumn.withoutRow(atIdx);
            columns.push(newColumn);
        }
        return new SparseColumnImmutableMatrix(columns, (this.n - 1), this.m);
    }
    withoutColumn(atIdx) {
        if (atIdx < 0 || atIdx >= this.m) {
            throw new Error('Invalid column index');
        }
        const columns = [...this.columns];
        return new SparseColumnImmutableMatrix(columns.splice(atIdx, 1), this.n, (this.m - 1));
    }
}
exports.SparseColumnImmutableMatrix = SparseColumnImmutableMatrix;
