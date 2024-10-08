/*!
 * License: MIT
 * Author: Kris Thom White, https://github.com/ktwbc
 * Contributors:
 * - Kris Thom White, https://github.com/ktwbc
 */

'use strict'

let sessionInterests = [];

function insertStylesheet () {
  const style = document.createElement('style')
  style.textContent = `
  .mgm {
      background-color: green !important;
  }
  .venetian {
      background-color: blue !important;
  }
  .aria {
      background-color: purple !important;
  }
  .caesars {
      background-color: grey !important;
  }
  .wynn {
      background-color: darkred !important;
  }
  .mandalay {
      background-color: #B8860B !important;
  }

  #aws-tweaker-panel {
      position: fixed;
      z-index: 1000000;
      bottom: 30px;
      right: 20px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
      padding: 5px;
  }

  `
  document.head.appendChild(style)
}

function insertTools () {
  const panel = document.createElement('div')
  let panelHtml = `<div id="aws-tweaker-panel">`
  panel.innerHTML = panelHtml + '</div>'
  document.body.append(panel)

}

function removeTools () {
  const element = document.getElementById('aws-tweaker-panel')
  if (element) {
    element.parentNode.removeChild(element)
  }
}

function addSessionVenues () {
  const elts = document.getElementsByClassName('rbc-time-content');
  if (!elts || elts.length === 0) {
    return;
  }
  // Recursive function to search through DOM elements
  function recursiveSearch(element) {

    // Check if the element is a div and has the target classes
    if (
      element.tagName === 'DIV' &&
      element.classList.contains('rbc-event') &&
      element.classList.contains('schedule-calendar-session') &&
      !element.classList.contains('reinvent-fixer') // so we don't do this twice as we click around
    ) {
      let titleAndTime = element.title;
      const titleParts = titleAndTime.match(/(?:\d{1,2}:\d{2} [AP]M(?: - \d{1,2}:\d{2} [AP]M)? \w*?: )(.*)/);

      if (titleParts && titleParts[1]) {
        const title  = titleParts[1].trim();
        let item = sessionInterests.find((session) => session.title.trim() === title);
        if (item?.times && item?.times[0]) {
          let room = item.times[0].room;
          let venueParts = room.split(' ');
          let venue = venueParts[0];
          element.classList.add(venue.toString().toLowerCase());
          element.classList.add('reinvent-fixer');

          // Attach the venue name
          let contentDiv = element.querySelector('.rbc-event-content');
          if (contentDiv) {
            let venueParagraph = document.createElement('p');
            venueParagraph.textContent = venue;

            // Append the new p element inside the contentDiv
            contentDiv.appendChild(venueParagraph);
          } else {
            console.warn('rbc-event-content div not found for', title);
          }

        } else {
          console.warn('No venue found for', title);
        }
      }

    }

    // Recursively search through the child elements
    for (let i = 0; i < element.children.length; i++) {
      recursiveSearch(element.children[i]);
    }
  }

  // Loop through all elements with the 'rbc-time-content' class and search recursively
  for (let i = 0; i < elts.length; i++) {
    recursiveSearch(elts[i]);
  }
}

function hookShowFavoritesCheckbox() {
  // Find all labels in the document
  const labels = document.querySelectorAll('label');

  // Loop through the labels to find the one containing "Show Favorites"
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];

    if (label.textContent.trim() === 'Show Favorites') {
      const checkbox = label.querySelector('input[type="checkbox"]');

      if (checkbox) {
        checkbox.addEventListener('click', function () {
          setTimeout(() => {
            addSessionVenues();
          }, 500); // delay so the page has time to update
        });
      }

      break;
    }
  }

  // Hook into buttons with the title "List View Daily" or "Grid View Weekly"
  const buttons = document.querySelectorAll('button');

  buttons.forEach((button) => {
    const span = button.querySelector('span[title]');
    if (span && (span.title === 'List View Daily' || span.title === 'Grid View Weekly')) {
      button.addEventListener('click', function () {
        // Run the addSessionVenues function when the button is clicked
        setTimeout(() => {
          addSessionVenues();
        }, 500); // delay so the page has time to update
      });
    }
  });

  // Use event delegation to handle dynamically added buttons with classes "next-day cursor-pointer" or "prev-day cursor-pointer"
  document.addEventListener('click', function (event) {
    const target = event.target.closest('.next-day.cursor-pointer, .prev-day.cursor-pointer');
    if (target) {
      // Run the addSessionVenues function when the button is clicked
      setTimeout(() => {
        addSessionVenues();
      }, 500); // delay so the page has time to update
    }
  });
}



(function() {
  const originalFetch = window.fetch;

  // Override the native fetch function
  window.fetch = async function(...args) {
    const response = await originalFetch(...args);

    if (args[0] && args[0].includes) {
      if (args[0].includes('/api/myData') && args[1]?.method.toLowerCase() === 'post') {
        const clone = response.clone();
        clone.json().then(data => {
          if (data?.sessionInterests) {
            sessionInterests = data.sessionInterests;
            addSessionVenues()
          }
        });
      }
    }

    return response; // Return the original response
  };
})();


// Only modify our registration agenda page
setTimeout(() => {
  if ( window.location.href.startsWith('https://registration.awsevents.com/') && window.location.href.includes('/myagenda/page/myagenda')) {
    if (document.getElementById('aws-tweaker-panel')) {
      return
    }
    hookShowFavoritesCheckbox()
    insertTools()
    insertStylesheet()
    addSessionVenues()
  } else {
    removeTools()
  }
}, 3000) // delay so the page has time to update

