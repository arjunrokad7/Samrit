"""Add PDF source links and validate final delivery artifacts."""
import sys, json, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / '.tools/presentation-python'))
import pymupdf
from PIL import Image, ImageDraw

# PowerPoint's PDF export can omit text hyperlinks; retain them explicitly.
manifest = json.loads((ROOT/'slide_manifest.json').read_text(encoding='utf-8'))
with zipfile.ZipFile(ROOT/'Samrit_Final_Presentation.pptx') as ppt:
    from lxml import etree
    ns = {'a':'http://schemas.openxmlformats.org/drawingml/2006/main', 'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
    slide = etree.fromstring(ppt.read('ppt/slides/slide15.xml'))
    rels = etree.fromstring(ppt.read('ppt/slides/_rels/slide15.xml.rels'))
    targets = {r.get('Id'):r.get('Target') for r in rels}
    sources = []
    for run in slide.findall('.//a:r', ns):
        h = run.find('a:rPr/a:hlinkClick', ns)
        if h is not None:
            sources.append((run.findtext('a:t', namespaces=ns), targets[h.get('{'+ns['r']+'}id')]))
    notes = [n for n in ppt.namelist() if n.startswith('ppt/notesSlides/notesSlide') and n.endswith('.xml')]
    assert len(notes) == 16
pdf = pymupdf.open(ROOT/'Samrit_Final_Presentation.pdf')
assert len(pdf) == 16 and 'human right' in pdf[-1].get_text()
if not pdf[14].get_links():
    for label, url in sources:
        boxes = pdf[14].search_for(label)
        assert boxes, f'Missing PDF source label: {label}'
        for box in boxes:
            pdf[14].insert_link({'kind':pymupdf.LINK_URI, 'from':box, 'uri':url})
    pdf.saveIncr()
pdf.close()
pdf = pymupdf.open(ROOT/'Samrit_Final_Presentation.pdf')
assert len(pdf[14].get_links()) == 9
validation = json.loads((ROOT/'render_validation.json').read_text(encoding='utf-8-sig'))
assert validation['slides'] == 16 and not validation['overflow']
canvas = Image.new('RGB',(2400,1460),'#dde5df'); draw = ImageDraw.Draw(canvas)
for i in range(1,17):
    x,y=12+((i-1)%4)*600,20+((i-1)//4)*365
    canvas.paste(Image.open(ROOT/'preview'/f'Slide{i}.PNG').resize((576,324)),(x,y))
    draw.text((x+6,y+326),str(i),fill='#244557')
canvas.save(ROOT/'Slide_Overview.png')
print('PASS: 16 slides, 16 PDF pages, 16 speaker-note pages, nine clickable PDF sources, zero text overflow.')
