"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiplyMatrices = exports.matrixContentMultiplier = exports.matrixContentScaler = exports.matrixContentSubtractor = exports.matrixContentAdder = exports.GenericColumn = exports.GenericRow = exports.GenericMatrix = void 0;
const index_1 = require("../node_modules/gpu.js/src/index");
const linearAlgebra_1 = require("./linearAlgebra");
const numberAdder = (a, b) => a + b;
const arrayAdder = (a, b) => { a.push(...b); return a; };
const matrixAdder = (a, b) => a.withAdded(b);
const numberSubtractor = (a, b) => a - b;
const arraySubtractor = (a, b) => { const result = a.filter(x => !b.includes(x)); return result; };
const matrixSubtractor = (a, b) => a.withSubtracted(b);
const numberMultiplier = (a, b) => a * b;
const arrayMultiplier = (a, b) => { const result = []; for (let i = 0; i < a.length; i++) {
    result.push([a[i], (b[i] ?? null)]);
} return result; };
const matrixMultiplier = (a, b) => a.getMultiplication(b);
const numberScaler = (a, s) => s * a;
const arrayScaler = (a, s) => { const max = Math.max(0, s); const result = []; let i = 0; while (i < max) {
    result[i] = a;
    i++;
} return result; };
const matrixScaler = (a, s) => a.getScaled(s);
const matrixContentAdder = (a, b) => {
    const result = typeof a === "number" ?
        numberAdder(a, b) :
        Array.isArray(a) ?
            arrayAdder(a, b) :
            matrixAdder(a, b);
    return result;
};
exports.matrixContentAdder = matrixContentAdder;
const matrixContentSubtractor = (a, b) => {
    const result = typeof a === "number" ?
        numberSubtractor(a, b) :
        Array.isArray(a) ?
            arraySubtractor(a, b) :
            matrixSubtractor(a, b);
    return result;
};
exports.matrixContentSubtractor = matrixContentSubtractor;
const matrixContentMultiplier = (a, b) => {
    const result = typeof a === "number" ?
        numberMultiplier(a, b) :
        Array.isArray(a) ?
            arrayMultiplier(a, b) :
            matrixMultiplier(a, b);
    return result;
};
exports.matrixContentMultiplier = matrixContentMultiplier;
const matrixContentScaler = (a, s) => {
    const result = typeof a === "number" ?
        numberScaler(a, s) :
        Array.isArray(a) ?
            arrayScaler(a, s) :
            matrixScaler(a, s);
    return result;
};
exports.matrixContentScaler = matrixContentScaler;
class GenericMatrix {
    arrData;
    rowData;
    columnData;
    n;
    m;
    referenceData;
    wrapArrayData(arrData, n, m) {
        return {
            getValue(i, j) {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                return arrData[i][j];
            },
            setValue(i, j, newValue) {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                arrData[i][j] = newValue;
            },
            withNewValue(i, j, newValue) {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                const result = arrData.slice();
                result[i][j] = newValue;
                return result;
            },
            at(i) {
                if (i >= n || i < 0) {
                    throw new Error('Invalid row index.');
                }
                return arrData[i];
            },
            getArrayData() {
                return arrData;
            }
        };
    }
    wrapRowData(rowData, n, m) {
        return {
            getValue(i, j) {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                return rowData[i].getValue(0, j);
            },
            setValue(i, j, newValue) {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                const newRow = rowData[i].withValue(0, j, newValue);
                rowData[i] = newRow;
            },
            withNewValue(i, j, newValue) {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                const result = rowData.slice();
                const newRow = rowData[i].withValue(0, j, newValue);
                result[i] = newRow;
                return result;
            },
            at(i) {
                if (i >= n || i < 0) {
                    throw new Error('Invalid row index.');
                }
                return rowData[i];
            },
            getArrayData() {
                return rowData.map(r => Array.from(r.generateRow(0)));
            }
        };
    }
    wrapColumnData(columnData, n, m) {
        return {
            getValue(i, j) {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                return columnData[j].getValue(i, 0);
            },
            setValue(i, j, newValue) {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                const newColumn = columnData[j].withValue(0, i, newValue);
                columnData[j] = newColumn;
            },
            withNewValue(i, j, newValue) {
                if (i >= n || i < 0 || j >= m || j < 0) {
                    throw new Error('Invalid matrix index.');
                }
                const result = columnData.slice();
                const newColumn = columnData[j].withValue(0, i, newValue);
                result[j] = newColumn;
                return result;
            },
            at(i) {
                if (i >= m || i < 0) {
                    throw new Error('Invalid column index.');
                }
                return columnData[i];
            },
            getArrayData() {
                const rows = [];
                for (let i = 0; i < n; i++) {
                    const row = [];
                    for (let j = 0; j < m; j++) {
                        row.push(columnData[j].getValue(i, 0));
                    }
                    rows.push(row);
                }
                return rows;
            }
        };
    }
    constructor(arrData = [], rowData = [], columnData = [], n, m) {
        this.arrData = arrData;
        this.rowData = rowData;
        this.columnData = columnData;
        this.n = n;
        this.m = m;
        let refData = null;
        if (null !== arrData && arrData.length) {
            refData = this.wrapArrayData(arrData, n, m);
        }
        else if (null !== rowData && rowData.length === n) {
            refData = this.wrapRowData(rowData, n, m);
        }
        else if (null !== columnData && columnData.length === m) {
            refData = this.wrapColumnData(columnData, n, m);
        }
        if (null === refData) {
            throw new Error('Invalid data.');
        }
        this.referenceData = refData;
    }
    getAsArray() {
        return this.referenceData.getArrayData();
    }
    getValue(i, j) {
        if (i >= this.n || i < 0 || j >= this.m || j < 0) {
            throw new Error('Invalid matrix index.');
        }
        return this.referenceData.getValue(i, j);
    }
    *generateRow(i) {
        if (i >= this.n || i < 0) {
            throw new Error('Invalid row index.');
        }
        for (let j = 0; j < this.m; j++) {
            yield this.referenceData.getValue(i, j);
        }
    }
    *generateColumn(j) {
        if (j >= this.m || j < 0) {
            throw new Error('Invalid column index.');
        }
        for (let i = 0; i < this.n; i++) {
            yield this.referenceData.getValue(i, j);
        }
    }
    getRow(i) {
        if (i >= this.n || i < 0) {
            throw new Error('Invalid row index.');
        }
        const arr = [];
        for (let j = 0; j < this.m; j++) {
            arr.push(this.referenceData.getValue(i, j));
        }
        return new GenericRow(arr, this.m);
    }
    getColumn(j) {
        if (j >= this.m || j < 0) {
            throw new Error('Invalid column index.');
        }
        const data = [];
        for (let i = 0; i < this.n; i++) {
            data.push(this.referenceData.getValue(i, j));
        }
        return new GenericColumn(data, this.n);
    }
    withValue(i, j, value) {
        if (i >= this.n || i < 0 || j >= this.m || j < 0) {
            throw new Error('Invalid matrix index.');
        }
        const data = [];
        for (let k = 0; k < this.n; k++) {
            const row = [];
            for (let l = 0; l < this.m; l++) {
                row.push(k === i && l === j ? value : this.referenceData.getValue(k, l));
            }
            data.push(row);
        }
        return new GenericMatrix(data, null, null, this.n, this.m);
    }
    withAdded(other) {
        const data = [];
        for (let i = 0; i < this.n; i++) {
            const row = [];
            for (let j = 0; j < this.m; j++) {
                row.push(matrixContentAdder(this.referenceData.getValue(i, j), other.getValue(i, j)));
            }
            data.push(row);
        }
        return new GenericMatrix(data, null, null, this.n, this.m);
    }
    withAddedScalar(other) {
        const data = [];
        for (let i = 0; i < this.n; i++) {
            const row = [];
            for (let j = 0; j < this.m; j++) {
                row.push(matrixContentAdder(this.referenceData.getValue(i, j), other));
            }
            data.push(row);
        }
        return new GenericMatrix(data, null, null, this.n, this.m);
    }
    withSubtracted(other) {
        const data = [];
        for (let i = 0; i < this.n; i++) {
            const row = [];
            for (let j = 0; j < this.m; j++) {
                row.push(matrixContentSubtractor(this.referenceData.getValue(i, j), other.getValue(i, j)));
            }
            data.push(row);
        }
        return new GenericMatrix(data, null, null, this.n, this.m);
    }
    withSubtractedScalar(other) {
        const data = [];
        for (let i = 0; i < this.n; i++) {
            const row = [];
            for (let j = 0; j < this.m; j++) {
                row.push(matrixContentSubtractor(this.referenceData.getValue(i, j), other));
            }
            data.push(row);
        }
        return new GenericMatrix(data, null, null, this.n, this.m);
    }
    getMultiplication(right) {
        const data = [];
        for (let i = 0; i < this.n; i++) {
            const row = [];
            for (let j = 0; j < right.m; j++) {
                let sum = 0;
                for (let k = 0; k < this.m; k++) {
                    sum = matrixContentAdder(sum, matrixContentMultiplier(this.referenceData.getValue(i, k), right.getValue(k, j)));
                }
                row.push(sum);
            }
            data.push(row);
        }
        return new GenericMatrix(data, null, null, this.n, right.m);
    }
    getScaled(other) {
        const data = [];
        for (let i = 0; i < this.n; i++) {
            const row = [];
            for (let j = 0; j < this.m; j++) {
                row.push(matrixContentMultiplier(this.referenceData.getValue(i, j), other));
            }
            data.push(row);
        }
        return new GenericMatrix(data, null, null, this.n, this.m);
    }
    getTranspose() {
        const data = [];
        for (let i = 0; i < this.m; i++) {
            const row = [];
            for (let j = 0; j < this.n; j++) {
                row.push(this.referenceData.getValue(j, i));
            }
            data.push(row);
        }
        return new GenericMatrix(data, null, null, this.m, this.n);
    }
    mapped(f) {
        const data = [];
        for (let i = 0; i < this.n; i++) {
            const row = [];
            for (let j = 0; j < this.m; j++) {
                row.push(f(this.referenceData.getValue(i, j)));
            }
            data.push(row);
        }
        return new GenericMatrix(data, null, null, this.n, this.m);
    }
    withAddedRow(newRow, atIdx) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.getRow(i));
        }
        rows.splice(atIdx, 0, newRow);
        return new GenericMatrix(null, rows, null, this.n + 1, this.m);
    }
    withAddedColumn(newColumn, atIdx) {
        const columns = [];
        for (let i = 0; i < this.m; i++) {
            columns.push(this.getColumn(i));
        }
        columns.splice(atIdx, 0, newColumn);
        return new GenericMatrix(null, null, columns, this.n, this.m + 1);
    }
    withoutRow(atIdx) {
        const rows = [];
        for (let i = 0; i < this.n; i++) {
            rows.push(this.getRow(i));
        }
        rows.splice(atIdx, 1);
        return new GenericMatrix(null, rows, null, this.n - 1, this.m);
    }
    withoutColumn(atIdx) {
        const columns = [];
        for (let i = 0; i < this.m; i++) {
            columns.push(this.getColumn(i));
        }
        columns.splice(atIdx, 1);
        return new GenericMatrix(null, null, columns, this.n, this.m - 1);
    }
    at(index) {
        if (this.n === 1) {
            return this.referenceData.getValue(0, index);
        }
        if (this.m === 1) {
            return this.referenceData.getValue(index, 0);
        }
        throw new Error('Matrix must be Nx1, 1xM or 1x1 to use at().');
    }
    [Symbol.iterator]() {
        if (this.n === 1) {
            return this.generateRow(0);
        }
        if (this.m === 1) {
            return this.generateColumn(0);
        }
        throw new Error('Matrix must be Nx1, 1xM or 1x1 to use iterator.');
    }
}
exports.GenericMatrix = GenericMatrix;
;
class GenericRow extends GenericMatrix {
    constructor(arrData = [], m) {
        super([arrData], null, null, 1, m);
    }
    getTranspose() {
        const newData = [];
        for (let i = 0; i < this.m; i++) {
            newData.push(this.referenceData.getValue(0, i));
        }
        return new GenericColumn(newData, this.m);
    }
    getRow(i) {
        if (i !== 0) {
            throw new Error(`Row index out of bounds: ${i}`);
        }
        return this;
    }
    getColumn(j) {
        if (j < 0 || j >= this.m) {
            throw new Error(`Column index out of bounds: ${j}`);
        }
        return new GenericColumn([this.referenceData.getValue(0, j)], 1);
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
    foldLeft(f, init) {
        let acc = init;
        for (let i = 0; i < this.m; i++) {
            acc = f(acc, this.at(i));
        }
        return acc;
    }
    foldRight(f, init) {
        let acc = init;
        for (let i = this.m - 1; i >= 0; i--) {
            acc = f(acc, this.at(i));
        }
        return acc;
    }
}
exports.GenericRow = GenericRow;
;
class GenericColumn extends GenericMatrix {
    constructor(arrData = [], n) {
        super(arrData.map((v) => [v]), null, null, n, 1);
    }
    getTranspose() {
        const newData = [];
        for (let i = 0; i < this.n; i++) {
            newData.push(this.referenceData.getValue(i, 0));
        }
        return new GenericRow(newData, this.n);
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
    getRow(i) {
        if (i < 0 || i >= this.n) {
            throw new Error("Index out of bounds.");
        }
        return new GenericRow([this.getValue(i, 0)], 1);
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
    foldLeft(f, init) {
        let acc = init;
        for (let i = 0; i < this.n; i++) {
            acc = f(acc, this.at(i));
        }
        return acc;
    }
    foldRight(f, init) {
        let acc = init;
        for (let i = this.n - 1; i >= 0; i--) {
            acc = f(acc, this.at(i));
        }
        return acc;
    }
}
exports.GenericColumn = GenericColumn;
const matrixMultiplicationKernelFn = function (a, b, m) {
    let sum = 0;
    for (let i = 0; i < m; i++) {
        sum += a[this.thread.y][i] * b[i][this.thread.x];
    }
    return sum;
};
class GPUProvider {
    static gpu = null;
    static getGPU() {
        if (GPUProvider.gpu === null) {
            try {
                GPUProvider.gpu = new index_1.GPU({ mode: "gpu" });
            }
            catch (e) {
                GPUProvider.gpu = new index_1.GPU({ mode: "cpu" });
            }
        }
        return GPUProvider.gpu;
    }
}
const matrixMultiplicationKernel = GPUProvider.getGPU().createKernel(matrixMultiplicationKernelFn)
    .setDynamicArguments(true)
    .setDynamicOutput(true);
function multiplyMatrices(a, b) {
    const n = a.n;
    const m = a.m;
    const o = b.m;
    if (typeof a.getValue(0, 0) === 'number') {
        const aData = a.getAsArray();
        const bData = b.getAsArray();
        // width/row-size x height/column-size instead of rows x columns
        matrixMultiplicationKernel.setOutput([o, n]);
        const multResult = matrixMultiplicationKernel(aData, bData, m);
        return new GenericMatrix(multResult, null, null, n, o);
    }
    const multResult = [];
    for (let i = 0; i < n; i++) {
        multResult.push([]);
        const row = a.getRow(i);
        for (let j = 0; j < o; j++) {
            multResult[i].push((0, linearAlgebra_1.dotProduct)(row, b.getColumn(j)));
        }
    }
    return new GenericMatrix(multResult, null, null, n, o);
}
exports.multiplyMatrices = multiplyMatrices;
