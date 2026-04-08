import sys
try:
    with open(r'c:\Users\salma\Downloads\san_nans\New folder\AI-Procurement\src\pages\Tenders.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    stack = []
    for i, char in enumerate(content):
        if char == '{':
            line_no = content.count('\n', 0, i) + 1
            stack.append((line_no, char))
        elif char == '}':
            if stack:
                stack.pop()
            else:
                line_no = content.count('\n', 0, i) + 1
                print(f"Extra closing brace at line {line_no}")
    if stack:
        print("Unclosed braces:")
        for line, char in stack:
            print(f"Line {line}: {char}")
    else:
        print("All braces balanced.")
except Exception as e:
    print(f"Error: {e}")
