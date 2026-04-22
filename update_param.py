import json

notebook_path = "notebooks/byoc_image_filter_guide.ipynb"

with open(notebook_path, 'r') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        for i, line in enumerate(cell['source']):
            if 'PROJECT_ID = "YOUR_PROJECT_ID_HERE"' in line:
                cell['source'][i] = line.replace('PROJECT_ID = "YOUR_PROJECT_ID_HERE"', 'PROJECT_ID = "gemini-ent-agent-demos" # @param {type:"string"}')
            elif "PROJECT_ID = 'YOUR_PROJECT_ID_HERE'" in line:
                cell['source'][i] = line.replace("PROJECT_ID = 'YOUR_PROJECT_ID_HERE'", 'PROJECT_ID = "gemini-ent-agent-demos" # @param {type:"string"}')

with open(notebook_path, 'w') as f:
    json.dump(nb, f, indent=2)

print("Notebook parameter updated successfully.")
