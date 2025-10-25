import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';

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
    post(): Promise<void[]>;
};

export { type PluginOptions, babelPluginUseAi as default };
