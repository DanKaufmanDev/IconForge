import re
import json
import os

css_input_file = 'style.css'  
json_output_file = 'iconforge-icons.json'  

with open(css_input_file, 'r') as f:
    css_content = f.read()

icon_classes = re.findall(r'\.([a-zA-Z0-9_-]+):before\s*{\s*content:\s*"(.+?)";\s*}', css_content)

json_data = {}

for icon_class in icon_classes:
    class_name = icon_class[0]
    content_value = icon_class[1].replace('"', "'")

    full_css_rule = f".{class_name}:before {{ font-family: 'IconForge' !important; content: '{content_value}'; }}"

    json_data[class_name] = full_css_rule

with open(json_output_file, 'w') as f:
    json.dump(json_data, f, indent=2)
    os.remove(css_input_file)

print(f'Successfully converted {len(icon_classes)} CSS rules to {json_output_file}')