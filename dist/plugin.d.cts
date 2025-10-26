import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

interface PluginOptions {
    apiKey?: string;
    model?: string;
    temperature?: number;
}
declare function babelPluginUseAi(_babelApi: any, options?: PluginOptions): {
    name: string;
    visitor: {
        FunctionExpression(path: NodePath<t.FunctionExpression>): void;
        ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>): void;
        ObjectMethod(path: NodePath<t.ObjectMethod>): void;
        FunctionDeclaration(path: NodePath<t.FunctionDeclaration>): void;
    };
};

export { type PluginOptions, babelPluginUseAi as default };
