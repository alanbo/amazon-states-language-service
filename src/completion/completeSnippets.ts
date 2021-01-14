/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
    ASTNode,
    CompletionItem,
    CompletionItemKind,
    InsertTextFormat,
    PropertyASTNode
} from 'vscode-json-languageservice'

import {
    findPropChildByName,
    insideStateNode,
    isChildOfStates,
    isObjectNode,
} from '../utils/astUtilityFunctions'

import errorHandlingSnippetsRaw from '../snippets/error_handling.json'
import stateSnippetsRaw from '../snippets/states.json'

interface Snippet {
    name: string,
    body: string[],
    description: string
}

const ERROR_HANDLING_STATES = ['Task', 'Parallel', 'Map']
export const stateSnippets = parseSnippetsFromJson(stateSnippetsRaw)
export const errorHandlingSnippets = parseSnippetsFromJson(errorHandlingSnippetsRaw)

function parseSnippetsFromJson(json: Snippet[]): CompletionItem[] {
    return json.map(snippet => {
        const item = CompletionItem.create(snippet.name)
        item.kind = CompletionItemKind.Snippet
        item.insertTextFormat = InsertTextFormat.Snippet
        item.insertText = snippet.body.join('\n')
        item.documentation = snippet.description

        return item
    })
}

function doesStateSupportErrorHandling(node: ASTNode): boolean {
    let typeNode: PropertyASTNode | undefined

    if(isObjectNode(node)) {
        typeNode = findPropChildByName(node, 'Type')
    }

    return ERROR_HANDLING_STATES.includes(typeNode?.valueNode?.value as string)
}
interface CompleteSnippetsOptions {
    shouldShowStateSnippets?: boolean,
    shouldShowErrorSnippets?: {
        shouldShowRetrySnippet: boolean,
        shouldShowCatchSnippet: boolean
    }
}

export default function completeSnippets(node: ASTNode | undefined, offset: number, options?: CompleteSnippetsOptions): CompletionItem[] {
    if (node) {
        const errorSnippetOptionsNotDefined = options?.shouldShowErrorSnippets === undefined

        if (options?.shouldShowStateSnippets) {
            return stateSnippets
        }

        // If the value of shouldShowStateSnippets is false prevent the snippets from being displayed
        if (options?.shouldShowStateSnippets === undefined && isChildOfStates(node)) {
            return stateSnippets
        }

        if (errorSnippetOptionsNotDefined) {
            if (insideStateNode(node) && doesStateSupportErrorHandling(node)) {
                return errorHandlingSnippets
            }

            return []
        }

        const errorSnippetsToShow: string[] = []

        if (options?.shouldShowErrorSnippets?.shouldShowCatchSnippet) {
            errorSnippetsToShow.push('Catch')
        }

        if (options?.shouldShowErrorSnippets?.shouldShowRetrySnippet) {
            errorSnippetsToShow.push('Retry')
        }

        if (errorSnippetsToShow.length) {
            return errorHandlingSnippets.filter(snippet => errorSnippetsToShow.includes(snippet.label))
        }
    }

    return []
}
