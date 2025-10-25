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
        FunctionDeclaration(path: NodePath<t.FunctionDeclaration>): void;
    };
};

export { type PluginOptions, babelPluginUseAi as default };
