"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericMutableColumn = exports.GenericMutableRow = exports.GenericMutableMatrix = void 0;
const matrix_1 = require("./matrix");
class GenericMutableMatrix extends matrix_1.GenericMatrix {
    constructor(arrData, rowData, columnData, n, m) {
        super(arrData, rowData, columnData, n, m);
    }
    setValue(row, col, value) {
        this.referenceData.setValue(row, col, value);
    }
    getMultiplication(right) {
        return super.getMultiplication(right);
    }
    getTranspose() {
        return super.getTranspose();
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
    getScaled(other) {
        return super.getScaled(other);
    }
    getRow(i) {
        return super.getRow(i);
    }
    getColumn(j) {
        return super.getColumn(j);
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
    withValue(i, j, value) {
        this.setValue(i, j, value);
        return this;
    }
    mapped(f) {
        return super.mapped(f);
    }
    add(other) {
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.m; j++) {
                const otherVal = other.getValue(i, j);
                if (0 !== otherVal) {
                    this.referenceData.setValue(i, j, (0, matrix_1.matrixContentAdder)(this.referenceData.getValue(i, j), otherVal));
                }
            }
        }
    }
    addScalar(other) {
        if (other !== 0) {
            for (let i = 0; i < this.n; i++) {
                for (let j = 0; j < this.m; j++) {
                    this.referenceData.setValue(i, j, (0, matrix_1.matrixContentAdder)(this.referenceData.getValue(i, j), other));
                }
            }
        }
    }
    subtract(other) {
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.m; j++) {
                const otherVal = other.getValue(i, j);
                if (0 !== otherVal) {
                    this.referenceData.setValue(i, j, (0, matrix_1.matrixContentSubtractor)(this.referenceData.getValue(i, j), otherVal));
                }
            }
        }
    }
    subtractScalar(other) {
        if (other !== 0) {
            for (let i = 0; i < this.n; i++) {
                for (let j = 0; j < this.m; j++) {
                    this.referenceData.setValue(i, j, (0, matrix_1.matrixContentSubtractor)(this.referenceData.getValue(i, j), other));
                }
            }
        }
    }
    scale(other) {
        if (other !== 1) {
            for (let i = 0; i < this.n; i++) {
                for (let j = 0; j < this.m; j++) {
                    const currVal = this.referenceData.getValue(i, j);
                    if (0 !== currVal) {
                        this.referenceData.setValue(i, j, (0, matrix_1.matrixContentMultiplier)(currVal, other));
                    }
                }
            }
        }
    }
    mapInPlace(mapper) {
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.m; j++) {
                this.referenceData.setValue(i, j, mapper(this.referenceData.getValue(i, j)));
            }
        }
    }
}
exports.GenericMutableMatrix = GenericMutableMatrix;
;
class GenericMutableRow extends GenericMutableMatrix {
    constructor(arrData = [], m) {
        super([arrData], null, null, 1, m);
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
    getScaled(other) {
        return super.getScaled(other);
    }
    mapped(f) {
        return super.mapped(f);
    }
    getTranspose() {
        const newData = [];
        for (let i = 0; i < this.m; i++) {
            newData.push(this.referenceData.getValue(0, i));
        }
        return new GenericMutableColumn(newData, this.m);
    }
    foldLeft(f, init) {
        let acc = init;
        for (let i = 0; i < this.m; i++) {
            acc = f(acc, this.referenceData.getValue(0, i));
        }
        return acc;
    }
    foldRight(f, init) {
        let acc = init;
        for (let i = this.m - 1; i >= 0; i--) {
            acc = f(acc, this.referenceData.getValue(0, i));
        }
        return acc;
    }
    at(index) {
        if (index < 0 || index >= this.m) {
            throw new Error("Index out of bounds.");
        }
        const ref = this.referenceData.at(0);
        return ref instanceof Array ? ref[index] : ref.at(index);
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
    withAddedRow(row, atIdx) {
        return super.withAddedRow(row, atIdx);
    }
    withAddedColumn(column, atIdx) {
        return super.withAddedColumn(column, atIdx);
    }
    withoutRow(atIdx) {
        return super.withoutRow(atIdx);
    }
    withoutColumn(atIdx) {
        return super.withoutColumn(atIdx);
    }
}
exports.GenericMutableRow = GenericMutableRow;
class GenericMutableColumn extends GenericMutableMatrix {
    constructor(arrData = [], n) {
        super(arrData.map((v) => [v]), null, null, n, 1);
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
    getScaled(other) {
        return super.getScaled(other);
    }
    mapped(f) {
        return super.mapped(f);
    }
    getTranspose() {
        const newData = [];
        for (let i = 0; i < this.n; i++) {
            newData.push(this.referenceData.getValue(i, 0));
        }
        return new GenericMutableRow(newData, this.n);
    }
    foldLeft(f, init) {
        let acc = init;
        for (let i = 0; i < this.n; i++) {
            acc = f(acc, this.referenceData.getValue(i, 0));
        }
        return acc;
    }
    foldRight(f, init) {
        let acc = init;
        for (let i = this.n - 1; i >= 0; i--) {
            acc = f(acc, this.referenceData.getValue(i, 0));
        }
        return acc;
    }
    getRow(i) {
        if (i < 0 || i >= this.n) {
            throw new Error("Index out of bounds.");
        }
        return new GenericMutableRow([this.referenceData.getValue(i, 0)], 1);
    }
    getColumn(j) {
        if (j !== 0) {
            throw new Error(`Column index out of bounds: ${j}`);
        }
        return this;
    }
    at(index) {
        if (index < 0 || index >= this.n) {
            throw new Error("Index out of bounds.");
        }
        const ref = this.referenceData.at(index);
        return ref instanceof Array ? ref[0] : ref.at(0);
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
    withAddedRow(row, atIdx) {
        return super.withAddedRow(row, atIdx);
    }
    withAddedColumn(column, atIdx) {
        return super.withAddedColumn(column, atIdx);
    }
    withoutRow(atIdx) {
        return super.withoutRow(atIdx);
    }
    withoutColumn(atIdx) {
        return super.withoutColumn(atIdx);
    }
}
exports.GenericMutableColumn = GenericMutableColumn;
