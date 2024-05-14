const axios = require('axios');

async function fetchPrice(link) {
  try {
    const response = await axios.get(link);
    const html = response.data;

    const regex = /<span>\$ (\d{1,3}(?:,\d{3})*)(?:\.(\d+))?<\/span>/;

    const price = html.match(regex);
    const match = price[1];
    const matchNoComa = match.replace(',', '');

    if (matchNoComa) {
      return matchNoComa;
    }

  } catch (error) {
    console.error('Error al obtener precio del libro:', error);
    return null;
  }
};

async function fetchBookData(link) {
  try {
    const response = await axios.get(link);
    const html = response.data;

    const regexTitulo = /<p class="tituloProducto" title="([^"]*)">/;
    const regexImage = /https:\/\/images\.cdn\d+\.buscalibre\.com\/[^'"\s]+\.jpg/g;
    const regexImageFail = /https:\/\/statics\.cdn\d+\.buscalibre\.com\/[^'"\s]+\.jpg/g;

    let imagen;
    const titulo = html.match(regexTitulo);
    imagen = html.match(regexImage);

    if (!imagen || imagen === '') {
      imagen = html.match(regexImageFail);
    }

    if (!titulo) {
      throw new Error('Error al obtener el título del libro');
    } else if (!imagen) {
      throw new Error('Error al obtener la imagen del libro');
    }

    const dataArray = {
      titulo: titulo[1],
      imagen: imagen[1]
    }

    if (response) {
      return dataArray;
    }

  } catch (error) {
    console.error('Error al obtener información del libro:', error);
    return null;
  }
};

module.exports = { fetchPrice, fetchBookData };
