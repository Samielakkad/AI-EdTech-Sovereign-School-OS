import { ParsedContent } from '../types.ts';

// The function to parse text for interactive widgets like [MULTIPLE_CHOICE:...]
export const parseInteractiveContent = (text: string, messageId: string): ParsedContent[] => {
    // This regex looks for any of our defined widget types
    const regex = /\[(FILL_IN_BLANK|MULTIPLE_CHOICE|MATCHING|ORDERING|FIND_THE_MISTAKE|CATEGORIZATION):(.*?)\]/gs;
    const result: ParsedContent[] = [];
    let lastIndex = 0;
    let match;
    let widgetIndex = 0;

    while ((match = regex.exec(text)) !== null) {
        // Add any text before the current match
        if (match.index > lastIndex) {
            result.push({ type: 'text', value: text.substring(lastIndex, match.index) });
        }
        
        const type = match[1];
        const value = match[2];
        const widgetId = `${messageId}-${widgetIndex++}`;
        
        // Process each widget type
        if (type === 'FILL_IN_BLANK') {
            const [sentencePart, ...wordBank] = value.split('|');
            const parts = sentencePart.match(/(.*){(.*)}(.*)/s);
            if (parts) {
                result.push({ 
                    type: 'fill_in_blank', 
                    before: parts[1], 
                    answer: parts[2], 
                    after: parts[3], 
                    wordBank: wordBank.length > 0 ? wordBank : undefined,
                    id: widgetId 
                });
            }
        } else if (type === 'MULTIPLE_CHOICE') {
            const [question, ...options] = value.split('|');
            if (question && options.length > 0) result.push({ type: 'mcq', question, answer: options[0], options, id: widgetId });
        } else if (type === 'MATCHING') {
            const [instruction, ...pairsData] = value.split('|');
            const pairs = pairsData.map(p => { const [term, definition] = p.split('=').map(s => s.trim()); return { term, definition }; }).filter(p => p.term && p.definition);
            if (instruction && pairs.length > 0) result.push({ type: 'matching', instruction, pairs, id: widgetId });
        } else if (type === 'ORDERING') {
            const [instruction, ...items] = value.split('|');
            if (instruction && items.length > 1) result.push({ type: 'ordering', instruction, orderingItems: items, id: widgetId });
        } else if (type === 'FIND_THE_MISTAKE') {
            const [statementWithMistake, correction] = value.split('|');
            const mistakeMatch = statementWithMistake.match(/(.*){(.*)}(.*)/s);
            if (mistakeMatch && correction) {
                const [, before, mistake, after] = mistakeMatch;
                const fullStatement = `${before}${mistake}${after}`;
                result.push({ type: 'find_the_mistake', statement: fullStatement, mistake, correction: correction.trim(), id: widgetId });
            }
        } else if (type === 'CATEGORIZATION') {
            const [instruction, ...parts] = value.split('|');
            const categories: string[] = [];
            const categorizationItems: { item: string, category: string }[] = [];
            parts.forEach(part => {
                if (part.includes('=')) {
                    const [item, category] = part.split('=').map(s => s.trim());
                    if (item && category) {
                        categorizationItems.push({ item, category });
                    }
                } else {
                    categories.push(part.trim());
                }
            });
            if (instruction && categories.length > 0 && categorizationItems.length > 0) {
                 result.push({ type: 'categorization', instruction, categories, categorizationItems, id: widgetId });
            }
        }
        lastIndex = regex.lastIndex;
    }

    // Add any remaining text after the last match
    if (lastIndex < text.length) {
        result.push({ type: 'text', value: text.substring(lastIndex) });
    }
    
    // If no widgets were found, return the original text as a single text part
    return result.length > 0 ? result : [{type: 'text', value: text}];
};
