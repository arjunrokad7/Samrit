# Samrit final presentation

- **Samrit_Final_Presentation.pptx** — 16-slide, widescreen PowerPoint with editable text, shapes, diagrams and speaker notes.
- **Samrit_Final_Presentation.pdf** — matching preview for sharing and review.
- **SPEAKER_NOTES.md** — the presentation narrative and clickable source references in a readable format.
- **Slide_Overview.png** — contact sheet of the final slides.

Open the PowerPoint and use Presenter View to read the embedded notes. The deck follows: name and meaning → Steel & Steam kitchen interpretation → statistics → strict/accountable simplicity → capabilities → four faces → each face → voice assistance → custody evidence → private reviews → workflow → sources → the right to food.

Statistics retain their geography, date and denominator. Lower-income smartphone ownership is an access proxy, not a measure of food-insecure people's phone ownership. The NYC provider figure combines pantries, soup kitchens and mobile pantries. AI is presented as assistance, not food-safety or truth certification. The deck discloses simulated GPS, fictional meal offers and the remaining automatic meal-publication integration.

The original four-face structure is preserved: people seeking meals, distribution centers, donors and the central NGO. Driver operations sit within the NGO face. Current app screenshots and the supplied Samrit logo are used; the OCR menu is a fictional fixture.

## Rebuild

Run `python presentations/build_deck.py` from the repository root after installing `python-pptx` into the workspace's `.tools/presentation-python` directory. Run `presentations/render_deck.ps1` on a Windows machine with PowerPoint to export the PDF and slide PNGs and validate text bounds. Rendering opens the deck without a visible presentation window.

The slide text and layout are defined in `build_deck.py`; `capture.cjs` refreshes app screenshots from the running local demo. `render_validation.json` records native PowerPoint's text-bounds check. The slide manifest contains the narrative and source IDs. External statistical references are documented in the deck and presenter notes.
