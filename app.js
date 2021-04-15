// var pdfreader = require("pdfreader");
var PdfReader = require("pdfreader").PdfReader;
const fs = require("fs");

let nombrePdf = "";
let rutaPdf = "";

// npm start nombrePdf="test.pdf" rutaPdf="C:\pdfToTxt"

// print process.argv
process.argv.forEach((val, index, array) => {
  switch (true) {
    case index === 2 && val.indexOf("nombrePdf") > -1:
      nombrePdf = val.split("=")[1];
      break;
    case index === 3 && val.indexOf("rutaPdf") > -1:
      rutaPdf = val.split("=")[1];
      break;
  }
});

rutaArchivo = rutaPdf + "\\" + nombrePdf;

var rows = {}; // indexed by y-position

var txt = "";

function printRows() {
  Object.keys(rows) // => array of y-positions (type: float)
    .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
    .forEach((y) => {
      const fila = ((rows[y] || []).join("\t") + "\n").trim();

      if (!(fila.length === 2 && fila.indexOf("nº") > -1)) {
        txt += (rows[y] || []).join("\t") + "\n";
      }
    });

  txt = encodeURIComponent(txt);

  fs.writeFile(rutaArchivo + ".txt", txt, (err) => {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
}

/*new pdfreader.PdfReader().parseFileItems(rutaArchivo, function (
  err,
  item
) {
  if (!item) {
    // end of file, or page
    printRows();
    rows = {}; // clear rows for next page
  } else if (item.text) {
    // accumulate text items into rows object, per line
    (rows[item.y] = rows[item.y] || []).push(item.text);
  }
});*/

function sortJSON(data, key, orden) {
  return data.sort(function (a, b) {
    var x = a[key],
      y = b[key];

    if (orden === "asc") {
      return x < y ? -1 : x > y ? 1 : 0;
    }

    if (orden === "desc") {
      return x > y ? -1 : x < y ? 1 : 0;
    }
  });
}

fs.readFile(rutaArchivo, async (err, pdfBuffer) => {
  let pages = await readPDFPages(pdfBuffer);

  let paginas = [];

  for (const page in pages) {
    if (pages.hasOwnProperty(page)) {
      const pagina = pages[page];
      let rows = [];

      for (const row in pagina) {
        if (pagina.hasOwnProperty(row)) {
          const fila = pagina[row];
          // console.log("La clave es " + row + " y el valor es ");
          // console.log(fila);

          rows.push({
            fila: Number(row),
            data: fila,
          });
        }
      }

      rows = sortJSON(rows, "fila", "asc");

      paginas.push({
        pagina: Number(page),
        data: rows,
      });
    }
  }

  let txt = "";

  paginas.forEach((pagina) => {
    pagina.data.forEach((fila) => {
      txt += fila.data.join("\t") + "\n";
    });
  });

  txt = encodeURIComponent(txt);

  fs.writeFile(rutaArchivo + ".txt", txt, (err) => {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });

  /*// pdfBuffer contains the file content
  new PdfReader().parseBuffer(pdfBuffer, (err, item) => {
    if (err)
      callback(err);
    else if (!item){
      // end of file, or page
      printRows();
      rows = {}; // clear rows for next page
    } else if (item.text){
      // accumulate text items into rows object, per line
      (rows[item.y] = rows[item.y] || []).push(item.text);
    }
  });*/
});

function readPDFPages(buffer) {
  const reader = new PdfReader();

  // We're returning a Promise here, as the PDF reading
  // operation is asynchronous.
  return new Promise((resolve, reject) => {
    // Each item in this array represents a page in the PDF
    let pages = [];

    reader.parseBuffer(buffer, (err, item) => {
      if (err)
        // If we've got a problem, eject!
        reject(err);
      else if (!item)
        // If we're out of items, resolve with the data structure
        resolve(pages);
      else if (item.page)
        // If the parser's reached a new page, it's time to
        // work on the next page object in our pages array.
        pages.push({});
      else if (item.text) {
        // If we have NOT got a new page item, then we need
        // to either retrieve or create a new "row" array
        // to represent the collection of text items at our
        // current Y position, which will be this item's Y
        // position.

        // Hence, this line reads as,
        // "Either retrieve the row array for our current page,
        //  at our current Y position, or make a new one"
        const row = pages[pages.length - 1][item.y] || [];

        // Add the item to the reference container (i.e.: the row)
        row.push(item.text);

        // Include the container in the current page
        pages[pages.length - 1][item.y] = row;
      }
    });
  });
}
