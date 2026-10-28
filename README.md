# Is not front-end

This repo contain two thing, Globe component code and component demo.
Globe component is pure vanilla javascript on Typescript. 

Demo run inside base nextjs application with a page with inside an instance of Globe.

Component is rendered via create new class GlobeClass.
This class is invoke via hook useRef on a simple div, when dom element is ready it's create a new instance of Globe class build inside this div.

You can take globe golder inside components and use it in every web stack. Below there is a list of deps requireed (just threejs).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Components npm dependencies



this example is inside React, the globe is build via ref hook on a div
and once dom loaded, instance Globe class and build with pure js/ts.
So the folder inside component can be use in every web stack.

**NB:** This is not Pure React Component, is a vanilla javascript over Typescript component.

Just three library is required like dependencie, and it's type definition.

```
"@types/three": "^0.185.4",
"three": "^0.185.1"
```

## Why this repo with a Typescript UX/UI components deserve attention and time. 

Three years ago, I set out to write a series of articles on a topic I had been studying in my spare time, purely out of passion. I was captivated by the interactive globe featured in the UIs of Stripe and GitHub—all built entirely with code. Eager to understand how such a result could be achieved, I spent hours hunting down the source code and reverse-engineering it—long before the AI ​​tools we have today existed.

After many hours, I managed to recreate the code, producing a globe identical in both functionality and visuals. I structured the code properly, modularizing it and rewriting it in TypeScript, leveraging the Three.js library to handle geometric shapes, advanced scene elements like lighting and materials, and more. I was—and remain—in awe of solutions that are so intuitive for a developer to grasp, yet so brilliant that I doubt I could have conceived them myself, even given months of effort.

For instance, there was a custom texture composed of small dots covering the landmasses, while the oceans were rendered as a simple, solid color. I couldn't fathom how they’d pulled it off; once I saw the code, it was so simple—yet so ingenious—that only a true genius could have come up with it. Then there was the animation triggered by a mouse click, handled via WebGL-specific code that offloaded the heavy lifting to the GPU, ensuring smooth motion for a vast number of dots without burdening the CPU.

A month ago, the Palantir blog published a series of articles focusing on this very globe, crediting Stripe and GitHub for setting the standard. Palantir even used it as a foundation for their own software in the military sector—incorporating real-time satellite coverage, zoom-to-satellite-view capabilities, simulations of military decisions, and AI-powered tracking of enemy assets, complete with a real-time day/night cycle. I felt a surge of frustration with myself—yet another insight I’d had, but never followed through on, only to see it adopted by industry giants later on. So, even though I’m the second person to do this, I’m going to create a series about what made me fall in love with this study—specifically, the reverse engineering of a component—and the wealth of things I’ve learned.

**@TODO ADD LINK MEDIUM WITH POST**