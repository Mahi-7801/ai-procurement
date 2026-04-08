import os
import time

def get_last_modified(dir_path):
    files = []
    for root, _, filenames in os.walk(dir_path):
        if 'venv' in root or '.git' in root or '__pycache__' in root:
            continue
        for f in filenames:
            path = os.path.join(root, f)
            try:
                mtime = os.path.getmtime(path)
                files.append((mtime, path))
            except:
                pass
    files.sort(reverse=True)
    return files[:5]

while True:
    print("-" * 40)
    for mtime, path in get_last_modified('backend'):
        print(f"{time.ctime(mtime)}: {path}")
    time.sleep(1)
