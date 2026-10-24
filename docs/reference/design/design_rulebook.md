# AI Design Prompt & Rulebook - Project Samrita

**INSTRUCTIONS FOR AI ASSISTANT:**
Read and strictly adhere to the following UI and Design System Principles when generating front-end code (Next.js/React). Do not deviate from these styling rules. 

## 1. Styling & Framework
*   **CSS Framework:** Use Tailwind CSS exclusively. Do NOT write custom CSS or inline styles.
*   **Icons:** Use the `lucide-react` library for all iconography.

## 2. Color Palette & Contrast Constraints
*   **Custom Palette:** The `tailwind.config.js` file includes custom colors: `samrita-charcoal`, `samrita-teal`, `samrita-spruce`, `samrita-fern`, and `samrita-iron`.
*   **Accessibility Mandate (CRITICAL):** These are extremely dark, low-luminance colors. Anytime you use one as a background (e.g., `bg-samrita-teal`), the text inside it MUST be `text-white` or `text-slate-50` to pass WCAG contrast checks.
*   **App Backgrounds:** Use `bg-slate-50` for the main application background to allow the deep Samrita brand colors to pop on cards and buttons.

## 3. Geometry & Borders
*   **Cards, Buttons, & Inputs:** Apply `rounded-2xl` uniformly to all standard UI elements.
*   **Modals & Bottom Sheets:** For any UI element that slides up from the bottom (pull-ups), use `rounded-t-3xl`.

## 4. The 3D "Stacked" Effect
*   **Rule:** Do NOT use standard Tailwind soft shadows (like `shadow-md` or `shadow-lg`) for primary action buttons or feature cards.
*   **Implementation:** We use a custom chunky 3D effect. Combine our custom `shadow-stacked` utility with a darker color from our palette to create a solid bottom edge.
*   **Example Syntax:** To create a Fern-colored card with a darker Spruce 3D edge, use: 
    `className="bg-samrita-fern text-white rounded-2xl shadow-stacked shadow-samrita-spruce"`

## 5. Navigation Architecture & Layout
*   **Max 3-Page Depth:** Keep the routing architecture flat. Do not build deep nested URL structures.
*   **Bottom-Sheet Overlays:** Instead of routing a user to a new page for temporary data entry (e.g., scanning a QR code, taking a photo, or leaving a rating), conditionally render a bottom-sheet (pull-up) modal. 
*   **Modal Styling:** These pull-ups must snap to the bottom of the viewport, feature a `rounded-t-3xl` top border, and sit above a semi-transparent dark backdrop (`bg-black/50`).