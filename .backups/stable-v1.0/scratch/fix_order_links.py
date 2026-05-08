import os
import re

TARGET_DIR = "/Users/prudhviraj/FHDB-WEBSITE-DEPLOY"
TARGET_LINK = "https://online.skytab.com/2d1f6d95e37f74d029fc5b1b9733c4df/order-settings"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Regex to find links that should point to SkyTab and ensure they have target="_blank"
    # We look for links containing "online.skytab.com"
    
    pattern = re.compile(r'(<a\s+[^>]*href=["\'])(https://online\.skytab\.com/[^"\']*)(["\'])([^>]*>)', re.IGNORECASE)
    
    def replacer(match):
        start_tag_href = match.group(1)
        current_href = match.group(2)
        end_href_quote = match.group(3)
        rest_of_start_tag = match.group(4)
        
        # Always use the user-provided link if it's a skytab link
        new_href = TARGET_LINK
        
        # Check if target="_blank" and rel="noopener noreferrer" are present
        new_rest = rest_of_start_tag
        if 'target="_blank"' not in new_rest.lower():
            new_rest = ' target="_blank"' + new_rest
        if 'rel="noopener noreferrer"' not in new_rest.lower():
            new_rest = ' rel="noopener noreferrer"' + new_rest
            
        return f"{start_tag_href}{new_href}{end_href_quote}{new_rest}"

    new_content = pattern.sub(replacer, content)

    if new_content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")
    else:
        # print(f"No changes: {filepath}")
        pass

def main():
    for root, dirs, files in os.walk(TARGET_DIR):
        for file in files:
            if file.endswith('.html') or file.endswith('.js'):
                filepath = os.path.join(root, file)
                process_file(filepath)

if __name__ == "__main__":
    main()
