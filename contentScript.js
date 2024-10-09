/*!
 * License: MIT
 * Author: Kris Thom White, https://github.com/ktwbc
 * Contributors:
 * - Kris Thom White, https://github.com/ktwbc
 */

'use strict'

let sessionInterests = [];
let mySchedule = [];
let debug = false;

function insertStylesheet() {
  if (debug) console.log('insertStylesheet()');

  const style = document.createElement('style')
  style.textContent = `
  .venue-mgm {
      background-color: green !important;
  }
  .venue-venetian {
      background-color: blue !important;
  }
  .venue-aria {
      background-color: purple !important;
  }
  .venue-caesars {
      background-color: grey !important;
  }
  .venue-wynn {
      background-color: darkred !important;
  }
  .venue-mandalay {
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

function insertTools() {
  if (debug) console.log('insertTools()');

  const panel = document.createElement('div')
  let panelHtml = `<div id="aws-tweaker-panel">`
  panel.innerHTML = panelHtml + '</div>'
  document.body.append(panel)

}

function removeTools() {
  if (debug) console.log('removeTools()');

  const element = document.getElementById('aws-tweaker-panel')
  if (element) {
    element.parentNode.removeChild(element)
  }
}

function addSessionVenues() {
  if (debug) console.log('addSessionVenues()');
  const elts = document.getElementsByClassName('rbc-events-container');
  if (!elts || elts.length === 0) {
    return;
  }

  // Recursive function to search through DOM elements
  function recursiveSearch(element) {

    // Check if the element is a div and has the target classes
    if (
      element.tagName === 'DIV' && element.classList.contains('schedule-calendar-session')
    ) {
      let titleAndTime = element.title;
      const titleParts = titleAndTime.match(/(\d{1,2}:\d{2} [AP]M(?: - \d{1,2}:\d{2} [AP]M)?(?: \w*)?):?\s*(.*)/);

      if (debug) console.log(titleParts);

      if (titleParts && titleParts[1]) {
        const time = titleParts[1];
        const title = titleParts[2];
        let item = mySchedule.find((session) => session.title.trim() === title.trim());
        if (!item) item =
          sessionInterests.find((session) => {
            if (debug) console.log('session.times', session.times);
            if (session.times) {
              let postedTime = session.times[0].startEndTimeSort
                .replace(/\b0(\d{1}:\d{2} [AP]M)\b/g, '$1') // Remove leading zeros
                .replace(/([AP]M) ([\d{1}])/g, '$1 - $2') + ' PST'; // Add hyphen and time zone
              if (debug) console.log(time, title, postedTime)

              return session.title.trim() === title.trim() && time === postedTime;
            } else {
              console.warn('problem item', session);
              return false;
            }
          });

        if (debug) console.log(item);
        if (!item) {
          console.warn('No session found for', title, 'faking it');
          item = { room: 'Unknown' };
        }

        if (debug) console.log(item);
        let room;
        if (item.room || item.room_name) {
          room = item.room || item.room_name;
        } else if ((item?.times && item?.times[0])) {
          room = item.times[0].room;
        }

        if (room) {
          let venueParts = room.split(' ');
          let venue = venueParts[0];
          element.classList.forEach(className => {
            if (className.startsWith('venue-')) {
              element.classList.remove(className);
            }
          });
          element.classList.add('venue-' + venue.toString().toLowerCase());
          element.classList.add('reinvent-fixer');

          // Attach the venue name
          let contentDiv = element.querySelector('.rbc-event-content');
          if (contentDiv) {
            let existingVenueParagraph = contentDiv.querySelector('p.venue');
            if (existingVenueParagraph) {
              contentDiv.removeChild(existingVenueParagraph);
            }
            let venueParagraph = document.createElement('p');
            venueParagraph.classList.add('venue');
            venueParagraph.textContent = venue;

            // Append the new p element inside the contentDiv
            contentDiv.appendChild(venueParagraph);
          } else {
            console.warn('rbc-event-content div not found for', title);
          }

        }

      }

    }

    // // Recursively search through the child elements
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
          }, 25); // delay so the page has time to update
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
        }, 25); // delay so the page has time to update
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
      }, 25); // delay so the page has time to update
    }
  });
}


(function () {
  const originalFetch = window.fetch;

  // Override the native fetch function
  window.fetch = async function (...args) {
    const response = await originalFetch(...args);

    if (args[0] && args[0].includes) {
      if (args[0].includes('/api/myData') && args[1]?.method.toLowerCase() === 'post') {
        const clone = response.clone();
        clone.json().then(data => {
          if (data?.sessionInterests) {
            sessionInterests = data.sessionInterests;
            if (data?.mySchedule) {
              mySchedule = data.mySchedule;
            }
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
  if (window.location.href.startsWith('https://registration.awsevents.com/') && window.location.href.includes('/myagenda/page/myagenda')) {
    if (document.getElementById('aws-tweaker-panel')) {
      return
    }
    if (debug) console.log('starting');
    hookShowFavoritesCheckbox()
    insertTools()
    insertStylesheet()
    addSessionVenues()
  } else {
    removeTools()
  }
  setInterval(addSessionVenues, 15000); // periodically refresh
}, 3000) // delay so the page has time to update

