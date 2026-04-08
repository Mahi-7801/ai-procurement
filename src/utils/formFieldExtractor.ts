export const extractFieldsFromForms = (templates: Record<string, string>, selectedForms: string[]): string[] => {
    const allFields = new Set<string>();

    selectedForms.forEach(form => {
        const content = templates[form];
        if (content) {
            const matches = content.match(/\[(.*?)\]/g);
            if (matches) {
                matches.forEach(match => {
                    // Start from index 1 to remove first bracket, length-1 to remove last bracket
                    allFields.add(match.substring(1, match.length - 1));
                });
            }
        }
    });

    return Array.from(allFields);
};

export const extractFormFields = (content: string): string[] => {
    const matches = content.match(/\[(.*?)\]/g);
    if (!matches) return [];
    return matches.map(match => match.substring(1, match.length - 1));
};

export const fillFormFields = (content: string, values: Record<string, string>): string => {
    let filled = content;
    // We should iterate over the keys of the values object to replace placeholders
    Object.keys(values).forEach(key => {
        // Create a regex to replace all instances of [key]
        // We escape the key just in case it contains regex special characters
        const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\[${safeKey}\\]`, 'g');
        filled = filled.replace(regex, values[key] || `[${key}]`);
    });
    return filled;
};

// Helper to determine input type based on field name
export const getFieldType = (fieldName: string): string => {
    const lower = fieldName.toLowerCase();

    if (lower.includes('date') || lower.includes('day') || lower.includes('month') || lower.includes('year') && !lower.includes('turnover')) return 'date';
    if (lower.includes('amount') || lower.includes('cost') || lower.includes('turnover') || lower.includes('price') || lower.includes('value') || lower.includes('quote')) return 'number';
    if (lower.includes('description') || lower.includes('details') || lower.includes('address') || lower.includes('plan') || lower.includes('services') || lower.includes('comment')) return 'textarea';

    return 'text';
};
