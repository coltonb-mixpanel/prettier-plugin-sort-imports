import { ImportDeclaration } from '@babel/types';
import { describe, expect, it } from 'vitest';

import { getSortedNodesGroup } from '../get-sorted-nodes-group.js';

const createImportDeclaration = (
    source: string,
    start: number,
    end: number,
    specifierType:
        | 'ImportDefaultSpecifier'
        | 'ImportNamespaceSpecifier'
        | 'ImportSpecifier' = 'ImportDefaultSpecifier',
): ImportDeclaration =>
    ({
        type: 'ImportDeclaration',
        source: { value: source },
        start,
        end,
        specifiers: [{ type: specifierType }],
    }) as unknown as ImportDeclaration;

describe('getSortedNodesGroup', () => {
    describe('when importOrderSortGroups is false', () => {
        it('should not sort imports', () => {
            const imports = [
                createImportDeclaration('zod', 0, 20),
                createImportDeclaration('axios', 0, 25),
                createImportDeclaration('react', 0, 22),
            ];

            const result = getSortedNodesGroup(imports, {
                importOrderSortGroups: false,
                importOrderGroupNamespaceSpecifiers: false,
                importOrderSortByLength: null,
            });

            expect(result.map((i) => i.source.value)).toEqual([
                'zod',
                'axios',
                'react',
            ]);
        });
    });

    describe('when importOrderSortGroups is true', () => {
        it('should sort imports alphabetically using natural sort', () => {
            const imports = [
                createImportDeclaration('zod', 0, 20),
                createImportDeclaration('axios', 0, 25),
                createImportDeclaration('react', 0, 22),
            ];

            const result = getSortedNodesGroup(imports, {
                importOrderSortGroups: true,
                importOrderGroupNamespaceSpecifiers: false,
                importOrderSortByLength: null,
            });

            expect(result.map((i) => i.source.value)).toEqual([
                'axios',
                'react',
                'zod',
            ]);
        });

        it('should handle numeric suffixes with natural sort', () => {
            const imports = [
                createImportDeclaration('file10', 0, 20),
                createImportDeclaration('file2', 0, 20),
                createImportDeclaration('file1', 0, 20),
            ];

            const result = getSortedNodesGroup(imports, {
                importOrderSortGroups: true,
                importOrderGroupNamespaceSpecifiers: false,
                importOrderSortByLength: null,
            });

            expect(result.map((i) => i.source.value)).toEqual([
                'file1',
                'file2',
                'file10',
            ]);
        });
    });

    describe('when importOrderSortByLength is "asc"', () => {
        it('should sort imports by length ascending', () => {
            const imports = [
                createImportDeclaration('react', 0, 30),
                createImportDeclaration('zod', 0, 15),
                createImportDeclaration('axios', 0, 25),
            ];

            const result = getSortedNodesGroup(imports, {
                importOrderSortGroups: true,
                importOrderGroupNamespaceSpecifiers: false,
                importOrderSortByLength: 'asc',
            });

            expect(result.map((i) => i.source.value)).toEqual([
                'zod',
                'axios',
                'react',
            ]);
        });

        it('should use localeCompare as tiebreaker when lengths are equal', () => {
            const imports = [
                createImportDeclaration('zod', 0, 20),
                createImportDeclaration('aaa', 0, 20),
                createImportDeclaration('bbb', 0, 20),
            ];

            const result = getSortedNodesGroup(imports, {
                importOrderSortGroups: true,
                importOrderGroupNamespaceSpecifiers: false,
                importOrderSortByLength: 'asc',
            });

            expect(result.map((i) => i.source.value)).toEqual([
                'aaa',
                'bbb',
                'zod',
            ]);
        });
    });

    describe('when importOrderSortByLength is "desc"', () => {
        it('should sort imports by length descending', () => {
            const imports = [
                createImportDeclaration('zod', 0, 15),
                createImportDeclaration('react', 0, 30),
                createImportDeclaration('axios', 0, 25),
            ];

            const result = getSortedNodesGroup(imports, {
                importOrderSortGroups: true,
                importOrderGroupNamespaceSpecifiers: false,
                importOrderSortByLength: 'desc',
            });

            expect(result.map((i) => i.source.value)).toEqual([
                'react',
                'axios',
                'zod',
            ]);
        });

        it('should use localeCompare as tiebreaker when lengths are equal', () => {
            const imports = [
                createImportDeclaration('zod', 0, 20),
                createImportDeclaration('aaa', 0, 20),
                createImportDeclaration('bbb', 0, 20),
            ];

            const result = getSortedNodesGroup(imports, {
                importOrderSortGroups: true,
                importOrderGroupNamespaceSpecifiers: false,
                importOrderSortByLength: 'desc',
            });

            expect(result.map((i) => i.source.value)).toEqual([
                'aaa',
                'bbb',
                'zod',
            ]);
        });
    });

    describe('when importOrderGroupNamespaceSpecifiers is true', () => {
        it('should prioritize namespace specifiers', () => {
            const imports = [
                createImportDeclaration(
                    'axios',
                    0,
                    25,
                    'ImportDefaultSpecifier',
                ),
                createImportDeclaration(
                    'react',
                    0,
                    22,
                    'ImportNamespaceSpecifier',
                ),
                createImportDeclaration('zod', 0, 20, 'ImportDefaultSpecifier'),
            ];

            const result = getSortedNodesGroup(imports, {
                importOrderSortGroups: true,
                importOrderGroupNamespaceSpecifiers: true,
                importOrderSortByLength: null,
            });

            expect(result.map((i) => i.source.value)).toEqual([
                'react',
                'axios',
                'zod',
            ]);
        });

        it('should sort namespace specifiers among themselves', () => {
            const imports = [
                createImportDeclaration(
                    'zod',
                    0,
                    20,
                    'ImportNamespaceSpecifier',
                ),
                createImportDeclaration(
                    'axios',
                    0,
                    25,
                    'ImportNamespaceSpecifier',
                ),
                createImportDeclaration(
                    'react',
                    0,
                    22,
                    'ImportDefaultSpecifier',
                ),
            ];

            const result = getSortedNodesGroup(imports, {
                importOrderSortGroups: true,
                importOrderGroupNamespaceSpecifiers: true,
                importOrderSortByLength: null,
            });

            expect(result.map((i) => i.source.value)).toEqual([
                'axios',
                'zod',
                'react',
            ]);
        });
    });

    describe('edge cases', () => {
        it('should handle empty imports array', () => {
            const result = getSortedNodesGroup([], {
                importOrderSortGroups: true,
                importOrderGroupNamespaceSpecifiers: false,
                importOrderSortByLength: null,
            });

            expect(result).toEqual([]);
        });

        it('should handle single import', () => {
            const imports = [createImportDeclaration('react', 0, 22)];

            const result = getSortedNodesGroup(imports, {
                importOrderSortGroups: true,
                importOrderGroupNamespaceSpecifiers: false,
                importOrderSortByLength: null,
            });

            expect(result.map((i) => i.source.value)).toEqual(['react']);
        });

        it('should handle imports with undefined start/end', () => {
            const imports = [
                {
                    type: 'ImportDeclaration',
                    source: { value: 'react' },
                    specifiers: [],
                } as unknown as ImportDeclaration,
                {
                    type: 'ImportDeclaration',
                    source: { value: 'axios' },
                    specifiers: [],
                } as unknown as ImportDeclaration,
            ];

            const result = getSortedNodesGroup(imports, {
                importOrderSortGroups: true,
                importOrderGroupNamespaceSpecifiers: false,
                importOrderSortByLength: 'asc',
            });

            expect(result.map((i) => i.source.value)).toEqual([
                'axios',
                'react',
            ]);
        });
    });
});
