let currentHighlight = undefined;
const hightlightExample = (name) => {
    if ( currentHighlight !== name ) {
        let found = false;
        document.querySelectorAll('[data-example-highlight]').forEach(function(highlight){
            if (highlight.getAttribute('data-example-highlight') === name) {
                highlight.classList.add('js-code-examples-highlighted');
                found = highlight;
            } else {
                highlight.classList.remove('js-code-examples-highlighted');
            }
        });
        if (found) {
            found.closest('.code-examples__example').classList.add('code-examples__example--blur');
        } else {
            document.querySelectorAll('.code-examples__example--blur')?.forEach(item => {
                item.classList.remove('code-examples__example--blur');
            })
        }
        currentHighlight = name;
    }
}

const hightlightExampleScreenDecorator = (name) => {
    if (window.matchMedia("(min-width: 900px)").matches) {
        hightlightExample(name);
    } else {
        hightlightExample(undefined);
    }
}

document.querySelectorAll('[data-example]').forEach( function(example){
    example.addEventListener("mousemove", function( event ) {
        const closestHighlight = event.target.closest('[data-example-highlight]');
        if(closestHighlight) {
            hightlightExampleScreenDecorator(closestHighlight.getAttribute('data-example-highlight'));
        } else {
            hightlightExampleScreenDecorator(undefined);
        }
    });
    example.addEventListener('mouseleave', event => {
        hightlightExampleScreenDecorator(undefined);
    })
});

window.addEventListener('resize', () => {
    hightlightExampleScreenDecorator(currentHighlight);
})



const exampleLinkHighlight = document.querySelector('[data-example-link-highlight]');

const examples = document.querySelectorAll('[data-example]');
const exampleLinks = document.querySelectorAll('[data-example-link]');
const exampleCanvas = document.querySelector('[data-example-canvas]');

if ( examples ) {

    examples.forEach( item => {
        // remove IDs so the page doesn't jump when an example link is clicked
        item.setAttribute('data-example-id', item.id);
        item.id = '';

        // set transition delay for all the code parts and notes
        let transitionDelay = 500;
        const transitionDelayStep = 5;
        const codePartHighlights = [];
        item.querySelectorAll('.highlight span:not([data-example-highlight]), [data-example-cta]').forEach(codePart => {
            codePart.style.transitionDelay = `${ transitionDelay }ms`;
            transitionDelay += transitionDelayStep;
            const codePartHighlight = codePart.parentNode.getAttribute('data-example-highlight');
            if(codePartHighlight && !codePartHighlights.includes(codePartHighlight)) {
                const relatedNotes = document.querySelectorAll(`[data-example-highlight=${ codePartHighlight }].code-examples__note`);
                if (relatedNotes) {
                    relatedNotes.forEach( note => {
                        note.parentNode.style.transitionDelay = `${ transitionDelay }ms`;
                    })
                }
                codePartHighlights.push(codePartHighlight);
            }
        });
        const resultBlock = item.querySelector('.code-examples__result-block-wrapper');
        if(resultBlock) {
            resultBlock.style.transitionDelay = `${ transitionDelay }ms`
        }
    });

    // toggle .code-examples__example--active, 
    // toggle .js-active for [data-example-link]
    // set height for examples wrapper according to a selected example
    // set props for [data-example-link-highlight]
    const examplesRouter = () => {
        let route = window.location.hash || '';
        let selectedExample;
        
        if (route) {
            selectedExample = document.querySelector(`[data-example-id="${route.replace('#', '')}"]`);
        }
        if(!selectedExample) {
            return;
            // selectedExample = examples[0];
        }
        examples.forEach( item => {
            item.classList.remove('code-examples__example--active');
            if ( item === selectedExample ) {
                item.classList.add('code-examples__example--active');
            }
        });

        if ( exampleCanvas ) {
            const marginBottom = parseInt(window.getComputedStyle(selectedExample,null).getPropertyValue("margin-bottom"));
            const marginTop = parseInt(window.getComputedStyle(selectedExample,null).getPropertyValue("margin-top"));
            exampleCanvas.style.height = selectedExample.offsetHeight + marginTop + marginBottom + 'px';
        }
        
        if(exampleLinks) {
            let previousActive, nextActive;
            exampleLinks.forEach(item => {
                if(item.hash === '#' + selectedExample.getAttribute('data-example-id')) {
                    nextActive = item;
                } else if( item.classList.contains('js-active') ) {
                    previousActive = item;
                }
            })
            if(previousActive) {
                previousActive.classList.remove('js-active');
            }
            if(nextActive) {
                const highlighter = nextActive.querySelector('span');
                if(previousActive) {
                    highlighter.classList.remove('js-left-move');
                    highlighter.classList.remove('js-right-move');
                    highlighter.style.left = previousActive.offsetLeft - nextActive.offsetLeft + 'px';
                    highlighter.style.right = (nextActive.offsetLeft + nextActive.offsetWidth) - (previousActive.offsetLeft + previousActive.offsetWidth) + 'px';
                    if ( previousActive.offsetLeft - nextActive.offsetLeft > 0 ) {
                        highlighter.classList.add('js-left-move');
                        highlighter.classList.remove('js-right-move');
                    } else {
                        highlighter.classList.add('js-right-move');
                        highlighter.classList.remove('js-left-move');
                    }
                }
                nextActive.classList.add('js-active');
                highlighter.style.left = 0;
                highlighter.style.right = 0;
            }
        }
    }

    window.addEventListener('hashchange', function(e) { examplesRouter() });
    window.addEventListener('resize', function (e) { examplesRouter() });
    examplesRouter();
}

setTimeout(() => {
    document.querySelector('html').classList.add('js-animation');
}, 100)
