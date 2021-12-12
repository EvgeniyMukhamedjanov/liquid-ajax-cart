try{

var currentHighlight = undefined;
function hightlightExample (name) {
    if ( currentHighlight !== name ) {
        var found = false;
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
            document.querySelectorAll('.code-examples__example--blur')?.forEach(function(item) {
                item.classList.remove('code-examples__example--blur');
            })
        }
        currentHighlight = name;
    }
}

function hightlightExampleScreenDecorator (name) {
    if (window.matchMedia("(min-width: 900px)").matches) {
        hightlightExample(name);
    } else {
        hightlightExample(undefined);
    }
}

document.querySelectorAll('[data-example]').forEach( function(example){
    example.addEventListener("mousemove", function( event ) {
        var closestHighlight = event.target.closest('[data-example-highlight]');
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



var exampleLinkHighlight = document.querySelector('[data-example-link-highlight]');

var examples = document.querySelectorAll('[data-example]');
var exampleLinks = document.querySelectorAll('[data-example-link]');
var exampleCanvas = document.querySelector('[data-example-canvas]');

if ( examples ) {

    examples.forEach( function(item) {
        // remove IDs so the page doesn't jump when an example link is clicked
        item.setAttribute('data-example-id', item.id);
        item.id = '';

        // set transition delay for all the code parts and notes
        var transitionDelay = 500;
        var transitionDelayStep = 5;
        var codePartHighlights = [];
        item.querySelectorAll('.highlight span:not([data-example-highlight]), [data-example-cta]').forEach(function(codePart) {
            codePart.style.transitionDelay = transitionDelay + 'ms';
            transitionDelay += transitionDelayStep;
            var codePartHighlight = codePart.parentNode.getAttribute('data-example-highlight');
            if(codePartHighlight && !codePartHighlights.includes(codePartHighlight)) {
                var relatedNotes = document.querySelectorAll('[data-example-highlight=' + codePartHighlight + '].code-examples__note');
                if (relatedNotes) {
                    relatedNotes.forEach( function(note) {
                        note.parentNode.style.transitionDelay = transitionDelay + 'ms';
                    })
                }
                codePartHighlights.push(codePartHighlight);
            }
        });
        var resultBlock = item.querySelector('.code-examples__result-block-wrapper');
        if(resultBlock) {
            resultBlock.style.transitionDelay = transitionDelay + 'ms'
        }
    });

    // toggle .code-examples__example--active, 
    // toggle .js-active for [data-example-link]
    // set height for examples wrapper according to a selected example
    // set props for [data-example-link-highlight]
    function examplesRouter () {
        var route = window.location.hash || '';
        var selectedExample;
        
        if (route) {
            selectedExample = document.querySelector('[data-example-id="' + route.replace('#', '') + '"]');
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
            var marginBottom = parseInt(window.getComputedStyle(selectedExample,null).getPropertyValue("margin-bottom"));
            var marginTop = parseInt(window.getComputedStyle(selectedExample,null).getPropertyValue("margin-top"));
            exampleCanvas.style.height = selectedExample.offsetHeight + marginTop + marginBottom + 'px';
        }
        
        if(exampleLinks) {
            var previousActive, nextActive;
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
                var highlighter = nextActive.querySelector('span');
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


} catch(e) {alert(e)}