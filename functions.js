const axios = require('axios');

async function fetchPrice(link) {
   try {
      const response = await axios.get(link);
      const html = response.data;

      const regex = /<span>\$ (\d+(\.\d+)?)<\/span>/;

      const price = html.match(regex);
      const match = price[1];

      if (match) {
         return match;
      }

   } catch (error) {
      console.error('Error fetching price:', error);
      return null;
   }
};

async function fetchBookData(link) {2
   try {
      const response = await axios.get(link);
      const html = response.data;

      const regexTitulo = /<p\s+class="tituloProducto">([^<]+)<\/p>/;
      const regexImage = /https:\/\/images\.cdn3\.buscalibre\.com\/[^'"\s]+\.jpg/g;

      const titulo = html.match(regexTitulo);
      const imagen = html.match(regexImage);

      const dataArray = {
         titulo: titulo[1],
         imagen: imagen[1]
      }

      if (response) {
         return dataArray;
      }

   } catch (error) {
      console.error('Error fetching price:', error);
      return null;
   }
};

module.exports = {fetchPrice, fetchBookData};