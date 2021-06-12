function getu16(value) { return value & 0xFFFF; }
function getu8(value) { return value & 0xFF; }
function getu1(value) { return value & 1; }
var CPU = /** @class */ (function () {
    function CPU() {
        this.V = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        this.SK = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        this.SP = 0;
        this.PC = 0x200;
        this.DT = 0;
        this.ST = 0;
        this.I = 0;
    }
    CPU.prototype.reset = function () {
        this.V = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        this.SK = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        this.SP = 0;
        this.PC = 0x200;
        this.DT = 0;
        this.ST = 0;
        this.I = 0;
    };
    CPU.prototype.register = function (index) {
        return getu16(this.V[index]);
    };
    CPU.prototype.setRegister = function (index, value) {
        this.V[index] = getu16(value);
    };
    CPU.prototype.pushStack = function () {
        this.SK[this.SP] = this.PC;
        this.SP++;
    };
    CPU.prototype.popStack = function () {
        this.SP--;
        this.PC = this.SK[this.SP];
    };
    return CPU;
}());
var Fontset = new Array(0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
0x20, 0x60, 0x20, 0x20, 0x70, // 1
0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
0x90, 0x90, 0xF0, 0x10, 0x10, // 4
0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
0xF0, 0x10, 0x20, 0x40, 0x40, // 7
0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
0xF0, 0x90, 0xF0, 0x90, 0x90, // A
0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
0xF0, 0x80, 0x80, 0x80, 0xF0, // C
0xE0, 0x90, 0x90, 0x90, 0xE0, // D
0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
0xF0, 0x80, 0xF0, 0x80, 0x80 // F
);
var Chip8 = /** @class */ (function () {
    function Chip8(context) {
        this.screenData = new Uint8Array(64 * 32);
        this.drawFlag = false;
        this.displayOnDraw = true;
        this.memory = new Uint8Array(0x1000);
        this.loadFontset();
        this.cpu = new CPU();
        this.context = context;
        this.cyclesLeftover = 0;
        this.iCyclesLeftover = 0;
        this.key = new Array(16);
        this.keyWait = false;
        this.clockRate = 800; //800 Hz
    }
    Chip8.prototype.getPixel = function (x, y) {
        return getu1(this.screenData[(y * 64) + x]);
    };
    Chip8.prototype.setPixel = function (x, y, val) {
        this.screenData[(y * 64) + x] = getu1(val);
    };
    Chip8.prototype.pressKey = function (k) {
        this.key[k] = 3;
    };
    Chip8.prototype.releaseKey = function (k) {
        this.key[k] = 4;
    };
    Chip8.prototype.makePressesStale = function () {
        for (var i = 0; i < 16; i++) {
            this.key[i] &= 1;
        }
    };
    Chip8.prototype.checkKeyJustPressed = function (k) {
        return (this.key[k] & 2) > 0;
    };
    Chip8.prototype.checkKeyPressed = function (k) {
        return (this.key[k] & 1) > 0;
    };
    Chip8.prototype.checkKeyReleased = function (k) {
        return (this.key[k] & 4) > 0;
    };
    Chip8.prototype.togglePixel = function (x, y) {
        this.setPixel(x, y, this.getPixel(x, y) ^ 1);
    };
    Chip8.prototype.clearScreen = function () {
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, 640, 320);
        for (var i = 0; i < 64 * 32; i++)
            this.screenData[i] = 0;
        this.drawFlag = true;
    };
    Chip8.prototype.loadFontset = function () {
        for (var i = 0; i < Fontset.length; i++) {
            this.memory[0x50 + i] = Fontset[i];
        }
    };
    Chip8.prototype.reset = function () {
        this.clearScreen();
        this.cpu.reset();
        this.memory = new Uint8Array(0x1000);
        this.loadFontset();
        this.cyclesLeftover = 0;
        this.iCyclesLeftover = 0;
    };
    Chip8.prototype.loadProgram = function (program) {
        this.reset();
        for (var i = 0; i < 0xFFF - 0x200; i++) {
            this.memory[0x200 + i] = program[i];
        }
    };
    Chip8.prototype.draw = function () {
        for (var y = 0; y < 32; y++) {
            for (var x = 0; x < 64; x++) {
                this.context.fillStyle = (this.getPixel(x, y) > 0) ? 'white' : 'black';
                this.context.fillRect(x * 10, y * 10, 10, 10);
            }
        }
    };
    Chip8.prototype.setClockRate = function (rate) {
        this.clockRate = rate;
    };
    Chip8.prototype.setDisplayOnDraw = function (value) {
        this.displayOnDraw = value;
    };
    Chip8.prototype.executeInstruction = function () {
        var instr = getu16((getu8(this.memory[this.cpu.PC]) << 8) | getu8(this.memory[this.cpu.PC + 1]));
        var cpu = this.cpu;
        var dest;
        var vx;
        var vy;
        var n;
        var xx;
        var yy;
        var h;
        switch (instr & 0xF000) {
            case 0x0000:
                switch (instr & 0xFF) {
                    case 0xE0:
                        this.clearScreen();
                        //console.log('cls');
                        cpu.PC += 2;
                        break;
                    case 0xEE:
                        cpu.popStack();
                        cpu.PC += 2;
                        //console.log('ret');
                        break;
                    default:
                        console.log('Unknown instruction, 0x' + instr.toString(16));
                        break;
                }
                break;
            case 0x1000:
                dest = instr & 0xFFF;
                cpu.PC = dest;
                //console.log('jp 0x' + dest.toString(16));
                break;
            case 0x2000:
                dest = instr & 0xFFF;
                cpu.pushStack();
                cpu.PC = dest;
                //console.log('call 0x' + dest.toString(16));
                break;
            case 0x3000:
                xx = (instr & 0xF00) >> 8;
                n = (instr & 0x0FF);
                if (cpu.register(xx) === n) {
                    cpu.PC += 2;
                }
                //console.log('se v' + xx.toString(16) + ', ' + n);
                cpu.PC += 2;
                break;
            case 0x4000:
                xx = (instr & 0xF00) >> 8;
                n = (instr & 0x0FF);
                if (cpu.register(xx) !== n) {
                    cpu.PC += 2;
                }
                //console.log('sne v' + xx.toString(16) + ', ' + n);
                cpu.PC += 2;
                break;
            case 0x5000:
                xx = (instr & 0xF00) >> 8;
                yy = (instr & 0x0F0) >> 4;
                if (cpu.V[xx] === cpu.V[yy]) {
                    cpu.PC += 2;
                }
                //console.log('se v' + xx.toString(16) + ', v' + yy.toString(16));
                cpu.PC += 2;
                break;
            case 0x6000:
                xx = (instr & 0xF00) >> 8;
                n = (instr & 0x0FF);
                cpu.setRegister(xx, n);
                //console.log('ld v' + xx.toString(16) + ', ' + n);
                cpu.PC += 2;
                break;
            case 0x7000:
                xx = (instr & 0xF00) >> 8;
                n = (instr & 0x0FF);
                cpu.V[xx] += n;
                cpu.V[xx] &= 0xFF;
                //console.log('add v' + xx.toString(16) + ', ' + n);
                cpu.PC += 2;
                break;
            case 0x8000:
                xx = (instr & 0xF00) >> 8;
                yy = (instr & 0x0F0) >> 4;
                switch (instr & 0x00F) {
                    case 0x0:
                        cpu.V[xx] = cpu.V[yy];
                        //console.log('ld v' + xx.toString(16) + ', v' + yy.toString(16));
                        break;
                    case 0x1:
                        cpu.V[xx] |= cpu.V[yy];
                        //console.log('or v' + xx.toString(16) + ', v' + yy.toString(16));
                        break;
                    case 0x2:
                        cpu.V[xx] &= cpu.V[yy];
                        //console.log('and v' + xx.toString(16) + ', v' + yy.toString(16));
                        break;
                    case 0x3:
                        cpu.V[xx] ^= cpu.V[yy];
                        //console.log('xor v' + xx.toString(16) + ', v' + yy.toString(16));
                        break;
                    case 0x4:
                        cpu.V[0xF] = (cpu.V[xx] + cpu.V[yy] > 255) ? 1 : 0;
                        cpu.V[xx] += cpu.V[yy];
                        cpu.V[xx] %= 0x100;
                        //console.log('add v' + xx.toString(16) + ', v' + yy.toString(16));
                        break;
                    case 0x5:
                        cpu.V[0xF] = (cpu.V[xx] > cpu.V[yy]) ? 1 : 0;
                        cpu.V[xx] -= cpu.V[yy];
                        if (cpu.V[xx] < 0) {
                            cpu.V[xx] = 0x100 + cpu.V[xx];
                        }
                        console.log('sub v' + xx.toString(16) + ', v' + yy.toString(16));
                        this.instructionStr = 'sub v' + xx.toString(16) + ', v' + yy.toString(16);
                        break;
                    case 0x6:
                        cpu.V[0xF] = (cpu.V[xx] & 1) ? 1 : 0;
                        cpu.V[xx] >>= 1;
                        //console.log('shr v' + xx.toString(16));
                        break;
                    case 0x7:
                        cpu.V[0xF] = (cpu.V[xx] < cpu.V[yy]) ? 1 : 0;
                        cpu.V[xx] = cpu.V[yy] - cpu.V[xx];
                        if (cpu.V[xx] < 0) {
                            cpu.V[xx] = 0x100 + cpu.V[xx];
                        }
                        console.log('sub v' + xx.toString(16) + ', v' + yy.toString(16));
                        break;
                    case 0xE:
                        cpu.V[0xF] = ((cpu.V[xx] & 0x80) === 0x80) ? 1 : 0;
                        cpu.V[xx] <<= 1;
                        cpu.V[xx] %= 0x100;
                        //console.log('shl v' + xx.toString(16));
                        break;
                    default:
                        console.log('Unknown instruction, 0x' + instr.toString(16));
                        break;
                }
                cpu.PC += 2;
                break;
            case 0x9000:
                xx = (instr & 0xF00) >> 8;
                yy = (instr & 0x0F0) >> 4;
                if (cpu.V[xx] !== cpu.V[yy]) {
                    cpu.PC += 2;
                }
                console.log('sne v' + xx.toString(16) + ', v' + yy.toString(16));
                cpu.PC += 2;
                break;
            case 0xA000:
                n = (instr & 0xFFF);
                cpu.I = n;
                console.log('ld i, ' + n);
                cpu.PC += 2;
                break;
            case 0xB000:
                n = (instr & 0xFFF);
                cpu.PC = (n + cpu.V[0]) & 0xFFF;
                console.log('jp v0, 0x' + n.toString(16));
                cpu.PC += 2;
                break;
            case 0xC000:
                xx = (instr & 0xF00) >> 8;
                n = (instr & 0x0FF);
                cpu.setRegister(xx, (Math.round(Math.random() * n) & n));
                console.log('sne v' + xx.toString(16) + ', ' + n);
                cpu.PC += 2;
                break;
            case 0xD000:
                xx = (instr & 0xF00) >> 8;
                yy = (instr & 0x0F0) >> 4;
                vx = cpu.V[xx];
                vy = cpu.V[yy];
                h = (instr & 0x00F);
                var pixel = 0;
                cpu.V[0xF] = 0;
                for (var yline = 0; yline < h; yline++) {
                    pixel = this.memory[cpu.I + yline];
                    for (var xline = 0; xline < 8; xline++) {
                        if ((pixel & (0x80 >> xline)) != 0) {
                            if (this.screenData[(vx + xline + ((vy + yline) * 64))] == 1)
                                cpu.V[0xF] = 1;
                            this.screenData[(vx + xline + ((vy + yline) * 64))] ^= 1;
                        }
                    }
                }
                console.log('drw v' + xx.toString(16) + ', y' + yy.toString(16) + ', ' + h);
                this.drawFlag = true;
                cpu.PC += 2;
                break;
            case 0xE000:
                xx = (instr & 0xF00) >> 8;
                switch (instr & 0x0FF) {
                    case 0x9E:
                        if (this.checkKeyPressed(cpu.V[xx])) {
                            cpu.PC += 2;
                        }
                        console.log('skp v' + xx.toString(16));
                        break;
                    case 0xA1:
                        if (!this.checkKeyPressed(cpu.V[xx])) {
                            cpu.PC += 2;
                        }
                        console.log('sknp v' + xx.toString(16));
                        break;
                }
                cpu.PC += 2;
                break;
            case 0xF000:
                xx = (instr & 0xF00) >> 8;
                switch (instr & 0x0FF) {
                    case 0x07:
                        cpu.setRegister(xx, cpu.DT);
                        console.log('ld v' + xx.toString(16) + ', dt');
                        break;
                    case 0x0A:
                        if (!this.keyWait) {
                            this.keyWait = true;
                            console.log('ld v' + xx.toString(16) + ', k');
                            return;
                        }
                        for (var i = 0; i < 16; i++) {
                            if (this.checkKeyJustPressed(i)) {
                                cpu.V[xx] = i;
                                this.keyWait = false;
                                cpu.PC += 2;
                                return;
                            }
                        }
                        return;
                    case 0x15:
                        cpu.DT = cpu.V[xx];
                        console.log('ld dt, v' + xx.toString(16));
                        break;
                    case 0x18:
                        cpu.ST = cpu.V[xx];
                        console.log('ld st, v' + xx.toString(16));
                        break;
                    case 0x1E:
                        if (cpu.I < 0x1000 && cpu.I + cpu.V[xx] >= 0x1000) {
                            cpu.V[0xF] = 1;
                        }
                        cpu.I += cpu.V[xx];
                        cpu.I &= 0xFFFF;
                        console.log('add i, v' + xx.toString(16));
                        break;
                    case 0x29:
                        cpu.I = 0x50 + (5 * cpu.V[xx]);
                        console.log('ld f, v' + xx.toString(16));
                        break;
                    case 0x33:
                        this.memory[cpu.I] = cpu.V[xx] / 100;
                        this.memory[cpu.I + 1] = (cpu.V[xx] / 10) % 10;
                        this.memory[cpu.I + 2] = (cpu.V[xx] % 100) % 10;
                        console.log('ld b, v' + xx.toString(16));
                        break;
                    case 0x55:
                        for (var i = 0; i < xx + 1; i++) {
                            this.memory[cpu.I + i] = cpu.V[i];
                        }
                        console.log('ld [i], v' + xx.toString(16));
                        break;
                    case 0x65:
                        for (var i = 0; i < xx + 1; i++) {
                            cpu.V[i] = this.memory[cpu.I + i];
                        }
                        console.log('ld v' + xx.toString(16) + ', [i]');
                        break;
                    default:
                        console.log('Unknown instruction, 0x' + instr.toString(16));
                        break;
                }
                cpu.PC += 2;
                break;
            default:
                console.log('Unknown instruction, 0x' + instr.toString(16));
                break;
        }
    };
    Chip8.prototype.update = function (secondsPassed) {
        var cyclesPassed = secondsPassed * 60;
        var cyclesToEmulate = Math.floor(cyclesPassed + this.cyclesLeftover);
        if (cyclesToEmulate < 1) {
            this.cyclesLeftover += cyclesPassed;
        }
        else {
            //console.log('cycles passed:' + cyclesPassed + ' cycles leftover:' + this.cyclesLeftover);
            if (this.cpu.DT > 0) {
                this.cpu.DT -= cyclesToEmulate;
                if (this.cpu.DT < 0)
                    this.cpu.DT = 0;
            }
            if (this.cpu.ST > 0) {
                this.cpu.ST -= cyclesToEmulate;
                if (this.cpu.ST < 0)
                    this.cpu.ST = 0;
            }
            this.cyclesLeftover = cyclesPassed - cyclesToEmulate;
        }
        var iCyclesPassed = secondsPassed * this.clockRate;
        var iCycles = Math.floor(iCyclesPassed + this.iCyclesLeftover);
        if (iCycles < 1) {
            this.iCyclesLeftover += iCyclesPassed;
            return;
        }
        else {
            this.iCyclesLeftover = iCyclesPassed - iCycles;
        }
        for (var i = 0; i < iCycles; i++) {
            this.executeInstruction();
            if (this.drawFlag) {
                this.drawFlag = false;
                if (this.displayOnDraw)
                    break;
            }
        }
        this.makePressesStale();
    };
    return Chip8;
}());
function createEmulator(ctx) { return new Chip8(ctx); }
