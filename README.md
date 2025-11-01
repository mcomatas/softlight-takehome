# Softlight Take Home Assignment
## Goal
Take this [Figma file](https://www.figma.com/design/MxMXpjiLPbdHlratvH0Wdy/Softlight-Engineering-Take-Home-Assignment?node-id=0-1&p=f&t=5xsT7ZMDetIBokz8-0) as input and create a script to generate HTML / CSS files that represent the Figma design.

## My Approach
I used a single JavaScript file (main.js) to fetch from the Figma API and traverse through the document tree. I created HTML and CSS based on each of the tree nodes and outputted to an index.html and main.css file.

One note about the design / outputted html. I made the background color of the html body gray to showcase the border radius of the outer most frame more.

## Limitations
I tailored my script for this specific Figma file for both accuracy and simplicity sake. This means not all cases are handled if this script were used for other Figma files.

Unhandled cases:
- The document tree had five different node types, those five being Document, Canvas, Frame, Rectanlge, and Text. Figma has more node types than this, but for this assignment I only needed to handle the Frame, Rectangle, and Text nodes.
- When generating border / stroke I only handle the case when stroke.type is SOLID. I know there can be different gradient borders, but as they did not show up in the design I did not code it for simplicity.
- For the border / stroke of the email and password box I handled the case of the overlapping border by eliminating the bottom and top borders based on their unique class name (lines 91-92). I recognize this is not an optimal approach and only handles the case for this Figma file. I could eliminate overlapping by trying to look at sibling nodes and find neighboring nodes / borders based on the positioning (x and y coordinates). For simplicity and time sake I chose this unoptimal approach.
- Similarly to the border generation, when generating backgrounds for Frame nodes I only handled the cases for fill.type of SOLID and GRADIENT_LINEAR as those were the two that were present in this Figma design.
- The unique class names I generate for each div or span are not easily identifiable by humans (example: frame-1321318734-115), but work well for the nodes.
- The generated HTML and CSS is not formatted ideally for reading by humans.

## Challenges
- The biggest challenge I faced was getting the positioning right for each element. At first I tried nesting div elements inside each other, but without nesting and using absolute positioning, the items fell into place. Additionally, I used the p element for text nodes at first not realizing the browser was adding default styles. Once switching to span element, it worked better.