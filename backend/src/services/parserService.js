const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const path = require('path');
const fs = require('fs');

/**
 * ParserService: Parses source files into AST and extracts code symbols,
 * imports, exports, API endpoints, and function invocation calls.
 */
class ParserService {
  /**
   * Parse a single file content into AST and structured symbols
   * @param {string} code - source code string
   * @param {string} relativeFilePath - file path relative to repo root
   */
  parseFile(code, relativeFilePath) {
    const ext = path.extname(relativeFilePath).toLowerCase();
    const isTs = ext === '.ts' || ext === '.tsx';
    const isJsx = ext === '.jsx' || ext === '.tsx';

    const result = {
      filePath: relativeFilePath.replace(/\\/g, '/'),
      fileName: path.basename(relativeFilePath),
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      routes: [],
      calls: [], // function invocations { callerName, calleeName, line }
      errors: [],
    };

    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: 'unambiguous',
        allowReturnOutsideFunction: true,
        allowImportExportEverywhere: true,
        plugins: [
          'asyncDoExpressions',
          'asyncGenerators',
          'classProperties',
          'classPrivateProperties',
          'classPrivateMethods',
          'decorators-legacy',
          'doExpressions',
          'dynamicImport',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'functionBind',
          'functionSent',
          'importMeta',
          'nullishCoalescingOperator',
          'numericSeparator',
          'objectRestSpread',
          'optionalCatchBinding',
          'optionalChaining',
          'throwExpressions',
          'topLevelAwait',
          isTs ? 'typescript' : null,
          isJsx ? 'jsx' : null,
        ].filter(Boolean),
      });
    } catch (err) {
      result.errors.push(`Parse error in ${relativeFilePath}: ${err.message}`);
      return result;
    }

    const lines = code.split('\n');

    // Helper: get leading docstring / comment
    const getDocstring = (node) => {
      if (node.leadingComments && node.leadingComments.length > 0) {
        return node.leadingComments.map((c) => c.value.trim()).join('\n');
      }
      return '';
    };

    // Helper: extract function parameters
    const getParams = (paramNodes) => {
      if (!paramNodes) return [];
      return paramNodes
        .map((p) => {
          if (p.type === 'Identifier') return p.name;
          if (p.type === 'AssignmentPattern' && p.left?.type === 'Identifier') {
            return `${p.left.name} = default`;
          }
          if (p.type === 'RestElement' && p.argument?.type === 'Identifier') {
            return `...${p.argument.name}`;
          }
          if (p.type === 'ObjectPattern') return '{...}';
          if (p.type === 'ArrayPattern') return '[...]';
          return 'param';
        })
        .filter(Boolean);
    };

    // Map scope tracking to identify currently active function/class
    let currentScopeStack = [];

    try {
      traverse(ast, {
        // --- IMPORTS ---
        ImportDeclaration(pathNode) {
          const source = pathNode.node.source.value;
          const specifiers = pathNode.node.specifiers.map((s) => {
            if (s.type === 'ImportDefaultSpecifier') {
              return { local: s.local.name, imported: 'default', isDefault: true };
            }
            if (s.type === 'ImportNamespaceSpecifier') {
              return { local: s.local.name, imported: '*', isNamespace: true };
            }
            if (s.type === 'ImportSpecifier') {
              return {
                local: s.local.name,
                imported: s.imported.type === 'Identifier' ? s.imported.name : s.imported.value,
                isDefault: false,
              };
            }
            return { local: 'unknown', imported: 'unknown' };
          });

          result.imports.push({
            source,
            specifiers,
            startLine: pathNode.node.loc?.start.line || 1,
            endLine: pathNode.node.loc?.end.line || 1,
          });
        },

        // --- COMMONJS REQUIRE ---
        CallExpression(pathNode) {
          const callee = pathNode.node.callee;
          const loc = pathNode.node.loc;

          // Check require(...)
          if (
            callee.type === 'Identifier' &&
            callee.name === 'require' &&
            pathNode.node.arguments.length > 0 &&
            pathNode.node.arguments[0].type === 'StringLiteral'
          ) {
            const source = pathNode.node.arguments[0].value;
            let local = path.basename(source);
            // Check if assigned in VariableDeclarator
            if (pathNode.parent?.type === 'VariableDeclarator') {
              if (pathNode.parent.id.type === 'Identifier') {
                local = pathNode.parent.id.name;
              } else if (pathNode.parent.id.type === 'ObjectPattern') {
                local = pathNode.parent.id.properties
                  .map((p) => p.key?.name)
                  .filter(Boolean)
                  .join(', ');
              }
            }
            result.imports.push({
              source,
              specifiers: [{ local, imported: 'default', isRequire: true }],
              startLine: loc?.start.line || 1,
              endLine: loc?.end.line || 1,
            });
            return;
          }

          // --- API ROUTES DETECTION (Express, Router, Koa) ---
          // e.g. app.get('/users', handler), router.post('/login', authController.login)
          if (
            callee.type === 'MemberExpression' &&
            callee.property?.type === 'Identifier' &&
            ['get', 'post', 'put', 'delete', 'patch', 'use', 'all'].includes(
              callee.property.name.toLowerCase()
            )
          ) {
            const httpMethod = callee.property.name.toUpperCase();
            const firstArg = pathNode.node.arguments[0];

            if (firstArg && (firstArg.type === 'StringLiteral' || firstArg.type === 'TemplateLiteral')) {
              let routePath = '';
              if (firstArg.type === 'StringLiteral') {
                routePath = firstArg.value;
              } else if (firstArg.type === 'TemplateLiteral') {
                routePath = firstArg.quasis.map((q) => q.value.raw).join('${...}');
              }

              // Extract handler names from remaining arguments
              const handlers = [];
              for (let i = 1; i < pathNode.node.arguments.length; i++) {
                const arg = pathNode.node.arguments[i];
                if (arg.type === 'Identifier') {
                  handlers.push(arg.name);
                } else if (arg.type === 'MemberExpression') {
                  const obj = arg.object.name || 'obj';
                  const prop = arg.property.name || 'fn';
                  handlers.push(`${obj}.${prop}`);
                } else if (
                  arg.type === 'FunctionExpression' ||
                  arg.type === 'ArrowFunctionExpression'
                ) {
                  handlers.push(`anonymous_${httpMethod}_${routePath}_L${arg.loc?.start.line}`);
                }
              }

              result.routes.push({
                method: httpMethod,
                path: routePath,
                handlers,
                startLine: loc?.start.line || 1,
                endLine: loc?.end.line || 1,
              });
            }
          }

          // --- FUNCTION CALL INVOCATIONS (Tracing graph edges) ---
          let calleeName = '';
          if (callee.type === 'Identifier') {
            calleeName = callee.name;
          } else if (callee.type === 'MemberExpression') {
            const objName = callee.object?.name || (callee.object?.property?.name ? `this.${callee.object.property.name}` : 'object');
            const propName = callee.property?.name || 'method';
            calleeName = `${objName}.${propName}`;
          }

          if (calleeName && calleeName !== 'require' && calleeName !== 'console.log') {
            const currentScope = currentScopeStack[currentScopeStack.length - 1] || 'global';
            result.calls.push({
              caller: currentScope,
              callee: calleeName,
              line: loc?.start.line || 1,
            });
          }
        },

        // --- CLASSES & METHODS ---
        ClassDeclaration: {
          enter(pathNode) {
            const name = pathNode.node.id ? pathNode.node.id.name : 'AnonymousClass';
            const superClass = pathNode.node.superClass?.name || null;
            const docstring = getDocstring(pathNode.node);

            result.classes.push({
              name,
              superClass,
              docstring,
              startLine: pathNode.node.loc?.start.line || 1,
              endLine: pathNode.node.loc?.end.line || 1,
              methods: [],
            });

            currentScopeStack.push(`class:${name}`);
          },
          exit() {
            currentScopeStack.pop();
          },
        },

        ClassMethod(pathNode) {
          const methodName = pathNode.node.key?.name || 'anonymousMethod';
          const isConstructor = pathNode.node.kind === 'constructor';
          const isStatic = pathNode.node.static || false;
          const isAsync = pathNode.node.async || false;
          const params = getParams(pathNode.node.params);
          const docstring = getDocstring(pathNode.node);

          const currentClass = result.classes[result.classes.length - 1];
          const methodInfo = {
            name: methodName,
            isConstructor,
            isStatic,
            async: isAsync,
            params,
            docstring,
            startLine: pathNode.node.loc?.start.line || 1,
            endLine: pathNode.node.loc?.end.line || 1,
          };

          if (currentClass) {
            currentClass.methods.push(methodInfo);
          }

          // Also treat methods as callable function units in graph
          result.functions.push({
            ...methodInfo,
            parentClass: currentClass ? currentClass.name : null,
            fullName: currentClass ? `${currentClass.name}.${methodName}` : methodName,
          });
        },

        // --- FUNCTION DECLARATIONS ---
        FunctionDeclaration: {
          enter(pathNode) {
            const name = pathNode.node.id ? pathNode.node.id.name : 'anonymous';
            const params = getParams(pathNode.node.params);
            const isAsync = pathNode.node.async || false;
            const docstring = getDocstring(pathNode.node);

            result.functions.push({
              name,
              fullName: name,
              params,
              async: isAsync,
              docstring,
              startLine: pathNode.node.loc?.start.line || 1,
              endLine: pathNode.node.loc?.end.line || 1,
              parentClass: null,
            });

            currentScopeStack.push(name);
          },
          exit() {
            currentScopeStack.pop();
          },
        },

        // --- ARROW FUNCTIONS & FUNCTION EXPRESSIONS ---
        VariableDeclarator: {
          enter(pathNode) {
            const init = pathNode.node.init;
            if (
              init &&
              (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') &&
              pathNode.node.id.type === 'Identifier'
            ) {
              const name = pathNode.node.id.name;
              const params = getParams(init.params);
              const isAsync = init.async || false;
              const docstring = getDocstring(pathNode.parent);

              result.functions.push({
                name,
                fullName: name,
                params,
                async: isAsync,
                docstring,
                startLine: pathNode.node.loc?.start.line || 1,
                endLine: pathNode.node.loc?.end.line || 1,
                parentClass: null,
              });

              currentScopeStack.push(name);
            }
          },
          exit(pathNode) {
            const init = pathNode.node.init;
            if (
              init &&
              (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') &&
              pathNode.node.id.type === 'Identifier'
            ) {
              currentScopeStack.pop();
            }
          },
        },

        // --- EXPORTS ---
        ExportNamedDeclaration(pathNode) {
          const loc = pathNode.node.loc;
          if (pathNode.node.declaration) {
            const decl = pathNode.node.declaration;
            if (decl.type === 'FunctionDeclaration' && decl.id) {
              result.exports.push({
                name: decl.id.name,
                isDefault: false,
                line: loc?.start.line || 1,
              });
            } else if (decl.type === 'ClassDeclaration' && decl.id) {
              result.exports.push({
                name: decl.id.name,
                isDefault: false,
                line: loc?.start.line || 1,
              });
            } else if (decl.type === 'VariableDeclaration') {
              decl.declarations.forEach((d) => {
                if (d.id?.type === 'Identifier') {
                  result.exports.push({
                    name: d.id.name,
                    isDefault: false,
                    line: loc?.start.line || 1,
                  });
                }
              });
            }
          } else if (pathNode.node.specifiers) {
            pathNode.node.specifiers.forEach((s) => {
              result.exports.push({
                name: s.exported?.name || 'unknown',
                isDefault: s.exported?.name === 'default',
                line: loc?.start.line || 1,
              });
            });
          }
        },

        ExportDefaultDeclaration(pathNode) {
          const loc = pathNode.node.loc;
          let name = 'default';
          const decl = pathNode.node.declaration;
          if (decl.id?.name) {
            name = decl.id.name;
          } else if (decl.name) {
            name = decl.name;
          }
          result.exports.push({
            name,
            isDefault: true,
            line: loc?.start.line || 1,
          });
        },

        AssignmentExpression(pathNode) {
          // Detect module.exports = ... or exports.foo = ...
          const left = pathNode.node.left;
          if (left.type === 'MemberExpression') {
            if (left.object?.name === 'module' && left.property?.name === 'exports') {
              result.exports.push({
                name: pathNode.node.right?.name || 'default',
                isDefault: true,
                line: pathNode.node.loc?.start.line || 1,
              });
            } else if (left.object?.name === 'exports' && left.property?.name) {
              result.exports.push({
                name: left.property.name,
                isDefault: false,
                line: pathNode.node.loc?.start.line || 1,
              });
            }
          }
        },
      });
    } catch (walkErr) {
      result.errors.push(`Traversal warning in ${relativeFilePath}: ${walkErr.message}`);
    }

    // Mark exported status on functions and classes
    const exportNames = new Set(result.exports.map((e) => e.name));
    result.functions.forEach((fn) => {
      if (exportNames.has(fn.name) || exportNames.has(fn.fullName) || exportNames.has('default')) {
        fn.exported = true;
      }
    });
    result.classes.forEach((cls) => {
      if (exportNames.has(cls.name) || exportNames.has('default')) {
        cls.exported = true;
      }
    });

    return result;
  }
}

module.exports = new ParserService();
