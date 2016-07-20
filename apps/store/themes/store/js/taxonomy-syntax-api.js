/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var TaxonomySyntaxAPI = {};
(function() {
    var SYMBOL_OR = 'OR';
    var SYMBOL_AND = 'AND';
    var SYMBOL_EXP_START = '(';
    var SYMBOL_EXP_STOP = ')';
    TaxonomySyntaxAPI.buildExpression = function(input, clean) {
        clean = clean || function(v) {
            return v;
        };
        var expression = buildExpression(input, clean);
        if (expression.operator === SYMBOL_OR) {
            var root = new Expression();
            root.operator = SYMBOL_AND;
            root.children.push(expression);
            return root;
        }
        return expression;
    };
    TaxonomySyntaxAPI.OR = SYMBOL_OR;
    TaxonomySyntaxAPI.AND = SYMBOL_AND;
    TaxonomySyntaxAPI.Expression = Expression;

    function Operand(value) {
        this.termString = value;
        this.terms = value.split('/');
    }
    Operand.prototype.root = function() {
        return this.terms[0] || '';
    };
    Operand.prototype.matchRoot = function(other) {
        return (this.root() === other.root());
    }
    Operand.prototype.match = function(other) {
        return (this.raw() === other.raw());
    };
    Operand.prototype.raw = function() {
        return this.termString;
    }

    function Group(expression) {
        this.expression = expression;
    };
    Group.prototype.hasOperand = function(other) {
        return this.countMatchingOperands(other) > 1;
    };
    Group.prototype.hasOnlyOneOperand = function(other) {
        return this.countMatchingOperands(other) === 1;
    };
    Group.prototype.operandIndex = function(other) {
        var operands = this.expression.operands;
        var currentOp;
        var operandIndex = -1;
        operands.forEach(function(value, index) {
            currentOp = new Operand(value);
            if (currentOp.matchRoot(other)) {
                operandIndex = index;
            }
        });
        return operandIndex;
    };
    Group.prototype.operandAtIndex = function(index) {
        return this.expression.operands[index];
    };
    Group.prototype.countMatchingOperands = function(other) {
        var operands = this.expression.operands;
        var currentOp;
        var match = 0;
        operands.forEach(function(value) {
            currentOp = new Operand(value);
            if (currentOp.matchRoot(other)) {
                match++;
            }
        });
        return match;
    };
    Group.prototype.mergeOperands = function(other) {
        //Remove the matching operand
        var operandIndex = this.operandIndex(other);
        //If it is not found do not do anything
        if (operandIndex <= -1) {
            return;
        }
        var operandToBeRemoved = this.operandAtIndex(operandIndex);
        this.expression.operands.splice(operandIndex, 1);
        var newExpression = new Expression();
        newExpression.operands.push(operandToBeRemoved);
        newExpression.operands.push(other.raw());
        newExpression.operator = SYMBOL_OR;
        this.expression.children.push(newExpression);
    };
    Group.prototype.add = function(operand) {
        if (this.hasOnlyOneOperand(operand)) {
            //Merge existing operand with new and add it as a child
            this.mergeOperands(operand);
        } else {
            //Add the operand to other operands
            this.expression.operands.push(operand.raw());
        }
    };
    Group.prototype.remove = function(operand) {
        var removeIndex = -1;
        //Check if there is only one operand
        if (this.hasOnlyOneOperand(operand)) {
            removeIndex = this.operandIndex(operand);
            this.expression.operands.splice(removeIndex, 1);
        } else {
            //Find and remove the exact match
            var currentOp;
            this.expression.operands.forEach(function(current, index) {
                currentOp = new Operand(current);
                if (currentOp.match(operand)) {
                    removeIndex = index;
                }
            });
            if (removeIndex > -1) {
                this.expression.operands.splice(removeIndex, 1);
            }
        }
    };

    function Expression() {
        this.operator = '';
        this.operands = [];
        this.children = [];
    }
    Expression.prototype.hasChildren = function() {
        return this.children.length > 0;
    };
    Expression.prototype.add = function(value) {
        //Locate the expression 
        var operand = new Operand(value);
        var result = rsearch(this, operand.root());
        if (!result) {
            //Add it to the existing operands
            this.operands.push(value);
            return;
        }
        var group = new Group(result);
        group.add(operand);
    };
    Expression.prototype.remove = function(value) {
        var operand = new Operand(value);
        var result = rsearch(this, operand.root());
        if (!result) {
            return;
        }
        var group = new Group(result);
        group.remove(operand);
    };
    Expression.prototype.query = function(q) {
        q = q || '';
        var terms = q.split('/');
        return rsearch(this, terms[0]);
    };
    Expression.prototype.buildExpressionString = function(decorator) {
        decorator = decorator || function(v) {
            return v;
        };
        var modifiedOperands = this.operands.map(function(v) {
            return decorator(v);
        });
        if (this.operands.length == 0) {
            return '';
        }
        if (this.operands.length === 1) {
            return modifiedOperands[0];
        }
        var content = modifiedOperands.join(' ' + this.operator + ' ');
        if (this.operator === SYMBOL_OR) {
            content = '( ' + content + ' )'
        }
        return content;
        //return '( ' + modifiedOperands.join(' ' + this.operator + ' ') + ' )';
    };
    Expression.prototype.compile = function(decorator) {
        //return rprint(this, '', decorator);
        return patch_add_braces(rprint(this, '', decorator));
    };
    /**
     * Adding url taxonomy category retrieve options with 2d array
     * @returns {Array}
     */
    Expression.prototype.groups = function() {
        var mainCol = [];
        this.operands.forEach(function(value) {
            mainCol.push([value]);
        });
        this.children.forEach(function(child) {
            mainCol.push(child.operands);
        });
        return mainCol;
    };

    function buildExpression(expression, clean) {
        symbols = expression.split(' ');
        symbols.reverse();
        if (symbols.length === 1) {
            var singleExpression = new Expression();
            singleExpression.operands.push(symbols[0]);
            singleExpression.operator = SYMBOL_AND;
            return singleExpression;
        }
        var stack = [];
        var x = rbuild(symbols, symbols.pop(), null, stack);
        var t = processStack(x);
        return t;
    }

    function processStack(stack) {
        var base = new Expression();
        base.operator = SYMBOL_AND;
        var item;
        if (stack.length === 1) {
            return stack[0];
        }
        for (var index = 0; index < stack.length; index++) {
            item = stack[index];
            // if (item !== SYMBOL_AND) {
            if (item.operator === SYMBOL_AND) {
                item.operands.forEach(function(operand) {
                    base.operands.push(operand);
                });
            } else {
                if (item.operands.length == 1) {
                    base.operands.push(item.operands[0]);
                } else {
                    base.children.push(item);
                }
            }
            //}
        }
        return base;
    }

    function rbuild(symbols, currentValue, expression, stack) {
        if (!currentValue) {
            //stack.push(expression);
            return stack;
        } else if (currentValue === SYMBOL_EXP_START) {
            if (expression) {
                stack.push(expression);
            }
            var newExpression = new Expression();
            newExpression.operator = SYMBOL_AND;
            return rbuild(symbols, symbols.pop(), newExpression, stack);
        } else if (currentValue === SYMBOL_EXP_STOP) {
            stack.push(expression);
            return rbuild(symbols, symbols.pop(), new Expression(), stack);
        } else if (currentValue === SYMBOL_AND) {
            //stack.push(SYMBOL_AND);
            expression.operator = SYMBOL_AND;
            return rbuild(symbols, symbols.pop(), expression, stack);
        } else if (currentValue === SYMBOL_OR) {
            expression.operator = SYMBOL_OR;
            return rbuild(symbols, symbols.pop(), expression, stack);
        } else {
            expression.operands.push(currentValue);
            return rbuild(symbols, symbols.pop(), expression, stack);
        }
    }

    function rprint(expression, output, decorator) {
        if (!expression.hasChildren()) {
            return expression.buildExpressionString(decorator);
        } else {
            var entries = [];
            var previousExpressions = 0;
            expression.children.forEach(function(child, index) {
                var result = rprint(child, output, decorator);
                if (result != '') {
                    entries.push(result);
                }
            });
            output += entries.join(' ' + expression.operator + ' ');
            previousExpressions = entries.length;
            entries = [];
            if (output != '') {
                entries.push(output);
            }
            var thisExpression = expression.buildExpressionString(decorator);
            if (thisExpression != '') {
                entries.push(thisExpression);
            }
            output = entries.join(' ' + expression.operator + ' ');
            if (previousExpressions > 1) {
                return '( ' + output + ' )';
            }
            if (entries.length === 1) {
                return output;
            }
            return '( ' + output + ' )';
        }
    }
    /**
    Performs a recursive search on an expression object to find the expression with the matching operand
    **/
    function rsearch(expression, query) {
        if (!expression.hasChildren()) {
            var found;
            for (var index = 0; index < expression.operands.length; index++) {
                if (expression.operands[index].indexOf(query) > -1) {
                    return expression;
                }
            }
            return null;
        } else {
            var result;
            //Check if the current operands can satisfy the query
            for (var index = 0; index < expression.operands.length; index++) {
                if (expression.operands[index].indexOf(query) > -1) {
                    return expression;
                }
            }
            for (var index = 0; index < expression.children.length; index++) {
                result = rsearch(expression.children[index], query);
                if (result) {
                    return result;
                }
            }
        }
    }

    function patch_add_braces(input) {
        var hasAnd = input.indexOf(SYMBOL_AND) > -1; //This means it has more than one operand
        var hasNoEnclosingBraces = ((input.charAt(0) !== '(') || (input.charAt(input.length - 1) !== ')'));
        if (hasAnd && hasNoEnclosingBraces) {
            return '( ' + input + ' )';
        }
        return input;
    }
}());