import re
from html.parser import HTMLParser

class ImageAuditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.imgs = []
        self.current_picture = None
        self.in_picture = False
        self.current_source = None

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if tag == 'picture':
            self.in_picture = True
            self.current_picture = {'sources': []}
        elif tag == 'source' and self.in_picture:
            self.current_picture['sources'].append(attr_dict)
        elif tag == 'img':
            img_data = {
                'tag': tag,
                'attrs': attr_dict,
                'line': self.getpos()[0],
                'in_picture': self.in_picture,
                'picture_data': self.current_picture if self.in_picture else None
            }
            self.imgs.append(img_data)

    def handle_endtag(self, tag):
        if tag == 'picture':
            self.in_picture = False
            self.current_picture = None

def audit_images(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()

    parser = ImageAuditParser()
    parser.feed(html)
    
    print(f"Total images found: {len(parser.imgs)}")
    print("-" * 50)
    
    for i, img in enumerate(parser.imgs):
        attrs = img['attrs']
        src = attrs.get('src', 'NO SRC')
        loading = attrs.get('loading', 'NO LOADING')
        width = attrs.get('width', 'NO WIDTH')
        height = attrs.get('height', 'NO HEIGHT')
        alt = attrs.get('alt', 'NO ALT')
        
        # Only print first 5 and any with potential issues to keep output manageable
        is_hero = img['line'] < 600
        has_issue = not img['in_picture'] or loading == 'NO LOADING' or width == 'NO WIDTH' or height == 'NO HEIGHT' or alt == 'NO ALT'
        
        if i < 5 or has_issue or i > len(parser.imgs) - 5:
            print(f"Image {i+1}: {src} (Line {img['line']})")
            print(f"  Picture: {img['in_picture']}, Loading: {loading}, Size: {width}x{height}, Alt: {alt}")
            if not img['in_picture']:
                print("  [!] Missing <picture> tag")
            if has_issue:
                print("  [!] Potential optimization issue detected")
            print("-" * 30)

if __name__ == "__main__":
    audit_images('menu.html')
