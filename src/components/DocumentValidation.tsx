import React from 'react';

export interface DocumentItem {
    name: string;
    url: string;
    type: string;
}

export const DocumentValidation = ({ documents }: { documents: DocumentItem[] }) => {
    return (
        <div className="p-4 border rounded-md bg-muted">
            <h3 className="font-semibold mb-2">Document Validation (Stub)</h3>
            {documents.map((doc, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                    <span>{doc.name}</span>
                    <span className="text-green-600">Valid</span>
                </div>
            ))}
        </div>
    );
};
