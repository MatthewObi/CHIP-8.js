(function getu8(num) { return num & 0xFF; });

disassembler = {disassemble(code){
    let outputString = 'start:\n';
    var labelValues = {};
    for(var i = 0; i < 0xFFF - 0x200; i++) {
        var instr = getu8(code[i]) << 8 | getu8(code[i+1]);
        value  = instr & 0x0FFF;
        if(value in labelValues) continue;
        if(i >= code.length) break;
        switch(instr & 0xF000) {
            case 0x1000:
                opcode = (instr & 0xF000) >> 12;
                if(value - 0x200 <= code.length - 1 && value >= 0x200) {
                    var label = 'sub_' + value.toString(16);
                    labelValues[value] = label;
                }
            break;
            case 0x2000:
                opcode = (instr & 0xF000) >> 12;
                value  = instr & 0x0FFF;
                if(value - 0x200 <= code.length - 1 && value >= 0x200) {
                    var label = 'sub_' + value.toString(16);
                    labelValues[value] = label;
                }
            break;
            case 0xA000:
                opcode = (instr & 0xF000) >> 12;
                value  = instr & 0x0FFF;
                if(value - 0x200 <= code.length - 1 && value >= 0x200) {
                    var label = 'sub_' + value.toString(16);
                    labelValues[value] = label;
                }
            break;
        }
    }
    for(var i = 0; i < 0xFFF - 0x200; i+=2) {
        var instr = getu8(code[i]) << 8 | getu8(code[i+1]);
        if((i + 0x200) in labelValues) {
            outputString += '\n';
            outputString += labelValues[(i + 0x200)] + ':\n';
        }
        else if((i + 0x201) in labelValues) {
            outputString += 'byte 0x' + getu8(code[i]).toString(16) + '\n';
            i--;
            continue;
        }
        var opcode = 0;
        var value  =  instr & 0x0FFF;
        var xvalue = (instr & 0x0F00) >> 8;
        var yvalue = (instr & 0x00F0) >> 4;
        var nvalue = (instr & 0x00FF);
        var hvalue = (instr & 0x000F);
        if(i >= code.length) break;
        switch(instr & 0xF000) {
            case 0x0000:
                switch(instr & 0xFFF) {
                    case 0xE0:
                        opcode = instr;
                        outputString += 'cls\n';
                    break;
                    case 0xEE:
                        opcode = instr;
                        outputString += 'ret\n';
                    break;
                }
            break;
            case 0x1000:
                opcode = (instr & 0xF000) >> 12;
                if(value in labelValues)
                    outputString += 'jp @' + labelValues[value] 
                        + ' ; word 0x' + instr.toString(16) + '\n';
                else
                    outputString += 'jp 0x' + value.toString(16) 
                        + ' ; word 0x' + instr.toString(16) + '\n';
            break;
            case 0x2000:
                opcode = (instr & 0xF000) >> 12;
                if(value in labelValues)
                outputString += 'call @' + labelValues[value] 
                    + ' ; word 0x' + instr.toString(16) + '\n';
                else
                outputString += 'call 0x' + value.toString(16) 
                    + ' ; word 0x' + instr.toString(16) + '\n';
            break;
            case 0x3000:
                opcode = (instr & 0xF000) >> 12;
                outputString += 'se v' + xvalue.toString(16) + ', ' + nvalue + '\n';
            break;
            case 0x4000:
                opcode = (instr & 0xF000) >> 12;
                outputString += 'sne v' + xvalue.toString(16) + ', ' + nvalue + '\n';
            break;
            case 0x5000:
                opcode = (instr & 0xF000) >> 12;
                if(instr & 0xF == 0) {
                    outputString += 'se v' + xvalue.toString(16) 
                        + ', v' + yvalue.toString(16) + '\n';
                } else {
                    outputString += 'word 0x' + instr.toString(16) + '\n';
                }
            break;
            case 0x6000:
                opcode = (instr & 0xF000) >> 12;
                outputString += 'ld v' + xvalue.toString(16) + ', ' + nvalue + '\n';
            break;
            case 0x7000:
                opcode = (instr & 0xF000) >> 12;
                outputString += 'add v' + xvalue.toString(16) + ', ' + nvalue + '\n';
            break;
            case 0x8000:
                switch(instr & 0xF) {
                    case 0x0:
                        opcode = instr;
                        outputString += 'ld v' + xvalue.toString(16) 
                            + ', v' + yvalue.toString(16) + '\n';
                    break;
                    case 0x1:
                        opcode = instr;
                        outputString += 'or v' + xvalue.toString(16) 
                            + ', v' + yvalue.toString(16) + '\n';
                    break;
                    case 0x2:
                        opcode = instr;
                        outputString += 'and v' + xvalue.toString(16) 
                            + ', v' + yvalue.toString(16) + '\n';
                    break;
                    case 0x3:
                        opcode = instr;
                        outputString += 'xor v' + xvalue.toString(16) 
                            + ', v' + yvalue.toString(16) + '\n';
                    break;
                    case 0x4:
                        opcode = instr;
                        outputString += 'add v' + xvalue.toString(16) 
                            + ', v' + yvalue.toString(16) + '\n';
                    break;
                    case 0x5:
                        opcode = instr;
                        outputString += 'sub v' + xvalue.toString(16) 
                            + ', v' + yvalue.toString(16) + '\n';
                    break;
                    case 0x6:
                        opcode = instr;
                        if(yvalue == 0) {
                            outputString += 'shr v' + xvalue.toString(16) 
                                + '\n';
                        } else {
                            outputString += 'word 0x' + instr.toString(16) + '\n';
                        }
                    break;
                    case 0x7:
                        opcode = instr;
                        outputString += 'subn v' + xvalue.toString(16) 
                            + ', v' + yvalue.toString(16) + '\n';
                    break;
                    case 0xE:
                        opcode = instr;
                        if(yvalue == 0) {
                            outputString += 'shl v' + xvalue.toString(16) 
                                + '\n';
                        } else {
                            outputString += 'word 0x' + instr.toString(16) + '\n';
                        }
                    break;
                }
            break;
            case 0x9000:
                opcode = (instr & 0xF000) >> 12;
                if(instr & 0xF == 0) {
                    outputString += 'sne v' + xvalue.toString(16) 
                        + ', v' + yvalue.toString(16) + '\n';
                } else {
                    outputString += 'word 0x' + instr.toString(16) + '\n';
                }
            break;
            case 0xA000:
                opcode = (instr & 0xF000) >> 12;
                if(value in labelValues)
                outputString += 'ld i, @' + labelValues[value]
                    + ' ; word 0x' + instr.toString(16) + '\n';
                else
                outputString += 'ld i, 0x' + value.toString(16)
                    + ' ; word 0x' + instr.toString(16) + '\n';
            break;
            case 0xC000:
                opcode = (instr & 0xF000) >> 12;
                outputString += 'rnd v' + xvalue.toString(16) + ', ' + nvalue + '\n';
            break;
            case 0xD000:
                opcode = (instr & 0xF000) >> 12;
                outputString += 'drw v' + xvalue.toString(16) 
                    + ', v' + yvalue.toString(16) 
                    + ', ' + hvalue + '\n';
            break;
            case 0xE000:
                switch(instr & 0xFF) {
                    case 0x9E:
                        opcode = instr;
                        outputString += 'skp v' + xvalue.toString(16) + '\n';
                    break;
                    case 0xA1:
                        opcode = instr;
                        outputString += 'sknp v' + xvalue.toString(16) + '\n';
                    break;
                }
            break;
            case 0xF000:
                switch(instr & 0xFF) {
                    case 0x07:
                        opcode = instr;
                        outputString += 'ld v' + xvalue.toString(16) + ', dt\n';
                    break;
                    case 0x0A:
                        opcode = instr;
                        outputString += 'ld v' + xvalue.toString(16) + ', k\n';
                    break;
                    case 0x15:
                        opcode = instr;
                        outputString += 'ld dt, v' + xvalue.toString(16) + '\n';
                    break;
                    case 0x18:
                        opcode = instr;
                        outputString += 'ld st, v' + xvalue.toString(16) + '\n';
                    break;
                    case 0x1E:
                        opcode = instr;
                        outputString += 'add i, v' + xvalue.toString(16) + '\n';
                    break;
                    case 0x29:
                        opcode = instr;
                        outputString += 'ld f, v' + xvalue.toString(16) + '\n';
                    break;
                    case 0x33:
                        opcode = instr;
                        outputString += 'ld b, v' + xvalue.toString(16) + '\n';
                    break;
                    case 0x55:
                        opcode = instr;
                        outputString += 'ld [i], v' + xvalue.toString(16) + '\n';
                    break;
                    case 0x65:
                        opcode = instr;
                        outputString += 'ld v' + xvalue.toString(16) + ', [i]\n';
                    break;
                }
                break;
        }
        if(opcode == 0) {
            outputString += 'word 0x' + instr.toString(16) + '\n';
        }
    }
    return outputString;
}};