/*
Softlight Take-Home Assignment
Author: Michael Comatas
Convert Figma design to HTML and CSS using Figma API
*/

const fs = require('fs');

const fileKey = process.env.FIGMA_FILE_KEY; // Figma file key from environment variable
const token = process.env.FIGMA_API_KEY; // Figma API token from environment variable
const url = `https://api.figma.com/v1/files/${fileKey}`;
const fonts = new Set();
let html = '';
let css = '';

// Main Execution --------------------------------------------------------------------------------

fetch(url, {
    method: 'GET',
    headers: {
        'X-Figma-Token': token
    }
})
.then(response => response.json())
.then(data => {
    const document = data.document;
    getFonts(document);
    const fontLinks = generateFontLinks(fonts);
    // document.children[0].children[0] skips the first DOCUMENT and CANVAS nodes
    // since we only care about FRAME, RECTANGLE, and TEXT nodes.
    // This generates the HTML that goes inside the <body> tag along with the CSS.
    generateHTMLandCSS(document.children[0].children[0]);

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Softlight Take Home Assignment</title>
            ${fontLinks}
            <link rel="stylesheet" href="main.css">
        </head>
        <body style="background-color: gray;">
            ${html}
        </body>
        </html>
    `;

    fs.writeFileSync('index.html', htmlContent);
    fs.writeFileSync('main.css', css);

    console.log('✅ HTML and CSS files have been generated.');
})
.catch(error => console.log(error));

// Functions --------------------------------------------------------------------------------------

// Main driver fction to generate HTML and CSS from Figma nodes
function generateHTMLandCSS(node) {
    // Traverse document and generate HTML and CSS
    switch(node.type) {
        // For this take-home, we only care about FRAME, RECTANGLE, and TEXT nodes
        case 'FRAME':
            frameNodeToHTMLAndCSS(node);
            if(node.children) node.children.forEach(child => generateHTMLandCSS(child));
            break;
        case 'RECTANGLE':
            rectangleNodeToHTMLAndCSS(node); // Rectangle nodes don't have children nodes to traverse
            break;
        case 'TEXT':
            textNodeToHTMLAndCSS(node); // Text nodes don't have children nodes to traverse
            break;
        default:
            break;
    }
}

// Generate HTML and CSS for FRAME nodes
// The last two css 
// lines handle special cases so the borders don't stack
function frameNodeToHTMLAndCSS(node) {
    const uniqueClass = toUniqueClass(node);
    html += `<div class="${uniqueClass}"></div>\n`;
    css += `
        .${uniqueClass} {
            ${generateLayoutCSS(node)}
            ${generateStrokeCSS(node)}
            ${generateFrameBackgroundCSS(node)}
            ${generateBorderRadius(node)}
            ${uniqueClass === 'frame-1321318734-115' ? 'border-bottom: none;' : ''}
            ${uniqueClass === 'frame-1321318734-117' ? 'border-top: none;' : ''}
        }
    `;
}

// Generate HTML and CSS for RECTANGLE nodes
function rectangleNodeToHTMLAndCSS(node) {
    const uniqueClass = toUniqueClass(node);
    html += `<div class="${uniqueClass}"></div>\n`;
    css += `
        .${uniqueClass} {
            background: rgb(${Math.round(node.fills[0].color.r * 255)}, ${Math.round(node.fills[0].color.g * 255)}, ${Math.round(node.fills[0].color.b * 255)});
            border-radius: ${node.cornerRadius}px;
            width: ${node.absoluteBoundingBox.width}px;
            height: ${node.absoluteBoundingBox.height}px;
            left: ${node.absoluteBoundingBox.x}px;
            top: ${node.absoluteBoundingBox.y}px;
            display: flex;
            position: absolute;
        }
    `;
}

// Generate HTML and CSS for TEXT nodes
function textNodeToHTMLAndCSS(node) {
    const uniqueClass = toUniqueClass(node);
    html += `<span class="${uniqueClass}">${node.characters}</span>\n`;
    css += `
        .${uniqueClass} {
            ${figmaStyleToCSS(node.style)}
            ${generateTextColor(node)}
            ${generateLayoutCSS(node)}
            white-space: nowrap;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    `;
}

// Generate CSS code for layout (poisition, size) of a node
function generateLayoutCSS(node) {
    const box = node.absoluteBoundingBox || {};

    return `
        position: absolute;
        width: ${box.width}px;
        height: ${box.height}px;
        left: ${box.x}px;
        top: ${box.y}px;
    `;
}

// Generate CSS code for stroke (border) of a node
function generateStrokeCSS(node) {
    const strokes = node.strokes || [];
    if(strokes.length === 0) return '';
    const weight = node.strokeWeight || 0;

    const stroke = strokes[0];

    // For this assignment, only SOLID strokes need to be handled
    if(stroke.type === 'SOLID') {
        const { r, g, b, a } = stroke.color;
        const color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
        return `border: ${weight}px solid ${color};`;
    }
}

// Generate CSS code for background of FRAME nodes
function generateFrameBackgroundCSS(node) {
    const fills = node.fills || [];
    if(fills.length === 0) return '';

    const fill = fills[0];

    // For this assignment, only SOLID and GRADIENT_LINEAR filles need to be handled
    if(fill.type === 'SOLID') {
        return `background-color: rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.opacity || 1});`;
    }

    if(fill.type === 'GRADIENT_LINEAR') {
        const stops = fill.gradientStops.map(stop => {
            const color = stop.color;
            return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a}) ${Math.round(stop.position * 100)}%`;
        }).join(', ');

        // Calculate angle from gradientHandlePositions
        const p0 = fill.gradientHandlePositions[0];
        const p1 = fill.gradientHandlePositions[1];
        const angleRad = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const angleDeg = (angleRad * 180 / Math.PI + 360) % 360; // Convert to degrees and normalize

        return `background: linear-gradient(${angleDeg}deg, ${stops});`;
    }
}

// Generate CSS code for border-radius of a node
function generateBorderRadius(node) {
    // Handle individual corner radii if present
    if(node.rectangleCornerRadii) {
        const [tl, tr, br, bl] = node.rectangleCornerRadii;
        return `border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`;
    }

    // Handle uniform corner radius
    if(node.cornerRadius) {
        return `border-radius: ${node.cornerRadius}px;`;
    }

    return '';
}

// Generate CSS code for text color of a TEXT node
function generateTextColor(node) {
    const fills = node.fills || [];
    if(fills.length === 0) return '';

    const fill = fills[0];
    const { r, g, b, a } = fill.color;

    const red = Math.round(r * 255);
    const green = Math.round(g * 255);
    const blue = Math.round(b * 255);
    
    return `color: rgba(${red}, ${green}, ${blue}, ${a});`;
}

// Create a unique CSS class name for a node. Uses node name and short node ID.
// Example: frame-1321318734-115
function toUniqueClass(node) {
    const safeName = node.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
        .replace(/^-+|-+$/g, '');    // Remove leading/trailing hyphens
    const shortId = node.id.split(':')[1];
    return `${safeName}-${shortId}`;
}

// Convert Figma text style to CSS
function figmaStyleToCSS(style) {
    if (!style) return '';

    const font  = `
        font-family: ${style.fontFamily};
        font-size: ${style.fontSize}px;
        font-weight: ${style.fontWeight};
        line-height: ${style.lineHeightPx}px;
        letter-spacing: ${style.letterSpacing}px;
        text-align: ${style.textAlignHorizontal.toLowerCase()};
    `

    return font.trim();
}

// Recursively collect font families from TEXT nodes
function getFonts(node) {
    if(node.type === 'TEXT' && node.style?.fontFamily) {
        fonts.add(node.style.fontFamily);
    }
    if(node.children) {
        node.children.forEach(child => getFonts(child));
    }
}

// Generate Google Fonts link tags for the collected fonts
function generateFontLinks(fonts) {
    return [...fonts].map(font => {
        const formatted = font.replace(/\s+/g, '+'); // Replace spaces with '+'
        return `<link href="https://fonts.googleapis.com/css2?family=${formatted}:wght@400;700&display=swap" rel="stylesheet">`;
    })
    .join('\n');
}


// Debugging Functions ---------------------------------------------------------------------------

function logNode(node, depth = 0) {
    // Log the current node with indentation based on depth
    console.log(`${'  '.repeat(depth)}- ${node.name} (${node.type})`);
    // If the node has children, log them recursively
    if(node.children) {
        node.children.forEach(child => logNode(child, depth + 1));
    }
}

function getTextNodes(node, texts = []) {
    if(node.type === 'TEXT') {
        // Push text node info
        texts.push({
            id: node.id,
            name: node.name,
            fills: node.fills,
            text: node.characters,
            style: node.style
        });
        fonts.add(node.style.fontFamily); // Collect font family
    }

    if(node.children) {
        node.children.forEach(child => getTextNodes(child, texts));
    }

    return texts;
}

function logTextNodes(node) {
    // If the node is a text node, log it
    if(node.type === 'TEXT') {
        console.log(node);
    }
    if(node.children) {
        node.children.forEach(child => logTextNodes(child));
    }
}

function getFrameNodes(node, frames = []) {
    if(node.type === 'FRAME') {
        frames.push(node);
    }
    if(node.children) {
        node.children.forEach(child => getFrameNodes(child, frames));
    }

    return frames;
}

function logFrameNodes(node) {
    // If node is a FRAME, log it
    if(node.type === 'FRAME') {
        console.log(node);
    }
    if(node.children) {
        node.children.forEach(child => logFrameNodes(child));
    }
}