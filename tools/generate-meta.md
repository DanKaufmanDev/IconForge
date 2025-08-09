# How to Use the `generate-meta.py` Script

This script is designed to convert a CSS file containing IconForge icon definitions into a JSON format (`iconforge-icons.json`) that can be used by the IconForge JIT compiler.

## Prerequisites

*   Python 3 installed on your system.

## Usage Instructions

1.  **Prepare your CSS file:**
    *   Ensure you have a CSS file (e.g., `style.css` or `icon-definitions.css`) that contains only the icon class definitions in the format:
        ```css
        .if-iconname:before {
          content: "\e123";
        }
        ```
    *   **Important:** The script expects the input CSS file to be named `convert.css` and located in the project's root directory (the same directory as `package.json`). If your file has a different name, please rename it to `convert.css`.
    *   Remove any other CSS rules, comments, or extraneous content from this `convert.css` file, leaving only the icon class definitions.
    *   **Note:** This script is designed to consume the `convert.css` file. If you wish to retain a copy of your original CSS definitions, please ensure you make a backup before running the script.

2.  **Run the conversion script:**
    *   Open your terminal or command prompt.
    *   Navigate to the root directory of your IconForge project (where `package.json` is located).
    *   Execute the `generate-meta.py` script using Python 3:

    ```bash
    python3 tools/generate-meta.py
    ```

3.  **Output:**
    *   Upon successful execution, the script will generate a file named `iconforge-icons.json` in the project's root directory. This JSON file will contain a mapping of icon class names to their full CSS rules.

This `iconforge-icons.json` file is then used by the JIT compiler to dynamically inject icon styles into your web pages.
