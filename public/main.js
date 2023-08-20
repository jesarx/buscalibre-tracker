const blForm = document.getElementById('blForm');
const blLink = document.getElementById('link');

async function saveLink (event) {
   event.preventDefault();

   const link = blLink.value;
   const nowDate = Date.now();

   const record = {
      dateAdded: nowDate,
      link: link
   };
   
   try {
      const response = await fetch ('/addlink', {
         method: 'POST',
         body: JSON.stringify(record),
         headers: {
            'Content-Type': 'application/json'
         }
      });

   } catch (error) {
      alert('Hay un error de conexión!');
   }
};



blForm.addEventListener('submit', saveLink);