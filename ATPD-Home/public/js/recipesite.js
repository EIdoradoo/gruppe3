/**
 * uses 'window.print();' built in method, to print to PDF/Printer.
 *
 * if 'dark theme' is selected, change to 'light theme' while printing.
 *
 * check css-sheet to see '@media print' custom attributes
 */
function printRecipe() {
  let prevTheme = htmlElement.getAttribute('data-theme');
  if (prevTheme === 'dark') {
    setTheme('light');
  }
  window.print();
  if (prevTheme === 'dark') {
    setTheme('dark');
  }
}

/**
 * reloads site with new servings amount
 */
function onServingsChange() {
  updateQueryParam('servings', document.getElementById('servings').value); // aktualisiere den ?servings= Parameter
  window.location.reload();
}

function updateQueryParam(key, value) {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.delete(key); // leer = löschen
  }
  window.history.replaceState({}, '', url);
}

/**
 * sends an HTTP DELETE request to delete the recipe with (id)
 * @param id recipes-database id to delete
 */
function deleteRecipe(id) {
  const confirmed =
    confirm("Möchten Sie dieses Rezept wirklich löschen? " +
      "\nEs ist für niemanden mehr zugänglich, noch wiederherstellbar.");
  if (!confirmed) {
    return;
  }

  const http = new XMLHttpRequest();
  http.open("DELETE", "/recipe/"+id);

  http.onreadystatechange = function () { //Call a function when the state changes.
    if (http.readyState === 4 && http.status === 200) {
      const jsonResponse = JSON.parse(http.responseText);
      if (jsonResponse.message !== 'Success') {
        console.log(jsonResponse.message);
      } else {
        window.location.href = "/yuumibook-read.html";
      }
    }
  }
  http.send();
}
