
import json
import re

def get_color_from_rule(rule):
    if isinstance(rule, dict):
        rule = rule.get('class', '')
    # Updated regex to handle different hex color formats
    match = re.search(r'#([a-fA-F0-9]{3,8})', str(rule))
    if match:
        return f"#{match.group(1)}"
    return None

def generate_docs():
    try:
        with open('/Users/myst/Documents/Developer/IconForge/dist/meta/iconforge-styles.json', 'r') as f:
            styles = json.load(f)
    except FileNotFoundError:
        print("Error: iconforge-styles.json not found.")
        return
    except json.JSONDecodeError:
        print("Error: Could not decode iconforge-styles.json.")
        return

    markdown = """
# IconForge Styles Documentation

This document provides a detailed overview of all the CSS utility classes available in IconForge. These classes are designed to be used directly in your HTML to style your components and layouts.

"""

    grouped_styles = {
        "Colors": {"prefix": "is-color-", "prop": "text color"},
        "Backgrounds": {"prefix": "is-bg-", "prop": "background color"},
        "Borders": {"prefix": "is-border-", "prop": "border color"},
        "Sizing": {"prefixes": ["is-size-", "is-h-", "is-w-"]},
        "Typography": {"prefixes": ["is-font-", "is-line-", "is-text-", "is-align-", "is-list-"]},
        "Layout": {"prefixes": ["is-hidden", "is-block", "is-inline", "is-position", "is-z-", "is-overflow-", "is-aspect-", "is-sticky", "is-absolute", "is-relative", "is-nav", "is-fixed-bg"]},
        "Flexbox": {"prefixes": ["is-flex", "is-justify-", "is-items-", "is-self-", "is-content-", "is-flex-grow-", "is-flex-shrink-"]},
        "Grid": {"prefixes": ["is-grid", "is-gap-"]},
        "Spacing": {"prefixes": ["is-m-", "is-p-", "is-mt-", "is-mr-", "is-mb-", "is-ml-", "is-mx-", "is-my-", "is-pt-", "is-pr-", "is-pb-", "is-pl-", "is-px-", "is-py-"]},
        "Transforms": {"prefixes": ["is-rot-", "is-flip-", "is-scale-", "is-translate-"]},
        "Transitions": {"prefixes": ["is-transition"]},
        "Effects": {"prefixes": ["is-shadow-", "is-blur-", "is-brightness-", "is-contrast-", "is-grayscale-", "is-invert-", "is-saturate-", "is-sepia-", "is-backdrop-blur-"]},
        "Animations": {"prefix": "is-anim-"},
        "Interactivity": {"prefixes": ["is-clickable", "is-not-clickable", "is-select-", "is-resize-"]},
        "SVG": {"prefixes": ["is-sq"]},
        "Other": {"prefixes": ["is-outline-", "is-truncate", "is-border-t", "is-border-b", "is-border-l", "is-border-r", "is-border", "is-bg-transparent", "is-border-none", "is-top", "is-bottom", "is-left", "is-right"]},
    }

    toc = "## Table of Contents\n\n"
    for category in grouped_styles.keys():
        toc += f"- [{category}](#{category.lower().replace(' ', '-')})\n"
    markdown += toc + "\n"


    for category, config in grouped_styles.items():
        markdown += f"## {category}\n\n"
        
        keys_in_category = []
        if "prefix" in config:
            keys_in_category.extend([k for k in styles if k.startswith(config["prefix"])])
        if "prefixes" in config:
            for prefix in config["prefixes"]:
                keys_in_category.extend([k for k in styles if k.startswith(prefix)])
        
        # Filter out keys that have been matched by more specific prefixes
        keys_in_category = list(dict.fromkeys(keys_in_category)) # remove duplicates
        
        processed_keys = set()

        for key in keys_in_category:
            if key in processed_keys:
                continue
            
            value = styles[key]
            
            if "prop" in config: # Color sections
                color = get_color_from_rule(value)
                markdown += f"### `{key}`\n\n"
                markdown += f"- **CSS:** `{value}`\n"
                markdown += f"- **Description:** Sets the {config['prop']} to a specific shade.\n"
                if color:
                    markdown += f'<div style="width: 50px; height: 20px; background-color: {color}; border: 1px solid #ccc;"></div>\n\n'
                markdown += "---\n\n"

            elif category == "Animations":
                 if isinstance(value, dict):
                    markdown += f"### `{key}`\n\n"
                    markdown += f"- **Keyframes:**\n```css\n{value['keyframes']}\n```\n"
                    markdown += f"- **Class:**\n```css\n{value['class']}\n```\n"
                    markdown += f"- **Description:** An animation utility class.\n\n"
                    markdown += "---\n\n"

            else: # Other sections
                markdown += f"### `{key}`\n\n"
                markdown += f"- **CSS:** `{value}`\n"
                markdown += f"- **Description:** A utility class for {category.lower()}\n\n"
                markdown += "---\n\n"
            
            processed_keys.add(key)


    with open('/Users/myst/Documents/Developer/IconForge/src/styles.md', 'w') as f:
        f.write(markdown)

    print("Documentation generated in src/styles.md")

if __name__ == "__main__":
    generate_docs()
