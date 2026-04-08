import json
with open(r'c:\Users\salma\Downloads\san_nans\New folder\AI-Procurement\src\pages\Tenders.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            stack.append(i + 1)
        elif char == '}':
            if stack:
                stack.pop()
            else:
                pass
print(stack)
